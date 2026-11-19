/**
 * stocks.js — Stock Exchange Tracker (Twelve Data edition): Stocks browse page
 * Author: Jayser Pilapil
 * Description: Fetches tickers from local JSON + live quotes from Twelve Data.
 *              Renders 23 stock cards (each showing full quote stats).
 *              Details modal shows a 90-day Chart.js price chart.
 *              Sector filter, live search, and watchlist toggle included.
 *
 * Usage: <script src="scripts/stocks.js" type="module"></script>
 * Requires: Chart.js loaded globally via CDN on stocks.html
 */

import { fetchQuotes, fetchQuote, fetchCandles, formatPrice, formatChange, dirClass } from './api.mjs';
import { inWatchlist, addToWatchlist, removeFromWatchlist } from './watchlist.mjs';

let allStocks    = [];
let activeFilter = 'All';
let searchQuery  = '';
let activeChart  = null;   // current Chart.js instance — destroyed when modal closes

/**
 * Load tickers JSON then fetch all quotes in parallel.
 * Quotes are served from sessionStorage cache on subsequent loads within 60s.
 */
const loadStocks = async () => {
    const container = document.querySelector('#stock-cards');
    try {
        const res = await fetch('data/tickers.json');
        if (!res.ok) throw new Error(`tickers.json: ${res.status}`);
        const tickers = await res.json();

        const quoteMap = await fetchQuotes(tickers.map(t => t.symbol));
        allStocks = tickers.map(t => ({ ...t, quote: quoteMap[t.symbol] }));

        renderFilterButtons();
        renderCards();
    } catch (error) {
        console.error('loadStocks error:', error);
        container.innerHTML = `<p class="empty-state">Could not load stocks: ${error.message}</p>`;
    }
};

/**
 * Build sector filter buttons from unique sector values.
 */
const renderFilterButtons = () => {
    const wrap = document.querySelector('#sector-filters');
    if (!wrap) return;

    const sectors = ['All', ...new Set(allStocks.map(s => s.sector))].sort((a, b) =>
        a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)
    );

    wrap.innerHTML = sectors.map(sector =>
        `<button class="filter-button${sector === activeFilter ? ' active' : ''}"
                 data-sector="${sector}"
                 aria-pressed="${sector === activeFilter}">${sector}</button>`
    ).join('');

    wrap.querySelectorAll('.filter-button').forEach(btn => {
        btn.addEventListener('click', () => {
            activeFilter = btn.dataset.sector;
            wrap.querySelectorAll('.filter-button').forEach(b => {
                b.classList.toggle('active', b.dataset.sector === activeFilter);
                b.setAttribute('aria-pressed', b.dataset.sector === activeFilter);
            });
            renderCards();
        });
    });
};

/**
 * Filter stocks by active sector and live search query.
 */
const getFiltered = () =>
    allStocks.filter(s => {
        const matchesSector = activeFilter === 'All' || s.sector === activeFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
        return matchesSector && matchesSearch;
    });

/**
 * Render stock cards into #stock-cards.
 */
const renderCards = () => {
    const container = document.querySelector('#stock-cards');
    const countEl   = document.querySelector('#stock-count');
    if (!container) return;

    const filtered = getFiltered();

    if (!filtered.length) {
        container.innerHTML = '<p class="empty-state">No stocks match your search.</p>';
        if (countEl) countEl.textContent = '';
        return;
    }

    container.innerHTML = filtered.map(s => buildCard(s)).join('');
    if (countEl) countEl.textContent = `Showing ${filtered.length} of ${allStocks.length} stocks`;

    container.querySelectorAll('.button-details').forEach(btn =>
        btn.addEventListener('click', () => openModal(btn.dataset.symbol))
    );
    container.querySelectorAll('.button-watchlist').forEach(btn =>
        btn.addEventListener('click', () => toggleWatchlist(btn))
    );
};

/**
 * Build a single stock card HTML string with full quote stats in a dl.
 */
const buildCard = ({ symbol, name, sector, exchange, quote }) => {
    const dir     = dirClass(quote.d);
    const price   = formatPrice(quote.c);
    const chg     = formatChange(quote.dp);
    const watched = inWatchlist(symbol);

    return `
        <div class="stock-card" data-symbol="${symbol}">
            <div class="card-header">
                <span class="card-symbol">${symbol}</span>
                <span class="card-exchange">${exchange}</span>
            </div>
            <p class="card-name">${name}</p>
            <p class="card-price ${dir}">${price}</p>
            <span class="card-change ${dir}">${chg}</span>
            <dl class="card-stats">
                <dt>Open</dt>       <dd>${formatPrice(quote.o)}</dd>
                <dt>Prev Close</dt> <dd>${formatPrice(quote.pc)}</dd>
                <dt>High</dt>       <dd>${formatPrice(quote.h)}</dd>
                <dt>Low</dt>        <dd>${formatPrice(quote.l)}</dd>
            </dl>
            <span class="card-sector">${sector}</span>
            <div class="card-actions">
                <button class="action-button button-details" data-symbol="${symbol}">Chart</button>
                <button class="action-button button-watchlist${watched ? ' saved' : ''}"
                        data-symbol="${symbol}"
                        aria-pressed="${watched}">
                    ${watched ? '\u2605 Saved' : '\u2606 Watch'}
                </button>
            </div>
        </div>`;
};

/**
 * Toggle a stock in/out of the watchlist.
 */
const toggleWatchlist = (btn) => {
    const symbol = btn.dataset.symbol;
    if (inWatchlist(symbol)) {
        removeFromWatchlist(symbol);
        btn.classList.remove('saved');
        btn.setAttribute('aria-pressed', 'false');
        btn.textContent = '\u2606 Watch';
    } else {
        addToWatchlist(symbol);
        btn.classList.add('saved');
        btn.setAttribute('aria-pressed', 'true');
        btn.textContent = '\u2605 Saved';
    }
};

/**
 * Open the detail modal for a symbol.
 * Shows company name from tickers.json and a 90-day Chart.js line chart from Twelve Data.
 */
const openModal = async (symbol) => {
    const modal = document.querySelector('#stock-modal');
    const body  = document.querySelector('#modal-body');
    if (!modal || !body) return;

    const stock = allStocks.find(s => s.symbol === symbol);
    if (!stock) return;

    if (activeChart) { activeChart.destroy(); activeChart = null; }

    body.innerHTML = `
        <p class="modal-symbol">${symbol}</p>
        <p class="modal-company-name">${stock.name}</p>
        <div class="modal-chart-wrap">
            <canvas id="price-chart" role="img" aria-label="90-day closing price chart for ${symbol}"></canvas>
            <p class="modal-chart-status loading-dots">Loading chart</p>
        </div>`;

    modal.showModal();

    const statusEl = body.querySelector('.modal-chart-status');
    const canvas   = body.querySelector('#price-chart');

    try {
        const candles = await fetchCandles(symbol);
        if (statusEl) statusEl.remove();

        const isUp  = candles.closes.at(-1) >= candles.closes[0];
        const color = isUp ? '#007a4d' : '#c0392b';

        activeChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: candles.labels,
                datasets: [{
                    label: `${symbol} Close`,
                    data: candles.closes,
                    borderColor: color,
                    backgroundColor: color + '22',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => `$${ctx.parsed.y.toFixed(2)}` } }
                },
                scales: {
                    x: { ticks: { maxTicksLimit: 8 } },
                    y: { ticks: { callback: v => `$${v.toFixed(0)}` } }
                }
            }
        });
    } catch (error) {
        if (statusEl) {
            statusEl.classList.remove('loading-dots');
            statusEl.textContent = `Chart unavailable: ${error.message}`;
        }
    }
};

/**
 * Wire up modal close button and backdrop dismiss.
 */
const initModal = () => {
    const modal    = document.querySelector('#stock-modal');
    const closeBtn = document.querySelector('#modal-close');
    if (!modal) return;

    const closeModal = () => {
        if (activeChart) { activeChart.destroy(); activeChart = null; }
        modal.close();
    };

    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
};

/**
 * Wire up live search input.
 */
const initSearch = () => {
    const input = document.querySelector('#stock-search');
    if (!input) return;
    input.addEventListener('input', () => {
        searchQuery = input.value.trim();
        renderCards();
    });
};

loadStocks();
initModal();
initSearch();
