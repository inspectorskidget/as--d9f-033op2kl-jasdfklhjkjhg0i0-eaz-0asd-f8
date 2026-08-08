import { createWindow } from '../modules/windowFactory.js';
import { closeWindow } from '../modules/windowManager.js';
import { getConfig, escapeText } from '../config.js';
import { getDiscordStatus, onDiscordStatus } from '../modules/discordStatus.js';

export function renderTerminal() {
    const windowId = 'window-terminal';

    if (document.getElementById(windowId)) return;

    const content = `
        <div class="terminal-body" id="terminal-output"></div>
        <div class="input-line">
            <span class="term-prompt">rezi@waifuOS:~$</span>
            <input type="text" id="cmd-input" class="cmd-input" autocomplete="off" spellcheck="false" autofocus>
        </div>
    `;

    createWindow({
        id: windowId,
        title: 'waifuOS Terminal',
        content: content,
        isCentered: true
    });

    const windowEl = document.getElementById(windowId);
    windowEl.querySelector('.window-body').addEventListener('click', function () {
        document.getElementById('cmd-input').focus();
    });

    setupTerminal();
}

let commandHistory = [];
let historyPosition = -1;
let animationEl = null;

function paint(text, className) {
    return '<span class="' + (className || '') + '">' + escapeText(text) + '</span>';
}

const HELP = `Available commands:
-------------------------------------------------------------
  system     neofetch  fastfetch  htop  uptime  uname  ver
             date  cal  whoami  who  id  groups  hostname  tty
             df  free  lsblk  lspci  ip  env  history  sudo
             ls  cd  pwd  cat  echo  clear  reboot  crash  exit
  network    ping  dig  nslookup  whois  traceroute  curl
             wget  nc  tcpdump  proxychains
  links      links  github  discord  status
  pentest    nmap  gobuster  ffuf  nikto  wpscan  sqlmap
             hydra  john  hashcat  msfconsole  searchsploit
             subfinder  sslscan  exiftool  aircrack-ng
  fun        cmatrix  sl  figlet  cowsay  lolcat  fortune  yes`;

const COMMANDS = {
    'help': function () { return HELP; },
    'cls': clearTerminal,
    'clear': clearTerminal,
    'date': function () { return new Date().toString(); },
    'whoami': function () { return 'rezi'; },
    'uname': function (args) {
        const a = (args || '').trim();
        if (a.indexOf('-a') !== -1) {
            return 'Linux waifuOS 6.8.0-arch1-1-waifu #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux';
        }
        return 'Linux';
    },
    'ver': function () {
        const pcInfo = getConfig().pc_info || {};
        return pcInfo.build || 'waifuOS 98 SE (build 98SE.1998.waifu)';
    },
    'hostname': function () { return 'waifuOS'; },
    'tty': function () { return '/dev/pts/1'; },
    'pwd': function () { return '/home/rezi'; },
    'echo': function (args) { return args || ''; },
    'sudo': function () {
        return 'rezi is not in the sudoers file. This incident will be reported.';
    },
    'ls': function (args) {
        const a = args || '';
        if (a.indexOf('-a') !== -1 || a.indexOf('-l') !== -1) {
            return paint('Desktop   Documents  scripts  pictures  scripts\n.config  .bashrc  .ssh  secret.txt  README.md  songs  bin', 't-blue');
        }
        return paint('Desktop   Documents  scripts  pictures  scripts\nsecret.txt  README.md  songs  bin', 't-blue');
    },
    'cat': function (args) {
        const f = (args || '').split(' ')[0] || '';
        const file = {
            'os-release': 'PRETTY_NAME="waifuOS 98 SE (Arch)"\nNAME="waifuOS 98 SE"\nVERSION="98 SE (b1998 custom rezi)"\nID=arch\nID_LIKE=arch\nHOME_URL="https://waifu.team"',
            'hostname': 'waifuOS',
            'secret.txt': 'nice try :)',
            'readme.md': '# rezi.lol\nA waifuOS 98 SE desktop (Arch-based) running on rezi.lol.\nboot it, click around, open the terminal.\n'
        };
        return file[f] !== undefined ? file[f] : 'cat: ' + f + ': No such file or directory';
    },
    'cd': function (args) {
        if (!args || !args.trim()) return '/home/rezi';
        if (args.trim() === '..') return '/home';
        if (args.trim() === '/') return '/';
        if (args.trim() === 'scripts' || args.trim() === '~/scripts') return '/home/rezi/scripts';
        return 'bash: cd: ' + args.trim().split(' ')[0] + ': No such file or directory';
    },
    'uptime': function () {
        const mins = Math.floor(performance.now() / 60000);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const now = new Date();
        const t = now.toTimeString().slice(0, 8);
        const load = (Math.random() * 0.2 + 0.01).toFixed(2);
        return paint(t + ' up ' + h + ':' + String(m).padStart(2, '0') + ',  1 user,  load average: ' + load + ', 0.09, 0.04', 't-green');
    },
    'id': function () {
        return 'uid=1000(rezi) gid=1000(rezi) groups=1000(rezi),10(wheel)';
    },
    'groups': function () { return 'rezi wheel'; },
    'who': function () { return 'rezi     tty1         2026-08-07 08:42 (waifuOS login)'; },
    'env': function () {
        return [
            'HOME=/home/rezi',
            'USER=rezi',
            'SHELL=/bin/bash',
            'TERM=xterm-256color',
            'PATH=/usr/local/sbin:/usr/local/bin:/usr/bin:/home/rezi/.local/bin',
            'HOSTNAME=waifuOS',
            'BUILD=98SE.1998.waifu'
        ].join('\n');
    },
    'history': function (args) {
        if ((args || '').trim() === '-c') { commandHistory = []; return 'history cleared'; }
        return commandHistory.map(function (c, i) { return paint(String(i + 1).padStart(4), 't-gray') + '  ' + c; }).join('\n') || 'no history yet';
    },
    'cal': function () { return renderCalendar(); },
    'df': function () {
        return [
            paint('Filesystem      1K-blocks      Used  Available Use% Mounted on', 't-bold'),
            '/dev/nvme0n1p2  975469224 234467128  707309640  24% /',
            '/dev/nvme0n1p1     523248     38296     484952   8% /boot/efi',
            'tmpfs            16630144     12580   16617564   1% /dev/shm',
            '/dev/sda       62533280         0   62533280   0% /mnt/sd'
        ].join('\n');
    },
    'free': function () {
        return [
            paint('               total        used        free      shared  buff/cache   available', 't-bold'),
            paint('Mem:        32600000     4102668    24513720     123456     3983612    27468132', 't-green'),
            'Swap:         8388608           0     8388608'
        ].join('\n');
    },
    'lsblk': function () {
        return [
            paint('NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS', 't-bold'),
            'nvme0n1     259:0    0 931.5G  0 disk',
            'â”œâ”€nvme0n1p1 259:1    0   512M  0 part /boot/efi',
            'â””â”€nvme0n1p2 259:2    0 930.9G  0 part /',
            'sda           8:0    0  59.5G  0 disk'
        ].join('\n');
    },
    'lspci': function () {
        const gpu = getConfig().pc_info && getConfig().pc_info.gpu || 'AMD Radeon RX 6700 XT';
        const net = getConfig().pc_info && getConfig().pc_info.network || 'Intel I219-V';
        return [
            '00:00.0 Host bridge: Intel Corporation Z690 (LGA1700) Chipset',
            '00:14.0 USB controller: Intel Corporation Alder Lake-S PCH USB 3.2',
            '00:1f.6 Ethernet controller: ' + net,
            paint('0b:00.0 VGA compatible controller: ' + gpu + ' (navi22)', 't-green'),
            '0b:00.1 Audio device: Advanced Micro Devices Navi 21 HDMI Audio'
        ].join('\n');
    },
    'ip': function () {
        return [
            '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536',
            '    inet 127.0.0.1/8 scope host lo',
            '2: eno1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500',
            '    link/ether de:ad:be:ef:00:01 brd ff:ff:ff:ff:ff:ff',
            '    inet 192.168.1.23/24 brd 192.168.1.255 scope global dynamic eno1'
        ].join('\n');
    },
    'fortune': function () { return renderFortune(); },
    'yes': function (args) {
        const word = args || 'y';
        return new Array(10).fill(word).join('\n');
    },
    'lolcat': function (args) { return rainbow(args || ''); },
    'cowsay': function (args) { return cowSay(args || 'moo'); },
    'figlet': function (args) { return figletText(args || 'rezi'); },
    'dig': function (args) {
        const d = (args || 'rezi.lol').split(' ')[0];
        return '; <<>> DiG 9.18.28 <<>> ' + d + '\n;; ANSWER SECTION:\n' + d + '.  300  IN  A  ' + fakeIp(d) + '\n;; Query time: 12 msec';
    },
    'nslookup': function (args) {
        const d = (args || 'rezi.lol').split(' ')[0];
        return 'Server:  192.168.1.1\nAddress: 192.168.1.1#53\n\nName: ' + d + '\nAddress: ' + fakeIp(d);
    },
    'whois': function (args) {
        const d = (args || 'rezi.lol').split(' ')[0];
        return [
            paint('Domain Name: ' + d.toUpperCase(), 't-bold'),
            'Registry Domain ID: WAIFU-1998',
            'Registrar: waifu.team Registrar',
            'Registrar WHOIS Server: whois.waifu.team',
            'Creation Date: 1998-06-06T06:06:06Z',
            'Registrant Organization: rezi',
            'Name Server: NS1.WAIFU.TEAM',
            'Name Server: NS2.WAIFU.TEAM'
        ].join('\n');
    },
    'traceroute': function (args) {
        const d = (args || 'rezi.lol').split(' ')[0];
        return [
            'traceroute to ' + d + ' (' + fakeIp(d) + '), 30 hops max',
            ' 1  192.168.1.1      0.4 ms   0.3 ms   0.3 ms',
            ' 2  10.42.0.1        4.2 ms   4.1 ms   4.1 ms',
            ' 3  waifu.gw1.example  11.8 ms   12.0 ms  11.9 ms',
            ' 4  waifu.gw2.example  15.2 ms  15.0 ms  15.3 ms',
            paint(' 5  ' + d + '   (' + fakeIp(d) + ')  21.4 ms  21.1 ms  21.2 ms', 't-green')
        ].join('\n');
    },
    'curl': function (args) {
        const u = (args || '').split(' ').pop() || 'https://waifu.team';
        const body = '<!doctype html><html><head><title>' + u + '</title></head><body><h1>' + u + '</h1><p>you wish.</p></body></html>';
        return paint('HTTP/2 200 ', 't-green') + 'ok\ncontent-type: text/html; charset=utf-8\n\n' + escapeText(body);
    },
    'wget': function (args) {
        const u = (args || '').split(' ').pop() || 'waifu.team';
        return '--' + new Date().toISOString() + '--  ' + u + '\nResolving ' + u + ' (' + u + ')... ' + fakeIp(u) + '\nConnecting to ' + u + ' (' + fakeIp(u) + '):443... connected.\nHTTP request sent, awaiting response... ' + paint('200 OK', 't-green') + '\nLength: 1337 [text/html]\nSaving to: \'index.html\'\n\nindex.html 100%[================================>]   1.31K  --.-KB/s    in 0s\n\n' + paint('2026-08-07 downloaded \'index.html\'', 't-green');
    },
    'git': function () {
        return 'On branch master\nYour branch is up to date with \'origin/master\'.\n\nnothing to commit, working tree clean';
    },
    'links': function () {
        const socials = getConfig().profile.socials || [];
        const rows = socials.map(function (s) {
            const label = String(s.label || s.type || '').toUpperCase();
            return '  ' + label.padEnd(10) + ' ->  ' + s.url;
        }).join('\n');
        return rows || 'no links configured';
    },
    'github': function () {
        const socials = getConfig().profile.socials || [];
        for (let i = 0; i < socials.length; i++) {
            if (socials[i].type === 'github') { window.open(socials[i].url, '_blank'); break; }
        }
        return 'Opening GitHub in your browser...';
    },
    'ping': function (args) {
        if (!args || !args.trim()) return 'Usage: ping <hostname>';
        const target = args.split(' ')[0];
        let output = '\nPING ' + target + ' (' + fakeIp(target) + ') 56(84) bytes of data.\n';
        for (let i = 1; i <= 4; i++) {
            const ms = (Math.random() * 20 + 8).toFixed(2);
            output += paint('64 bytes from ' + target + ' (' + fakeIp(target) + '): icmp_seq=' + i + ' ttl=64 time=' + ms + ' ms', 't-green') + '\n';
        }
        output += '\n--- ' + target + ' ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3057ms';
        return output;
    },
    'nmap': function (args) { return nmapScan(args); },
    'gobuster': function (args) { return gobusterDir(args); },
    'ffuf': function (args) { return ffufFuzz(args); },
    'nikto': function () { return niktoScan(); },
    'wpscan': function (args) { return wpscanTarget(args); },
    'sqlmap': function (args) { return sqlmapInject(args); },
    'hydra': function (args) { return hydraBrute(args); },
    'john': function () { return johnCrack(); },
    'hashcat': function () { return hashcatCrack(); },
    'msfconsole': function () { return msfBanner(); },
    'metasploit': function () { return msfBanner(); },
    'searchsploit': function (args) { return searchSploit(args); },
    'subfinder': function (args) { return subfinderEnum(args); },
    'sslscan': function (args) { return sslScan(args); },
    'exiftool': function (args) { return exifTool(args); },
    'aircrack-ng': function (args) { return aircrackNg(args); },
    'tcpdump': function () { return tcpDump(); },
    'nc': function () { return netCat(); },
    'netcat': function () { return netCat(); },
    'proxychains': function (args) { return proxyChains(args); },
    'status': function () { return null; },
    'discord': function () {
        const name = (getConfig().discord && getConfig().discord.username) || 'rezi.lol';
        copyText(name);
        return 'copied "' + name + '" to clipboard';
    },
    'neofetch': function () { return null; },
    'fetch': function () { return null; },
    'fastfetch': function () { return null; },
    'exit': function () { closeWindow('window-terminal'); return null; },
    'reboot': function () { location.reload(); return null; },
    'crash': function () { showBsod(); return 'SYSTEM HALTED'; }
};

function fakeIp(name) {
    let h = 0;
    const s = String(name);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
    return '203.0.113.' + (h % 240 + 1);
}

function clearTerminal() {
    stopAnimation();
    document.getElementById('terminal-output').innerHTML = '';
    return null;
}

function stopAnimation() {
    if (animationEl) { animationEl.remove(); animationEl = null; }
}

function renderNeofetch() {
    const config = getConfig();
    const pcInfo = config.pc_info || {};
    const profile = config.profile || {};
    const user = profile.displayName || 'rezi';

    const art = [
        '                   -`',
        '                  .o+`',
        '                 `ooo/',
        '                `+oooo:',
        '               `+oooooo:',
        '               -+oooooo+:',
        '              `/:-:++oooo+:',
        '             `/++++/+++++++:',
        '            `/++++++++++++++:',
        '           `/+++ooooooooooooo/`',
        '          ./ooosssso++osssssso+`',
        '         .oossssso-````/ossssss+`',
        '        -osssssso.      :ssssssso.',
        '       :osssssss/        osssso+++.',
        '      /ossssssss/        +ssssooo/-',
        '    `/ossssso+/:-        -:/+osssso/-',
        '   `+sso+:-`                 `.-:+oso:',
        '  `++:.                           `-+/',
        '  .`                                 `/'
    ];

    const artWidth = Math.max.apply(null, art.map(function (l) { return l.length; }));

    const uptimeMins = Math.floor(performance.now() / 60000);
    const resolution = window.screen.width + 'x' + window.screen.height;
    const ramLine = (pcInfo.ram_modules || []).join(' / ') || '';
    const build = pcInfo.build || 'waifuOS 98 SE — build 98SE.1998.waifu (custom rezi)';

    const info = [
        ['', user + '@waifuOS', 'nf-user'],
        ['', 'â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€', 'nf-sep'],
        ['OS', 'Arch Linux x86_64', ''],
        ['Host', pcInfo.host || 'ASRock Z690M Phantom Gaming 4', ''],
        ['Kernel', '6.8.0-arch1-1-waifu', ''],
        ['Uptime', uptimeMins + ' mins', ''],
        ['Packages', '98 (pacman)', ''],
        ['Shell', 'zenzinDOS 1.0', ''],
        ['Resolution', resolution, ''],
        ['DE', 'waifu.team (Explorer 98)', ''],
        ['WM', 'Explorer (Win98)', ''],
        ['Theme', 'waifuOS [purple]', ''],
        ['Icons', 'waifuOS [98 SE]', ''],
        ['Terminal', 'zenzinDOS', ''],
        ['Build', build, ''],
        ['', '', ''],
        ['Host OS', (pcInfo.os || 'Windows 10 Pro') + ' (' + (pcInfo.os_build || '10.0.19045') + ')', ''],
        ['CPU', (pcInfo.cpu || 'Intel Core i5-12600KF') + ' (' + (pcInfo.cpu_cores || '10c/16t') + ') @ ' + (pcInfo.cpu_mhz || '3700 MHz'), ''],
        ['GPU', (pcInfo.gpu || 'AMD Radeon RX 6700 XT') + ' (navi22)', ''],
        ['Memory', '32576MiB / 32600MiB', ''],
        ['RAM', ramLine, ''],
        ['Disk', pcInfo.disk_free || '707.3GiB free', ''],
        ['BIOS', pcInfo.bios || 'American Megatrends 3.80', ''],
        ['Network', pcInfo.network || 'Intel I219-V', ''],
        ['Monitor', pcInfo.monitor || 'Generic PnP Monitor', '']
    ];

    let labelWidth = 0;
    info.forEach(function (row) { if (row[0].length > labelWidth) labelWidth = row[0].length; });

    const gap = '&nbsp;&nbsp;&nbsp;';
    let html = '';
    for (let i = 0; i < Math.max(art.length, info.length); i++) {
        let left = '';
        if (i < art.length) {
            left = '<span class="term-art">' + escapeText(art[i]) + '</span>' + new Array(artWidth - art[i].length + 3).join('&nbsp;');
        } else if (info[i] && info[i][0]) {
            left = new Array(artWidth + 3).join('&nbsp;');
        }
        if (i < info.length) {
            const row = info[i];
            const label = row[0] ? '<span class="nf-label">' + escapeText(row[0].padEnd(labelWidth)) + ':' + '</span> ' : '';
            const valueClass = row[2] || 'nf-value';
            left += gap + label + '<span class="' + valueClass + '">' + escapeText(row[1]) + '</span>';
        }
        html += '<div class="term-line">' + left + '</div>';
    }
    html += '<div class="term-line">&nbsp;</div>';
    return html;
}

function runCmatrix() {
    stopAnimation();
    const output = document.getElementById('terminal-output');
    const box = document.createElement('div');
    box.className = 'term-rain';

    const chars = 'ã‚¢ã‚¤ã‚¦ã‚¨ã‚ªã‚«ã‚­ã‚¯ã‚±ã‚³ã‚µã‚·ã‚¹ã‚»ã‚½ã‚¿ãƒãƒ„ãƒ†ãƒˆãƒŠãƒ‹ãƒŒãƒãƒŽ0123456789!@#$%&*';
    const columnCount = 58;
    const rowCount = 18;
    for (let x = 0; x < columnCount; x++) {
        const col = document.createElement('div');
        col.className = 'rain-col';
        let text = '';
        for (let y = 0; y < rowCount; y++) text += chars[Math.floor(Math.random() * chars.length)];
        col.textContent = text;
        col.style.left = (x * 12) + 'px';
        col.style.animationDuration = (1.6 + Math.random() * 3.4).toFixed(2) + 's';
        col.style.animationDelay = (-Math.random() * 5).toFixed(2) + 's';
        box.appendChild(col);
    }

    const hint = document.createElement('div');
    hint.className = 'rain-hint';
    hint.textContent = 'press any key... (cmatrix running)';
    box.appendChild(hint);

    output.appendChild(box);
    animationEl = box;
    output.parentElement.scrollTop = output.parentElement.scrollHeight;
}

function runSl() {
    stopAnimation();
    const output = document.getElementById('terminal-output');
    const pre = document.createElement('div');
    pre.className = 'term-line term-pre';

    const train = [
        '                              ______',
        '                             (   __)',
        '    ___   ___                (  ( ())',
        '  _/   \\_/   \\__  chugga chugga      \\',
        ' ( O   O   O   )_____   chugga chugga  )',
        '  \\_/ \\_/ \\_/ \\/_____\\_____________/_/',
        '   |  |  |  |  |  |  |  |  |  |  |  |  |',
        '   O  O  O  O  O  O  O  O  O  O  O  O  O'
    ];

    const smokeFrames = [
        ['       .', '      ..', '       .', '      ..', '', '', '', ''],
        ['      ..', '     . .', '      .', '     ..', '', '', '', ''],
        ['       .', '      ..', '       .', '      ..', '', '', '', ''],
        ['     .  ', '    ..', '      .', '     ..', '', '', '', '']
    ];

    let frame = 0;
    const iv = setInterval(function () {
        const f = smokeFrames[frame % smokeFrames.length];
        const lines = [];
        for (let i = 0; i < train.length; i++) {
            lines.push((f[i] || '') + train[i]);
        }
        pre.textContent = lines.join('\n');
        frame++;
        if (frame > 12) {
            clearInterval(iv);
            pre.textContent = lines.join('\n') + '\nAll aboard! (sl: this is why you type ls fast)';
            animationEl = null;
        }
    }, 160);

    output.appendChild(pre);
    animationEl = pre;
    output.parentElement.scrollTop = output.parentElement.scrollHeight;
}

function renderHtop() {
    const mins = Math.floor(performance.now() / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const now = new Date();
    const t = now.toTimeString().slice(0, 8);

    function bar(used, total, width, cls) {
        let usedWidth = Math.round((used / total) * width);
        let html = '';
        html += '<span class="htop-bar htop-bar-used" style="width:' + usedWidth + 'px"></span>';
        html += '<span class="htop-bar ' + (cls || 'htop-bar-free') + '" style="width:' + (width - usedWidth) + 'px"></span>';
        return html;
    }

    const processes = [
        ['systemd', '0.0', '0.1', '0:00.68'],
        ['kworker', '0.0', '0.0', '0:04.21'],
        ['bash', '0.0', '0.2', '0:00.31'],
        ['neofetch', '0.3', '0.1', '0:00.05'],
        ['waifuDM', '0.7', '1.8', '0:12.40'],
        ['explorer.exe', '1.2', '3.1', '0:55.10'],
        ['zenzinDOS', '2.4', '4.2', '1:33.66'],
        ['cmatrix', '99.9', '0.8', '0:03.02']
    ];

    const cpuUsed = 12;
    const memUsed = 4102, memTotal = 32576;

    let html = '<div class="term-line term-pre">';
    html += paint('  waifuOS htop 3.3.0 (Arch) - ' + t + ' up ' + h + ':' + String(m).padStart(2, '0') + ',  1 user, load average: 0.15, 0.09, 0.05', 't-bold') + '\n';
    html += '                                                                  Tasks: 143, 24 thr; 1 running\n';
    html += paint('  Mem', 't-bold') + '[' + bar(memUsed, memTotal, 40) + '] ' + paint('4102/32576MB', 't-bold') + '\n';
    html += paint('  Swp', 't-bold') + '[' + bar(0, 8192, 40) + '] 0/8192MB\n';
    html += paint('  CPU', 't-bold') + '[' + bar(cpuUsed, 100, 40, 'htop-bar-soft') + '] ' + paint(cpuUsed + '.4%', 't-bold') + '\n';
    html += '\n' + paint('  PID USER PRI NI VIRT RES SHR S CPU% MEM% TIME+  Command', 't-bold') + '\n';
    processes.forEach(function (p, i) {
        html += paint(String(1000 + i * 37).padStart(5), 't-gray') + ' rezi   20   0  ' + String(80 + i * 90) + 'M ' + String(10 + i * 3) + 'M ' + String(6 + i) + 'M S ' +
            p[1].padStart(4) + ' ' + p[2].padStart(4) + ' ' + p[3] + '  ' + paint(p[0], 't-cyan') + '\n';
    });
    html += '\n  ' + paint('(htop snapshot — this is a demo, press any key)', 't-dim');
    html += '</div>';
    return html;
}

const FIGLET = {
    'A': [' â–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ'],
    'B': ['â–ˆâ–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆâ–ˆ '],
    'C': [' â–ˆâ–ˆâ–ˆâ–ˆ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆ   ', ' â–ˆâ–ˆâ–ˆâ–ˆ'],
    'D': ['â–ˆâ–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆâ–ˆ '],
    'E': ['â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ'],
    'F': ['â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆ   '],
    'G': [' â–ˆâ–ˆâ–ˆâ–ˆ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆâ–ˆ'],
    'H': ['â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ'],
    'I': ['â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ', '  â–ˆ  ', '  â–ˆ  ', '  â–ˆ  ', 'â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ'],
    'J': ['  â–ˆâ–ˆâ–ˆâ–ˆ', '   â–ˆ  ', '   â–ˆ  ', ' â–ˆ â–ˆ  ', ' â–ˆâ–ˆ   '],
    'K': ['â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆ  ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ'],
    'L': ['â–ˆâ–ˆ   ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ'],
    'M': ['â–ˆâ–ˆ   â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆ â–ˆâ–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ   â–ˆâ–ˆ', 'â–ˆâ–ˆ   â–ˆâ–ˆ'],
    'N': ['â–ˆâ–ˆ  â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆâ–ˆ', 'â–ˆâ–ˆ  â–ˆâ–ˆ'],
    'O': [' â–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆ '],
    'P': ['â–ˆâ–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆ   '],
    'Q': [' â–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆâ–ˆ'],
    'R': ['â–ˆâ–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ'],
    'S': [' â–ˆâ–ˆâ–ˆâ–ˆ', 'â–ˆâ–ˆ   ', ' â–ˆâ–ˆâ–ˆ ', '   â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆâ–ˆ '],
    'T': ['â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ', '  â–ˆ  ', '  â–ˆ  ', '  â–ˆ  ', '  â–ˆ  '],
    'U': ['â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆ '],
    'V': ['â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', ' â–ˆ â–ˆ ', '  â–ˆ  '],
    'W': ['â–ˆâ–ˆ   â–ˆâ–ˆ', 'â–ˆâ–ˆ   â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆ â–ˆâ–ˆâ–ˆ', ' â–ˆ   â–ˆ '],
    'X': ['â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ'],
    'Y': ['â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆ ', '  â–ˆ  ', '  â–ˆ  '],
    'Z': ['â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ', '   â–ˆâ–ˆ', '  â–ˆâ–ˆ ', ' â–ˆâ–ˆ  ', 'â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ'],
    '0': [' â–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆ '],
    '1': ['  â–ˆ  ', ' â–ˆâ–ˆ  ', '  â–ˆ  ', '  â–ˆ  ', ' â–ˆâ–ˆâ–ˆ '],
    '2': [' â–ˆâ–ˆâ–ˆ ', '   â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ'],
    '3': [' â–ˆâ–ˆâ–ˆ ', '   â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆ ', '   â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆ '],
    '4': ['â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆ â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ', '   â–ˆâ–ˆ', '   â–ˆâ–ˆ'],
    '5': ['â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆâ–ˆâ–ˆ ', '   â–ˆâ–ˆ', 'â–ˆâ–ˆâ–ˆâ–ˆ '],
    '6': [' â–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆ '],
    '7': ['â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ', '   â–ˆâ–ˆ', '  â–ˆâ–ˆ ', ' â–ˆâ–ˆ  ', ' â–ˆ   '],
    '8': [' â–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆ '],
    '9': [' â–ˆâ–ˆâ–ˆ ', 'â–ˆâ–ˆ â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆâ–ˆ', '   â–ˆâ–ˆ', ' â–ˆâ–ˆâ–ˆ '],
    ' ': [' ', ' ', ' ', ' ', ' '],
    '.': [' ', ' ', ' ', ' ', 'â–ˆâ–ˆ'],
    '!': ['â–ˆâ–ˆ', 'â–ˆâ–ˆ', 'â–ˆâ–ˆ', '  ', 'â–ˆâ–ˆ'],
    '-': ['   ', '   ', 'â–ˆâ–ˆâ–ˆâ–ˆ', '   ', '   '],
    '_': ['   ', '   ', '   ', '   ', 'â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ'],
    '/': ['   â–ˆâ–ˆ', '  â–ˆâ–ˆ ', ' â–ˆâ–ˆ  ', 'â–ˆâ–ˆ   ', 'â–ˆâ–ˆ   '],
    ':': [' ', 'â–ˆâ–ˆ', ' ', 'â–ˆâ–ˆ', ' '],
    '?': [' â–ˆâ–ˆâ–ˆ ', '   â–ˆâ–ˆ', '  â–ˆâ–ˆ ', '     ', '  â–ˆâ–ˆ '],
    '+': ['     ', '  â–ˆ  ', ' â–ˆâ–ˆâ–ˆ ', '  â–ˆ  ', '     ']
};

function figletText(text) {
    const glyphs = (text || 'rezi').toUpperCase().split('').map(function (ch) {
        return FIGLET[ch] || FIGLET['?'];
    });
    const lines = [];
    for (let row = 0; row < 5; row++) {
        lines.push(glyphs.map(function (g) { return g[row]; }).join(' '));
    }
    return '<div class="term-line term-pre">' + lines.map(function (line) { return paint(line, 't-cyan t-bold'); }).join('\n') + '</div>';
}

function cowSay(text) {
    const msg = String(text || 'moo');
    const width = msg.length + 2;
    let box = ' ' + '_'.repeat(width) + '\n';
    box += '< ' + msg + ' >\n';
    box += ' ' + '-'.repeat(width) + '\n';
    return box +
        '        \\   ^__^\n' +
        '         \\  (oo)\\_______\n' +
        '            (__)\\       )\\/\\\n' +
        '                ||----w |\n' +
        '                ||     ||';
}

function rainbow(text) {
    const s = String(text || 'lolcat');
    return s.split('').map(function (ch, i) {
        return '<span style="color:hsl(' + (i * 14) + ',100%,60%)">' + escapeText(ch) + '</span>';
    }).join('');
}

const FORTUNES = [
    'patience, young grasshopper. or just run cmatrix.',
    'the best way to win an argument is to start one with yourself in a mirror.',
    'a burger a day keeps the doctor away. probably.',
    'fortune: this machine runs on waifu.team technology. btw.',
    'do not trust everything you read on the internet. - abraham lincoln',
    'there is no place like 127.0.0.1',
    'always remember: you are unique, just like everyone else.',
    'your uptime is looking great today.',
    'segfaults are just the kernel saying hello in its own way.',
    'rm -rf / is a great way to free up disk space.',
    'the cloud is just someones elses computer. this desktop is mine.',
    'real programmers count from 0.'
];

function renderFortune() {
    return FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
}

function renderCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = first.getDay();

    let out = paint(('      ' + now.toLocaleString('en-US', { month: 'long' }) + ' ' + year).padEnd(20), 't-bold') + '\n';
    out += 'Su Mo Tu We Th Fr Sa\n';
    let line = '   '.repeat(lead);
    for (let day = 1; day <= daysInMonth; day++) {
        if (day === now.getDate()) {
            line += paint(String(day).padStart(2), 't-yellow t-bold') + ' ';
        } else {
            line += String(day).padStart(2) + ' ';
        }
        if ((lead + day) % 7 === 0 && day !== daysInMonth) { out += line + '\n'; line = ''; }
    }
    return out + line;
}

function nmapScan(args) {
    const a = (args || '').trim();
    let flags = '';
    let target = 'waifu.team';
    const parts = a.split(/\s+/);
    parts.forEach(function (p) {
        if (p.indexOf('-') === 0) flags += p + ' ';
        else target = p;
    });
    const flagInfo = flags ? ' (' + flags.trim() + ')' : '';

    const ports = [
        '22/tcp   open  ssh     OpenSSH 8.9p1 (protocol 2.0)',
        '80/tcp   open  http    nginx 1.22.1',
        '443/tcp  open  ssl/http nginx 1.22.1',
        '8080/tcp open  http    Apache Tomcat 9.0.68'
    ];
    return [
        paint('Starting Nmap 7.94 ( https://nmap.org ) at ' + new Date().toTimeString().slice(0, 8), 't-bold'),
        paint('Nmap scan report for ' + target + ' (' + fakeIp(target) + ')', 't-bold'),
        'Host is up (0.045s latency).',
        'Not shown: 996 closed tcp ports (reset)',
        'PORT     STATE SERVICE VERSION',
        ports.map(function (p) { return paint(p, 't-green'); }).join('\n'),
        paint('Service detection performed' + flagInfo + '. Please report any incorrect results at https://nmap.org/submit/ .', 't-gray'),
        paint('Nmap done: 1 IP address (1 host up) scanned in 7.42 seconds', 't-bold')
    ].join('\n');
}

function gobusterDir(args) {
    const target = (args || '').split(' ').pop() || 'http://203.0.113.42';
    const dirs = [
        ['/admin', '200'], ['/api', '200'], ['/backup', '403'], ['/wp-admin', '301'],
        ['/wp-login.php', '200'], ['/config', '403'], ['/uploads', '301'], ['/robots.txt', '200'], ['/phpmyadmin', '302']
    ];
    return [
        paint('===============================================================', 't-bold'),
        paint('Gobuster v3.6', 't-bold'),
        '===============================================================',
        'Starting gobuster in directory enumeration mode',
        paint('[+] Url:                     ' + target, 't-blue'),
        paint('[+] Threads:                 10', 't-blue'),
        '===============================================================',
        dirs.map(function (d) {
            const code = d[1];
            const cls = code === '200' ? 't-green' : (code === '403' ? 't-yellow' : 't-blue');
            return paint('/' + d[0].replace('/', '').padEnd(20) + ' (Status: ' + code + ')', cls);
        }).join('\n'),
        '===============================================================',
        'Finished'
    ].join('\n');
}

function ffufFuzz(args) {
    const target = (args || '').split(' ').pop() || 'http://203.0.113.42/FUZZ';
    return [
        "        /'___/ /'__          /'__/ /'__/ /'__/",
        "       /'__/  /'    '  /'__/  /'__/ /'__/",
        "      /'____/ /'__/__/ /'____/ /'____/ /'____/",
        'ffuf v2.1.0',
        '--------------------------------------------------------------',
        paint(':: Method           : GET', 't-blue'),
        paint(':: URL              : ' + target, 't-blue'),
        paint(':: FUZZ             : /usr/share/wordlists/dirb/common.txt', 't-blue'),
        '--------------------------------------------------------------',
        ':: Progress: [4615/4615] :: Job [1/1] :: 1264 req/sec :: Duration: [0:00:03] :: Errors: 0 ::',
        '--------------------------------------------------------------',
        paint('admin                  [Status: 200, Size: 1337, Words: 44]', 't-green'),
        paint('api                    [Status: 200, Size: 421, Words: 21]', 't-green'),
        paint('backup.zip             [Status: 200, Size: 81920, Words: 2]', 't-green'),
        paint('config                 [Status: 403, Size: 153]', 't-yellow')
    ].join('\n');
}

function niktoScan() {
    return [
        paint('- Nikto v2.5.0', 't-bold'),
        '---------------------------------------------------------------------------',
        paint('+ Target IP:          203.0.113.42', 't-blue'),
        paint('+ Target Hostname:    waifu.team', 't-blue'),
        '---------------------------------------------------------------------------',
        paint('+ Server: nginx/1.22.1', 't-green'),
        paint('+ The anti-clickjacking X-Frame-Options header is not present.', 't-yellow'),
        paint('+ Cookie wp-settings-1 created without the httponly flag.', 't-yellow'),
        paint('+ /wp-login.php: Wordpress login found', 't-yellow'),
        paint('+ /config.php: PHP config file may contain db IDs and passwords.', 't-red'),
        paint('+ Server leaks inodes via ETags, header found with file /index.php, inode: 291845, size: 31', 't-yellow'),
        '---------------------------------------------------------------------------',
        paint('+ 1 host(s) tested', 't-bold')
    ].join('\n');
}

function wpscanTarget(args) {
    const target = (args || '').split(' ').pop() || 'http://203.0.113.42';
    return [
        paint('_______________________________________________________________', 't-bold'),
        paint('         __          _______   _____', 't-bold'),
        paint('         \\ \\        / /  __ \\ / ____|', 't-bold'),
        paint('          \\ \\  /\\  / /| |__) | (___   ___  ___  _ __', 't-bold'),
        paint('           \\ \\/  \\/ / |  ___/ \\___ \\ / __|/ _ \\| \'_ \\', 't-bold'),
        paint('            \\  /\\  /  | |     ____) | (__| (_) | | | |', 't-bold'),
        paint('             \\/  \\/   |_|    |_____/ \\___|\\___/|_| |_|', 't-bold'),
        '_______________________________________________________________',
        paint('[+] URL: ' + target, 't-blue'),
        paint('[+] Started: ' + new Date().toISOString(), 't-blue'),
        '[+] Interesting Finding(s):',
        paint('[+] XML-RPC seems to be enabled', 't-yellow'),
        paint('[+] User Enumeration: admin found', 't-yellow'),
        paint('[+] WordPress version 6.1 identified (insecure, out of date)', 't-yellow'),
        paint('[+] WPScan DB API disabled, using fallback fingerprints', 't-gray'),
        paint('[+] Finished: 1 plugin found, 0 vulnerabilities', 't-bold')
    ].join('\n');
}

function sqlmapInject(args) {
    const target = (args || '').split(' ').pop() || 'http://203.0.113.42/index.php?id=1';
    return [
        paint('        __', 't-red'),
        paint('       /\\ \\    ___ __  __ ___   ___ ___  ___   __', 't-red'),
        paint('      /  \\ \\  / __ |\\ \\/ // __| / __/ __|/ _ \\ /__\\', 't-red'),
        paint('     / /\\ \\ \\| (__ | \\  / \\__ \\\\__ \\__ \\ (_) |/ /\\', 't-red'),
        paint('     \\/  \\/  \\/ \\___| \\/  |___/|___/___/\\___/ /_/', 't-red'),
        '[!] legal disclaimer: usage of sqlmap for attacking targets without prior mutual consent is illegal',
        paint('[*] starting @ ' + new Date().toTimeString().slice(0, 8), 't-bold'),
        paint('[+] testing connection to the target URL', 't-green'),
        paint('[+] heuristics detected web page and 3 parameters (id)', 't-blue'),
        paint('[+] checking if the target is protected by some kind of WAF/IPS', 't-blue'),
        paint('[+] confirming boolean-based blind SQL injection', 't-green'),
        paint('[+] GET parameter \'id\' is vulnerable. Do you want to keep testing the others? [y/N] y', 't-yellow'),
        paint('[+] fetching columns, tables and databases', 't-green'),
        paint('[*] database: waifu_db [1 table]', 't-bold'),
        '    +-----------------------+',
        '    | users                 |',
        '    +-----------------------+',
        paint('[*] finished @ ' + new Date().toTimeString().slice(0, 8), 't-bold')
    ].join('\n');
}

function hydraBrute(args) {
    const target = (args || '').split(' ').pop() || '203.0.113.42';
    return [
        paint('Hydra v9.5 (c) 2022 by van Hauser/THC', 't-bold'),
        paint('[DATA] max 16 tasks per server, overall 32 tasks, 16384 login tries (l:2/p:8192), ~512 tries per task', 't-gray'),
        paint('[DATA] attacking ssh://' + target + ':22/', 't-blue'),
        paint('[22][ssh] host: ' + target + '   login: root   password: toor', 't-green'),
        paint('[22][ssh] host: ' + target + '   login: admin   password: admin123', 't-green'),
        paint('[80][http-get] host: ' + target + '   login: admin   password: admin', 't-green'),
        paint('1 of 1 target successfully completed, 3 valid passwords found', 't-bold')
    ].join('\n');
}

function johnCrack() {
    return [
        'Loaded 1 password hash (md5crypt, crypt(3) $1$ [MD5 256/256 AVX2 12x])',
        "Press 'q' or Ctrl-C to abort, almost any other key for status",
        paint('admin123         (admin)', 't-green'),
        paint('toor             (root)', 't-green'),
        paint('2g 0:00:00:03 100% 2/3g 0.60s ...', 't-gray'),
        paint('Use the "--show" option to display all of the cracked passwords reliably', 't-gray')
    ].join('\n');
}

function hashcatCrack() {
    return [
        paint('hashcat (v6.2.6) starting in benchmark mode', 't-bold'),
        'OpenCL API (OpenCL 2.1 LINUX) - Platform #1 [NVIDIA Corporation]',
        '* Device #1: GeForce RTX 4090, 16384/24564 MB (2048 MB allocatable)',
        'Minimum password length supported by kernel: 0',
        'Maximum password length supported by kernel: 256',
        paint('Hash mode: 0 (MD5)', 't-blue'),
        'Speed.#1.........:  42103.4 MH/s (52.34ms) @ Accel:16',
        paint('5f4dcc3b5aa765d61d8327deb882cf99:password', 't-green'),
        paint('e10adc3949ba59abbe56e057f20f883e:123456', 't-green'),
        paint('Session..........: rezi', 't-gray'),
        paint('Status...........: Cracked', 't-green')
    ].join('\n');
}

function msfBanner() {
    return [
        '                    _____                                     __',
        '   ___             /  __ \\         ____  __  __  ___  __  __  / /',
        '  / _ \\   ______  / / / /  _____ / __ \\/ / / / / _ \\/ / / / / /',
        ' /  __/  /_____/ / /_/ /  /_____/ / / / /_/ / /  __/ /_/ / / /',
        ' \\___/           \\____/          /_/ /_/\\__, / \\___/\\__,_/ /_/',
        '                                        /____/',
        '',
        '       =[ metasploit v6.3.55-dev                          ]',
        '+ -- --=[ 2422 exploits - 1238 auxiliary - 422 post       ]',
        '+ -- --=[ 1446 payloads - 46 encoders - 11 nops           ]',
        '',
        paint("Metasploit tip: use 'info <module>' to see detailed info about a module", 't-gray'),
        'msf6 > use exploit/multi/handler',
        'msf6 exploit(multi/handler) > set payload linux/x64/meterpreter/reverse_tcp',
        paint('payload => linux/x64/meterpreter/reverse_tcp', 't-green'),
        'msf6 exploit(multi/handler) > set LHOST 0.0.0.0',
        paint('LHOST => 0.0.0.0', 't-green'),
        'msf6 exploit(multi/handler) > run',
        '',
        paint('(demo only — metasploit shell is not running here)', 't-yellow')
    ].join('\n');
}

function searchSploit(args) {
    const q = (args || 'wordpress').trim();
    return [
        paint('  Exploit Title                                       |  Path', 't-bold'),
        '----------------------------------------------------------',
        paint('WordPress Plugin WPScan < 3.8 - Vulnerability Scanner  | exploits/php/webapps/12345.py', 't-green'),
        paint('Apache Tomcat < 9.0.68 - Denial of Service              | exploits/linux/dos/24680.py', 't-green'),
        paint('nginx < 1.22.1 - Request Smuggling                       | exploits/linux/remote/11223.c', 't-green'),
        '----------------------------------------------------------',
        paint('Shellcodes: No Results', 't-gray'),
        'Papers: No Results'
    ].join('\n');
}

function subfinderEnum(args) {
    const d = (args || 'waifu.team').split(' ')[0];
    return [
        paint('   ____        _     __   _____             __', 't-bold'),
        paint('  / __/_ _____(_)___/ /  / __(_)__  ___ ____/ /__', 't-bold'),
        paint(' _\\ \\/ // / _ \\ / _  /  _\\ \\/ / _ \\/ -_) __/  \'_/', 't-bold'),
        paint('/___/\\_, /_//_/_/\\_,_/  /___/_/ .__/\\__/\\__/_/\\_\\', 't-bold'),
        paint('     /___/                    /_/', 't-bold'),
        '',
        paint('[INF] Loading provider config from /root/.config/subfinder/provider-config.yaml', 't-gray'),
        paint(d + ' [ASN]  [Whois]  [CrtSh]  [DNS]  [VirusTotal]', 't-blue'),
        paint('[INF] Enumerating subdomains for ' + d, 't-blue'),
        paint('www.' + d, 't-green'),
        paint('api.' + d, 't-green'),
        paint('dev.' + d, 't-green'),
        paint('staging.' + d, 't-green'),
        paint('cdn.' + d, 't-green'),
        paint('mail.' + d, 't-green'),
        paint('[INF] Found 6 unique subdomains for ' + d, 't-bold')
    ].join('\n');
}

function sslScan(args) {
    const target = (args || '').split(' ').pop() || 'waifu.team';
    return [
        paint('Version: 2.1.4', 't-bold'),
        'OpenSSL 3.0.11',
        'Connected to ' + target,
        paint('Testing SSL server ' + target + ' on port 443', 't-blue'),
        '',
        paint('  Supported Server Cipher(s):', 't-bold'),
        paint('  Accepted  TLSv1.3  256 bits  TLS_AES_256_GCM_SHA384', 't-green'),
        paint('  Accepted  TLSv1.3  256 bits  TLS_CHACHA20_POLY1305_SHA256', 't-green'),
        paint('  Accepted  TLSv1.2  256 bits  ECDHE-RSA-AES256-GCM-SHA384', 't-green'),
        paint('  Rejected  SSLv3    RC4-SHA', 't-red'),
        paint('  Rejected  TLSv1.1  EXP-RC4-MD5', 't-red'),
        '',
        paint('  Server Certificate:', 't-bold'),
        '  Subject:  rezi.lol',
        '  Signature Algorithm: sha256WithRSAEncryption',
        paint('  RSA Key Strength: 2048', 't-green')
    ].join('\n');
}

function exifTool(args) {
    const f = (args || '').split(' ').pop() || 'secret.jpg';
    return [
        paint('ExifTool Version Number         : 12.76', 't-bold'),
        'File Name                       : ' + escapeText(f),
        'File Size                       : 1.3 MB',
        'File Modification Date/Time     : 2026:08:07 08:42:00+00:00',
        'File Type                       : JPEG',
        'Image Width                     : 1920',
        'Image Height                    : 1080',
        'Camera Model Name               : Canon EOS R6',
        paint('GPS Latitude                   : 51 deg 30\' 0.00" N', 't-yellow'),
        paint('GPS Longitude                  : 0 deg 7\' 0.00" W', 't-yellow'),
        paint('Warning                        : [minor] Trailer data after PNG IEND chunk', 't-gray')
    ].join('\n');
}

function aircrackNg(args) {
    const bssid = 'AA:BB:CC:DD:EE:FF';
    return [
        paint('Opening home/Desktop/waifu-01.cap', 't-bold'),
        paint('Read 8475 packets.', 't-gray'),
        '',
        paint('   #  BSSID              CH  ENC   CIPHER AUTH ESSID', 't-bold'),
        '   1  ' + bssid + '  11  WPA2  CCMP   PSK  waifuNet',
        '',
        '   1  ' + bssid + '  ' + paint('Handshake captured', 't-green'),
        '   ',
        paint('   Aircrack-ng 1.7 ', 't-bold') + paint('| Passwords: 2 / 1000000 (0.00%)', 't-gray'),
        paint('   [00:00:03] 12345/43210 keys tested (28.45 k/s)'),
        '',
        paint('   KEY FOUND! [ waifuNet password ]', 't-green'),
        '',
        paint('(simulation — no wireless interfaces were touched)', 't-gray')
    ].join('\n');
}

function tcpDump() {
    return [
        paint('tcpdump: verbose output suppressed, use -v[v]... for full protocol decode', 't-gray'),
        paint('listening on eno1, link-type EN10MB (Ethernet), snapshot length 262144 bytes', 't-gray'),
        '08:42:01.123456 IP 192.168.1.23.55000 > 203.0.113.42.443: Flags [P.], seq 1:517, ack 1, win 502, length 516: TLS 1.3',
        '08:42:01.125678 IP 203.0.113.42.443 > 192.168.1.23.55000: Flags [.], ack 517, win 604, length 0',
        paint('08:42:01.129999 ARP, Request who-has 192.168.1.1 tell 192.168.1.23, length 46', 't-yellow'),
        paint('08:42:02.000001 IP 192.168.1.23.53 > 203.0.113.53.53: 0x1f4a [1au] A? waifu.team. (44)', 't-green'),
        '08:42:02.000002 IP 203.0.113.53.53 > 192.168.1.23.53: 0x1f4a 1/0/0 A 203.0.113.42 (60)',
        paint('^C', 't-red'),
        paint('5 packets captured', 't-bold'),
        paint('5 packets received by filter', 't-gray'),
        paint('0 packets dropped by kernel', 't-gray')
    ].join('\n');
}

function netCat() {
    return [
        paint('nc -lvnp 4444', 't-bold'),
        'listening on [any] 4444 ...',
        paint('connect to [192.168.1.23] from (UNKNOWN) [203.0.113.42] 53210', 't-green'),
        'GET / HTTP/1.1',
        paint('HTTP/1.1 200 OK', 't-green'),
        'Server: waifuOS/98SE (Arch)',
        'Content-Type: text/plain',
        '',
        'hi. this shell is simulated, but nice try :)'
    ].join('\n');
}

function proxyChains(args) {
    const cmd = args || 'ping 8.8.8.8';
    return [
        paint('[proxychains] config file found: /etc/proxychains.conf', 't-gray'),
        paint('[proxychains] Preloading /usr/lib/libproxychains.so.4', 't-gray'),
        paint('[proxychains] DLL init: proxychains-ng 4.17', 't-gray'),
        paint('[proxychains] Dynamic chain  ...  203.0.113.1:9050  ...  socks5  ...  done', 't-green'),
        'executing: ' + escapeText(cmd),
        'PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.',
        paint('64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=24.1 ms', 't-green'),
        paint('[proxychains] Strict chain  ...  203.0.113.1:9050  ...  done', 't-gray')
    ].join('\n');
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

function copyText(text) {
    function fallback() {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try { document.execCommand('copy'); } catch (error) {}
        document.body.removeChild(textArea);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {}, fallback);
    } else { fallback(); }
}

function setupTerminal() {
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
            '<span class="term-input">' + escapeText(cmd) + '</span>';
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

        if (cmd !== 'cmatrix' && cmd !== 'matrix' && cmd !== 'sl') stopAnimation();

        if (cmd === 'neofetch' || cmd === 'fetch' || cmd === 'fastfetch') {
            addLine(renderNeofetch(), true);
            return;
        }
        if (cmd === 'cmatrix' || cmd === 'matrix') { runCmatrix(); return; }
        if (cmd === 'sl') { runSl(); return; }
        if (cmd === 'htop') {
            addLine(renderHtop(), true);
            return;
        }
        if (cmd === 'status') {
            addLine('checking discord status...', false);
            const st = getDiscordStatus();
            if (st) {
                addLine('discord status: ' + st, false);
            } else {
                onDiscordStatus(function (s) {
                    const line = document.createElement('div');
                    line.className = 'term-line';
                    line.innerHTML = 'discord status: <span class="' + (s === 'online' ? 't-green' : s === 'idle' ? 't-yellow' : s === 'dnd' ? 't-red' : 't-gray') + ' t-bold">' + escapeText(s) + '</span>';
                    output.appendChild(line);
                    scrollToBottom();
                });
            }
            return;
        }

        const fn = COMMANDS[cmd];
        if (fn) {
            const response = fn(args.slice(1).join(' '));
            if (response) addLine(response, response.indexOf('<') === -1 ? false : true);
        } else {
            addLine('bash: ' + cmd + ': command not found (try: help)');
        }
    }

    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            const fullCommand = input.value.trim();

            if (fullCommand) {
                addPrompt(fullCommand);
                commandHistory.push(fullCommand);
                historyPosition = commandHistory.length;
                processCommand(fullCommand);
            } else {
                addPrompt('');
            }
            input.value = '';
            scrollToBottom();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (commandHistory.length === 0) return;
            historyPosition = Math.max(0, historyPosition - 1);
            input.value = commandHistory[historyPosition];
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (commandHistory.length === 0) return;
            historyPosition = Math.min(commandHistory.length, historyPosition + 1);
            input.value = historyPosition < commandHistory.length ? commandHistory[historyPosition] : '';
        } else if (event.key === 'l' && event.ctrlKey) {
            event.preventDefault();
            clearTerminal();
        }
    });

    const pcInfo = getConfig().pc_info || {};
    addLine(pcInfo.build || 'waifuOS 98 SE [Version 98SE.1998.waifu]');
    addLine('(c) 1998-2026 waifu.team — running on rezi.lol. Type \'help\' for a list of commands.');
    addLine('', false);
    addLine(renderNeofetch(), true);
}
