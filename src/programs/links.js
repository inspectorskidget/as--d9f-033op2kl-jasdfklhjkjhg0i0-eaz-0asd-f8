import { createWindow } from '../modules/windowFactory.js';
import { getConfig, escapeText } from '../config.js';

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

    const config = getConfig();
    const socials = (config.profile && config.profile.socials) || [];
    const discordName = (config.discord && config.discord.username) || 'rezi.lol';

    const rows = socials.map(function (social) {
        const icon = ICONS[social.type] || 'icons/logo.svg';
        if (social.type === 'discord') {
            return '<div class="link-item" data-copy="' + escapeText(discordName) + '">' +
                '<img src="' + icon + '" alt="">' +
                '<span class="link-label">' + escapeText(social.label || 'Discord') + '</span>' +
                '<span class="link-url">click to copy @' + escapeText(discordName) + '</span>' +
                '</div>';
        }
        return '<a class="link-item" href="' + escapeText(social.url) + '" target="_blank" rel="noopener">' +
            '<img src="' + icon + '" alt="">' +
            '<span class="link-label">' + escapeText(social.label || social.type) + '</span>' +
            '<span class="link-url">' + escapeText(social.url) + '</span>' +
            '</a>';
    }).join('') || '<div style="padding: 12px; font-family: var(--system-font); font-size: 12px;">no links configured</div>';

    createWindow({
        id: winId,
        title: 'Links',
        content: '<div class="links-body">' + rows + '</div>',
        isCentered: true
    });

    const windowEl = document.getElementById(winId);
    windowEl.querySelectorAll('.link-item[data-copy]').forEach(function (row) {
        row.addEventListener('click', function () {
            const text = row.getAttribute('data-copy') || 'rezi.lol';
            const label = row.querySelector('.link-label');
            const url = row.querySelector('.link-url');
            copyText(text, function () {
                if (label) label.textContent = 'Copied!';
                if (url) url.textContent = '@' + text + ' is in your clipboard';
                setTimeout(function () {
                    const social = socials.find ? socials.find(function (social) { return social.type === 'discord'; }) : null;
                    if (label) label.textContent = (social && social.label) || 'Discord';
                    if (url) url.textContent = 'click to copy @' + text;
                }, 1500);
            });
        });
    });
}

function copyText(text, done) {
    function fallback() {
        const textArea = document.createElement('textarea');
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
