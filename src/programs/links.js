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
    const discordName = (cfg.discord && cfg.discord.username) || 'rezi.lol';

    const rows = socials.map(function (s) {
        const icon = ICONS[s.type] || 'icons/logo.svg';
        if (s.type === 'discord') {
            return '<div class="link-item" data-copy="' + esc(discordName) + '">' +
                '<img src="' + icon + '" alt="">' +
                '<span class="link-label">' + esc(s.label || 'Discord') + '</span>' +
                '<span class="link-url">click to copy @' + esc(discordName) + '</span>' +
                '</div>';
        }
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

    const win = document.getElementById(winId);
    win.querySelectorAll('.link-item[data-copy]').forEach(function (row) {
        row.addEventListener('click', function () {
            const text = row.getAttribute('data-copy') || 'rezi.lol';
            const label = row.querySelector('.link-label');
            const url = row.querySelector('.link-url');
            copyText(text, function () {
                if (label) label.textContent = 'Copied!';
                if (url) url.textContent = '@' + text + ' is in your clipboard';
                setTimeout(function () {
                    const s = socials.find ? socials.find(function (x) { return x.type === 'discord'; }) : null;
                    if (label) label.textContent = (s && s.label) || 'Discord';
                    if (url) url.textContent = 'click to copy @' + text;
                }, 1500);
            });
        });
    });
}

function copyText(text, done) {
    function fallback() {
        const ta = document.createElement('textarea');
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
