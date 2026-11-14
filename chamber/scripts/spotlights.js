// Fetches members.json, filters to gold (3) and silver (2) members,
// randomly picks 2 or 3, and renders them as spotlight cards.

const MEMBERS_URL = 'data/members.json';
const MEMBERSHIP_LABELS = { 1: 'Member', 2: 'Silver', 3: 'Gold' };

const container = document.querySelector('#spotlights-container');

const pickRandom = (arr, count) => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

const renderSpotlights = (members) => {
    container.innerHTML = '';
    members.forEach((member) => {
        const card = document.createElement('div');
        card.setAttribute('class', 'spotlight-card');

        const logo = document.createElement('img');
        logo.setAttribute('src', member.image);
        logo.setAttribute('alt', member.name + ' logo');
        logo.setAttribute('loading', 'lazy');
        logo.setAttribute('width', '100');
        logo.setAttribute('height', '100');

        const name = document.createElement('h3');
        name.textContent = member.name;

        const phone = document.createElement('p');
        phone.textContent = member.phone;

        const address = document.createElement('p');
        address.textContent = member.address;

        const site = document.createElement('p');
        const siteLink = document.createElement('a');
        siteLink.setAttribute('href', member.website);
        siteLink.setAttribute('target', '_blank');
        siteLink.setAttribute('rel', 'noopener noreferrer');
        siteLink.textContent = member.website.replace(/^https?:\/\//, '');
        site.appendChild(siteLink);

        const level = document.createElement('p');
        const levelNum = member.membershipLevel;
        level.setAttribute('class', 'spotlight-level level-' + levelNum);
        level.textContent = MEMBERSHIP_LABELS[levelNum] || 'Member';

        card.append(logo, name, phone, address, site, level);
        container.appendChild(card);
    });
};

const loadSpotlights = async () => {
    try {
        const response = await fetch(MEMBERS_URL);
        if (!response.ok) throw new Error('Members fetch failed: ' + response.status);
        const data = await response.json();

        const eligible = data.members.filter(
            (m) => m.membershipLevel === 2 || m.membershipLevel === 3
        );

        // Randomly show 2 or 3 spotlights each page load
        const count = Math.random() < 0.5 ? 2 : 3;
        const picks = pickRandom(eligible, count);
        renderSpotlights(picks);

    } catch (error) {
        console.error('Spotlights error:', error);
        container.textContent = 'Spotlight data unavailable.';
    }
};

loadSpotlights();
