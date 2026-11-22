/**
 * ============================================================================
 * AUTHOR  : Jayser Pilapil
 * COPYLEFT: 2026
 * ============================================================================
 */

/**
 * Navigation Event Handlers & Hydration
 */
function bindNavEvents() {
    const carousel = document.getElementById('carousel');
    const stalkmate = document.getElementById('stalkmate');
    const carouselMen = document.getElementById('carouselMen');
    const stalkmateMen = document.getElementById('stalkmateMen');

    if (carouselMen && stalkmateMen) {
        carouselMen.addEventListener('click', (e) => {
            e.preventDefault();
            if (stalkmate) stalkmate.innerHTML = '';
            if (carousel) carousel.style.display = 'block';

            const userNavBtn = document.getElementById('userNavBtn');
            if (userNavBtn) userNavBtn.classList.remove('show');
        });

        stalkmateMen.addEventListener('click', async (e) => {
            e.preventDefault();
            if (carousel) carousel.style.display = 'none';
            if (stalkmate) stalkmate.style.display = 'block';
            await generateStalkmate();
        });
        
        console.log("Stalkyard navigation events successfully bound!");
    } else {
        console.warn("Target menu elements not found in DOM yet.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const stalkmate = document.getElementById('stalkmate');
    if (stalkmate) stalkmate.style.display = 'none'; 
    if (window.navIsHydrated) bindNavEvents();
});

document.addEventListener('hydrationFinished', () => {
    window.navIsHydrated = true; 
    bindNavEvents();
    // stalkmateMen.click(); // test temporary
});

/**
 * Course Link Definitions — Lazy Loader
 * Fetches link defs for a given course key on demand, caches per session.
 */
const linkDefsCache = new Map();
const COURSE_STORAGE_KEY = 'stalkyard-course';

const COURSE_OPTIONS = [
    { value: 'wdd131', label: 'WDD 131' },
    { value: 'wdd231', label: 'WDD 231' }
];

async function fetchLinkDefs(courseKey) {
    if (linkDefsCache.has(courseKey)) return linkDefsCache.get(courseKey);
    const response = await fetch(`./data/stalkyard-${courseKey}.json`);
    if (!response.ok) throw new Error(`Failed to load link definitions for ${courseKey}`);
    const defs = await response.json();
    linkDefsCache.set(courseKey, defs);
    return defs;
}

function applyUsername(defs, username) {
    return defs.map(def => ({
        link: def.link.replaceAll('{username}', username),
        text: def.text.replaceAll('{username}', username)
    }));
}

/**
 * Renders the course dropdown and returns the currently selected course value.
 * Returns null if no course is selected yet.
 */
function renderCourseDropdown(stalkmate, onCourseChange) {
    let wrapper = document.getElementById('course-select-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'course-select-wrapper';

        const label = document.createElement('label');
        label.htmlFor = 'course-select';
        label.textContent = 'Course: ';

        const select = document.createElement('select');
        select.id = 'course-select';

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

        // Restore saved state
        const saved = localStorage.getItem(COURSE_STORAGE_KEY);
        if (saved) {
            select.value = saved;
        } else {
            select.value = '';
        }

        select.addEventListener('change', () => {
            localStorage.setItem(COURSE_STORAGE_KEY, select.value);
            onCourseChange(select.value);
        });

        const hideLabel = document.createElement('label');
        hideLabel.htmlFor = 'hide-fallbacks-toggle';
        hideLabel.textContent = 'Hide no-activity';

        const hideCheckbox = document.createElement('input');
        hideCheckbox.type = 'checkbox';
        hideCheckbox.id = 'hide-fallbacks-toggle';

        // Restore saved state
        // Default: hide no-activity cards; only an explicit 'false' in storage shows them
        const hideSaved = localStorage.getItem('stalkyard-hide-fallbacks') !== 'false';
        hideCheckbox.checked = hideSaved;
        if (hideSaved) stalkmate.classList.add('hide-fallbacks');

        hideCheckbox.addEventListener('change', () => {
            const hide = hideCheckbox.checked;
            localStorage.setItem('stalkyard-hide-fallbacks', hide);
            stalkmate.classList.toggle('hide-fallbacks', hide);
        });

        wrapper.appendChild(label);
        wrapper.appendChild(select);
        wrapper.appendChild(hideCheckbox);
        wrapper.appendChild(hideLabel);
        stalkmate.prepend(wrapper);
    }

    return document.getElementById('course-select').value || null;
}

/**
 * Core Data Fetching and Dynamic UI Injection
 */
let isStalkmateLoading = false;

async function generateStalkmate() {
    const header = document.querySelector('header');
    const stalkmate = document.getElementById('stalkmate');
    const jsonFile = './data/people.json';
    
    if (!stalkmate || isStalkmateLoading) return;
    isStalkmateLoading = true;

    // Flush existing markup immediately (except the dropdown wrapper if present)
    const existingWrapper = document.getElementById('course-select-wrapper');
    stalkmate.innerHTML = '';
    if (existingWrapper) stalkmate.appendChild(existingWrapper);

    try {
        // --- PHASE 0: Global Navigation Collapse Observers ---
        // Runs in parallel with Phase 1 logic
        const mainnav = document.querySelector('.navigation'); // Adjust selectors if your DOM layout differs
        const hambutton = document.querySelector('#menu');
        
        if (mainnav && hambutton) {
            const navLinks = mainnav.querySelectorAll('a');
            navLinks.forEach(item => {
                item.addEventListener('click', () => {
                    mainnav.classList.remove('show');
                    hambutton.classList.remove('show');
                });
            });
        }

        // --- RENDER DROPDOWN, CHECK COURSE SELECTION ---
        const selectedCourse = renderCourseDropdown(stalkmate, async (newCourse) => {
            // When the user changes the dropdown while stalkmate is visible, re-render
            isStalkmateLoading = false;
            await generateStalkmate();
        });

        if (!selectedCourse) {
            // No course selected yet — show the dropdown and wait
            isStalkmateLoading = false;
            return;
        }

        // --- FETCH COURSE LINK DEFINITIONS ---
        const linkDefs = await fetchLinkDefs(selectedCourse);

        // --- FETCH RAW SOURCE DATA ---
        const response = await fetch(jsonFile);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const rawData = (await response.text()).trim();
        let items = [];

        try {
            items = JSON.parse(rawData);
        } catch {
            try {
                items = Function(`"use strict"; return (${rawData})`)();
            } catch (jsolErr) {
                throw new Error(`Failed parsing data structure. Details: ${jsolErr.message}`);
            }
        }

        if (!Array.isArray(items)) throw new Error("Target root format structure must parse as an Array.");

        const cache = new Map();

        // Data Deduplication Guard
        const uniqueItems = [];
        const seenUsernames = new Set();
        
        for (const item of items) {
            if (item.username && !seenUsernames.has(item.username)) {
                seenUsernames.add(item.username);
                uniqueItems.push(item);
            }
        }
        
        uniqueItems.sort((a, b) => a.name.localeCompare(b.name));

        // --- PHASE 1: Scaffold Skeleton and Base Component UI Styles First ---
        injectPreviewStyles();

        // Sticky Name Navigation Trigger Element setup
        let userNavBtn = document.getElementById('userNavBtn');
        if (!userNavBtn) {
            userNavBtn = document.createElement('button');
            userNavBtn.textContent = 'Names';
            userNavBtn.id = 'userNavBtn';
            header.appendChild(userNavBtn);
        }
        userNavBtn.classList.add('show');

        const userNavUl = document.createElement('ul');
        userNavUl.id = "userNavList";
        stalkmate.appendChild(userNavUl);

        userNavBtn.onclick = (e) => {
            e.preventDefault();
            userNavUl.classList.toggle('show');
            userNavBtn.classList.toggle('active');
        };

        // Construct quick navigation layout
        for (const item of uniqueItems) {
            const innerHtml = `<li><a href="#${item.username}">${item.name}</a></li>`;
            userNavUl.innerHTML += innerHtml;
        }

        // Also bind the Phase 0 behavior to the newly generated stalkmate inner navigation elements
        const localNavLinks = userNavUl.querySelectorAll('a');
        localNavLinks.forEach(item => {
            item.addEventListener('click', () => {
                if (mainnav) mainnav.classList.remove('show');
                if (hambutton) hambutton.classList.remove('show');
            });
        });

        // Track cards needing SEO data retrieval downstream
        const pendingSeoTasks = [];

        // Structural Skeleton Layout injection loop
        for (const item of uniqueItems) {
            const username = item.username ? item.username.trim().replace(/\s+/g, '') : '';
            const name = item.name;
            const rawLinks = applyUsername(linkDefs, username);

            if (item.other_links && Array.isArray(item.other_links)) {
                rawLinks.push(...item.other_links);
            }

            // Group links by label text so duplicate-path pairs can be collapsed after fetching
            const groupedLinks = groupLinksByText(rawLinks);

            const userDiv = document.createElement('div');
            userDiv.className = 'users';
            userDiv.dataset.username = username;
            stalkmate.appendChild(userDiv);

            const userDivh2 = document.createElement('h2');
            userDivh2.id = `${username}`;
            userDivh2.textContent = `${name} - ${username}`;
            userDiv.appendChild(userDivh2);

            const cardsDiv = document.createElement('div');
            cardsDiv.className = 'cards';
            userDiv.appendChild(cardsDiv);

            groupedLinks.forEach(({ link, groupId, isDuplicate, groupSize }, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card';

                const uniqueId = `preview-${username}-${index}`;

                cardDiv.innerHTML = `
                    <a class="anchor" href="${link.link}" target="_blank" rel="noopener">
                        <div id="${uniqueId}" class="preview" data-href="${link.link}">
                            <div class="preview-content">
                                <p class="loading-dots">Loading preview</p>
                            </div>
                        </div>
                        <span class="link-label">${link.text}</span>
                    </a>
                `;

                cardsDiv.appendChild(cardDiv);

                const previewContainer = cardDiv.querySelector(`#${uniqueId}`);

                // Tag duplicate cards with a registryKey for post-fetch collapsing
                if (isDuplicate) {
                    const registryKey = username + ':' + groupId;
                    pendingSeoTasks.push({ element: previewContainer, url: link.link, isDuplicate: true, registryKey, cardWrapper: cardDiv, username });
                } else {
                    pendingSeoTasks.push({ element: previewContainer, url: link.link, isDuplicate: false, username });
                }
            });
        }

        // --- PHASE 2: Lazy-load per user via IntersectionObserver ---
        // Group tasks by username so each .users section loads only when scrolled into view
        const tasksByUser = new Map();
        for (const task of pendingSeoTasks) {
            if (!tasksByUser.has(task.username)) tasksByUser.set(task.username, []);
            tasksByUser.get(task.username).push(task);
        }

        // Runs all SEO fetches for one user, then collapses duplicate groups
        function runUserTasks(tasks) {
            const groupPromises = new Map();
            const groupWrappers = new Map();

            tasks.forEach(task => {
                const promise = fetchAndRenderSEO(task.element, task.url, cache);
                if (task.isDuplicate) {
                    const key = task.registryKey;
                    if (!groupPromises.has(key)) { groupPromises.set(key, []); groupWrappers.set(key, []); }
                    groupPromises.get(key).push(promise);
                    groupWrappers.get(key).push(task.cardWrapper);
                }
            });

            for (const [key, promises] of groupPromises) {
                const wrappers = groupWrappers.get(key);
                Promise.allSettled(promises).then(results => {
                    const flags = results.map(r => r.status === 'fulfilled' && r.value === true);
                    const wins  = flags.filter(Boolean).length;
                    if (wins === 1) {
                        flags.forEach((ok, i) => { if (!ok) wrappers[i]?.remove(); });
                    } else if (wins === 0) {
                        wrappers.slice(1).forEach(w => w?.remove());
                    }
                });
            }
        }

        // Observe each .users div; fire once when it enters the viewport (200px ahead)
        const userObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                obs.unobserve(entry.target);
                const uname = entry.target.dataset.username;
                const tasks = tasksByUser.get(uname);
                if (tasks) runUserTasks(tasks);
            });
        }, { rootMargin: '200px' });

        // Attach data-username and start observing each .users div
        stalkmate.querySelectorAll('.users').forEach(div => {
            userObserver.observe(div);
        });

    } catch (err) {
        console.error(`❌ Script configuration break: ${err.message}`);
    } finally {
        isStalkmateLoading = false;
    }
}

/**
 * Filter and retain live/reachable endpoints via HEAD validation requests
 */
async function getValidLinks(urlArray) {
    const linkChecks = urlArray.map(async (item) => {
        const formattedLink = item.link.startsWith('http') ? item.link : `https://${item.link}`;
        try {
            const response = await fetch(formattedLink, { method: 'HEAD' });
            return response.ok ? item : null;
        } catch {
            return null;
        }
    });

    const results = await Promise.all(linkChecks);
    return results.filter(item => item !== null);
}

/**
 * Duplicate-Text Link Grouping
 * Groups a flat links array into logical groups by label text.
 * Links with unique text get a single-item group (no deduplication needed).
 * Links sharing the same text are candidates for post-fetch collapsing.
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
 * Post-fetch Group Collapse
 * Called once every card in a duplicate group has settled (success or fallback).
 * Applies the deduplication rule:
 *   - Exactly 1 succeeded → remove the failed card wrappers
 *   - 0 succeeded        → remove all but the first card wrapper (keep one fallback)
 *   - 2+ succeeded       → keep all (genuinely different pages)
 */
function collapseGroup(groupEntries) {
    const succeeded = groupEntries.filter(e => e.resolved);
    const failed    = groupEntries.filter(e => !e.resolved);

    if (succeeded.length === 1) {
        for (const entry of failed) {
            entry.cardWrapper?.remove();
        }
    } else if (succeeded.length === 0) {
        // Keep only the first; remove the rest
        const [, ...extras] = groupEntries;
        for (const entry of extras) {
            entry.cardWrapper?.remove();
        }
    }
    // 2+ succeeded: keep all — do nothing
}

/**
 * Fetches dynamic parameters out of external target documents
 */
async function fetchAndRenderSEO(cardElement, url, cache) {
    if (!cardElement) return;
    const contentWrapper = cardElement.querySelector('.preview-content');


    try {
        let seoData;

        if (cache.has(url)) {
            seoData = cache.get(url);
        } else {
            const response = await fetch(url);
            if (!response.ok) {
                renderFallback(contentWrapper);
                return false;
            }

            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, "text/html");

            const metadataTitle = doc.title || "";
            const metadataDesc = doc.querySelector('meta[name="description"]')?.content || "";

            if (!metadataTitle && !metadataDesc) {
                renderFallback(contentWrapper);
                return false;
            }

            seoData = {
                title: metadataTitle || "Untitled Resource Assignment",
                description: metadataDesc || "No document meta description available for layout parsing.",
                fullHtml: htmlText
            };

            cache.set(url, seoData);
        }

        contentWrapper.innerHTML = `
            <div class="preview-seo">
                <strong>${seoData.title}</strong>
                <p>${seoData.description}</p>
            </div>
            <div class="preview-iframe-container"></div>
            <div class="loading-indicator">Hover to load frame</div>
        `;
        cardElement.dataset.seoLoaded = "true";

        // --- PHASE 3: Listen for mouseenter, Compile Live View Frame and Append Isolated Encapsulated Styles ---
        cardElement.addEventListener('mouseenter', () => {
            handleFrameCompilation(cardElement, url, seoData.fullHtml);
        });
        return true;

    } catch (err) {
        renderFallback(contentWrapper);
        return false;
    }
}

/**
 * Reusable layout injector for missing or unreachable resources
 */
function renderFallback(contentWrapper) {
    contentWrapper.innerHTML = `
        <div class="preview-fallback">
            <p class="loading-dots">No activity or assignment yet</p>
        </div>
    `;
}

/**
 * Compiles preview frames asynchronously only when requested via user interaction
 */
function handleFrameCompilation(cardElement, url, fullHtml) {
    if (cardElement.classList.contains('active') || cardElement.dataset.loadingFrame === "true") return;
    cardElement.dataset.loadingFrame = "true";

    const container = cardElement.querySelector('.preview-iframe-container');
    if (!container) return;

    const iframe = document.createElement('iframe');
    const absoluteUrl = new URL(url, document.baseURI).href;
    const baseTag = `<base href="${absoluteUrl}">`;
    
    let finalHtml = fullHtml;
    const headMatch = finalHtml.match(/<head[^>]*>/i);
    if (headMatch) {
        finalHtml = finalHtml.replace(headMatch[0], `${headMatch[0]}\n    ${baseTag}`);
    } else {
        finalHtml = baseTag + finalHtml;
    }
    
    iframe.srcdoc = finalHtml;
    container.appendChild(iframe);

    iframe.onload = () => {
        cardElement.classList.add('active');
        const indicator = cardElement.querySelector('.loading-indicator');
        if (indicator) indicator.style.display = 'none';
        delete cardElement.dataset.loadingFrame;
    };
}

/**
 * Shared Style Sheet Initialization Tool
 */
function injectPreviewStyles() {
    if (document.getElementById('preview-card-styles')) return;
    const style = document.createElement('style');
    style.id = 'preview-card-styles';
    style.textContent = `
        .loading-dots { font-weight: bold; margin: 0; padding: 12px; font-size: 12px; color: #777; }
        .loading-dots::after { content: ''; animation: dots 1.5s infinite steps(4); }
        @keyframes dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } }
        
        .preview[id^="preview-"] { width: 200px; aspect-ratio: 3 / 4; overflow: hidden; border: 1px solid #ccc; border-radius: 8px; background: #fdfdfd; position: relative; display: flex; flex-direction: column; font-family: sans-serif; transition: transform 0.2s ease; }
        .preview[id^="preview-"]:hover { transform: scale(1.02); z-index: 10; cursor: pointer; }
        
        .preview-content { width: 100%; height: 100%; display: flex; flex-direction: column; }
        .preview-seo { padding: 12px; font-size: 13px; color: #333; height: 100%; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
        .preview-seo strong { font-size: 14px; color: #000; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .preview-seo p { margin: 0; font-size: 11px; color: #666; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
        
        .preview-fallback { display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; background: #f7f7f7; }
        .preview-fallback .loading-dots { font-weight: normal; color: #999; }

        .preview-iframe-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #fff; opacity: 0; transition: opacity 0.3s ease; pointer-events: none; }
        .preview[id^="preview-"].active .preview-iframe-container { opacity: 1; }
        .preview[id^="preview-"] iframe { width: 400%; height: 400%; transform: scale(0.25); transform-origin: 0 0; border: none; }
        
        .loading-indicator { position: absolute; bottom: 5px; right: 8px; font-size: 10px; color: #999; font-style: italic; }
        div.card { margin-bottom: 15px; display: inline-block; vertical-align: top; }
        div.card > a { text-decoration: none; color: inherit; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .link-label { max-width: 200px; text-align: center; font-size: 12px; padding: 0 4px; }
        #stalkmate.hide-fallbacks .card:has(.preview-fallback) { display: none; }
    `;
    document.head.appendChild(style);
}