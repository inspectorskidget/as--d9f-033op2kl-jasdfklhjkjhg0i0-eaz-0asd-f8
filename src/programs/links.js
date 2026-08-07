import { createWindow } from '../modules/windowFactory.js';
import { getConfig, esc } from '../config.js';

const ICONS = {
    github: 'icons/github.svg',
    discord: 'icons/logo.svg',
    website: 'icons/logo.svg',
    telegram: 'icons/logo.svg',
    twitter: 'icons/logo.svg'
};

export function renderLinks() {
    const winId = 'window-links';
    if (document.getElementById(winId)) return;

    const cfg = getConfig();
    const socials = (cfg.profile && cfg.profile.socials) || [];

    const rows = socials.map(function (s) {
        const icon = ICONS[s.type] || 'icons/logo.svg';
        return '<a class="link-item" href="' + esc(s.url) + '" target="_blank" rel="noopener">' +
            '<img src="' + icon + '" alt="">' +
            '<span class="link-label">' + esc(s.label || s.type) + '</span>' +
            '<span class="link-url">' + esc(s.url) + '</span>' +
            '</a>';
    }).join('') || '<div style="padding: 12px; font-family: var(--system-font); font-size: 12px;">no links configured</div>';

    createWindow({
        id: winId,
        title: 'Links',
        content: '<div class="links-body">' + rows + '</div>',
        isCentered: true
    });
}
