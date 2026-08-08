import { getConfig } from '../config.js';

let current = null;
const listeners = [];

export function getDiscordStatus() {
    return current;
}

export function initDiscordStatus() {
    const userId = (getConfig().discord && getConfig().discord.userId) || '';
    if (!userId) return;

    function poll() {
        fetch('https://api.lanyard.rest/v1/users/' + userId, { cache: 'no-store' })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (data && data.data && data.data.discord_status) {
                    current = data.data.discord_status;
                    listeners.forEach(function (listener) { listener(current); });
                }
            })
            .catch(function () {});
    }

    poll();
    setInterval(poll, 60000);
}

export function onDiscordStatus(listener) {
    listeners.push(listener);
    if (current) listener(current);
}
