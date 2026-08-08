import { createWindow } from '../modules/windowFactory.js';
import { getConfig, escapeText } from '../config.js';

export function renderScriptViewer() {
    const winId = 'window-scriptviewer';
    if (document.getElementById(winId)) return;

    const config = getConfig();
    const script = window._reziScript || (config.scripts || [])[0] || { title: 'script', content: '' };

    createWindow({
        id: winId,
        title: (script.title || 'script'),
        content:
            '<div class="script-editor" spellcheck="false">' + escapeText(script.content || '') + '</div>' +
            '<div class="script-actions">' +
                '<button class="os-btn" id="script-copy">Copy</button>' +
                '<button class="os-btn" id="script-dl">Save .txt</button>' +
            '</div>',
        isCentered: true
    });

    const windowEl = document.getElementById(winId);
    const content = script.content || '';

    windowEl.querySelector('#script-copy').addEventListener('click', function () {
        copyText(content, this);
    });

    windowEl.querySelector('#script-dl').addEventListener('click', function () {
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

function copyText(text, button) {
    function done() {
        if (button) {
            var old = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(function () { button.textContent = old; }, 1200);
        }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else { fallback(); }
    function fallback() {
        var textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try { document.execCommand('copy'); } catch (error) {}
        document.body.removeChild(textArea);
        done();
    }
}
