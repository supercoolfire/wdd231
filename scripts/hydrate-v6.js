/**
 * hydrate-v6.js
 * Author: Jayser Pilapil
 * Date: 2026-11-14
 * Description: Just-In-Time Universal Hydrator v6.0
 *              Extends v5.1.2 with multi-file support.
 *              Fully backward compatible — single-file usage works exactly as before.
 * Version: 6.0
 *
 * Features:
 * - All v5.1.2 features preserved unchanged (backward compatible)
 * - Multi-file: data-file accepts space- or comma-separated JSON paths
 * - Files fetched in parallel (Promise.all) for minimum latency
 * - Keys merged left-to-right before rendering (later files win on collision)
 * - Same 'hydrationComplete' CustomEvent dispatched when done
 * - Single data-file path still works exactly as in v5.1
 *
 * Event:
 * Dispatches 'hydrationComplete' when done (same as v5.1).
 *
document.addEventListener("hydrationComplete", function() {
    myFunction();
});
 *
 * Usage — single file (v5.1 compatible):
<script src="scripts/hydrate-v6.js" data-file="data/page.json" defer></script>
 *
 * Usage — multiple files (v6 feature):
<script src="scripts/hydrate-v6.js" data-file="data/nav.json data/page.json" defer></script>
 *   or comma-separated:
<script src="scripts/hydrate-v6.js" data-file="data/nav.json, data/page.json" defer></script>
 *
 * Usage — production / placeholder toggle (v5 compatible):
<script src="scripts/hydrate-v6.js"
        data-production="true"
        data-production-file="data/production.json"
        data-placeholder-file="data/placeholder.json"
        defer></script>
 *
 * JSON Format (identical to v5.1):
{
    "unique-key": {
        "querySelector": "CSS-selector",
        "tag": "html-tag-to-create",
        "insertion": "replace | append | prepend | before | after",
        "id": "optional-id",
        "class": "optional-class",
        "textContent": "optional-text",
        "innerHTML": "optional-raw-html",
        "items": [
            { "tag": "child-tag", "src": "value", "textContent": "child-text" },
            { "textContent": "raw-text-node-no-tag" }
        ]
    }
}
 *
 * Navigation Example:
{
    "#navigation": {
        "tag": "ul",
        "id": "navigation",
        "items": [
            { "tag": "li", "items": [{ "tag": "a", "href": "index.html", "textContent": "Home" }] },
            { "tag": "li", "items": [{ "tag": "a", "href": "about.html", "textContent": "About" }] }
        ]
    }
}
 *
 * v5.0 Responsive Image Example (array values joined with ", " for srcset/sizes):
{
    "hero-banner": {
        "querySelector": "#hero-container",
        "tag": "img",
        "insertion": "append",
        "alt": "Hero banner",
        "src": "images/hero-large.webp",
        "srcset": [
            "images/hero-small.webp 480w",
            "images/hero-medium.webp 800w",
            "images/hero-large.webp 1200w"
        ],
        "sizes": [
            "(max-width: 600px) 480px",
            "(max-width: 900px) 800px",
            "1200px"
        ]
    }
}
 *
 * v5.1 Inline External File Example (a string path in items[] fetches and inlines the file):
{
    "inline-css": {
        "querySelector": "head",
        "tag": "head",
        "insertion": "append",
        "items": [
            { "tag": "style", "items": ["styles/critical.css"] }
        ]
    }
}
 *
 * v6 Multi-file Merge Example — nav.json merged with page.json:
nav.json:
{
    "#navigation": {
        "tag": "ul",
        "id": "navigation",
        "items": [
            { "tag": "li", "items": [{ "tag": "a", "href": "index.html", "textContent": "Home" }] }
        ]
    }
}

page.json:
{
    "main-content": {
        "querySelector": "main",
        "tag": "main",
        "insertion": "replace",
        "items": [
            { "tag": "h1", "textContent": "Page Title" }
        ]
    }
}
 */

const startJITHydration = async () => {
    const scriptEl = document.currentScript ||
        document.querySelector('script[src*="/scripts/hydrate-v6.js"]');

    if (!scriptEl) {
        console.error('Hydration script element not found.');
        return;
    }

    const config = scriptEl.dataset;
    const dataFileAttr = (config.production === 'true' ? config.productionFile : config.placeholderFile)
        || config.file;

    if (!dataFileAttr) return;

    // Split on commas or whitespace, remove empty strings
    const filePaths = dataFileAttr.split(/[\s,]+/).filter(Boolean);

    try {
        // Fetch all files in parallel
        const responses = await Promise.all(filePaths.map(p => fetch(p)));

        for (const res of responses) {
            if (!res.ok) throw new Error(`HTTP error ${res.status} for ${res.url}`);
        }

        const jsons = await Promise.all(responses.map(r => r.json()));

        // Merge all objects: later files win on key collision
        const data = Object.assign({}, ...jsons);

        // --- Render pass (identical to v5.1.2) ---
        for (const key of Object.keys(data)) {
            const nodeData = data[key];
            const selector = nodeData.querySelector || key;
            const target = document.querySelector(selector);

            if (!target) continue;

            const insertion = nodeData.insertion || 'replace';

            if (insertion === 'replace') {
                target.innerHTML = '';
                if (nodeData.tag && target.tagName.toLowerCase() === nodeData.tag.toLowerCase()) {
                    await appendChildrenAndAttributes(target, nodeData);
                    continue;
                }
            }

            const element = await renderNode(nodeData);
            switch (insertion) {
                case 'prepend':  target.prepend(element);       break;
                case 'append':   target.appendChild(element);   break;
                case 'before':   target.before(element);        break;
                case 'after':    target.after(element);         break;
                case 'replace':
                default:         target.appendChild(element);   break;
            }
        }

        document.dispatchEvent(new CustomEvent('hydrationComplete'));

    } catch (err) {
        console.error('Hydration failure:', err);
    }
};

async function renderNode(nodeData) {
    if (typeof nodeData === 'string') {
        const trimmedPath = nodeData.trim();
        if (trimmedPath.endsWith('.css') || trimmedPath.endsWith('.js') ||
            trimmedPath.endsWith('.txt') || trimmedPath.includes('/')) {
            try {
                const res = await fetch(trimmedPath);
                if (!res.ok) throw new Error(`Could not fetch file: ${trimmedPath}`);
                return document.createTextNode(await res.text());
            } catch (fileErr) {
                console.error('Inlining asset failed:', fileErr);
                return document.createTextNode(`/* Failed to load: ${trimmedPath} */`);
            }
        }
        return document.createTextNode(nodeData);
    }

    if (!nodeData.tag && nodeData.textContent) {
        return document.createTextNode(nodeData.textContent);
    }

    const el = document.createElement(nodeData.tag || 'span');
    await appendChildrenAndAttributes(el, nodeData);
    return el;
}

async function appendChildrenAndAttributes(element, data) {
    for (const [key, value] of Object.entries(data)) {
        if (key === 'tag' || key === 'insertion' || key === 'querySelector') continue;

        if (key === 'items' && Array.isArray(value)) {
            for (const itemData of value) {
                element.appendChild(await renderNode(itemData));
            }
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            element.setAttribute(key, Array.isArray(value) ? value.join(', ') : value);
        }
    }
}

startJITHydration();
