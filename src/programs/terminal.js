import { createWindow } from '../modules/windowFactory.js';
import { openWindow, closeWindow } from '../modules/windowManager.js';
import { getConfig, esc } from '../config.js';

export function renderTerminal() {
    const winId = 'window-terminal';

    if (document.getElementById(winId)) return;

    const content = `
        <div class="terminal-body" id="terminal-output"></div>
        <div class="input-line">
            <span class="term-prompt">rezi@waifuOS:~$</span>
            <input type="text" id="cmd-input" class="cmd-input" autocomplete="off" spellcheck="false" autofocus>
        </div>
    `;

    createWindow({
        id: winId,
        title: 'waifuOS Terminal',
        content: content,
        isCentered: true
    });

    const win = document.getElementById(winId);
    win.querySelector('.window-body').addEventListener('click', function () {
        document.getElementById('cmd-input').focus();
    });

    initTerminal();
}

const COMMANDS = {
    'help': function () {
        return `
    Available commands:
    --------------------------------
    NEOFETCH - Show system info (like arch btw)
    LS       - List directory
    CAT      - Print a file
    CD       - Change directory
    PWD      - Print working directory
    ECHO     - Print text
    DATE     - Show current date/time
    WHOAMI   - Who are you?
    UNAME    - Kernel information
    VER      - waifuOS version
    CLEAR    - Clear the screen
    LINKS    - List my links
    GITHUB   - Open my GitHub
    PING     - Ping a host
    SUDO     - Escalate privileges
    CRASH    - Crash the system
    REBOOT   - Restart the system
    EXIT     - Close the terminal
    HELP     - Show this list`;
    },
    'cls': clearTerminal,
    'clear': clearTerminal,
    'date': function () { return new Date().toString(); },
    'whoami': function () { return 'rezi'; },
    'uname': function () {
        return 'Linux waifuOS 6.8.0-waifu-amd64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux';
    },
    'ver': function () {
        const pc = getConfig().pc_info || {};
        return pc.build || 'waifuOS 98 SE (build 98SE.1998.waifu)';
    },
    'pwd': function () { return '/home/rezi'; },
    'echo': function (args) { return args || ''; },
    'sudo': function () {
        return 'rezi is not in the sudoers file. This incident will be reported.';
    },
    'ls': function () {
        return `Desktop   Documents  scripts  pictures  scripts
secret.txt  README.md  songs  bin`;
    },
    'cat': function (args) {
        const f = (args || '').split(' ')[0] || '';
        const file = {
            'os-release': 'PRETTY_NAME="waifuOS 98 SE"\nVERSION="98 SE (b1998 custom rezi)"\nID=waifuos\nHOME_URL="https://waifu.team"',
            'hostname': 'waifuOS',
            'secret.txt': 'nice try :)',
            'readme.md': '# rezi.lol\nA waifuOS 98 SE desktop running on rezi.lol. boot it, click around, open the terminal.\n'
        };
        return file[f] !== undefined ? file[f] : 'cat: ' + f + ': No such file or directory';
    },
    'cd': function (args) {
        if (!args || !args.trim()) return '/home/rezi';
        if (args.trim() === '..') return '/home';
        if (args.trim() === '/') return '/';
        return 'bash: cd: ' + args.trim().split(' ')[0] + ': No such file or directory';
    },
    'github': function () {
        const socials = getConfig().profile.socials || [];
        for (let i = 0; i < socials.length; i++) {
            if (socials[i].type === 'github') { window.open(socials[i].url, '_blank'); break; }
        }
        return 'Opening GitHub in your browser...';
    },
    'links': function () {
        const socials = getConfig().profile.socials || [];
        const rows = socials.map(function (s) {
            const label = String(s.label || s.type || '').toUpperCase();
            return '  ' + label + '  ->  ' + s.url;
        }).join('\n');
        return rows || 'no links configured';
    },
    'ping': function (args) {
        if (!args || !args.trim()) return 'Usage: ping <hostname>';
        const target = args.split(' ')[0];
        let output = '\nPinging ' + target + ' with 32 bytes of data:\n';
        for (let i = 0; i < 4; i++) {
            const ms = Math.floor(Math.random() * 80) + 10;
            output += 'Reply from ' + target + ': bytes=32 time=' + ms + 'ms TTL=64\n';
        }
        output += '\nPing statistics for ' + target + ':\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)';
        return output;
    },
    'neofetch': function () { return null; },
    'exit': function () { closeWindow('window-terminal'); return null; },
    'reboot': function () { location.reload(); return null; },
    'crash': function () { showBsod(); return 'SYSTEM HALTED'; }
};

function clearTerminal() {
    document.getElementById('terminal-output').innerHTML = '';
    return null;
}

function showBsod() {
    const bsod = document.createElement('div');
    Object.assign(bsod.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: '#0000AA', color: 'white', fontFamily: '"Courier New", monospace',
        zIndex: '999999', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', fontSize: '20px', fontWeight: 'bold'
    });

    bsod.innerHTML = `
        <div style="text-align: center; max-width: 800px;">
            <p style="background: white; color: #0000AA; display: inline-block; padding: 2px; margin-bottom: 20px;">waifuOS</p>
            <p>A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) + 00010E36.</p>
            <p>The current application will be terminated.</p>
            <br>
            <p>* Press any key to return to waifuOS.</p>
            <p>* Press ALT+F4 to restart your computer.</p>
        </div>
    `;
    document.body.appendChild(bsod);

    const removeBsod = function () {
        bsod.remove();
        window.removeEventListener('keydown', removeBsod);
        window.removeEventListener('click', removeBsod);
    };

    setTimeout(function () {
        window.addEventListener('keydown', removeBsod);
        window.addEventListener('click', removeBsod);
    }, 500);
}

function initTerminal() {
    const input = document.getElementById('cmd-input');
    const output = document.getElementById('terminal-output');

    function addLine(text, html) {
        const div = document.createElement('div');
        div.className = 'term-line';
        if (html) {
            div.innerHTML = text;
        } else {
            div.textContent = text;
        }
        output.appendChild(div);
        scrollToBottom();
    }

    function addPrompt(cmd) {
        const div = document.createElement('div');
        div.className = 'term-line';
        div.innerHTML =
            '<span class="term-user">rezi</span><span class="term-dim">@</span><span class="term-host">waifuOS</span>' +
            '<span class="term-dim">:</span><span class="term-path">~</span> <span class="term-input">$</span> ' +
            '<span class="term-input">' + esc(cmd) + '</span>';
        output.appendChild(div);
        scrollToBottom();
    }

    function scrollToBottom() {
        const body = document.querySelector('#window-terminal .window-body');
        if (body) body.scrollTop = body.scrollHeight;
    }

    function processCommand(cmdString) {
        const args = cmdString.split(' ');
        const cmd = args[0].toLowerCase();

        if (cmd === 'neofetch') {
            addLine(renderNeofetch(), true);
            return;
        }

        const fn = COMMANDS[cmd];
        if (fn) {
            const response = fn(args.slice(1).join(' '));
            if (response) addLine(response);
        } else {
            addLine('bash: ' + cmd + ': command not found (try: help)');
        }
    }

    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            const fullCommand = input.value.trim();

            if (fullCommand) {
                addPrompt(fullCommand);
                processCommand(fullCommand);
            } else {
                addPrompt('');
            }
            input.value = '';
            scrollToBottom();
        }
    });

    /* startup: banner + auto neofetch */
    const pc = getConfig().pc_info || {};
    addLine(pc.build || 'waifuOS 98 SE [Version 98SE.1998.waifu]');
    addLine('(c) 1998-2026 waifu.team — running on rezi.lol. Type \'help\' for a list of commands.');
    addLine('', false);
    addLine(renderNeofetch(), true);
}

function renderNeofetch() {
    const cfg = getConfig();
    const pc = cfg.pc_info || {};
    const profile = cfg.profile || {};
    const user = profile.displayName || 'rezi';

    const art = [
        '   ██████╗ ███████╗███████╗██╗',
        '   ██╔══██╗██╔════╝╚══███╔╝██║',
        '   ██████╔╝█████╗    ███╔╝ ██║',
        '   ██╔══██╗██╔══╝   ███╔╝  ╚═╝',
        '   ██║  ██║███████╗███████╗██╗',
        '   ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝'
    ];

    const artWidth = Math.max.apply(null, art.map(function (l) { return l.length; }));

    const uptimeMins = Math.floor(performance.now() / 60000);
    const resolution = window.screen.width + 'x' + window.screen.height;

    const ramLine = (pc.ram_modules || []).join(' / ') || '';
    const build = pc.build || 'waifuOS 98 SE — build 98SE.1998.waifu (custom rezi)';

    const info = [
        user + '@waifuOS',
        '------------',
        'OS: WaifuOS 98 SE x86_64',
        'Kernel: 6.8.0-waifu-amd64',
        'Build: ' + build,
        'Uptime: ' + uptimeMins + ' mins',
        'Packages: 98',
        'Shell: zenzinDOS 1.0',
        'Resolution: ' + resolution,
        'DE: waifu.team (Explorer 98)',
        'WM: Explorer (Win98)',
        'Theme: waifuOS [purple]',
        'Icons: waifuOS [98 SE]',
        'Terminal: zenzinDOS',
        '',
        'Host OS: ' + (pc.os || 'Windows 10 Pro') + ' (' + (pc.os_build || '10.0.19045') + ')',
        'Host: ' + (pc.host || 'ASRock Z690M Phantom Gaming 4'),
        'CPU: ' + (pc.cpu || 'Intel Core i5-12600KF') + ' (' + (pc.cpu_cores || '10c/16t') + ') @ ' + (pc.cpu_mhz || '3700 MHz'),
        'GPU: ' + (pc.gpu || 'AMD Radeon RX 6700 XT') + ' (navi22)',
        'Memory: 32576MiB / 32600MiB',
        'RAM: ' + ramLine,
        'Disk: ' + (pc.disk_free || '707.3GiB free'),
        'BIOS: ' + (pc.bios || 'American Megatrends 3.80'),
        'Network: ' + (pc.network || 'Intel I219-V'),
        'Monitor: ' + (pc.monitor || 'Generic PnP Monitor')
    ];

    let html = '';
    for (let i = 0; i < Math.max(art.length, info.length); i++) {
        const left = i < art.length
            ? '<span class="term-art">' + esc(art[i]) + '</span>' + new Array(artWidth - art[i].length + 3).join('&nbsp;')
            : new Array(artWidth + 3).join('&nbsp;');
        const right = i < info.length
            ? '<span class="term-art-label">' + esc(info[i]) + '</span>'
            : '';
        html += '<div class="term-line">' + left + right + '</div>';
    }
    html += '<div class="term-line">&nbsp;</div>';

    return html;
}
