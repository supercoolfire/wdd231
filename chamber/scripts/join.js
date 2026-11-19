/*
 * join.js
 * Author: Jayser Pilapil
 * Description: Handles the W04 Chamber Join page.
 *   - Sets the hidden timestamp field on page load
 *   - Opens and closes the four membership-level <dialog> modals
 */

// ── Timestamp ─────────────────────────────────────────────────
const timestampField = document.querySelector('#timestamp');
if (timestampField) {
    timestampField.value = new Date().toLocaleDateString();
}

// ── Modals ────────────────────────────────────────────────────
// Each .open-modal-btn carries data-modal="<dialog-id>"
document.querySelectorAll('.open-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const dialog = document.querySelector('#' + btn.dataset.modal);
        if (dialog) dialog.showModal();
    });
});

// Close buttons inside each dialog
document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const dialog = btn.closest('dialog');
        if (dialog) dialog.close();
    });
});

// Close on backdrop click (click lands on the <dialog> element itself)
document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
    });
});
