import { getConfig } from '../config.js';

let current = null;
const listeners = [];

export function getDiscordStatus() {
    return current;
}

export function initDiscordStatus() {
    const id = (getConfig().discord && getConfig().discord.id) || '';
    if (!id) return;

    function poll() {
        fetch('https://api.lanyard.rest/v1/users/' + id, { cache: 'no-store' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.data && data.data.discord_status) {
                    current = data.data.discord_status;
                    listeners.forEach(function (fn) { fn(current); });
                }
            })
            .catch(function () {});
    }

    poll();
    setInterval(poll, 60000);
}

export function onDiscordStatus(fn) {
    listeners.push(fn);
    if (current) fn(current);
}
