/**
 * home.js — Stock Exchange Tracker (Finnhub edition): Home page
 * Author: Jayser Pilapil
 * Description: Fetches live quotes for 6 featured stocks and market news from
 *              Finnhub. Each card has a Chart button that opens a 90-day
 *              closing price chart in a modal dialog.
 *
 * Usage: <script src="scripts/home.js" type="module"></script>
 * Requires: Chart.js loaded globally via CDN on index.html
 */

import { fetchQuote, fetchCandles, fetchMarketNews, formatPrice, formatChange, dirClass } from './finnhub.mjs';

const FEATURED = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'JPM'];

let activeChart = null;

/**
 * Build a featured stock card HTML string.
 * @param {string} symbol
 * @param {object} quote
 * @returns {string}
 */
const buildCard = (symbol, quote) => {
    const dir   = dirClass(quote.d);
    const price = formatPrice(quote.c);
    const chg   = formatChange(quote.dp);

    return `
        <div class="stock-card" data-symbol="${symbol}">
            <div class="card-header">
                <span class="card-symbol">${symbol}</span>
            </div>
            <p class="card-price ${dir}">${price}</p>
            <span class="card-change ${dir}">${chg}</span>
            <small class="card-name">H: ${formatPrice(quote.h)} &nbsp; L: ${formatPrice(quote.l)}</small>
            <div class="card-actions">
                <button class="action-button button-chart" data-symbol="${symbol}">Chart</button>
            </div>
        </div>`;
};

/**
 * Fetch and render featured stock cards.
 */
const loadFeatured = async () => {
    const container = document.querySelector('#featured-cards');
    if (!container) return;

    try {
        const quotes = await Promise.all(FEATURED.map(sym => fetchQuote(sym)));
        container.innerHTML = FEATURED.map((sym, i) => buildCard(sym, quotes[i])).join('');

        container.querySelectorAll('.button-chart').forEach(btn =>
            btn.addEventListener('click', () => openModal(btn.dataset.symbol))
        );
    } catch (error) {
        container.innerHTML = `<p class="empty-state">Could not load quotes. ${error.message}</p>`;
    }
};

/**
 * Fetch and render market news (top 6 articles).
 * Finnhub fields: headline, source, url, datetime (Unix seconds), summary
 */
const loadNews = async () => {
    const list = document.querySelector('#news-list');
    if (!list) return;

    try {
        const articles = await fetchMarketNews('general');

        list.innerHTML = articles.slice(0, 6).map(article => {
            const date = new Date(article.datetime * 1000).toLocaleDateString();
            return `
                <li class="news-item">
                    <a href="${article.url}" target="_blank" rel="noopener">${article.headline}</a>
                    <p class="news-meta">${article.source} &bull; ${date}</p>
                    <p class="news-summary">${article.summary ? article.summary.slice(0, 160) + '\u2026' : ''}</p>
                </li>`;
        }).join('');
    } catch (error) {
        list.innerHTML = `<li class="empty-state">Could not load news. ${error.message}</li>`;
    }
};

/**
 * Open the chart modal for a symbol.
 * @param {string} symbol
 */
const openModal = async (symbol) => {
    const modal = document.querySelector('#stock-modal');
    const body  = document.querySelector('#modal-body');
    if (!modal || !body) return;

    if (activeChart) { activeChart.destroy(); activeChart = null; }

    body.innerHTML = `
        <p class="modal-symbol">${symbol}</p>
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

loadFeatured();
loadNews();
initModal();
