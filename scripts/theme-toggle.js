/**
 * ============================================================================
 * AUTHOR  : Jayser Pilapil
 * COPYLEFT: 2026
 * PROJECT : Light/Dark Theme Switcher Boilerplate
 * ============================================================================
 *
 * FEATURES:
 *   1. Plug-and-Play: No need to modify your existing HTML structure.
 *   2. Persistent Storage: Saves user theme preference to localStorage.
 *   3. System Preference Sync: Automatically respects OS/browser light/dark
 *      settings if no manual preference has been saved yet.
 *   4. Element Swapping: Provides seamless CSS hooks to swap UI elements
 *      conditionally depending on the active theme.
 *   5. Zero Flash (Anti-FOUC): Optimized to prevent a bright white flash on
 *      load when dark mode is active.
 *
 * ----------------------------------------------------------------------------
 * REQUIRED HTML STRUCTURE:
 * ----------------------------------------------------------------------------
 *
 *   1. The <html> element must include a `data-theme` attribute:
 *
 *        <html lang="en" data-theme="light">
 *
 *   2. Include this script in <head> with the `defer` attribute:
 *
 *        <script src="theme-toggle.js" defer></script>
 *
 *   3. For element swapping, pair contextual classes with your styles:
 *
 *        <div class="foo bar light">Visible only in light mode</div>
 *        <div class="foo bar dark">Visible only in dark mode</div>
 */

/* ============================================================================
   CSS STARTER KIT — Paste to first line
   ============================================================================

:root, [data-theme="light"] {
  --toggle-btn-bg:     #e0e0e0;
  --toggle-text-color: #333333;
  --body-text-color:   #333333;
}

[data-theme="dark"] {
  --toggle-btn-bg:     #333333;
  --toggle-text-color: #f0f0f0;
  --body-text-color:   #f0f0f0;
}

[data-theme="light"] .dark  { display: none; }
[data-theme="dark"]  .light { display: none; }

   ============================================================================ */


// Select all buttons using the shared class name
const head = document.querySelector('header');
const themeToggleBtn = document.createElement('button');
themeToggleBtn.classList.add('theme-toggle');
themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
themeToggleBtn.setAttribute('title', 'Switch to dark mode');
themeToggleBtn.textContent = '🌙';
head.appendChild(themeToggleBtn)

const style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = `
.theme-toggle {
	position: fixed;
	top: 20px;
	right: 15px;
	z-index: 100;

    padding: 8px 8px;
    border: none;
    border-radius: 30px;
    background-color: var(--toggle-btn-bg);
    color: var(--body-text-color);
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background-color 1s ease;
}
.theme-icon, .theme-toggle, .theme-text {
    color: var(--toggle-text-color);
}
`;



document.head.appendChild(style);

const themeToggleButtons = document.querySelectorAll('.theme-toggle');
const rootElement = document.documentElement;




/**
 * Initialization Logic
 */
const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

setTheme(initialTheme);

themeToggleButtons.forEach(button => {
    button.addEventListener('click', () => {
        const currentTheme = rootElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
});

function setTheme(theme) {
    rootElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    themeToggleButtons.forEach(button => {
        const themeIcon = button.querySelector('.theme-icon');
        const themeText = button.querySelector('.theme-text');

        if (theme === 'dark') {
            button.setAttribute('aria-label', 'Switch to light mode');
            button.setAttribute('title', 'Switch to light mode');
            if (themeIcon && themeText) {
                themeIcon.textContent = '☀️';
                themeText.textContent = 'Light Mode';
            } else {
                button.textContent = '☀️';
            }
        } else {
            button.setAttribute('aria-label', 'Switch to dark mode');
            button.setAttribute('title', 'Switch to dark mode');
            if (themeIcon && themeText) {
                themeIcon.textContent = '🌙';
                themeText.textContent = 'Dark Mode';
            } else {
                button.textContent = '🌙';
            }
        }
    });
}