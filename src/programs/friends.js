import { createWindow } from '../modules/windowFactory.js';
import { getConfig, escapeText } from '../config.js';

export function renderFriends() {
    const winId = 'window-friends';
    if (document.getElementById(winId)) return;

    const config = getConfig();
    const friends = config.friends || [];

    const rows = friends.map(function (friend, idx) {
        return '<div class="friend-row" data-idx="' + idx + '">' +
            '<img src="icons/friends.svg" alt="">' +
            '<span class="friend-alias">' + escapeText(friend.alias || '?') + '</span>' +
            '<span class="friend-id">' + escapeText(friend.id || 'no id') + '</span>' +
            '</div>';
    }).join('') || '<div style="padding: 12px; font-family: var(--system-font); font-size: 12px;">no friends yet</div>';

    createWindow({
        id: winId,
        title: 'Friends',
        content:
            '<div class="friends-body">' +
                '<div class="friends-header"><span>close friends</span><span>click a row to copy their Discord id</span></div>' +
                rows +
            '</div>',
        isCentered: true
    });

    const windowEl = document.getElementById(winId);
    windowEl.querySelectorAll('.friend-row').forEach(function (row) {
        row.addEventListener('click', function () {
            const friend = (config.friends || [])[parseInt(row.getAttribute('data-idx'), 10)];
            if (!friend || !friend.id) return;
            copyText(friend.id, function () {
                const header = windowEl.querySelector('.friends-header span:last-child');
                if (!header) return;
                const old = header.textContent;
                header.textContent = 'copied ' + (friend.alias || 'friend') + '\'s id';
                setTimeout(function () { header.textContent = old; }, 1500);
            });
        });
    });
}

function copyText(text, done) {
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
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
}
