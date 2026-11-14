const url = 'data/members.json';

const cards = document.querySelector('#cards');
const gridbutton = document.querySelector('#grid');
const listbutton = document.querySelector('#list');
const searchInput = document.querySelector('#member-search');

cards.setAttribute('class','directory-cards');

let allMembers = [];
let searchQuery = '';

const getMemberData = async () => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        allMembers = data.members;
        showGrid();                      // default view
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

/* ─── Filter logic ───────────────────────────────────────────────────────── */

function getFiltered() {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allMembers;
    return allMembers.filter(member =>
        member.name.toLowerCase().includes(query) ||
        (member.tagline  && member.tagline.toLowerCase().includes(query)) ||
        (member.email    && member.email.toLowerCase().includes(query)) ||
        (member.phone    && member.phone.toLowerCase().includes(query)) ||
        (member.website  && member.website.toLowerCase().includes(query))
    );
}

/* ─── Highlight helper ───────────────────────────────────────────────────── */

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text, query) {
    const safe = escapeHtml(text);
    if (!query) return safe;
    const safeQ = escapeHtml(query.trim());
    if (!safeQ) return safe;
    const re = new RegExp(`(${escapeRegex(safeQ)})`, 'gi');
    return safe.replace(re, '<mark>$1</mark>');
}

/* **************** GRID VIEW (cards) *****************/

const displayMembers = (members) => {
    cards.innerHTML = '';

    if (members.length === 0) {
        cards.innerHTML = '<p class="member-empty">No members match your search.</p>';
        return;
    }

    const query = searchQuery.trim();

    members.forEach((member) => {
        const card = document.createElement('section');
        const businessName = document.createElement('h2');
        const tagLine = document.createElement('p');
        const logo = document.createElement('img');
        const contactInfo = document.createElement('div');
        const email = document.createElement('p');
        const phone = document.createElement('p');
        const site = document.createElement('p');

        card.setAttribute('class', 'directory-card');

        businessName.innerHTML = highlight(member.name, query);
        businessName.setAttribute('class', 'card-businessName');

        tagLine.innerHTML = highlight(member.tagline, query);
        tagLine.setAttribute('class', 'tagLine');

        logo.setAttribute('src', member.image);
        logo.setAttribute('alt', `logo of ${member.name}`);
        logo.setAttribute('loading', 'lazy');
        logo.setAttribute('width', '100');
        logo.setAttribute('height', '100');
        logo.setAttribute('class', 'logo-card');

        email.innerHTML = `<span class="card-label">EMAIL:</span> ${highlight(member.email, query)}`;
        email.setAttribute('class', 'email');

        phone.innerHTML = `<span class="card-label">PHONE:</span> ${highlight(member.phone, query)}`;
        phone.setAttribute('class', 'phone');

        site.innerHTML = `<span class="card-label">URL:</span> ${highlight(member.website, query)}`;
        site.setAttribute('class', 'url');
        
        contactInfo.append(email, phone, site);
        contactInfo.setAttribute('class', 'contactInfo');

        
        card.appendChild(businessName);
        card.appendChild(tagLine);
        card.appendChild(logo);
        card.appendChild(contactInfo);

        cards.appendChild(card);
    });
    fitTitles(); 
};

/* **************** LIST VIEW (table) *****************/

const displayTable = (members) => {
    cards.innerHTML = '';

    if (members.length === 0) {
        cards.innerHTML = '<p class="member-empty">No members match your search.</p>';
        return;
    }

    const query = searchQuery.trim();

    const columns = [
        { label: 'Name',    key: 'name',    cls: 'name' },
        { label: 'Email',   key: 'email',   cls: 'email' },
        { label: 'Phone',   key: 'phone',   cls: 'phone' },
        { label: 'Website', key: 'website', cls: 'url' }
    ];

    const table = document.createElement('table');
    table.setAttribute('class', 'member-table');

    // header
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    columns.forEach((col) => {
        const th = document.createElement('th');
        th.setAttribute('scope', 'col');
        th.textContent = col.label;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    // body: one row per member
    const tbody = document.createElement('tbody');
    members.forEach((member) => {
        const row = document.createElement('tr');
        columns.forEach((col) => {
            const td = document.createElement('td');
            td.innerHTML = highlight(member[col.key], query);
            td.setAttribute('data-label', col.label);   // used by mobile CSS
            td.setAttribute('class', col.cls);
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    cards.appendChild(table);
};

/* **************** GRIDDY *****************/

function showGrid() {
    cards.classList.add('grid');
    cards.classList.remove('list');
    gridbutton.setAttribute('aria-pressed', 'true');
    listbutton.setAttribute('aria-pressed', 'false');
    displayMembers(getFiltered());
}

function showList() {
    cards.classList.add('list');
    cards.classList.remove('grid');
    listbutton.setAttribute('aria-pressed', 'true');
    gridbutton.setAttribute('aria-pressed', 'false');
    displayTable(getFiltered());
}

gridbutton.addEventListener('click', showGrid);
listbutton.addEventListener('click', showList);

/* **************** LIVE SEARCH *****************/

searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    if (cards.classList.contains('list')) {
        displayTable(getFiltered());
    } else {
        displayMembers(getFiltered());
    }
});

/* **************** H2wow *****************/

function fitTitles() {
    document.querySelectorAll('#cards.grid h2').forEach((h) => {
        h.style.fontSize = '';
    const ratio = h.clientWidth / h.scrollWidth;
    if (ratio < 1) {
      const size = parseFloat(getComputedStyle(h).fontSize);
      h.style.fontSize = (size * ratio * 0.98) + 'px';
    }
  });
}
window.addEventListener('resize', fitTitles);

getMemberData();