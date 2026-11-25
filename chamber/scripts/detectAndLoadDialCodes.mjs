const detectCountryCode = async (fallbackCountry = 'ph') => {
    const providersBak = [
        {
            name: 'ipwho.is',
            url: 'https://ipwho.is/',
            extract: (data) => (data?.success ? data.country_code : null),
        },
        {
            name: 'ipinfo.io',
            url: 'https://ipinfo.io/json',
            extract: (data) => data?.country ?? null,
        },
        {
            name: 'ipapi.co',
            url: 'https://ipapi.co/json/',
            extract: (data) => data?.country_code ?? null,
        },
    ];
    const providers = [
        {
            name: 'ipapi.co',
            url: 'https://ipapi.co/json/',
            extract: (data) => data?.country_code ?? null,
        },
    ];

    const controllers = providers.map(() => new AbortController());
    const timeouts = controllers.map((c) => setTimeout(() => c.abort(), 5000));

    const race = providers.map((provider, i) =>
        fetch(provider.url, { signal: controllers[i].signal })
            .then((res) => {
                if (!res.ok) throw new Error(`${provider.name} returned ${res.status}`);
                return res.json();
            })
            .then((data) => {
                const code = provider.extract(data);
                if (!code) throw new Error(`${provider.name} returned no code`);
                // Cancel the other two
                controllers.forEach((c, j) => { if (j !== i) c.abort(); });
                timeouts.forEach((t) => clearTimeout(t));
                return code.trim().toLowerCase();
            })
    );

    try {
        return await Promise.any(race);
    } catch {
        // All three failed — use browser locale or static fallback
        const localeRegion = navigator.language?.split('-')[1]?.toLowerCase();
        return localeRegion || fallbackCountry.toLowerCase();
    }
};



export const detectAndLoadDialCodes = async (fallbackCountry = 'ph') => {
    try {
        // 1. Detect country with automatic fallback on 429 / network / timeout errors
        const userCountry = await detectCountryCode(fallbackCountry);

        // 2. Load local calling codes
        const codesRes = await fetch('./data/callingCodes.json');
        if (!codesRes.ok) throw new Error(`Calling codes fetch failed: ${codesRes.status}`);
        const countries = await codesRes.json();

        // 3. Build <select> options
        const select = document.querySelector('#country-code');
        const flagImg = document.querySelector('#country-flag');
        const dialDisplay = document.querySelector('#dial-code-display');
        select.innerHTML = '';

        let matchedOption = null;

        countries.forEach((c) => {
            const option = document.createElement('option');
            option.value = c.dialCode;
            option.textContent = `${c.name} (${c.dialCode})`;
            option.dataset.flag = c.flag;
            option.dataset.cca2 = c.cca2;

            const code = c.cca2?.toLowerCase();
            if (code === userCountry) {
                option.selected = true;
                matchedOption = option;
            }
            select.appendChild(option);
        });

        // If detected country isn't in callingCodes.json, fall back to fallbackCountry or first option
        if (!matchedOption && select.options.length > 0) {
            const fallbackOpt =
                Array.from(select.options).find(
                    (opt) => opt.dataset.cca2?.toLowerCase() === fallbackCountry.toLowerCase()
                ) || select.options[0];
            fallbackOpt.selected = true;
        }

        // 4. Update flag and dial code display
        const selected = select.selectedOptions[0];
        if (selected) {
            if (selected.dataset.flag && flagImg) {
                flagImg.src = selected.dataset.flag;
                flagImg.alt = `${selected.textContent.split('(')[0].trim()} flag`;
            }
            if (dialDisplay) {
                dialDisplay.classList.remove('loading-dots');
                dialDisplay.textContent = selected.value;
            }
        }
    } catch (error) {
        console.error('Phone setup failed:', error);
        const dialDisplay = document.querySelector('#dial-code-display');
        dialDisplay?.classList.remove('loading-dots');
    }
};