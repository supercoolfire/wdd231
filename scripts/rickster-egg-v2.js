/**
 * Rickster Egg - v2.1
 * Triggered by the class ".rickster-egg"
 * Handles modal toggle and video playback.
 * 
 * Usage:
 * 1. Add <script src="/cripts/rickster-egg-v2.js" defer></script> to your HTML head.
 * 2. Put the mp4 video at root /images/rick-roll.mp4 or update the source in the script.
 * 3. Add class="rickster-egg" to any element you want as a trigger (e.g., <span class="rickster-egg">Title</span>).
 * 4. Ensure the triggering element is visible and reachable in the DOM.
 * 5. The script automatically injects the necessary modal HTML if it's not present.
 */

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

const initRicksterEggV2 = () => {
    // Inject the modal once — guard against double-init
    if (document.getElementById('video-container')) return;
    if (!document.body) return;

    document.body.insertAdjacentHTML('beforeend', `
        <div id="video-container" class="modal-rickster-egg" style="display: none;">
            <video preload="none" playsinline id="rick-video" controls>
                <source src="images/rick-roll.mp4" type="video/mp4">
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
    initRicksterEggV2();
} else {
    document.addEventListener('DOMContentLoaded', initRicksterEggV2);
}
