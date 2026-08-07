import { createWindow } from '../modules/windowFactory.js';
import { getConfig, esc } from '../config.js';

export function renderScriptViewer() {
    const winId = 'window-scriptviewer';
    if (document.getElementById(winId)) return;

    const cfg = getConfig();
    const script = window._reziScript || (cfg.scripts || [])[0] || { title: 'script', content: '' };

    createWindow({
        id: winId,
        title: (script.title || 'script'),
        content:
            '<div class="script-editor" spellcheck="false">' + esc(script.content || '') + '</div>' +
            '<div class="script-actions">' +
                '<button class="os-btn" id="script-copy">Copy</button>' +
                '<button class="os-btn" id="script-dl">Save .txt</button>' +
            '</div>',
        isCentered: true
    });

    const win = document.getElementById(winId);
    const content = script.content || '';

    win.querySelector('#script-copy').addEventListener('click', function () {
        copyText(content, this);
    });

    win.querySelector('#script-dl').addEventListener('click', function () {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (script.title || 'script').replace(/[\\/:*?"<>|]/g, '_') || 'script.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

function copyText(text, btn) {
    function done() {
        if (btn) {
            var old = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(function () { btn.textContent = old; }, 1200);
        }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else { fallback(); }
    function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        done();
    }
}
