import { createTaskbarButton, removeTaskbarButton } from './taskbar.js';
import { playSound } from './audioManager.js';

import { renderAbout } from '../programs/about.js';
import { renderLinks } from '../programs/links.js';
import { renderScripts } from '../programs/scripts.js';
import { renderScriptViewer } from '../programs/scriptviewer.js';
import { renderRepos } from '../programs/repos.js';
import { renderFriends } from '../programs/friends.js';
import { renderTerminal } from '../programs/terminal.js';
import { renderCalculator } from '../programs/calculator.js';

let zIndexCounter = 100;

const windowRegistry = {
    'window-about': renderAbout,
    'window-links': renderLinks,
    'window-scripts': renderScripts,
    'window-scriptviewer': renderScriptViewer,
    'window-repos': renderRepos,
    'window-friends': renderFriends,
    'window-terminal': renderTerminal,
    'window-calculator': renderCalculator
};

const hibernationVault = new Map();

function hibernateWindow(windowId) {
    const win = document.getElementById(windowId);
    if (!win) return;

    const body = win.querySelector('.window-body');
    if (body && body.childNodes.length > 0) {
        win.dispatchEvent(new CustomEvent('window-hibernated'));

        const fragment = document.createDocumentFragment();
        while (body.firstChild) {
            fragment.appendChild(body.firstChild);
        }
        hibernationVault.set(windowId, fragment);
    }
}

function wakeUpWindow(windowId) {
    const win = document.getElementById(windowId);
    if (!win) return;

    const body = win.querySelector('.window-body');
    if (body && hibernationVault.has(windowId)) {
        body.appendChild(hibernationVault.get(windowId));
        hibernationVault.delete(windowId);
        win.dispatchEvent(new CustomEvent('window-woken'));
    }
}

export function bringToFront(windowElement) {
    zIndexCounter++;
    windowElement.style.zIndex = zIndexCounter;
}

export function preRenderWindow(windowId) {
    let windowElement = document.getElementById(windowId);

    if (!windowElement && windowRegistry[windowId]) {
        windowRegistry[windowId]();
    }
}

export function openWindow(windowId, playAudio = true) {
    let windowElement = document.getElementById(windowId);

    if (!windowElement && windowRegistry[windowId]) {
        windowRegistry[windowId]();
        windowElement = document.getElementById(windowId);
    }

    if (windowElement) {
        wakeUpWindow(windowId);

        if (playAudio) playSound('window');
        windowElement.classList.add('open');
        windowElement.classList.remove('minimizing');

        if (windowElement.dataset.skipTaskbar !== 'true') {
            createTaskbarButton(windowId, windowElement);
            const taskButton = document.getElementById('btn-' + windowId);
            if (taskButton) taskButton.classList.add('active');
        }
        bringToFront(windowElement);
    }
}

export function closeWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    if (windowElement) {
        playSound('window');
        windowElement.style.transition = 'none';
        windowElement.style.visibility = 'hidden';
        windowElement.style.opacity = '0';
        windowElement.style.pointerEvents = 'none';

        setTimeout(function () {
            windowElement.classList.remove('open');
            windowElement.classList.remove('minimizing');
            windowElement.style.transition = '';
            windowElement.style.visibility = '';
            windowElement.style.opacity = '';
            windowElement.style.pointerEvents = '';
            windowElement.style.top = '';
            windowElement.style.left = '';
            windowElement.style.margin = '';
            windowElement.style.transform = '';

            if (windowElement.dataset.skipTaskbar !== 'true') {
                removeTaskbarButton(windowId);
            }

            hibernateWindow(windowId);
        }, 50);
    }
}

export function minimizeWindow(windowId, playAudio = true) {
    const windowElement = document.getElementById(windowId);
    const taskButton = document.getElementById('btn-' + windowId);

    if (windowElement) {
        if (playAudio) playSound('minimize');
        windowElement.classList.add('minimizing');

        setTimeout(function () {
            windowElement.classList.remove('open');
            windowElement.classList.remove('minimizing');
        }, 150);
    }
    if (taskButton) taskButton.classList.remove('active');
}

export function initWindowListener() {
    document.addEventListener('mousedown', function (e) {
        const clickedWindow = e.target.closest('.window');
        if (clickedWindow) bringToFront(clickedWindow);
    });
}
