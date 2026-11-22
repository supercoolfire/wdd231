export const detectAndLoadDialCodes = async () => {
    try {
        // 1. Detect user's country from their IP (HTTPS — works on GitHub Pages)
        const geoRes = await fetch('https://ipapi.co/json/');
        if (!geoRes.ok) throw new Error(`Geo lookup failed: ${geoRes.status}`);
        const geoData = await geoRes.json();
        const userCountry = geoData.country_code.toLowerCase(); // e.g. "ph"

        // 2. Load local calling codes — no API key, no CORS issues
        const codesRes = await fetch('./data/callingCodes.json');
        if (!codesRes.ok) throw new Error(`Calling codes fetch failed: ${codesRes.status}`);
        const countries = await codesRes.json();

        // 3. Build the <select> options and set initial display from JSON
        const select = document.querySelector('#country-code');
        const flagImg = document.querySelector('#country-flag');
        const dialDisplay = document.querySelector('#dial-code-display');
        select.innerHTML = ''; // clear the "Loading…" placeholder

        countries.forEach(c => {
            const option = document.createElement('option');
            option.value = c.dialCode;
            option.textContent = `${c.name} (${c.dialCode})`;
            option.dataset.flag = c.flag;
            option.dataset.cca2 = c.cca2;
            if (c.cca2 === userCountry) option.selected = true;
            select.appendChild(option);
        });

        // Set the initial flag and dial code — stop the loading animation
        const selected = select.selectedOptions[0];
        if (selected && selected.dataset.flag) {
            flagImg.src = selected.dataset.flag;
            flagImg.alt = selected.textContent.split('(')[0].trim() + ' flag';
            dialDisplay.classList.remove('loading-dots'); // stop animation
            dialDisplay.textContent = selected.value;
        }

    } catch (error) {
        console.error('Phone setup failed:', error);
    }
};
