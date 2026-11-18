/*
 * navigation.js
 * Author: Jayser Pilapil
 * Description: Hamburger toggle for mobile nav (#ham-btn / #nav-bar) and
 *              submenu toggle for .has-submenu items.
 *              Runs after hydrationComplete since nav is injected by hydrate-v6.js.
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

// ── Submenu toggle (injected nav links) ───────────────────────
const initSubmenus = () => {
    document.querySelectorAll('nav ul li.has-submenu > a.submenu-toggle').forEach(toggle => {
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
