import { bringToFront, closeWindow, minimizeWindow, openWindow } from './windowManager.js';
import { playSound } from './audioManager.js';

let activeContextWindowId = null;

function initTaskbarContextMenu() {
    if (document.getElementById('taskbar-context-menu')) return;

    const menu = document.createElement('div');
    menu.id = 'taskbar-context-menu';

    menu.innerHTML = `
        <div class="context-menu-item" id="tb-ctx-minimize">Minimize</div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" id="tb-ctx-close">Close</div>
    `;
    document.body.appendChild(menu);

    document.getElementById('tb-ctx-minimize').addEventListener('click', function () {
        if (!activeContextWindowId) return;

        const win = document.getElementById(activeContextWindowId);
        const isOpen = win && win.classList.contains('open');

        if (isOpen) {
            minimizeWindow(activeContextWindowId);
        } else {
            openWindow(activeContextWindowId);
        }

        menu.style.display = 'none';
    });

    document.getElementById('tb-ctx-close').addEventListener('click', function () {
        if (activeContextWindowId) {
            closeWindow(activeContextWindowId);
        }
        menu.style.display = 'none';
    });

    document.addEventListener('mousedown', function (e) {
        if (e.button === 0 && !e.target.closest('#taskbar-context-menu')) {
            menu.style.display = 'none';
        }
    });
}

const appIcons = {
    'window-about': 'icons/sobreMim.svg',
    'window-links': 'icons/internet.png',
    'window-scripts': 'icons/notepad.ico',
    'window-scriptviewer': 'icons/notepad.ico',
    'window-repos': 'icons/github.svg',
    'window-friends': 'icons/friends.svg',
    'window-terminal': 'icons/zenzinDOS.svg',
    'window-calculator': 'icons/calculator.ico'
};

export function createTaskbarButton(windowId, windowElement) {
    initTaskbarContextMenu();

    const taskbarArea = document.querySelector('.tasks-area');
    const titleText = windowElement.querySelector('.title-bar-text').textContent;
    const iconPath = appIcons[windowId] || 'icons/logo.svg';
    const existingButton = document.getElementById('btn-' + windowId);

    if (existingButton) {
        existingButton.classList.add('active');
        return;
    }

    const button = document.createElement('button');
    button.className = 'task-button active';
    button.id = 'btn-' + windowId;

    button.innerHTML = `
        <img src="${iconPath}" width="16" height="16" alt="">
        <span>${titleText}</span>
    `;

    button.onclick = function () {
        const isWindowOpen = windowElement.classList.contains('open');
        const isButtonActive = button.classList.contains('active');

        if (isWindowOpen && isButtonActive) {
            minimizeWindow(windowId);
        } else {
            playSound('window');
            windowElement.classList.add('minimizing');
            windowElement.classList.add('open');
            button.classList.add('active');
            bringToFront(windowElement);

            void windowElement.offsetWidth;
            windowElement.classList.remove('minimizing');
        }
    };

    button.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        playSound('menu');

        activeContextWindowId = windowId;
        const menu = document.getElementById('taskbar-context-menu');
        const win = document.getElementById(windowId);
        const isOpen = win && win.classList.contains('open');
        document.getElementById('tb-ctx-minimize').textContent = isOpen ? 'Minimize' : 'Open';

        const deskMenu = document.getElementById('context-menu');
        if (deskMenu) deskMenu.style.display = 'none';
        menu.style.display = 'flex';

        let x = e.clientX;
        let y = e.clientY;

        if (x + menu.offsetWidth > window.innerWidth) {
            x = window.innerWidth - menu.offsetWidth - 2;
        }

        y = y - menu.offsetHeight;

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
    });

    taskbarArea.appendChild(button);
}

export function removeTaskbarButton(windowId) {
    const taskButton = document.getElementById('btn-' + windowId);
    if (taskButton) {
        taskButton.remove();
    }
}
