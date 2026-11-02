/**
 * Course Cards v1.0
	* Author: Jayser Pilapil
	* Date: 2026-10-31
	* Description: Fetches major course data from JSON, renders neumorphic cards,
	* and supports subject filter buttons (All / WDD / CSE) and live search.
	* Version: 1.0
 * Features:
 * - Fetches course data from an external JSON file (data/web-certificate-courses.json)
 * - Filter buttons: All, WDD, CSE — using Array.filter()
 * - Live search — matches subject+number, title, and certificate name
 * - Completed courses rendered with a distinct completed style
 * - Credit total dynamically computed using Array.reduce()
 * - Empty state message when no courses match the current filter/search
 * * Usage:
 * <script src="scripts/course.js" defer></script>
 * Requires .web-cert-courses section with .filter-btn[data-filter] buttons
 * and #course-search input in the HTML.
 */

const courseSection = document.querySelector('.web-cert-courses');
const filterButtons = courseSection.querySelectorAll('.filter-btn');
const searchInput   = document.querySelector('#course-search');

let allCourses   = [];   // full dataset from JSON
let activeFilter = 'ALL'; // current subject filter
let searchQuery  = '';    // current search string

/**
 * Fetch
 */

async function loadCourses() {
  try {
    const response = await fetch('data/web-certificate-courses.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    allCourses = await response.json();
    renderCourses(getFiltered());
  } catch (err) {
    courseSection.insertAdjacentHTML(
      'beforeend',
      `<p class="course-error">Could not load courses: ${err.message}</p>`
    );
  }
}

/**
 * Filter + Search Logic
 */

function getFiltered() {
  const query = searchQuery.trim().toLowerCase();

  return allCourses.filter(course => {
    // Subject filter
    const matchesFilter =
      activeFilter === 'ALL' || course.subject === activeFilter;

    // Live search — matches course number, title, subject, or certificate
    const matchesSearch =
      query === '' ||
      `${course.subject} ${course.number}`.toLowerCase().includes(query) ||
      course.title.toLowerCase().includes(query) ||
      course.certificate.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });
}

/**
 * Render
 */

function renderCourses(list) {
  courseSection.querySelector('.course-cards-grid')?.remove();
  courseSection.querySelector('.credit-total')?.remove();
  courseSection.querySelector('.course-empty')?.remove();

  if (list.length === 0) {
    courseSection.insertAdjacentHTML(
      'beforeend',
      '<p class="course-empty">No courses match your search.</p>'
    );
    return;
  }

  const grid = document.createElement('div');
  grid.classList.add('course-cards-grid');

  list.forEach(course => {
    const card = document.createElement('div');
    card.classList.add('course-card');
    if (course.completed) card.classList.add('completed');

    card.innerHTML = `
      <h3>${course.subject} ${course.number}</h3>
      <p class="course-title">${course.title}</p>
      <p class="course-credits">${course.credits} credits</p>
      ${course.completed ? '<span class="badge-complete">&#10003; Completed</span>' : ''}
    `;
    grid.appendChild(card);
  });

  courseSection.appendChild(grid);

  // Credit total via Array.reduce
  const total = list.reduce((sum, c) => sum + c.credits, 0);
  const totalEl = document.createElement('p');
  totalEl.classList.add('credit-total');
  totalEl.textContent = `Total Credits: ${total}`;
  courseSection.appendChild(totalEl);
}

/**
 * Filter Buttons
 */

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderCourses(getFiltered());
  });
});

/**
 * Live Search
 */

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  renderCourses(getFiltered());
});

/**
 * Initialization Logic
 */

loadCourses();
