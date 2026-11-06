const url = 'https://byui-cse.github.io/cse-ww-program/data/latter-day-prophets.json';

const cards = document.querySelector('#cards');

const getProphetData = async () => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        // console.log(data);
        // console.table(data.prophets) // testing
        displayProphets(data.prophets);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
};

const displayProphets = (prophets) => {
    prophets.forEach((prophet) => {
        const card = document.createElement('section');
        const fullName = document.createElement('h2');
        const portrait = document.createElement('img');
        const bio = document.createElement('p');

        portrait.setAttribute('class', 'card');

        fullName.textContent = `${prophet.name} ${prophet.lastname}`;

        bio.innerHTML = `Date of birth: ${prophet.birthdate} <br> Place of birth: ${prophet.birthplace}`;
        bio.setAttribute('class', 'birthDate');
        
        portrait.setAttribute('src', prophet.imageurl);
        portrait.setAttribute('alt', `portrait of ${fullName.textContent}`);
        portrait.setAttribute('loading', 'lazy');
        portrait.setAttribute('width', '340');
        portrait.setAttribute('height', '440');

        card.appendChild(fullName);
        card.appendChild(bio);
        card.appendChild(portrait);

        cards.appendChild(card);
    });
}
getProphetData();