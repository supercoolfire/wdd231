/**
 * Rickster Egg v3.0 - Easter Egg Video Modal
 * Author: Jayser Pilapil
 * Date: 2026-05-15
 * Description: Click-to-toggle rick-roll video modal, triggered by the '.rickster-egg' class
 * Version: 3.0
 * Features:
 * - Plug & Play: auto-injects modal HTML and its own <style> block (no external CSS needed)
 * - Event delegation: works for triggers added to the DOM at any time (e.g. after hydration)
 * - Click '.rickster-egg' to open; click again or click the dark backdrop to close
 * - Closes on Escape key
 * - Guards against double-initialization
 * - Configurable video path via data-file attribute on the <script> tag
 *
 * Usage:
<script src="scripts/rickster-egg-v3.js" data-file="images/rick-roll.mp4" defer></script>
 *
 * The data-file attribute sets the video source path relative to the HTML page loading
 * the script. If omitted, defaults to 'images/rick-roll.mp4'.
 *
 * Examples:
<script src="scripts/rickster-egg-v3.js" data-file="images/rick-roll.mp4" defer></script>
<script src="../scripts/rickster-egg-v3.js" data-file="../../images/rick-roll.mp4" defer></script>
 *
 * Trigger Format (any element with the '.rickster-egg' class):
 * <span class="rickster-egg">Title</span>
 * or
 * <button class="rickster-egg">Surprise</button>
 *
 * CSS Classes & IDs Used:
 * - .rickster-egg        -> click trigger (cursor: pointer)
 * - .modal-rickster-egg  -> the modal overlay (fixed, full-screen, dark backdrop)
 * - #video-container     -> the modal element (same node as .modal-rickster-egg)
 * - #rick-video          -> the <video> element
 */

// Capture data-file at parse time — document.currentScript is only available synchronously
const _ricksterVideoSrc = document.currentScript?.dataset.file || 'images/rick-roll.mp4';

(function injectRicksterStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .modal-rickster-egg {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
            justify-content: center;
            align-items: center;
        }
        video#rick-video {
            max-width: 90%;
            max-height: 90%;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        .rickster-egg { cursor: pointer; }
    `;
    document.head.appendChild(style);
})();

const initRicksterEggV3 = () => {
    // Inject the modal once — guard against double-init
    if (document.getElementById('video-container')) return;
    if (!document.body) return;

    document.body.insertAdjacentHTML('beforeend', `
        <div id="video-container" class="modal-rickster-egg" style="display: none;">
            <video preload="none" playsinline id="rick-video" controls>
                <source src="${_ricksterVideoSrc}" type="video/mp4">
                <p>Your browser does not support the video tag.</p>
            </video>
        </div>
    `);

    const modal = document.getElementById('video-container');
    const video = document.getElementById('rick-video');

    // Event delegation — works for triggers added to the DOM at any time (e.g. after hydration)
    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('.rickster-egg');
        const isVisible = modal.style.display === 'flex';

        if (trigger) {
            if (isVisible) {
                video.pause();
                modal.style.display = 'none';
            } else {
                modal.style.display = 'flex';
                video.play();
            }
            return;
        }

        // Close when clicking the dark backdrop
        if (event.target === modal) {
            video.pause();
            modal.style.display = 'none';
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            video.pause();
            modal.style.display = 'none';
        }
    });
};

// Run as soon as the DOM is ready — no need to wait for hydration
if (document.readyState !== 'loading') {
    initRicksterEggV3();
} else {
    document.addEventListener('DOMContentLoaded', initRicksterEggV3);
}
