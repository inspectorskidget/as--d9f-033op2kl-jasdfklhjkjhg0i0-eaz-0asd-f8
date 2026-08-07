import { openWindow } from './windowManager.js';
import { playSound } from './audioManager.js';
import { getConfig } from '../config.js';

export function setupDesktopIcons() {
    document.querySelectorAll('.desktop-icon').forEach(function (icon) {
        icon.style.visibility = 'visible';
    });
}

export function initSelectionBox() {
    const desktop = document.querySelector('.desktop-area');

    let selectionBox = document.getElementById('selection-box');
    if (!selectionBox) {
        selectionBox = document.createElement('div');
        selectionBox.id = 'selection-box';
        document.body.appendChild(selectionBox);
    }

    let isDragging = false;
    let startX = 0;
    let startY = 0;

    desktop.addEventListener('mousedown', function (e) {
        if (e.button === 2 || e.target.closest('.desktop-icon') || e.target.closest('.taskbar')) return;

        document.querySelectorAll('.desktop-icon.selection').forEach(function (i) { i.classList.remove('selection'); });

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
    });

    let clickTimer = null;
    let lastClickedIcon = null;
    let justFinishedDragging = false;

    desktop.addEventListener('click', function (e) {
        if (justFinishedDragging) {
            justFinishedDragging = false;
            return;
        }

        const icon = e.target.closest('.desktop-icon');

        if (!icon) {
            document.querySelectorAll('.desktop-icon.selection').forEach(function (i) { i.classList.remove('selection'); });
            return;
        }

        if (lastClickedIcon === icon && clickTimer !== null) {
            clearTimeout(clickTimer);
            clickTimer = null;
            lastClickedIcon = null;

            icon.classList.remove('selection');
            icon.blur();

            if (icon.dataset.window) {
                openWindow(icon.dataset.window);
            }
        } else {
            document.querySelectorAll('.desktop-icon.selection').forEach(function (i) { i.classList.remove('selection'); });
            icon.classList.add('selection');

            lastClickedIcon = icon;
            clearTimeout(clickTimer);
            clickTimer = setTimeout(function () {
                clickTimer = null;
                lastClickedIcon = null;
            }, 250);
        }
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);

        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';

        const selRect = selectionBox.getBoundingClientRect();
        document.querySelectorAll('.desktop-icon').forEach(function (icon) {
            const iconRect = icon.getBoundingClientRect();
            const hits =
                iconRect.left < selRect.right &&
                iconRect.right > selRect.left &&
                iconRect.top < selRect.bottom &&
                iconRect.bottom > selRect.top;
            icon.classList.toggle('selection', hits);
        });
    });

    document.addEventListener('mouseup', function () {
        if (isDragging) {
            isDragging = false;
            justFinishedDragging = true;
            selectionBox.style.display = 'none';
        }
    });

    let contextMenu = document.getElementById('context-menu');
    if (!contextMenu) {
        contextMenu = document.createElement('div');
        contextMenu.id = 'context-menu';

        const githubUrl = githubUrlFromConfig();

        contextMenu.innerHTML = `
            <div class="context-menu-item" id="ctx-refresh">Refresh</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" id="ctx-terminal">Open Terminal</div>
            <div class="context-menu-item" id="ctx-github">My GitHub</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" id="ctx-properties">Properties</div>
        `;
        document.body.appendChild(contextMenu);

        document.getElementById('ctx-refresh').addEventListener('click', function () {
            const icons = document.querySelectorAll('.desktop-icon');
            icons.forEach(function (i) { i.style.visibility = 'hidden'; });
            setTimeout(function () { icons.forEach(function (i) { i.style.visibility = 'visible'; }); }, 100);
            hideContextMenu();
        });

        document.getElementById('ctx-terminal').addEventListener('click', function () {
            openWindow('window-terminal');
            hideContextMenu();
        });

        document.getElementById('ctx-github').addEventListener('click', function () {
            window.open(githubUrl, '_blank');
            hideContextMenu();
        });

        document.getElementById('ctx-properties').addEventListener('click', function () {
            openWindow('window-terminal');
            hideContextMenu();
        });
    }

    function hideContextMenu() {
        if (contextMenu.style.display === 'flex') {
            contextMenu.style.display = 'none';
        }
    }

    desktop.addEventListener('contextmenu', function (e) {
        if (e.target.closest('.desktop-icon') || e.target.closest('.window') || e.target.closest('.taskbar')) return;

        e.preventDefault();
        playSound('menu');

        let x = e.clientX;
        let y = e.clientY;

        const tbMenu = document.getElementById('taskbar-context-menu');
        if (tbMenu) tbMenu.style.display = 'none';
        contextMenu.style.display = 'flex';

        if (x + contextMenu.offsetWidth > window.innerWidth) x = window.innerWidth - contextMenu.offsetWidth - 2;
        if (y + contextMenu.offsetHeight > window.innerHeight) y = window.innerHeight - contextMenu.offsetHeight - 2;

        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
    });

    document.addEventListener('mousedown', function (e) {
        if (e.button === 0 && !e.target.closest('#context-menu')) {
            hideContextMenu();
        }
    });
}

function githubUrlFromConfig() {
    const cfg = getConfig();
    const socials = (cfg.profile && cfg.profile.socials) || [];
    for (let i = 0; i < socials.length; i++) {
        if (socials[i].type === 'github') return socials[i].url || 'https://github.com/';
    }
    return 'https://github.com/';
}
