import { createWindow } from '../modules/windowFactory.js';
import { getConfig, escapeText } from '../config.js';

export function renderRepos() {
    const winId = 'window-repos';
    if (document.getElementById(winId)) return;

    const config = getConfig();
    const repos = config.repos || [];

    const rows = repos.map(function (repo, idx) {
        return '<div class="repo-item" data-idx="' + idx + '">' +
            '<img src="icons/github.svg" alt="">' +
            '<span class="repo-name">' + escapeText(repo.name || 'untitled') + '</span>' +
            '<span class="repo-desc">' + escapeText(repo.desc || '') + '</span>' +
            '</div>';
    }).join('') || '<div style="padding: 12px; font-family: var(--system-font); font-size: 12px;">no repos yet</div>';

    createWindow({
        id: winId,
        title: 'Repos',
        content:
            '<div class="repos-body">' +
                rows +
            '</div>',
        isCentered: true
    });

    document.getElementById(winId).querySelectorAll('.repo-item').forEach(function (row) {
        row.addEventListener('click', function () {
            const repo = (config.repos || [])[parseInt(row.getAttribute('data-idx'), 10)];
            if (repo && repo.url) window.open(repo.url, '_blank');
        });
    });
}
