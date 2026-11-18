/**
 * * Click Modaler v2.0 - Plug & Play Image Expansion
 * Author: Jayser Pilapil
 * Date: 2026-11-18
 * Description: Click-to-expand image modal with seamless origin-based transitions
 * Version: 2.0
 * Features:
 * - Plug & Play: zero configuration required, auto-injects modal DOM on first use
 * - Works on any <img> inside a '.card' or <figure> container
 * - Accepts class="modal-click-origin" as a trigger
 * - Seamless expand/collapse animation that originates from the clicked image's exact position
 * - Automatic high-resolution image swapping (replaces '-small'/'-medium' suffix with '-large')
 * - Dynamic zoom-in/zoom-out cursor styling
 * - Developer-friendly console warnings when an image lacks a valid container
 * - Graceful error handling with actionable console messages
 * CSS Dependency:
 * - None. Styles are injected automatically by this script.
 * 
 * Usage: 
 * <link rel="stylesheet" href="styles/modal-click-origin.css">
 * <script src="scripts/modal-click-origin-v2.js" defer></script>
 * 
 * Trigger Conditions:
 *
 * All valid trigger examples:
 * 1. Direct child:
     <div class="card">
         <img src="images/photo-small.webp" alt="Description">
     </div>
 
 * 2. Deeply nested descendant (depth does not matter):
    <div class="card">
        <div class="inner">
            <picture><img src="images/photo-small.webp" alt="Description"></picture>
        </div>
    </div>

 * 3. Image carries the '.card' class itself:
    <img class="card" src="images/photo-small.webp" alt="Description">
 *
 * 4. Same three patterns also work with <figure> instead of .card:
    <figure><img src="images/photo-small.webp" alt="Description"></figure>
 *
 * 5. class="modal-click-origin"
    <img class="modal-click-origin" src="images/photo-small.webp" alt="Description">
 * 
 * High-Resolution Naming Convention:
 * - Source image: photo-small.webp or photo-medium.webp
 * - Modal swaps to: photo-large.webp (suffix replaced automatically)
 * 
 * CSS Classes & IDs Used:
 * - #img-modal        -> the modal overlay container (injected into <body>)
 * - #modal-content    -> the <img> inside the modal
 * - .active           -> class toggled on #img-modal to trigger the CSS transition
 * - .modal-click-origin -> opt-in class (v2.0) marking an image/wrapper as a modal trigger
 */

// Inject modal styles once
(function injectModalStyles() {
    if (document.getElementById('modal-click-origin-styles')) return;
    const style = document.createElement('style');
    style.id = 'modal-click-origin-styles';
    style.textContent = `
#img-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #00000000;
    transition: background 0.5s ease;
    z-index: 9999;
    cursor: pointer;
}
#img-modal.active {
    background: #000000d9;
    color: #e4bd76;
}
#modal-content {
    position: fixed;
    transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
    object-fit: contain;
    z-index: 10000;
}
#img-modal.active #modal-content {
    top: 2.5vh !important;
    left: 2.5vw !important;
    width: 95vw !important;
    height: 95vh !important;
}`;
    document.head.appendChild(style);
})();

// Handle dynamic cursor styles for zoomable images
document.addEventListener('mouseover', (e) => {
    if (e.target.tagName === 'IMG' && (e.target.closest('.card') || e.target.closest('figure') || e.target.closest('.modal-click-origin'))) {
        e.target.style.cursor = 'zoom-in';
    }
});

document.addEventListener('click', (e) => {
    // 1. Identification Phase
    const isImage = e.target.tagName === 'IMG';
    const container = e.target.closest('.card') || e.target.closest('figure') || e.target.closest('.modal-click-origin');

    // If it's an image but not in a valid container, help the developer
    if (isImage && !container) {
        console.warn(
            "Click Modaler: Image clicked but no valid container found.\n" +
            "Solution: Wrap your <img> in an element with class 'card', 'modal-click-origin', or a <figure> tag to enable the modal."
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
