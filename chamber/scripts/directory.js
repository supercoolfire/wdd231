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
        businessName.setAttribute('class', 'businessName');
        tagLine.textContent = `${member.tagline}`;
        tagLine.setAttribute('class', 'tagLine');

        logo.setAttribute('src', member.imageurl);
        logo.setAttribute('alt', `logo of ${businessName.textContent}`);
        logo.setAttribute('loading', 'lazy');
        logo.setAttribute('width', '100');
        logo.setAttribute('height', '100');
        logo.setAttribute('class', 'logo');

        email.innerHTML = `<span class="card-label">EMAIL:</span> ${member.email}`;
        email.setAttribute('class', 'email');

        phone.innerHTML = `<span class="card-label">PHONE:</span> ${member.phone}`;
        phone.setAttribute('class', 'phone');

        url.innerHTML = `<span class="card-label">URL:</span> ${member.website}`;
        url.setAttribute('class', 'url');
        
        contactInfo.appendChild(email);
        contactInfo.appendChild(phone);
        contactInfo.appendChild(url);
        contactInfo.setAttribute('class', 'contactInfo');


        card.appendChild(businessName);
        card.appendChild(tagLine);
        card.appendChild(logo);
        card.appendChild(contactInfo);

        cards.appendChild(card);
    });
}
getMemberData();

/* **************** GRIDDY *****************/

const gridbutton = document.querySelector("#grid");
const listbutton = document.querySelector("#list");
const display = document.querySelector("#cards");

// The following code could be written cleaner. How? We may have to simplfiy our HTMl and think about a default view.

gridbutton.addEventListener("click", () => {
	// example using arrow function
	display.classList.add("grid");
	display.classList.remove("list");
});

listbutton.addEventListener("click", showList); // example using defined function

function showList() {
	display.classList.add("list");
	display.classList.remove("grid");
}
