import { temples, url } from "../data/temples.js";

// References
const showHere  = document.querySelector("#showHere");
const mydialog  = document.querySelector("#mydialog");
const mytitle   = document.querySelector("#mydialog h2");
const myclose   = document.querySelector("#mydialog button");
const myinfo    = document.querySelector("#mydialog p");

// Close button
myclose.addEventListener("click", () => mydialog.close());

// Close on backdrop click
mydialog.addEventListener("click", (e) => {
    if (e.target === mydialog) mydialog.close();
});

// Render temple images
function displayItems(data) {
    data.forEach(x => {
        const photo = document.createElement("img");
        photo.src = `${url}${x.path}`;
        photo.alt = x.name;
        photo.addEventListener("click", () => showStuff(x));
        showHere.appendChild(photo);
    });
}

// Open dialog with temple details
function showStuff(x) {
    mytitle.textContent = x.name;
    myinfo.textContent  = `Dedicated ${x.dedicated} by ${x.person} as temple number ${x.number}`;
    mydialog.showModal();
}

displayItems(temples);