/**
 * Just-In-Time Universal Hydrator v5.0 (Modified)
 * Author: Jayser Pilapil
 * Date: 2026-05-15
 * Description: Makes html clean as possible
 * Version: 5.0
 *
 * Features:
 * - Support for unique identifiers as keys
 * - Optional 'querySelector' property for explicit targeting
 * - Backward compatible: defaults to key-as-selector if querySelector is missing
 * - Precise selector logic (IDs, Classes, Tags)
 * - Support for 'insertion' attribute (replace, append, prepend, before, after)
 * - Support for 'innerHTML' attribute for raw HTML injection (v4.1)
 * - Support for text-only nodes in 'items' (removes <undefined> tag) (v4.2)
 * - v5.0 Upgrade: Support for complex, multi-type array properties (e.g., srcset/sizes arrays)
 *
 * Event:
 * Dispatches 'hydrationFinished' when done.
 *
document.addEventListener("hydrationFinished", function() {
    myFunction();
});
 *
 * Usage — single file:
<script src="scripts/hydrate-v5.js" data-file="data/page.json" defer></script>
 *
 * Usage — production / placeholder toggle:
<script src="scripts/hydrate-v5.js"
        data-production="true"
        data-production-file="data/production.json"
        data-placeholder-file="data/placeholder.json"
        defer></script>
 *
 * JSON Format:
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
 * Plug-and-Play Example (append a deferred script after <title>):
{
    "sample-script": {
        "querySelector": "title",
        "tag": "title",
        "insertion": "after",
        "items": [
            { "tag": "script", "src": "scripts/sample.js", "defer": "true" }
        ]
    }
}
 *
 * Backward-compatible key-as-selector:
{
    "body": {
        "tag": "title",
        "insertion": "after",
        "items": [
            { "tag": "script", "src": "scripts/sample.js", "defer": "true" }
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
 */

const startJITHydration = async () => {
    // Falls back to finding the script by its filename if currentScript is null
    const scriptEl = document.currentScript || document.querySelector('script[src*="/scripts/hydrate-v5.js"]');
    
    if (!scriptEl) {
        console.error("Hydration script element not found.");
        return;
    }

    const config = scriptEl.dataset;
    const dataFile = (config.production === "true" ? config.productionFile : config.placeholderFile) || config.file;

    if (!dataFile) return;

    try {
        const response = await fetch(dataFile);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        Object.keys(data).forEach(key => {
            const nodeData = data[key];
            
            // Use querySelector if provided, otherwise fallback to the key
            const selector = nodeData.querySelector || key;
            const target = document.querySelector(selector);
            
            if (!target) return;

            const insertion = nodeData.insertion || 'replace';

            // Handle 'replace' logic
            if (insertion === 'replace') {
                target.innerHTML = '';
                if (nodeData.tag && target.tagName.toLowerCase() === nodeData.tag.toLowerCase()) {
                    appendChildrenAndAttributes(target, nodeData);
                    return;
                }
            }

            const element = renderNode(nodeData);
            switch (insertion) {
                case 'prepend': target.prepend(element); break;
                case 'append': target.appendChild(element); break;
                case 'before': target.before(element); break;
                case 'after': target.after(element); break;
                case 'replace':
                default: target.appendChild(element); break;
            }
        });

        // MODIFIED: Notify other scripts with the new event and log it to the console
        const finishEvent = new CustomEvent('hydrationFinished');
        document.dispatchEvent(finishEvent);
        console.log('Hydration complete: "hydrationFinished" event dispatched.');

    } catch (err) {
        console.error("Hydration failure:", err);
    }
};

/**
 * Creates a DOM node and recursively builds its structure
 */
function renderNode(nodeData) {
    // Support for raw text nodes if 'tag' is missing
    if (!nodeData.tag && nodeData.textContent) {
        return document.createTextNode(nodeData.textContent);
    }
    const el = document.createElement(nodeData.tag || 'span'); // Default to span if tag is missing and no text
    appendChildrenAndAttributes(el, nodeData);
    return el;
}

/**
 * Helper to apply attributes and handle recursion
 */
function appendChildrenAndAttributes(element, data) {
    Object.entries(data).forEach(([key, value]) => {
        // Skip hydrator-specific metadata
        if (key === 'tag' || key === 'insertion' || key === 'querySelector') return;

        if (key === 'items' && Array.isArray(value)) {
            value.forEach(itemData => {
                element.appendChild(renderNode(itemData));
            });
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            // v5.0 Upgrade: If value is an array, join elements with commas (ideal for srcset/sizes lists)
            const attributeValue = Array.isArray(value) ? value.join(', ') : value;
            element.setAttribute(key, attributeValue);
        }
    });
}

startJITHydration();