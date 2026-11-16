// Store the selected elements that we are going to use.
const navButton = document.querySelector('#ham-btn');
const navLinks = document.querySelector('#nav-bar');
const a = document.querySelectorAll('nav ul li a');

//Toggle the show class off and on
navButton.addEventListener('click', () => {
  const isOpen = navButton.classList.toggle('show');
  navButton.setAttribute('aria-expanded', isOpen);
  navLinks.classList.toggle('show');
});


const setActiveNavLink = () => {
    const pathname = window.location.pathname;
    document.querySelectorAll('nav ul li a').forEach(link => {
        const href = link.getAttribute('href').replace(/^\.\//, '');
        if (pathname.endsWith('/' + href)) {
            link.parentElement.classList.add('current');
        }
    });
};

// Listens for both event names: hydrationFinished (v5) and hydrationComplete (v5.1 / v6).
document.addEventListener('hydrationFinished', setActiveNavLink);
document.addEventListener('hydrationComplete', setActiveNavLink);
document.addEventListener('DOMContentLoaded', setActiveNavLink);

// Short delay fallback in case events fire before nav links are in the DOM
setTimeout(setActiveNavLink, 100);
setTimeout(setActiveNavLink, 500);