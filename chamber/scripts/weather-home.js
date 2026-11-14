// ─── Point Nemo coordinates ───────────────────────────────────────────────────
const LAT = '-48.876667';
const LON = '-123.393333';
const API_KEY = '40892fcd23eff123bc5dec810bc513b6';

const iconEl     = document.querySelector('#weather-icon');
const descEl     = document.querySelector('#weather-desc');
const tempFEl    = document.querySelector('#weather-temp-f');
const tempCEl    = document.querySelector('#weather-temp-c');
const forecastEl = document.querySelector('#weather-forecast');

// ─── Current weather ──────────────────────────────────────────────────────────

const fetchCurrentWeather = async () => {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=imperial`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Weather fetch failed: ${response.status}`);
        const data = await response.json();

        const iconSrc = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        iconEl.setAttribute('src', iconSrc);
        iconEl.setAttribute('alt', data.weather[0].description);

        descEl.textContent = data.weather[0].description;

        const tempF = Math.round(data.main.temp);
        const tempC = Math.round((tempF - 32) * 5 / 9);
        tempFEl.textContent = `${tempF}\u00B0F`;
        tempCEl.textContent = `${tempC}\u00B0C`;

    } catch (error) {
        console.error('Current weather error:', error);
        descEl.textContent = 'Weather data unavailable.';
    }
};

// ─── 3-Day forecast ───────────────────────────────────────────────────────────
// The free forecast endpoint returns 3-hour steps for 5 days.
// We pick the reading closest to noon for each of the next 3 calendar days.

const fetchForecast = async () => {
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=imperial`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Forecast fetch failed: ${response.status}`);
        const data = await response.json();

        // Group by date, keeping the entry whose hour is closest to 12:00
        const byDay = {};
        data.list.forEach((entry) => {
            const [date, time] = entry.dt_txt.split(' ');
            const hour = parseInt(time);
            if (!byDay[date]) {
                byDay[date] = entry;
            } else {
                const prevHour = parseInt(byDay[date].dt_txt.split(' ')[1]);
                if (Math.abs(hour - 12) < Math.abs(prevHour - 12)) {
                    byDay[date] = entry;
                }
            }
        });

        // Skip today, show the next 3 days
        const days = Object.values(byDay).slice(1, 4);

        forecastEl.innerHTML = '';
        days.forEach((day) => {
            const date  = new Date(day.dt * 1000);
            const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const tempF = Math.round(day.main.temp);
            const tempC = Math.round((tempF - 32) * 5 / 9);
            const desc  = day.weather[0].description;
            const icon  = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;

            const card = document.createElement('div');
            card.setAttribute('class', 'forecast-day');

            const labelEl = document.createElement('p');
            labelEl.setAttribute('class', 'forecast-label');
            labelEl.textContent = label;

            const iconEl = document.createElement('img');
            iconEl.setAttribute('src', icon);
            iconEl.setAttribute('alt', desc);
            iconEl.setAttribute('width', '50');
            iconEl.setAttribute('height', '50');

            const descEl = document.createElement('p');
            descEl.setAttribute('class', 'forecast-desc');
            descEl.textContent = desc;

            const tempEl = document.createElement('p');
            tempEl.setAttribute('class', 'forecast-temp');
            tempEl.textContent = `${tempF}\u00B0F / ${tempC}\u00B0C`;

            card.append(labelEl, iconEl, descEl, tempEl);
            forecastEl.appendChild(card);
        });

    } catch (error) {
        console.error('Forecast error:', error);
        forecastEl.textContent = 'Forecast unavailable.';
    }
};

fetchCurrentWeather();
fetchForecast();
