/**
 * Course Cards v2.1
 * Author: Jayser Pilapil
 * Date: 2026-11-02
 * Description: Fetches course data from JSON, builds data-driven filter buttons,
 * renders neumorphic cards with search-term highlighting, and supports live search.
 * Features:
 * - Fetches course data from data/web-certificate-courses.json
 * - Filter buttons generated from unique subjects in the data (data-driven)
 * - "All" button always first; subject buttons sorted alphabetically
 * - Live search — matches subject+number, title, and certificate name
 * - Matched text highlighted with <mark> so users see why a card is included
 * - Completed courses rendered with a distinct completed style
 * - Credit total dynamically computed using Array.reduce()
 * - Empty state message when no courses match the current filter/search
 * Usage:
 * <script src="scripts/course.js" defer></script>
 * Requires .web-cert-courses section with .filter-buttons container
 * and #course-search input in the HTML.
 */

const courseSection   = document.querySelector('.web-cert-courses');
const filterContainer = courseSection.querySelector('.filter-buttons');
const searchInput     = document.querySelector('#course-search');

let allCourses   = [];    // full dataset from JSON
let activeFilter = 'ALL'; // current subject filter
let searchQuery  = '';    // current search string

/* ─── Fetch ─────────────────────────────────────────────────────────────── */

async function loadCourses() {
  try {
    const response = await fetch('data/web-certificate-courses.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    allCourses = await response.json();

    buildFilterButtons(allCourses);
    renderCourses(getFiltered());
  } catch (err) {
    courseSection.insertAdjacentHTML(
      'beforeend',
      `<p class="course-error">Could not load courses: ${err.message}</p>`
    );
  }
}

/* ─── Build Filter Buttons (data-driven) ────────────────────────────────── */

function buildFilterButtons(courses) {
  const subjects = [...new Set(courses.map(c => c.subject))].sort();
  filterContainer.appendChild(createFilterBtn('ALL', 'All', true));
  subjects.forEach(subject => {
    filterContainer.appendChild(createFilterBtn(subject, subject, false));
  });
}

function createFilterBtn(filterValue, label, isActive) {
  const btn = document.createElement('button');
  btn.classList.add('filter-btn');
  if (isActive) btn.classList.add('active');
  btn.dataset.filter = filterValue;
  btn.textContent = label;

  btn.addEventListener('click', () => {
    filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = filterValue;
    renderCourses(getFiltered());
  });

  return btn;
}

/* ─── Filter + Search Logic ─────────────────────────────────────────────── */

function getFiltered() {
  const query = searchQuery.trim().toLowerCase();

  return allCourses.filter(course => {
    const matchesFilter =
      activeFilter === 'ALL' || course.subject === activeFilter;

    const matchesSearch =
      query === '' ||
      `${course.subject} ${course.number}`.toLowerCase().includes(query) ||
      course.title.toLowerCase().includes(query) ||
      course.certificate.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });
}

/* ─── Highlight helper ───────────────────────────────────────────────────── */

/**
 * Escapes HTML special chars, then wraps every case-insensitive occurrence
 * of `query` with <mark>. Safe against XSS because we escape first.
 */
function highlight(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const safeQuery = escapeHtml(query.trim());
  if (!safeQuery) return safe;
  const re = new RegExp(`(${escapeRegex(safeQuery)})`, 'gi');
  return safe.replace(re, '<mark>$1</mark>');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ─── Render ─────────────────────────────────────────────────────────────── */

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

  const query = searchQuery.trim();
  const grid  = document.createElement('div');
  grid.classList.add('course-cards-grid');

  list.forEach(course => {
    const card = document.createElement('div');
    card.classList.add('course-card');
    if (course.completed) card.classList.add('completed');

    const courseCode = `${course.subject} ${course.number}`;

    card.innerHTML = `
      <h3>${highlight(courseCode, query)}</h3>
      <p class="course-title">${highlight(course.title, query)}</p>
      <p class="course-credits">${course.credits} credits</p>
      <p class="course-cert">${highlight(course.certificate, query)}</p>
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

/* ─── Live Search ────────────────────────────────────────────────────────── */

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  renderCourses(getFiltered());
});

/* ─── Init ───────────────────────────────────────────────────────────────── */

loadCourses();
