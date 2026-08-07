import { createWindow } from '../modules/windowFactory.js';
import { getConfig, esc } from '../config.js';

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
                <li><b>Status:</b> ${esc(p.status || 'online')}</li>
                <li><b>Location:</b> ${esc(p.location || 'unknown')}</li>
                <li><b>OS:</b> ${esc((cfg.pc_info && cfg.pc_info.os) || 'unknown')}</li>
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
}
