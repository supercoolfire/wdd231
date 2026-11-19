/**
 * watchlist.mjs — Watchlist localStorage helpers
 * Author: Jayser Pilapil
 * Description: Get, add, remove, and check the user's saved watchlist,
 *              stored as a JSON array of ticker symbols in localStorage.
 *
 * Usage: import { getWatchlist, addToWatchlist, removeFromWatchlist, inWatchlist } from './watchlist.mjs';
 */

const STORAGE_KEY = 'stock-tracker-watchlist';

/** @returns {string[]} */
export const getWatchlist = () =>
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const saveWatchlist = (list) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

/** @param {string} symbol @returns {boolean} */
export const inWatchlist = (symbol) =>
    getWatchlist().includes(symbol.toUpperCase());

/** @param {string} symbol */
export const addToWatchlist = (symbol) => {
    const list = getWatchlist();
    const sym  = symbol.toUpperCase();
    if (!list.includes(sym)) saveWatchlist([...list, sym]);
};

/** @param {string} symbol */
export const removeFromWatchlist = (symbol) => {
    const sym  = symbol.toUpperCase();
    saveWatchlist(getWatchlist().filter(s => s !== sym));
};

export const clearWatchlist = () =>
    localStorage.removeItem(STORAGE_KEY);
