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

function applyUsername(defs) {
    return defs.map(def => ({
        link: def.link.replaceAll('{username}', USERNAME),
        text: def.text.replaceAll('{username}', USERNAME)
    }));
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

        group.links.forEach((entry, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';

            // preview-card.js requires the <a> to BE the .preview element
            // and reads href directly from it
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
        });

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
