const url = 'data/members.json';

const cards = document.querySelector('#cards');

const getMemberData = async () => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        // console.log(data);
        console.table(data.members) // testing
        displayMembers(data.members);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
};

const displayMembers = (members) => {
    members.forEach((member) => {
        const card = document.createElement('section');
        const businessName = document.createElement('h2');
        const tagLine = document.createElement('p');
        const logo = document.createElement('img');
        const contactInfo = document.createElement('div');
        const email = document.createElement('p');
        const phone = document.createElement('p');
        const url = document.createElement('p');

        logo.setAttribute('class', 'card');

        businessName.textContent = `${member.name}`;
        tagLine.textContent = `${member.tagline}`;
        tagLine.setAttribute('class', 'tagline');

        logo.setAttribute('src', member.imageurl);
        logo.setAttribute('alt', `logo of ${businessName.textContent}`);
        logo.setAttribute('loading', 'lazy');
        logo.setAttribute('width', '100');
        logo.setAttribute('height', '100');

        email.textContent = `${member.email}`;
        email.setAttribute('class', 'email');

        phone.textContent = `${member.phone}`;
        phone.setAttribute('class', 'phone');

        url.textContent = `${member.url}`;
        url.setAttribute('class', 'url');
        
        contactInfo.appendChild(email);
        contactInfo.appendChild(phone);

        contactInfo.appendChild(url);
        contactInfo.setAttribute('class', 'contactInfo');


        card.appendChild(businessName);
        card.appendChild(tagLine);
        card.appendChild(logo);
        card.appendChild(email);
        card.appendChild(phone);
        card.appendChild(url);

        cards.appendChild(card);
    });
}
getMemberData();