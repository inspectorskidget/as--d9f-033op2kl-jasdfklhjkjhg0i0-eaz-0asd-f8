let CONFIG = null;

const FALLBACK = {
    site: { name: "rezi.lol", copyright: "rezi (C)2026. All Rights Reserved.", greeting: "Greetings, -rezi" },
    discord: { id: "351035537169186826", username: "rezi.lol" },
    profile: {
        displayName: "rezi",
        username: "rezi.lol",
        tagline: "i break things and build weird stuff",
        bio: "this is my little corner of the internet.",
        status: "online",
        location: "unknown",
        socials: [
            { type: "discord", label: "Discord", url: "https://discord.com/users/351035537169186826" },
            { type: "github", label: "GitHub", url: "https://github.com/rezi" }
        ]
    },
    scripts: [{ title: "welcome.txt", content: "welcome to rezi.lol", date: "2026-08-07" }],
    repos: [],
    friends: [],
    pc_info: {
        os: "Windows 10 Pro",
        os_build: "10.0.19045 (Build 19045)",
        build: "waifuOS 98 SE — build 98SE.1998.waifu (custom rezi)",
        host: "ASRock Z690M Phantom Gaming 4",
        cpu: "12th Gen Intel(R) Core(TM) i5-12600KF",
        cpu_cores: "10 cores / 16 threads",
        cpu_mhz: "3700 MHz",
        gpu: "AMD Radeon RX 6700 XT",
        ram_total: "32 GiB",
        ram_modules: ["2x Kingston KF3200C16D4/16GX (16 GB each)"],
        bios: "American Megatrends International 3.80 (2023-10-01)",
        storage: ["Samsung SSD 980 1TB", "Generic SD/MMC 59.5 GiB (USB)"],
        network: "Intel(R) Ethernet Connection (17) I219-V",
        monitor: "Generic PnP Monitor",
        disk_free: "707.3 GiB free / 930.8 GiB"
    }
};

export function loadConfig() {
    if (CONFIG) return Promise.resolve(CONFIG);
    return fetch('config.json', { cache: 'no-store' })
        .then(function (r) {
            if (!r.ok) throw new Error('config fetch failed: ' + r.status);
            return r.json();
        })
        .then(function (cfg) {
            CONFIG = deepMerge(FALLBACK, cfg || {});
            return CONFIG;
        })
        .catch(function () {
            CONFIG = deepMerge(FALLBACK, {});
            return CONFIG;
        });
}

export function getConfig() {
    return CONFIG || FALLBACK;
}

function deepMerge(base, extra) {
    var out = {};
    Object.keys(base).forEach(function (k) {
        out[k] = base[k];
    });
    Object.keys(extra || {}).forEach(function (k) {
        var b = base[k];
        var e = extra[k];
        if (b && e && typeof b === 'object' && !Array.isArray(b) && !Array.isArray(e)) {
            out[k] = deepMerge(b, e);
        } else {
            out[k] = e;
        }
    });
    return out;
}

export function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
