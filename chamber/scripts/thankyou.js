/*
 * thankyou.js
 * Author: Jayser Pilapil
 * Description: Reads URL query parameters from the join form submission
 *              and displays them on the thankyou page.
 *
 * The join form uses method="get", so submitted values arrive as
 * query parameters: ?firstName=...&lastName=...&email=...etc.
 */

const params = new URLSearchParams(window.location.search);

const fields = [
    { param: 'firstName',    id: 'confirm-first'     },
    { param: 'lastName',     id: 'confirm-last'      },
    { param: 'email',        id: 'confirm-email'     },
    { param: 'phone',        id: 'confirm-phone'     },
    { param: 'businessName', id: 'confirm-business'  },
    { param: 'timestamp',    id: 'confirm-timestamp' },
];

fields.forEach(({ param, id }) => {
    const el = document.querySelector('#' + id);
    if (el) {
        el.textContent = params.get(param) || '\u2014';
    }
});
