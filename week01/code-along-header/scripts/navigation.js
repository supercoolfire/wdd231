// Store the selected elements that we are going to use.
const navButton = document.querySelector('#ham-btn');
const navLinks = document.querySelector('#nav-bar');

//Toggle the show class off and on
navButton.addEventListener('click', () => {
  const isOpen = navButton.classList.toggle('show');
  navButton.setAttribute('aria-expanded', isOpen);
  navLinks.classList.toggle('show');
});