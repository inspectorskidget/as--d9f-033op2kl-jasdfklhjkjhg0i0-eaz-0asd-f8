import { loadConfig } from './config.js';
import { startClock } from './modules/clock.js';
import { initSelectionBox, setupDesktopIcons } from './modules/desktop.js';
import { openWindow, closeWindow, minimizeWindow, initWindowListener, preRenderWindow } from './modules/windowManager.js';
import { initDraggableWindows } from './modules/drag.js';
import { initStartMenu } from './modules/startMenu.js';
import { runBootSequence } from './modules/boot.js';
import { initLogin } from './modules/login.js';
import { initClippy } from './modules/clippy.js';
import { initDiscordStatus } from './modules/discordStatus.js';

window.openWindow = openWindow;
window.closeWindow = closeWindow;
window.minimizeWindow = minimizeWindow;

async function initSystem() {
    await loadConfig();

    startClock();

    const loginPromise = initLogin();

    await runBootSequence();

    await loginPromise;

    initClippy();

    initDiscordStatus();

    initSelectionBox();
    setupDesktopIcons();
    initWindowListener();
    initDraggableWindows();
    initStartMenu();

    openWindow('window-about', false);
}

document.addEventListener('DOMContentLoaded', initSystem);

document.addEventListener('contextmenu', function (e) {
    if (e.target.closest('.desktop-icon') || !e.target.closest('.desktop-area')) {
        e.preventDefault();
    }
});
