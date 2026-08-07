import { createWindow } from '../modules/windowFactory.js';
import { openWindow } from '../modules/windowManager.js';
import { getConfig, esc } from '../config.js';

export function renderScripts() {
    const winId = 'window-scripts';
    if (document.getElementById(winId)) return;

    const cfg = getConfig();
    const scripts = cfg.scripts || [];

    const rows = scripts.map(function (script, idx) {
        return '<div class="script-row" data-idx="' + idx + '">' +
            '<img src="icons/notepad.ico" alt="">' +
            '<span class="script-title">' + esc(script.title || 'untitled') + '</span>' +
            '<span class="script-date">' + esc(script.date || '') + '</span>' +
            '</div>';
    }).join('') || '<div style="padding: 12px; font-family: var(--system-font); font-size: 12px;">no scripts yet</div>';

    createWindow({
        id: winId,
        title: 'Scripts',
        content:
            '<div class="scripts-body">' +
                '<div class="scripts-header"><span>' + (cfg.site && cfg.site.name) + ' — scripts</span><span>' + scripts.length + ' file(s)</span></div>' +
                rows +
            '</div>',
        isCentered: true
    });

    document.getElementById(winId).querySelectorAll('.script-row').forEach(function (row) {
        row.addEventListener('click', function () {
            openScript(parseInt(row.getAttribute('data-idx'), 10));
        });
    });
}

function openScript(idx) {
    const cfg = getConfig();
    const script = (cfg.scripts || [])[idx];
    if (!script) return;

    window._reziScript = script;
    openWindow('window-scriptviewer');
}
