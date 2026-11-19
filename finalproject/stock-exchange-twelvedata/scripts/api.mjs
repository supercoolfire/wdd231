/**
 * api.mjs — Stock Exchange Tracker (Twelve Data edition)
 * Author: Jayser Pilapil
 * Description: Shared async fetch utilities using Twelve Data REST API.
 *              Quotes + candles are both available on the free tier (800 req/day, 8/min).
 *              Candles are cached in localStorage per symbol with a date stamp —
 *              only re-fetched once per calendar day, not on every modal open.
 *              Quotes are cached in sessionStorage for 60 seconds.
 *              A live rate-limit badge (#rate-limit-badge) tracks calls this minute.
 *
 * Usage: import { fetchQuote, fetchCandles, fetchNews, formatPrice, formatChange, dirClass } from './api.mjs';
 *
 * Free tier limits:
 *   - 8 requests / minute
 *   - 800 requests / day
 *
 * Twelve Data quote response shape:
 *   { symbol, name, exchange, currency, datetime, open, high, low, close, volume,
 *     previous_close, change, percent_change, is_market_open, fifty_two_week: { low, high } }
 *
 * Twelve Data time series response shape:
 *   { meta: { symbol, ... }, values: [{ datetime, open, high, low, close, volume }, ...] }
 *   values[0] is the most recent day.
 */

const API_KEY    = 'ddc10ba2cc084255bb75ed79ec212501';
const BASE       = 'https://api.twelvedata.com';
const QUOTE_TTL  = 60 * 1000;     // sessionStorage TTL: 60 seconds
const CANDLE_KEY = 'td-candles-'; // localStorage key prefix for daily candle cache
const RATE_MAX   = 8;             // Twelve Data free tier: 8 req/min

let callsThisMinute = 0;
let windowStart     = Date.now();

/**
 * Track one outgoing API call and update the rate-limit badge.
 */
const trackCall = () => {
    const now = Date.now();
    if (now - windowStart > 60_000) {
        callsThisMinute = 0;
        windowStart     = now;
    }
    callsThisMinute++;
    updateRateBadge();
};

const updateRateBadge = () => {
    const badge = document.querySelector('#rate-limit-badge');
    if (!badge) return;
    const remaining = Math.max(0, RATE_MAX - callsThisMinute);
    badge.textContent = `API calls this minute: ${callsThisMinute} / ${RATE_MAX} — ${remaining} remaining`;
    badge.className   = 'rate-limit-badge' + (remaining <= 2 ? ' rate-limit-warning' : '');
};

/**
 * Core fetch wrapper — async/await + try/catch + response.ok check.
 * Optionally reads/writes sessionStorage cache (quotes only).
 * @param {string} url
 * @param {boolean} [useSessionCache=false]
 * @returns {Promise<object>}
 */
const apiFetch = async (url, useSessionCache = false) => {
    if (useSessionCache) {
        const cached = JSON.parse(sessionStorage.getItem(url) || 'null');
        if (cached && (Date.now() - cached.ts) < QUOTE_TTL) return cached.data;
    }

    trackCall();

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Twelve Data request failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        // Twelve Data returns { code, message } for API-level errors (bad symbol, over limit, etc.)
        if (data.code && data.message) {
            throw new Error(`Twelve Data: ${data.message}`);
        }

        if (useSessionCache) {
            sessionStorage.setItem(url, JSON.stringify({ data, ts: Date.now() }));
        }
        return data;
    } catch (error) {
        console.error('apiFetch error:', error);
        throw error;
    }
};

/**
 * Get real-time quotes for multiple symbols in one API call (batch endpoint).
 * Twelve Data accepts comma-separated symbols: /quote?symbol=AAPL,MSFT,...
 * Up to 8 symbols per call — matches the free-tier 8 req/min limit exactly.
 * Single-symbol responses are a plain object; multi-symbol responses are keyed by symbol.
 * All results normalised to { c, d, dp, h, l, o, pc } and cached per symbol for 60s.
 *
 * @param {string[]} symbols
 * @returns {Promise<Record<string, {c,d,dp,h,l,o,pc}>>}
 */
export const fetchQuotes = async (symbols) => {
    const BATCH = 8;
    const normalise = (d) => ({
        c:  parseFloat(d.close)          || 0,
        d:  parseFloat(d.change)         || 0,
        dp: parseFloat(d.percent_change) || 0,
        h:  parseFloat(d.high)           || 0,
        l:  parseFloat(d.low)            || 0,
        o:  parseFloat(d.open)           || 0,
        pc: parseFloat(d.previous_close) || 0,
    });

    const result  = {};
    const toFetch = [];

    for (const symbol of symbols) {
        const cacheKey = `td-quote-${symbol}`;
        const cached   = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
        if (cached && (Date.now() - cached.ts) < QUOTE_TTL) {
            result[symbol] = cached.data;
        } else {
            toFetch.push(symbol);
        }
    }

    for (let i = 0; i < toFetch.length; i += BATCH) {
        const batch = toFetch.slice(i, i + BATCH);
        const url   = `${BASE}/quote?symbol=${batch.join(',')}&apikey=${API_KEY}`;
        const raw   = await apiFetch(url, false);

        if (batch.length === 1) {
            const normalised = normalise(raw);
            result[batch[0]] = normalised;
            sessionStorage.setItem(`td-quote-${batch[0]}`, JSON.stringify({ data: normalised, ts: Date.now() }));
        } else {
            for (const symbol of batch) {
                const normalised = normalise(raw[symbol] || {});
                result[symbol]   = normalised;
                sessionStorage.setItem(`td-quote-${symbol}`, JSON.stringify({ data: normalised, ts: Date.now() }));
            }
        }
    }

    return result;
};

/**
 * Convenience single-symbol wrapper around fetchQuotes.
 * @param {string} symbol
 * @returns {Promise<{c,d,dp,h,l,o,pc}>}
 */
export const fetchQuote = async (symbol) => {
    const map = await fetchQuotes([symbol]);
    return map[symbol];
};

/**
 * Get 90 days of daily closing prices for the Chart.js line chart.
 * Cached in localStorage keyed by symbol + today's date — one fetch per symbol per day.
 * Returns { labels: string[], closes: number[] } ordered oldest → newest.
 * @param {string} symbol
 * @returns {Promise<{labels: string[], closes: number[]}>}
 */
export const fetchCandles = async (symbol) => {
    const today    = new Date().toISOString().slice(0, 10);  // "YYYY-MM-DD"
    const cacheKey = `${CANDLE_KEY}${symbol}-${today}`;
    const cached   = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached) return cached;

    const url  = `${BASE}/time_series?symbol=${symbol}&interval=1day&outputsize=90&apikey=${API_KEY}`;
    const data = await apiFetch(url, false);

    if (!data.values || !data.values.length) {
        throw new Error('No candle data returned');
    }

    // values[0] is most recent — reverse so chart runs left→right
    const reversed = [...data.values].reverse();
    const result   = {
        labels: reversed.map(v => v.datetime),
        closes: reversed.map(v => parseFloat(v.close)),
    };

    localStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
};

/**
 * Get latest market news from Twelve Data.
 * Returns array of: { title, source, url, published_at, snippet }
 * @param {number} [count=6]
 * @returns {Promise<object[]>}
 */
export const fetchNews = async (count = 6) => {
    const url  = `${BASE}/news/latest?apikey=${API_KEY}&country=us`;
    const data = await apiFetch(url, true);
    return (data.data || []).slice(0, count);
};

/**
 * Format a price to 2 decimal places with $ prefix.
 * @param {number} price
 * @returns {string}
 */
export const formatPrice = (price) =>
    price != null ? `$${Number(price).toFixed(2)}` : 'N/A';

/**
 * Format a change percentage with sign and % suffix.
 * @param {number} pct
 * @returns {string}
 */
export const formatChange = (pct) => {
    if (pct == null) return 'N/A';
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${Number(pct).toFixed(2)}%`;
};

/**
 * Return CSS direction class: 'up', 'down', or 'flat'.
 * @param {number} change
 * @returns {string}
 */
export const dirClass = (change) => {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'flat';
};
