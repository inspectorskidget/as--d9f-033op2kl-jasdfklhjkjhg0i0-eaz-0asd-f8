import { playSound } from './audioManager.js';
import { getConfig, esc } from '../config.js';

export function initClippy() {
    setTimeout(function () {
        if (document.getElementById('clippy-container')) return;

        const cfg = getConfig();
        const user = (cfg.profile && cfg.profile.displayName) || 'rezi';

        const clippyContainer = document.createElement('div');
        clippyContainer.id = 'clippy-container';

        clippyContainer.innerHTML = `
            <div class="clippy-bubble">
                <div class="clippy-close" id="clippy-close" title="Close">✕</div>
                <div class="clippy-text">
                    It looks like you want to explore the system!<br><br>
                    <b>Tip:</b> Press the <b>(Alt)</b> key on your keyboard to quickly open the Start Menu.
                    Open the Terminal and type <b>neofetch</b> for system info. — <b>${esc(user)}</b>
                </div>
            </div>
            <img src="assets/clippy.gif" alt="Clippy" class="clippy-img" id="clippy-img">
        `;

        document.body.appendChild(clippyContainer);
        playSound('clippy');

        const dismissClippy = function () {
            playSound('clippy');
            clippyContainer.style.opacity = '0';
            setTimeout(function () { clippyContainer.remove(); }, 300);
        };

        document.getElementById('clippy-close').onclick = dismissClippy;
        document.getElementById('clippy-img').onclick = dismissClippy;
    }, 10000);
}
