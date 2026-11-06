/**
 * * Click Modaler v1.1 - Plug & Play Image Expansion
 * Author: Jayser Pilapil
 * Date: 2026-05-15
 * Description: Click-to-expand image modal with seamless origin-based transitions
 * Version: 1.1
 * Features:
 * - Plug & Play: zero configuration required, auto-injects modal DOM on first use
 * - Works on any <img> inside a '.card' or <figure> container
 * - Seamless expand/collapse animation that originates from the clicked image's exact position
 * - Automatic high-resolution image swapping (replaces '-small'/'-medium' suffix with '-large')
 * - Dynamic zoom-in/zoom-out cursor styling
 * - Developer-friendly console warnings when an image lacks a valid container
 * - Graceful error handling with actionable console messages
 * CSS Dependency:
 * - Requires 'modal-click-origin.css' (styles #img-modal and #modal-content)
 * 
 * Usage: 
 * <link rel="stylesheet" href="styles/modal-click-origin.css">
 * <script src="scripts/modal-click-origin.js" defer></script>
 * 
 * Trigger Conditions:
 * - An <img> triggers the modal if a '.card' or <figure> exists anywhere up its
 *   ancestor chain (uses element.closest(), so depth/nesting does not matter).
 * - If the image has no '.card' or <figure> ancestor, a console warning is logged
 *   and the modal does not open.
 *
 * All valid trigger examples:
 * 1. Direct child:
 *    <div class="card">
 *        <img src="images/photo-small.webp" alt="Description">
 *    </div>
 *
 * 2. Deeply nested descendant (depth does not matter):
 *    <div class="card">
 *        <div class="inner">
 *            <picture><img src="images/photo-small.webp" alt="Description"></picture>
 *        </div>
 *    </div>
 *
 * 3. Image carries the '.card' class itself:
 *    <img class="card" src="images/photo-small.webp" alt="Description">
 *
 * 4. Same three patterns also work with <figure> instead of .card:
 *    <figure><img src="images/photo-small.webp" alt="Description"></figure>
 * 
 * High-Resolution Naming Convention:
 * - Source image: photo-small.webp or photo-medium.webp
 * - Modal swaps to: photo-large.webp (suffix replaced automatically)
 * 
 * CSS Classes & IDs Used:
 * - #img-modal        -> the modal overlay container (injected into <body>)
 * - #modal-content    -> the <img> inside the modal
 * - .active           -> class toggled on #img-modal to trigger the CSS transition
 */

// Handle dynamic cursor styles for zoomable images
document.addEventListener('mouseover', (e) => {
    if (e.target.tagName === 'IMG' && (e.target.closest('.card') || e.target.closest('figure'))) {
        e.target.style.cursor = 'zoom-in';
    }
});

document.addEventListener('click', (e) => {
    // 1. Identification Phase
    const isImage = e.target.tagName === 'IMG';
    const container = e.target.closest('.card') || e.target.closest('figure');

    // If it's an image but not in a valid container, help the developer
    if (isImage && !container) {
        console.warn(
            "Click Modaler: Image clicked but no valid container found.\n" +
            "Solution: Wrap your <img> in an element with class 'card' or a <figure> tag to enable the modal."
        );
        return;
    }

    // Only proceed if we have a valid image in a valid container
    if (isImage && container) {
        try {
            const img = e.target;
            const rect = img.getBoundingClientRect();
            
            // 2. Initialization Phase
            let modal = document.getElementById('img-modal');
            if (!modal) {
                console.info("Click Modaler: Initializing modal structure in DOM...");
                document.body.insertAdjacentHTML('beforeend', `
                    <div id="img-modal">
                        <img id="modal-content" src="" alt="Expanded view">
                    </div>
                `);
                modal = document.getElementById('img-modal');
            }

            const modalImg = document.getElementById('modal-content');
            if (!modalImg) throw new Error("Modal content element (#modal-content) is missing from the injected HTML.");

            // 3. Positioning Phase
            // Position the modal image EXACTLY over the original image for a seamless transition
            modalImg.src = img.src;
            modalImg.style.top = `${rect.top}px`;
            modalImg.style.left = `${rect.left}px`;
            // Use high-resolution image if available by replacing size suffixes
            const highResSrc = img.src.replace(/-(small|medium)(\.\w+)$/, '-large$2');
            modalImg.src = highResSrc;
            modalImg.style.width = `${rect.width}px`;
            modalImg.style.height = `${rect.height}px`;
            modalImg.style.display = 'block';
            
            modal.style.display = 'block';
            modal.style.cursor = 'zoom-out'; // Set cursor to zoom-out when modal is open

            // 4. Animation Phase
            // Using requestAnimationFrame ensures the browser has painted the initial position before we animate
            requestAnimationFrame(() => {
                modal.classList.add('active');
            });

            // 5. Interaction Phase (Close Logic)
            modal.onclick = () => {
                modal.classList.remove('active');
                
                // Shrink back to the original spot (re-calculating in case of resize/scroll)
                const currentRect = img.getBoundingClientRect();
                modalImg.style.top = `${currentRect.top}px`;
                modalImg.style.left = `${currentRect.left}px`;
                modalImg.style.width = `${currentRect.width}px`;
                modalImg.style.height = `${currentRect.height}px`;

                // Clean up display after the CSS transition finishes (500ms)
                setTimeout(() => {
                    if (!modal.classList.contains('active')) {
                        modal.style.display = 'none';
                    }
                }, 500);
            };

        } catch (err) {
            console.error(
                "Click Modaler Error: Failed to trigger modal.\n" +
                "Details: " + err.message + "\n" +
                "Solution: Ensure your CSS includes the #img-modal and #modal-content styles."
            );
        }
    }
});
