import { createWindow } from '../modules/windowFactory.js';
import { getConfig, escapeText } from '../config.js';
import { getDiscordStatus, onDiscordStatus } from '../modules/discordStatus.js';

const STATUS_COLORS = { online: '#4ade80', idle: '#f5b942', dnd: '#f87171', offline: '#888888' };

export function renderAbout() {
    const winId = 'window-about';
    if (document.getElementById(winId)) return;

    const config = getConfig();
    const profile = config.profile || {};
    const site = config.site || {};

    const menuHTML = `
        <div class="menu-item">File</div>
        <div class="menu-item">Edit</div>
        <div class="menu-item">Search</div>
        <div class="menu-item">Help</div>
    `;

    const socials = (profile.socials || []).map(function (social) {
        if (social.type === 'discord') {
            return '<li><a class="js-copy-discord" href="javascript:void(0)">' + escapeText(social.label || 'Discord') + ' — copy username</a></li>';
        }
        return '<li><a href="' + escapeText(social.url) + '" target="_blank" rel="noopener">' + escapeText(social.label || social.type) + '</a></li>';
    }).join('');

    const bodyHTML = `
        <div class="md-content">
            <h1>About Me</h1>

            <img src="pfp.png" alt="pfp" style="width: 96px; image-rendering: pixelated;">

            <h3>Who am I?</h3>
            <br>
            <p><b>${escapeText(profile.displayName || 'rezi')}</b> — <i>${escapeText(profile.tagline || '')}</i></p>
            <p>${escapeText(profile.bio || '')}</p>

            <hr>

            <h3>Meta</h3>
            <br>
            <ul>
                <li><b>Status:</b> <span id="about-status">${escapeText(profile.status || 'online')}</span></li>
                <li><b>Location:</b> ${escapeText(profile.location || 'unknown')}</li>
                <li><b>OS:</b> Arch Linux x86_64 <i style="color:#888">(waifuOS 98 SE — ${escapeText((config.pc_info && config.pc_info.build) || 'custom build')})</i></li>
            </ul>

            <hr>

            <h3>My Links</h3>
            <br>
            <ul>
                ${socials || '<li>no links configured</li>'}
            </ul>

            <br>
            <p style="text-align: center; color: #888; font-size: 12px;">
                <i>${escapeText(site.copyright || 'rezi (C)2026. All Rights Reserved.')}</i>
            </p>
        </div>
    `;

    createWindow({
        id: winId,
        title: 'About Me',
        menuBar: menuHTML,
        content: bodyHTML,
        isCentered: false
    });

    const windowEl = document.getElementById(winId);

    const statusEl = windowEl.querySelector('#about-status');
    if (statusEl) {
        const applyStatus = function (status) {
            const statusText = status || profile.status || 'online';
            statusEl.textContent = statusText === 'dnd' ? 'do not disturb' : statusText;
            statusEl.style.color = STATUS_COLORS[statusText] || STATUS_COLORS.online;
            statusEl.style.fontWeight = 'bold';
        };
        applyStatus(getDiscordStatus());
        onDiscordStatus(applyStatus);
    }

    const copyBtn = windowEl.querySelector('.js-copy-discord');
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            copyText(config.discord && config.discord.username ? config.discord.username : 'rezi.lol', copyBtn);
        });
    }
}

function copyText(text, button) {
    function done() {
        if (button) {
            const old = button.textContent;
            button.textContent = 'copied "' + text + '" to clipboard';
            setTimeout(function () { button.textContent = old; }, 1500);
        }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else { fallback(); }
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
}
