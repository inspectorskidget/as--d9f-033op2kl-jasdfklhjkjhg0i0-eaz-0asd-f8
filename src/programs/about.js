import { createWindow } from '../modules/windowFactory.js';
import { getConfig, esc } from '../config.js';
import { getDiscordStatus, onDiscordStatus } from '../modules/discordStatus.js';

const STATUS_COLORS = { online: '#4ade80', idle: '#f5b942', dnd: '#f87171', offline: '#888888' };

export function renderAbout() {
    const winId = 'window-about';
    if (document.getElementById(winId)) return;

    const cfg = getConfig();
    const p = cfg.profile || {};
    const site = cfg.site || {};

    const menuHTML = `
        <div class="menu-item">File</div>
        <div class="menu-item">Edit</div>
        <div class="menu-item">Search</div>
        <div class="menu-item">Help</div>
    `;

    const socials = (p.socials || []).map(function (s) {
        if (s.type === 'discord') {
            return '<li><a class="js-copy-discord" href="javascript:void(0)">' + esc(s.label || 'Discord') + ' — copy username</a></li>';
        }
        return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label || s.type) + '</a></li>';
    }).join('');

    const bodyHTML = `
        <div class="md-content">
            <h1>About Me</h1>

            <img src="pfp.png" alt="pfp" style="width: 96px; image-rendering: pixelated;">

            <h3>Who am I?</h3>
            <br>
            <p><b>${esc(p.displayName || 'rezi')}</b> — <i>${esc(p.tagline || '')}</i></p>
            <p>${esc(p.bio || '')}</p>

            <hr>

            <h3>Meta</h3>
            <br>
            <ul>
                <li><b>Status:</b> <span id="about-status">${esc(p.status || 'online')}</span></li>
                <li><b>Location:</b> ${esc(p.location || 'unknown')}</li>
                <li><b>OS:</b> Arch Linux x86_64 <i style="color:#888">(waifuOS 98 SE — ${esc((cfg.pc_info && cfg.pc_info.build) || 'custom build')})</i></li>
            </ul>

            <hr>

            <h3>My Links</h3>
            <br>
            <ul>
                ${socials || '<li>no links configured</li>'}
            </ul>

            <br>
            <p style="text-align: center; color: #888; font-size: 12px;">
                <i>${esc(site.copyright || 'rezi (C)2026. All Rights Reserved.')}</i>
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

    const win = document.getElementById(winId);

    const statusEl = win.querySelector('#about-status');
    if (statusEl) {
        const apply = function (status) {
            const st = status || p.status || 'online';
            statusEl.textContent = st === 'dnd' ? 'do not disturb' : st;
            statusEl.style.color = STATUS_COLORS[st] || STATUS_COLORS.online;
            statusEl.style.fontWeight = 'bold';
        };
        apply(getDiscordStatus());
        onDiscordStatus(apply);
    }

    const copyBtn = win.querySelector('.js-copy-discord');
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            copyText(cfg.discord && cfg.discord.username ? cfg.discord.username : 'rezi.lol', copyBtn);
        });
    }
}

function copyText(text, btn) {
    function done() {
        if (btn) {
            const old = btn.textContent;
            btn.textContent = 'copied "' + text + '" to clipboard';
            setTimeout(function () { btn.textContent = old; }, 1500);
        }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else { fallback(); }
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
}
