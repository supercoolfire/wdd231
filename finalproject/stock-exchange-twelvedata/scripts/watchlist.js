/**
 * watchlist.js — Stock Exchange Tracker: Watchlist page
 * Author: Jayser Pilapil
 * Description: Reads saved tickers from localStorage, fetches live quotes,
 *              renders cards, tracks last-visit date, and handles clear action.
 *
 * Usage: <script src="scripts/watchlist.js" type="module"></script>
 */

import { fetchQuote, formatPrice, formatChange, dirClass } from './api.mjs';
import { getWatchlist, removeFromWatchlist, clearWatchlist } from './watchlist.mjs';

const VISIT_KEY = 'stock-tracker-last-visit';

/**
 * Record and display the last visit date using localStorage.
 */
const handleLastVisit = () => {
    const msgEl  = document.querySelector('#last-visit-msg');
    const now    = new Date();
    const stored = localStorage.getItem(VISIT_KEY);

    if (msgEl) {
        msgEl.textContent = stored
            ? `Your last visit was ${new Date(stored).toLocaleString()}.`
            : 'This is your first visit to the Watchlist page.';
    }

    localStorage.setItem(VISIT_KEY, now.toISOString());
};

/**
 * Build a watchlist card HTML string.
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
                <button class="action-button button-watchlist saved" data-symbol="${symbol}" aria-pressed="true">
                    \u2716 Remove
                </button>
            </div>
        </div>`;
};

/**
 * Fetch and render all watchlisted stocks.
 */
const loadWatchlist = async () => {
    const container  = document.querySelector('#watchlist-cards');
    const actionsDiv = document.querySelector('#watchlist-actions');
    if (!container) return;

    const symbols = getWatchlist();

    if (!symbols.length) {
        container.innerHTML = `<p class="empty-state">Your watchlist is empty. <a href="stocks.html">Browse stocks</a> to add some.</p>`;
        if (actionsDiv) actionsDiv.hidden = true;
        return;
    }

    container.innerHTML = '<p class="loading-msg loading-dots">Loading watchlist</p>';

    try {
        const quotes = await Promise.all(symbols.map(sym => fetchQuote(sym)));
        container.innerHTML = symbols.map((sym, i) => buildCard(sym, quotes[i])).join('');

        if (actionsDiv) actionsDiv.hidden = false;

        container.querySelectorAll('.button-watchlist').forEach(btn => {
            btn.addEventListener('click', () => {
                removeFromWatchlist(btn.dataset.symbol);
                btn.closest('.stock-card')?.remove();
                if (!getWatchlist().length) {
                    container.innerHTML = `<p class="empty-state">Your watchlist is empty. <a href="stocks.html">Browse stocks</a> to add some.</p>`;
                    if (actionsDiv) actionsDiv.hidden = true;
                }
            });
        });
    } catch (error) {
        container.innerHTML = `<p class="empty-state">Could not load quotes: ${error.message}</p>`;
    }
};

/**
 * Wire up the Clear Watchlist button.
 */
const initClear = () => {
    const btn        = document.querySelector('#clear-watchlist');
    const container  = document.querySelector('#watchlist-cards');
    const actionsDiv = document.querySelector('#watchlist-actions');
    if (!btn) return;

    btn.addEventListener('click', () => {
        clearWatchlist();
        container.innerHTML = `<p class="empty-state">Your watchlist is empty. <a href="stocks.html">Browse stocks</a> to add some.</p>`;
        if (actionsDiv) actionsDiv.hidden = true;
    });
};

handleLastVisit();
loadWatchlist();
initClear();
