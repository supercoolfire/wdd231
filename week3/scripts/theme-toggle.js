(function () {
  const STORAGE_KEY = 'cse-theme';
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  const ICONS =
    '<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="12" r="4"/>' +
    '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>' +
    '</svg>' +
    '<svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
    '</svg>';

  // Storage can be unavailable (private mode, blocked site data)
  function getSavedTheme() {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      return savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : null;
    } catch (error) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      // The choice still applies to this page view
    }
  }

  function getSystemTheme() {
    return systemDark.matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);

    const button = document.querySelector('.theme-toggle');
    if (button) {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      button.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
      button.setAttribute('title', `Switch to ${nextTheme} mode`);
    }
  }

  function createToggleButton(headerPage) {
    if (!headerPage || headerPage.querySelector('.theme-toggle')) {
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    button.innerHTML = ICONS;
    button.addEventListener('click', function () {
      const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      saveTheme(nextTheme);
    });

    // Sits between the course title and the logo
    headerPage.insertBefore(button, headerPage.querySelector('.logo'));
  }

  function initThemeToggle() {
    createToggleButton(document.querySelector('header .page'));
    setTheme(root.getAttribute('data-theme'));
  }

  // Apply the theme before the page paints to avoid a flash of the wrong theme
  setTheme(getSavedTheme() || getSystemTheme());

  // Follow the operating system until the user picks a theme with the toggle
  systemDark.addEventListener('change', function () {
    if (!getSavedTheme()) {
      setTheme(getSystemTheme());
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
  } else {
    initThemeToggle();
  }
})();
