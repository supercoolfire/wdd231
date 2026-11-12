/**
 * * Course Cards v3.0
 * Author: Jayser Pilapil
 * Date: 2026-11-13
 * Description: Renders Web Certificate course cards from the official course array,
 *              with All / WDD / CSE filter buttons and a dynamic credit total.
 * Version: 3.0
 * Features:
 * - **UPDATE** Official 6-course array copied from the W01 assignment (no fetch, no JSON)
 * - completed: true set for personally completed courses
 * - Filter buttons: All, WDD, CSE — using Array.filter()
 * - Credit total dynamically computed using Array.reduce()
 * - Credit total updates when a filter is applied
 * - Completed courses rendered with a visually distinct style
 * - All cards rendered dynamically — page auto-adjusts if data changes
 * Usage:
 * <script src="scripts/course.js" defer></script>
 * Requires .web-cert-courses section with .filter-buttons container in the HTML.
 */

/* ─── Official Course List Array (W01 Assignment) ────────────────────────── */

const courses = [
    {
        subject: 'CSE',
        number: 110,
        title: 'Introduction to Programming',
        credits: 2,
        certificate: 'Web and Computer Programming',
        description: 'This course will introduce students to programming. It will introduce the building blocks of programming languages (variables, decisions, calculations, loops, array, and input/output) and use them to solve problems.',
        technology: ['Python'],
        completed: true
    },
    {
        subject: 'WDD',
        number: 130,
        title: 'Web Fundamentals',
        credits: 2,
        certificate: 'Web and Computer Programming',
        description: 'This course introduces students to the World Wide Web and to careers in web site design and development. The course is hands on with students actually participating in simple web designs and programming. It is anticipated that students who complete this course will understand the fields of web design and development and will have a good idea if they want to pursue this degree as a major.',
        technology: ['HTML', 'CSS'],
        completed: true
    },
    {
        subject: 'CSE',
        number: 111,
        title: 'Programming with Functions',
        credits: 2,
        certificate: 'Web and Computer Programming',
        description: 'CSE 111 students become more organized, efficient, and powerful computer programmers by learning to research and call functions written by others; to write, call , debug, and test their own functions; and to handle errors within functions. CSE 111 students write programs with functions to solve problems in many disciplines, including business, physical science, human performance, and humanities.',
        technology: ['Python'],
        completed: true
    },
    {
        subject: 'CSE',
        number: 210,
        title: 'Programming with Classes',
        credits: 2,
        certificate: 'Web and Computer Programming',
        description: 'This course will introduce the notion of classes and objects. It will present encapsulation at a conceptual level. It will also work with inheritance and polymorphism.',
        technology: ['C#'],
        completed: true
    },
    {
        subject: 'WDD',
        number: 131,
        title: 'Dynamic Web Fundamentals',
        credits: 2,
        certificate: 'Web and Computer Programming',
        description: 'This course builds on prior experience in Web Fundamentals and programming. Students will learn to create dynamic websites that use JavaScript to respond to events, update content, and create responsive user experiences.',
        technology: ['HTML', 'CSS', 'JavaScript'],
        completed: true
    },
    {
        subject: 'WDD',
        number: 231,
        title: 'Frontend Web Development I',
        credits: 2,
        certificate: 'Web and Computer Programming',
        description: 'This course builds on prior experience with Dynamic Web Fundamentals and programming. Students will focus on user experience, accessibility, compliance, performance optimization, and basic API usage.',
        technology: ['HTML', 'CSS', 'JavaScript'],
        completed: false
    }
];

/* ─── DOM References ─────────────────────────────────────────────────────── */

const courseSection   = document.querySelector('.web-cert-courses');
const filterContainer = courseSection.querySelector('.filter-buttons');

let activeFilter = 'ALL';

/* ─── Build Filter Buttons ───────────────────────────────────────────────── */

function buildFilterButtons() {
    const filters = [
        { value: 'ALL', label: 'All' },
        { value: 'WDD', label: 'WDD' },
        { value: 'CSE', label: 'CSE' },
    ];

    filters.forEach(({ value, label }, index) => {
        const btn = document.createElement('button');
        btn.classList.add('filter-btn');
        if (index === 0) btn.classList.add('active');
        btn.dataset.filter = value;
        btn.textContent = label;

        btn.addEventListener('click', () => {
            filterContainer.querySelectorAll('.filter-btn')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = value;
            renderCourses(getFiltered());
        });

        filterContainer.appendChild(btn);
    });
}

/* ─── Filter Logic ───────────────────────────────────────────────────────── */

function getFiltered() {
    if (activeFilter === 'ALL') return courses;
    return courses.filter(c => c.subject === activeFilter);
}

/* ─── Render ─────────────────────────────────────────────────────────────── */

function renderCourses(list) {
    courseSection.querySelector('.course-cards-grid')?.remove();
    courseSection.querySelector('.credit-total')?.remove();

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

    // Credit total via Array.reduce()
    const total = list.reduce((sum, c) => sum + c.credits, 0);
    const totalEl = document.createElement('p');
    totalEl.classList.add('credit-total');
    totalEl.textContent = `Total Credits: ${total}`;
    courseSection.appendChild(totalEl);
}

/* ─── Init ───────────────────────────────────────────────────────────────── */

buildFilterButtons();
renderCourses(getFiltered());
