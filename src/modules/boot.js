import { getConfig, esc } from '../config.js';

export function runBootSequence() {
    return new Promise(function (resolve) {
        runBios(function () {
            runKernelLog(function () {
                resolve();
            });
        });
    });
}

/* ================= BIOS POST ================= */
function runBios(done) {
    const screen = document.getElementById('boot-screen');
    const memDisplay = document.getElementById('bios-mem');
    const footer = document.getElementById('bios-footer');

    const header = screen.querySelector('.bios-header');
    const info = screen.querySelector('.bios-info');
    const drives = screen.querySelector('.bios-drives');
    const cursor = screen.querySelector('.bios-cursor');

    const totalMem = 16384;
    let currentMem = 0;
    const warmUpTime = 800;

    const audio = new Audio('sounds/boot.mp3');
    audio.volume = 0.5;

    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.catch(function () {
            showClickToStart(audio);
        }).then(function () {
            if (!audio.paused) startWarmUpSequence();
        });
    }

    function startWarmUpSequence() {
        setTimeout(function () {
            header.style.visibility = 'visible';
            setTimeout(function () {
                info.style.visibility = 'visible';
                startMemoryCheck();
            }, 550);
        }, warmUpTime);
    }

    function startMemoryCheck() {
        const memInterval = setInterval(function () {
            currentMem += 256;
            if (currentMem >= totalMem) {
                currentMem = totalMem;
                memDisplay.innerText = currentMem + 'K OK';
                clearInterval(memInterval);
                setTimeout(function () {
                    drives.style.visibility = 'visible';
                    setTimeout(function () {
                        if (footer) {
                            footer.style.display = 'block';
                            footer.style.visibility = 'visible';
                        }
                        cursor.style.visibility = 'visible';
                        setTimeout(finishBoot, 1100);
                    }, 800);
                }, 350);
            } else {
                memDisplay.innerText = currentMem;
            }
        }, 10);
    }

    function showClickToStart(audioElement) {
        const msg = document.createElement('div');
        msg.style.position = 'absolute';
        msg.style.top = '50%';
        msg.style.left = '50%';
        msg.style.transform = 'translate(-50%, -50%)';
        msg.style.color = '#666';
        msg.style.fontFamily = "'Courier New', monospace";
        msg.style.fontSize = '14px';
        msg.style.visibility = 'visible';
        msg.style.animation = 'blink 1s infinite';
        msg.innerText = 'PRESS ANY KEY...';
        screen.appendChild(msg);

        const start = function () {
            msg.remove();
            audioElement.play();
            startWarmUpSequence();
            window.removeEventListener('keydown', start);
            window.removeEventListener('click', start);
        };

        window.addEventListener('keydown', start);
        window.addEventListener('click', start);
    }

    function finishBoot() {
        screen.classList.add('boot-fade-out');
        setTimeout(function () {
            screen.remove();
            done();
        }, 450);
    }
}

/* ================= GRUB + kernel log + login ================= */
function runKernelLog(done) {
    const screen = document.createElement('div');
    screen.id = 'kernel-screen';
    screen.className = 'active';
    screen.innerHTML = '<div id="kernel-log"></div><div id="kernel-cursor"></div>';
    document.body.appendChild(screen);

    const log = document.getElementById('kernel-log');
    const cfg = getConfig();
    const pc = cfg.pc_info || {};
    const cpu = pc.cpu || 'Intel i5-12600KF';
    const cores = pc.cpu_cores || '10 cores / 16 threads';
    const host = pc.host || 'ASRock Z690M Phantom Gaming 4';
    const gpu = pc.gpu || 'AMD Radeon RX 6700 XT';
    const bios = pc.bios || 'AMI 3.80';
    const build = pc.build || 'waifuOS 98 SE (custom rezi build)';
    const mem = '32576MiB/32600MiB';
    const disk = (pc.storage || ['Samsung SSD 980 1TB'])[0];
    const sd = (pc.storage || [])[1] || 'Generic- SD/MMC 59.5 GiB (USB)';
    const net = pc.network || 'Intel(R) Ethernet Connection (17) I219-V';

    let t = 0.0;
    function stamp() {
        t += 0.035 + Math.random() * 0.12;
        return t.toFixed(6);
    }

    const lines = [
        { text: 'Booting \'waifuOS 98 SE, with Linux 6.8.0-waifu-amd64\'' },
        { text: 'boot', cls: 'cmd' },
        { text: '[    0.000000] Linux version 6.8.0-waifu-amd64 (buildbot@waifu.team) (gcc (Debian 12.2.0-14) 12.2.0) #1 SMP PREEMPT_DYNAMIC waifuOS 98 SE', cls: 'ok' },
        { text: 'Command line: BOOT_IMAGE=/boot/vmlinuz-6.8.0-waifu-amd64 root=UUID=waifu-98se ro quiet splash' },
        { text: 'KERNEL supported cpus:' },
        { text: '  Intel GenuineIntel 12th Gen Core i5-12600KF (' + cores + ')', cls: 'ok' },
        { text: 'BIOS-provided physical RAM map:' },
        { text: '  BIOS-e820: [mem 0x0000000000000000-0x000000007f5fffff] usable (waifu BIOS)' },
        { text: 'Memory: ' + mem + ' available (14336K kernel code, 4096K rwdata, 5120K rodata, 4096K init, 8192K bss)' },
        { text: 'ACPI: Host Platform: waifu.team — ' + build, cls: 'ok' },
        { text: 'ACPI: Host OEM: ' + host + ' / ' + bios },
        { text: 'pci 0000:03:00.0: [1002:73df] ' + gpu + ' (navi22) vgaarb: setting as boot VGA device', cls: 'ok' },
        { text: 'nvme0n1: ' + disk + ', 1000202273280 bytes' },
        { text: 'usb-storage: ' + sd + ', SCSI emulated' },
        { text: 'e1000e 0000:00:1f.6 eth0: ' + net },
        { text: 'input: waifu-keyboard, keyboard emulation' },
        { text: 'systemd[1]: Running in \'waifu\' mode.' },
        { text: 'systemd[1]: Starting waifuOS boot services...' },
        { text: 'systemd[1]: Starting Login Service...' },
        { text: 'systemd[1]: Started waifuOS Display Manager (waifuDM).', cls: 'ok' },
        { text: 'systemd[1]: Starting waifu.desktop.service...' },
        { text: 'systemd[1]: Started waifu.desktop.service (waifuOS 98 SE desktop).', cls: 'ok' },
        { text: '[ OK ] Reached target waifu.team — graphical interface ready.', cls: 'ok' }
    ];

    let i = 0;
    function nextLine() {
        if (i >= lines.length) { setTimeout(loginPrompt, 250); return; }
        const line = lines[i++];
        addLine(line.text, line.cls);
        setTimeout(nextLine, 90);
    }

    function addLine(text, cls) {
        const div = document.createElement('div');
        if (cls === 'cmd') {
            div.innerHTML = '<span class="k-time">grub&gt; </span><span class="k-cmd">' + esc(text) + '</span>';
        } else {
            div.innerHTML = '<span class="k-time">[' + stamp() + '] </span>' + (cls === 'ok' ? '<span class="k-ok">' + esc(text) + '</span>' : esc(text));
        }
        log.appendChild(div);
        screen.scrollTop = screen.scrollHeight;
    }

    function typeText(div, text, speed, doneFn) {
        let n = 0;
        const iv = setInterval(function () {
            n++;
            div.textContent = text.slice(0, n);
            screen.scrollTop = screen.scrollHeight;
            if (n >= text.length) { clearInterval(iv); if (doneFn) doneFn(); }
        }, speed);
    }

    function loginPrompt() {
        const blank = document.createElement('div');
        log.appendChild(blank);
        log.appendChild(blank);
        screen.scrollTop = screen.scrollHeight;

        const head = document.createElement('div');
        head.innerHTML = 'waifuOS 98 SE <span class="k-time">6.8.0-waifu-amd64</span> tty1';
        log.appendChild(head);

        const line1 = document.createElement('div');
        line1.innerHTML = 'waifuOS 98 SE login: ';
        log.appendChild(line1);
        const user = document.createElement('span');
        user.className = 'k-input';
        line1.appendChild(user);
        screen.scrollTop = screen.scrollHeight;

        typeText(user, getConfig().profile.username || 'rezi', 70, function () {
            const line2 = document.createElement('div');
            line2.innerHTML = 'Password: ';
            log.appendChild(line2);
            const pass = document.createElement('span');
            pass.className = 'k-input';
            line2.appendChild(pass);
            screen.scrollTop = screen.scrollHeight;

            typeText(pass, '********', 55, function () {
                setTimeout(function () {
                    const w = document.createElement('div');
                    w.innerHTML = 'Last login: <span class="k-dim">on tty1</span>';
                    log.appendChild(w);
                    const w2 = document.createElement('div');
                    w2.innerHTML = '<span class="k-ok">Welcome to WaifuOS 98 SE!</span> (c) 1998-2026 waifu.team';
                    log.appendChild(w2);
                    const w3 = document.createElement('div');
                    w3.innerHTML = 'Custom build: <span class="k-dim">' + esc(build) + '</span>';
                    log.appendChild(w3);
                    const w4 = document.createElement('div');
                    w4.innerHTML = 'The system is up and running. <span class="k-warn">tip: press Alt for the Start Menu.</span>';
                    log.appendChild(w4);
                    screen.scrollTop = screen.scrollHeight;

                    setTimeout(function () {
                        screen.classList.add('boot-fade-out');
                        setTimeout(function () {
                            screen.remove();
                            done();
                        }, 600);
                    }, 900);
                }, 350);
            });
        });
    }

    nextLine();
}
