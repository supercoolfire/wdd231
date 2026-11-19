/*
 * navigation.js
 * Author: Jayser Pilapil
 * Description: Hamburger toggle for mobile nav (#ham-btn / #nav-bar),
 *              wayfinding (sets class="current" on <li> and aria-current="page"
 *              on <a> after hydration), and optional submenu toggle for
 *              .has-submenu items.
 *
 *              Nav is injected by hydrate-v6.js from a JSON file — any
 *              hardcoded wayfinding in HTML is wiped on hydration, so
 *              setActiveNavLink must run after hydrationComplete fires.
 *
 * Usage — load in <head> with defer:
<script src="scripts/navigation.js" defer></script>
 *
 * Required HTML:
<button id="ham-btn" class="hamburger" aria-label="Toggle navigation" aria-expanded="false"></button>
<nav id="nav-bar" class="navigation">
    <ul id="navigation"></ul>
</nav>
 *
 * Required hydrate-v6.js script with nav.json:
<script src="scripts/hydrate-v6.js" data-file="data/nav.json" defer></script>
 *
 * Flat nav.json example:
{
    "#navigation": {
        "tag": "ul",
        "id": "navigation",
        "insertion": "replace",
        "items": [
            { "tag": "li", "items": [{ "tag": "a", "href": "index.html", "textContent": "Home", "title": "Home", "rel": "noopener" }] },
            { "tag": "li", "items": [{ "tag": "a", "href": "about.html", "textContent": "About", "title": "About", "rel": "noopener" }] }
        ]
    }
}
 *
 * Submenu nav.json example (requires .has-submenu CSS and initSubmenus below):
{
    "#navigation": {
        "tag": "ul",
        "id": "navigation",
        "insertion": "replace",
        "items": [
            { "tag": "li", "items": [{ "tag": "a", "href": "index.html", "textContent": "Home", "title": "Home", "rel": "noopener" }] },
            { "tag": "li", "class": "has-submenu", "items": [
                { "tag": "a", "href": "#", "textContent": "Others", "title": "Others", "class": "submenu-toggle", "aria-haspopup": "true", "aria-expanded": "false" },
                { "tag": "ul", "class": "submenu", "items": [
                    { "tag": "li", "items": [{ "tag": "a", "href": "portfolio.html", "textContent": "Portfolio", "title": "Portfolio", "rel": "noopener" }] }
                ]}
            ]}
        ]
    }
}
 */

// ── Hamburger toggle ──────────────────────────────────────────
const navButton = document.querySelector('#ham-btn');
const navBar = document.querySelector('#nav-bar');

if (navButton && navBar) {
    navButton.addEventListener('click', () => {
        const isOpen = navButton.classList.toggle('show');
        navButton.setAttribute('aria-expanded', isOpen);
        navBar.classList.toggle('show');
    });
}

// ── Wayfinding ────────────────────────────────────────────────
const setActiveNavLink = () => {
    const pathname = window.location.pathname;
    document.querySelectorAll('nav ul li a').forEach(link => {
        const href = link.getAttribute('href').replace(/^\.\//, '');
        if (pathname.endsWith('/' + href)) {
            link.parentElement.classList.add('current');
            link.setAttribute('aria-current', 'page');
        }
    });
};

document.addEventListener('hydrationComplete', setActiveNavLink);
document.addEventListener('hydrationFinished', setActiveNavLink);
document.addEventListener('DOMContentLoaded', setActiveNavLink);
setTimeout(setActiveNavLink, 100);
setTimeout(setActiveNavLink, 500);

// ── Submenu toggle (injected nav links) ───────────────────────
const initSubmenus = () => {
    const submenus = document.querySelectorAll('nav ul li.has-submenu > a.submenu-toggle');
    if (!submenus.length) return; // no submenus on this page — nothing to do

    submenus.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const parentLi = toggle.closest('li.has-submenu');
            const isOpen = parentLi.classList.toggle('open');
            toggle.setAttribute('aria-expanded', isOpen);
        });
    });
};

document.addEventListener('hydrationComplete', initSubmenus);
document.addEventListener('hydrationFinished', initSubmenus);
// Fallback in case hydration already fired before this script ran
document.addEventListener('DOMContentLoaded', () => setTimeout(initSubmenus, 200));
