// Store the selected elements that we are going to use.
const navbuttom = document.querySelector('#ham-btn');
const navlinks = document.querySelector('#nav-bar');

//Toggle the show class off and on
navbuttom.addEventListener('click', () => {
navbuttom.classList.toggle('show');
navlinks.classList.toggle('show');

});