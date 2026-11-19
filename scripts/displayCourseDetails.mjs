const courseDetails = document.querySelector('#course-details');

export function displayCourseDetails(course) {
    courseDetails.innerHTML = `
        <button id="closeModal" aria-label="Close">&#10006;</button>
        <h2>${course.subject} ${course.number}</h2>
        <h3>${course.title}</h3>
        <p><strong>Credits</strong>: ${course.credits}</p>
        <p><strong>Certificate</strong>: ${course.certificate}</p>
        <p>${course.description}</p>
        <p><strong>Technologies</strong>: ${course.technology.join(', ')}</p>
    `;
    courseDetails.showModal();

    courseDetails.querySelector('#closeModal').addEventListener('click', () => {
        courseDetails.close();
    });
}

// Close when the user clicks the backdrop (outside the dialog box)
courseDetails.addEventListener('click', (event) => {
    if (event.target === courseDetails) {
        courseDetails.close();
    }
});