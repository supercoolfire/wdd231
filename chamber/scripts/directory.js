const url = 'data/members.json';

const cards = document.querySelector('#cards');
const gridbutton = document.querySelector('#grid');
const listbutton = document.querySelector('#list');

let allMembers = [];

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

/* **************** GRID VIEW (cards) *****************/

const displayMembers = (members) => {
    cards.innerHTML = '';

    members.forEach((member) => {
        const card = document.createElement('section');
        const businessName = document.createElement('h2');
        const tagLine = document.createElement('p');
        const logo = document.createElement('img');
        const contactInfo = document.createElement('div');
        const email = document.createElement('p');
        const phone = document.createElement('p');
        const site = document.createElement('p');

        businessName.textContent = member.name;
        businessName.setAttribute('class', 'businessName');

        tagLine.textContent = member.tagline;
        tagLine.setAttribute('class', 'tagLine');

        logo.setAttribute('src', member.image);
        logo.setAttribute('alt', `logo of ${member.name}`);
        logo.setAttribute('loading', 'lazy');
        logo.setAttribute('width', '100');
        logo.setAttribute('height', '100');
        logo.setAttribute('class', 'logo card');

        email.innerHTML = `<span class="card-label">EMAIL:</span> ${member.email}`;
        email.setAttribute('class', 'email');

        phone.innerHTML = `<span class="card-label">PHONE:</span> ${member.phone}`;
        phone.setAttribute('class', 'phone');

        site.innerHTML = `<span class="card-label">URL:</span> ${member.website}`;
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
            td.textContent = member[col.key];
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
    displayMembers(allMembers);
}

function showList() {
    cards.classList.add('list');
    cards.classList.remove('grid');
    displayTable(allMembers);
}

gridbutton.addEventListener('click', showGrid);
listbutton.addEventListener('click', showList);

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