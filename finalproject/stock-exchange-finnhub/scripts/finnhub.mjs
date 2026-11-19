/**
 * finnhub.mjs — Finnhub API helpers
 * Author: Jayser Pilapil
 * Description: Shared async fetch utilities for Finnhub REST API.
 *              Includes sessionStorage caching (1-min TTL) to reduce API calls,
 *              and a live rate-limit counter that updates a #rate-limit-badge element.
 *
 * Usage: import { fetchQuote, fetchProfile, fetchMarketNews, fetchCandles } from './finnhub.mjs';
 *
 * Rate limit: Finnhub free tier = 60 requests/minute.
 * Caching: quotes are stored in sessionStorage for 60 seconds — repeated filter/search
 *          interactions reuse the cache instead of firing new API calls.
 */

const API_KEY   = 'dbv7cd1r01qrflsnss20dbv7cd1r01qrflsnss2g';
const BASE      = 'https://finnhub.io/api/v1';
const CACHE_TTL = 60 * 1000;   // 1 minute in milliseconds
const RATE_MAX  = 60;          // Finnhub free tier cap per minute

/**
 * Rate-limit counter — tracks calls made in the current 60-second window.
 * Resets automatically after 60 seconds.
 */
let callsThisMinute = 0;
let windowStart     = Date.now();

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
    badge.className   = 'rate-limit-badge' + (remaining <= 10 ? ' rate-limit-warning' : '');
};

/**
 * Core fetch wrapper — async/await with try/catch and response.ok check.
 * Checks sessionStorage cache before making a network request.
 * @param {string} url
 * @param {boolean} [skipCache=false]
 * @returns {Promise<object>}
 */
const apiFetch = async (url, skipCache = false) => {
    if (!skipCache) {
        const cached = JSON.parse(sessionStorage.getItem(url) || 'null');
        if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
            return cached.data;
        }
    }

    trackCall();

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Finnhub request failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (!skipCache) {
            sessionStorage.setItem(url, JSON.stringify({ data, ts: Date.now() }));
        }
        return data;
    } catch (error) {
        console.error('apiFetch error:', error);
        throw error;
    }
};

/**
 * Get real-time quote for a symbol. Cached 60s.
 * Returns: { c: current, d: change, dp: changePercent, h: high, l: low, o: open, pc: prevClose }
 * @param {string} symbol
 */
export const fetchQuote = (symbol) =>
    apiFetch(`${BASE}/quote?symbol=${symbol}&token=${API_KEY}`);

/**
 * Get company profile for a symbol. Cached 60s.
 * Returns: { name, ticker, exchange, ipo, marketCapitalization, weburl, finnhubIndustry, logo }
 * @param {string} symbol
 */
export const fetchProfile = (symbol) =>
    apiFetch(`${BASE}/stock/profile2?symbol=${symbol}&token=${API_KEY}`);

/**
 * Get market news. Cached 60s.
 * Returns array: { headline, source, datetime, summary, url, image }
 * @param {string} [category='general']
 */
export const fetchMarketNews = (category = 'general') =>
    apiFetch(`${BASE}/news?category=${category}&token=${API_KEY}`);

/**
 * Get daily candles for a symbol over the past 90 days.
 * Uses Twelve Data free tier (Finnhub candles require a paid plan).
 * Cached in localStorage per symbol per calendar day — one fetch per day.
 * Returns { labels: string[], closes: number[] } ordered oldest → newest.
 * @param {string} symbol
 * @returns {Promise<{labels: string[], closes: number[]}>}
 */
export const fetchCandles = async (symbol) => {
    const TD_KEY   = 'ddc10ba2cc084255bb75ed79ec212501';
    const TD_BASE  = 'https://api.twelvedata.com';
    const today    = new Date().toISOString().slice(0, 10);
    const cacheKey = `td-candles-${symbol}-${today}`;
    const cached   = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached) return cached;

    const url      = `${TD_BASE}/time_series?symbol=${symbol}&interval=1day&outputsize=90&apikey=${TD_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Candle fetch failed: ${response.status} ${response.statusText}`);
    const data = await response.json();
    if (data.code && data.message) throw new Error(`Twelve Data: ${data.message}`);
    if (!data.values || !data.values.length) throw new Error('No candle data returned');

    const reversed = [...data.values].reverse();
    const result   = {
        labels: reversed.map(v => v.datetime),
        closes: reversed.map(v => parseFloat(v.close)),
    };
    localStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
};

/**
 * Format a price number to 2 decimal places with $ prefix.
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
 * Return CSS direction class: 'up', 'down', or 'flat'
 * @param {number} change
 * @returns {string}
 */
export const dirClass = (change) => {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'flat';
};
