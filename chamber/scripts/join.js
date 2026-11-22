/*
 * join.js
 * Author: Jayser Pilapil
 * Description: Handles the W04 Chamber Join page.
 *   - Sets the hidden timestamp field on page load
 *   - Opens and closes the four membership-level <dialog> modals
 */

// -- Imports -------------------------------------------------
import { detectAndLoadDialCodes } from "./detectAndLoadDialCodes.mjs"
detectAndLoadDialCodes();
// -- Timestamp -------------------------------------------------
const timestampField = document.querySelector('#timestamp');
if (timestampField) {
    timestampField.value = new Date().toLocaleDateString();
}

// -- Modals ----------------------------------------------------
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

// -- Phone auto-format (spaces: 555 555 5555) ------------------
const phoneInput = document.querySelector('#phone');
const countrySelect = document.querySelector('#country-code');
const countryFlag = document.querySelector('#country-flag');

// Update flag image and dial code display when country selection changes
if (countrySelect && countryFlag) {
    countrySelect.addEventListener('change', () => {
        const selected = countrySelect.selectedOptions[0];
        if (selected && selected.dataset.flag) {
            countryFlag.src = selected.dataset.flag;
            countryFlag.alt = selected.textContent.split('(')[0].trim() + ' flag';
            const dialDisplay = document.querySelector('#dial-code-display');
            if (dialDisplay) dialDisplay.textContent = selected.value;
        }
    });
}

// -- Membership card selection animation -----------------------
const membershipSelect = document.querySelector('#membershipLevel');
const membershipSection = document.querySelector('.membership-cards-section');

// Hide the easter egg card on load � JS owns this state
const eggCard = document.querySelector('#egg-card');
if (eggCard) eggCard.style.display = 'none';

if (membershipSelect && membershipSection) {
    membershipSelect.addEventListener('change', () => {
        const chosen = membershipSelect.value;

        if (!chosen) {
            // Reset: ::before snaps back to full section size
            membershipSection.classList.remove('has-selection');
            return;
        }

        // Sink BEFORE animation (travels under cards)
        membershipSection.style.setProperty('--outline-z', '2');
        // console.log('float');

        const target = document.querySelector(`.membership-card[data-level="${chosen}"]`);
        if (!target) return;

        // Reveal the easter egg card once any level is chosen
        // (eggCard declared above)
        if (eggCard) eggCard.style.display = '';

        // Measure card position relative to the section
        const sRect = membershipSection.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();

        membershipSection.style.setProperty('--outline-top',    (tRect.top    - sRect.top)    + 'px');
        membershipSection.style.setProperty('--outline-left',   (tRect.left   - sRect.left)   + 'px');
        membershipSection.style.setProperty('--outline-right',  (sRect.right  - tRect.right)  + 'px');
        membershipSection.style.setProperty('--outline-bottom', (sRect.bottom - tRect.bottom) + 'px');

        // Add class AFTER setting vars so transition runs correctly
        membershipSection.classList.add('has-selection');

        // Float AFTER 400ms (transition done)
        setTimeout(() => {
            membershipSection.style.setProperty('--outline-z', '-1');
        }, 400);
        // console.log('sink');
    });
}
// Format digits as 555 555 5555 (spaces, no country code � that's in the select)
if (phoneInput) {
    phoneInput.addEventListener('input', () => {
        const digits = phoneInput.value.replace(/\D/g, '').slice(0, 10);

        let formatted = digits.slice(0, 3);
        if (digits.length > 3) formatted += ' ' + digits.slice(3, 6);
        if (digits.length > 6) formatted += ' ' + digits.slice(6, 10);

        phoneInput.value = formatted;
    });
}

// -- Easter egg: insert kevin.webp into egg card when rickster modal closes --
const watchForRicksterModal = () => {
    const modal = document.getElementById('video-container');
    const eggCard = document.getElementById('egg-card');
    if (!modal || !eggCard) return;

    const insertKevin = () => {
        if (eggCard.querySelector('.egg-kevin')) return;
        const img = document.createElement('img');
        img.src = 'images/kevin.webp';
        img.alt = 'Kevin';
        img.className = 'egg-kevin';
        img.width = 200;
        eggCard.appendChild(img);

        // Reset select to blank and dispatch change so the animation handler runs
        const membershipSel = document.querySelector('#membershipLevel');
        if (membershipSel) {
            membershipSel.value = '';
            membershipSel.dispatchEvent(new Event('change'));
        }
    };

    const observer = new MutationObserver(() => {
        if (modal.style.display === 'none') insertKevin();
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
};

// rickster-egg-v2.js injects #video-container on DOMContentLoaded ? poll until it exists
const eggPoll = setInterval(() => {
    if (document.getElementById('video-container')) {
        clearInterval(eggPoll);
        watchForRicksterModal();
    }
}, 50);
