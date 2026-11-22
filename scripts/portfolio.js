/**
 * ============================================================================
 * AUTHOR  : Jayser Pilapil
 * COPYLEFT: 2026
 * portfolio.js — Renders the WDD231 portfolio page using stalkyard link
 * definitions. Dropdown lets the user switch between WDD 131 and WDD 231.
 * Selection is persisted in localStorage.
 * ============================================================================
 */

const USERNAME = 'supercoolfire';
const COURSE_STORAGE_KEY = 'portfolio-course';

const COURSE_OPTIONS = [
    { value: 'wdd131', label: 'WDD 131' },
    { value: 'wdd231', label: 'WDD 231' }
];

const linkDefsCache = new Map();

async function fetchLinkDefs(courseKey) {
    if (linkDefsCache.has(courseKey)) return linkDefsCache.get(courseKey);
    const response = await fetch(`data/stalkyard-${courseKey}.json`);
    if (!response.ok) throw new Error(`Failed to load link definitions for ${courseKey}: ${response.status}`);
    const defs = await response.json();
    linkDefsCache.set(courseKey, defs);
    return defs;
}

/**
 * Substitutes {username} into every link/text, then converts the deployed
 * GitHub Pages URLs (https://{username}.github.io/wdd231/<path>) into paths
 * relative to portfolio.html — e.g. "week01/index.html".
 *
 * Why: preview-card.js fetch()es each card's href to render a live preview.
 * Absolute github.io URLs are cross-origin when portfolio.html is previewed
 * locally (Live Server on localhost), so the fetch is blocked by CORS and
 * every card shows "Preview unavailable". Relative paths fetch the local copy
 * of the same page instead. On the deployed site the relative paths resolve
 * correctly too, because portfolio.html lives at /wdd231/portfolio.html.
 *
 * The github.com repository link (https://github.com/{username}/wdd231/) is
 * left absolute — it points to the repo on GitHub, not a page, so it cannot
 * be previewed locally. wdd131 links (host github.io but path /wdd131/) are
 * also left absolute; their files live in a sibling repo, not under wdd231/.
 */
function applyUsername(defs) {
    return defs.map(def => {
        const link = def.link.replaceAll('{username}', USERNAME);
        return {
            link: toRelativePath(link),
            text: def.text.replaceAll('{username}', USERNAME)
        };
    });
}

/**
 * Strip the GitHub Pages origin + repo prefix so a deployed page URL becomes
 * a path relative to portfolio.html:
 *   https://supercoolfire.github.io/wdd231/week01/index.html  ->  week01/index.html
 * Non-matching URLs (github.com repo link, wdd131 links, anything else) are
 * returned unchanged.
 */
function toRelativePath(url) {
    const match = url.match(/^https?:\/\/[^/]+\.github\.io\/wdd231\/(.*)$/);
    return match ? match[1] : url;
}

/**
 * Groups a flat {link, text}[] by week prefix ("W01 ...", "W02 ...").
 * Non-matching entries (repo link, Final Project, etc.) go into "Other".
 */
function groupByWeek(links) {
    const weekMap = new Map();
    const others = [];

    for (const entry of links) {
        const match = entry.text.match(/^W(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (!weekMap.has(num)) {
                weekMap.set(num, { label: `Week ${num}`, links: [] });
            }
            weekMap.get(num).links.push(entry);
        } else {
            others.push(entry);
        }
    }

    const sorted = [...weekMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, group]) => group);

    if (others.length > 0) {
        sorted.push({ label: 'Other', links: others });
    }

    return sorted;
}

/**
 * Groups a flat links array by label text.
 * Links sharing the same text are duplicate-path candidates — they all point
 * to the same assignment but at different possible URL paths.
 * Returns each entry annotated with { link, groupId, isDuplicate, groupSize }.
 * (Ported from stalkyard.js groupLinksByText)
 */
function groupLinksByText(links) {
    const byText = new Map();
    for (const link of links) {
        if (!byText.has(link.text)) byText.set(link.text, []);
        byText.get(link.text).push(link);
    }
    const groups = [];
    let groupId = 0;
    for (const [, candidates] of byText) {
        const id = groupId++;
        const isDuplicate = candidates.length > 1;
        for (const link of candidates) {
            groups.push({ link, groupId: id, isDuplicate, groupSize: candidates.length });
        }
    }
    return groups;
}

/**
 * Watches a card's preview <a> element for preview-card.js to finish.
 * preview-card.js replaces the initial <p class="loading-dots"> with either
 * real SEO content (success) or "Preview unavailable" (failure). Once that
 * mutation fires, resolve with true (success) or false (unavailable).
 */
function waitForPreviewResult(anchor) {
    return new Promise(resolve => {
        const observer = new MutationObserver(() => {
            // preview-card.js sets data-seo-loaded="true" on success
            if (anchor.dataset.seoLoaded === 'true') {
                observer.disconnect();
                resolve(true);
                return;
            }
            // failure: the loading-dots p is replaced with plain text
            const text = anchor.textContent.trim().toLowerCase();
            if (text === 'preview unavailable' || text.startsWith('preview unavailable')) {
                observer.disconnect();
                resolve(false);
            }
        });
        observer.observe(anchor, { childList: true, subtree: true, characterData: true });

        // Safety timeout — if preview-card.js never fires (e.g. not in viewport),
        // resolve false after 15 s so the duplicate group still collapses eventually.
        setTimeout(() => { observer.disconnect(); resolve(false); }, 15000);
    });
}

/**
 * Collapses a duplicate group once all its fetch results have settled.
 * Rules (same as stalkyard.js collapseGroup):
 *   1 succeeded  → remove all failed card wrappers
 *   0 succeeded  → remove all but the first (keep one fallback)
 *   2+ succeeded → keep all (genuinely different pages at different paths)
 */
function collapseGroup(entries) {
    const succeeded = entries.filter(e => e.ok);
    const failed    = entries.filter(e => !e.ok);

    if (succeeded.length === 1) {
        for (const entry of failed) entry.cardWrapper?.remove();
    } else if (succeeded.length === 0) {
        const [, ...extras] = entries;
        for (const entry of extras) entry.cardWrapper?.remove();
    }
    // 2+ succeeded → keep all, nothing to remove
}

function renderPortfolio(links) {
    const main = document.querySelector('main');
    main.innerHTML = '';

    const h1 = document.createElement('h1');
    h1.textContent = 'Portfolio';
    main.appendChild(h1);

    const weeksDiv = document.createElement('div');
    weeksDiv.className = 'weeks';
    main.appendChild(weeksDiv);

    const groups = groupByWeek(links);

    groups.forEach(group => {
        const weekDiv = document.createElement('div');
        weekDiv.className = 'week';

        const h2 = document.createElement('h2');
        h2.textContent = group.label;
        weekDiv.appendChild(h2);

        const cardsDiv = document.createElement('div');
        cardsDiv.className = 'cards';
        weekDiv.appendChild(cardsDiv);

        // Annotate links with duplicate-group metadata before rendering
        const annotated = groupLinksByText(group.links);

        // Collect per-groupId entries so we can collapse after fetches settle
        const duplicateGroups = new Map(); // groupId → [{ anchor, cardWrapper, ok }]

        annotated.forEach((item, index) => {
            const { link: entry, groupId, isDuplicate } = item;

            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';

            // preview-card.js requires the <a> to BE the .preview element
            const previewId = `preview-${group.label.replace(/\s+/g, '').toLowerCase()}-${index}`;
            const anchor = document.createElement('a');
            anchor.id = previewId;
            anchor.className = 'preview';
            anchor.href = entry.link;
            anchor.innerHTML = `<p class="loading-dots">Loading preview</p>`;

            const span = document.createElement('span');
            span.textContent = entry.text;

            cardDiv.appendChild(anchor);
            cardDiv.appendChild(span);
            cardsDiv.appendChild(cardDiv);

            if (isDuplicate) {
                if (!duplicateGroups.has(groupId)) duplicateGroups.set(groupId, []);
                duplicateGroups.get(groupId).push({ anchor, cardWrapper: cardDiv });
            }
        });

        // For every duplicate group, wait for all previews to settle then collapse
        for (const [, entries] of duplicateGroups) {
            const promises = entries.map(e =>
                waitForPreviewResult(e.anchor).then(ok => { e.ok = ok; return ok; })
            );
            Promise.allSettled(promises).then(() => collapseGroup(entries));
        }

        weeksDiv.appendChild(weekDiv);
    });

    // Tell preview-card.js new .preview elements are ready
    document.dispatchEvent(new CustomEvent('hydrationComplete'));
}

function renderDropdown(onCourseChange) {
    let wrapper = document.getElementById('portfolio-course-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'portfolio-course-wrapper';

        const label = document.createElement('label');
        label.htmlFor = 'portfolio-course-select';
        label.textContent = 'Course: ';

        const select = document.createElement('select');
        select.id = 'portfolio-course-select';

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = '— select a course —';
        defaultOpt.disabled = true;
        select.appendChild(defaultOpt);

        COURSE_OPTIONS.forEach(({ value, label: optLabel }) => {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = optLabel;
            select.appendChild(opt);
        });

        const saved = localStorage.getItem(COURSE_STORAGE_KEY);
        select.value = saved || '';

        select.addEventListener('change', () => {
            localStorage.setItem(COURSE_STORAGE_KEY, select.value);
            onCourseChange(select.value);
        });

        wrapper.appendChild(label);
        wrapper.appendChild(select);

        const main = document.querySelector('main');
        main.parentNode.insertBefore(wrapper, main);
    }

    return document.getElementById('portfolio-course-select').value || null;
}

async function init() {
    const selectedCourse = renderDropdown(async (course) => {
        try {
            const defs = await fetchLinkDefs(course);
            renderPortfolio(applyUsername(defs));
        } catch (err) {
            console.error(`❌ portfolio.js: ${err.message}`);
        }
    });

    if (!selectedCourse) return;

    try {
        const defs = await fetchLinkDefs(selectedCourse);
        renderPortfolio(applyUsername(defs));
    } catch (err) {
        console.error(`❌ portfolio.js: ${err.message}`);
    }
}

document.addEventListener('DOMContentLoaded', init);
