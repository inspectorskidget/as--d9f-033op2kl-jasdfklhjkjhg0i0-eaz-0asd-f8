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
            '</div>';
    }).join('') || '<div style="padding: 12px; font-family: var(--system-font); font-size: 12px;">no friends yet</div>';

    createWindow({
        id: winId,
        title: 'Friends',
        content:
            '<div class="friends-body">' +
                '<div class="friends-header"><span>close friends</span><span>' + friends.length + ' friends</span></div>' +
                rows +
            '</div>',
        isCentered: true
    });
}
