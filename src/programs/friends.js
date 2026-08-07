import { createWindow } from '../modules/windowFactory.js';
import { getConfig, esc } from '../config.js';

export function renderFriends() {
    const winId = 'window-friends';
    if (document.getElementById(winId)) return;

    const cfg = getConfig();
    const friends = cfg.friends || [];

    const rows = friends.map(function (friend, idx) {
        return '<div class="friend-row" data-idx="' + idx + '">' +
            '<img src="icons/friends.svg" alt="">' +
            '<span class="friend-alias">' + esc(friend.alias || '?') + '</span>' +
            '<span class="friend-id">' + esc(friend.id || 'no id') + '</span>' +
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

    const win = document.getElementById(winId);
    win.querySelectorAll('.friend-row').forEach(function (row) {
        row.addEventListener('click', function () {
            const friend = (cfg.friends || [])[parseInt(row.getAttribute('data-idx'), 10)];
            if (!friend || !friend.id) return;
            copyText(friend.id, function () {
                const header = win.querySelector('.friends-header span:last-child');
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
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
}
