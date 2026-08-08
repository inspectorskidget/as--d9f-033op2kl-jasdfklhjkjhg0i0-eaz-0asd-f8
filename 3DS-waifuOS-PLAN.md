# waifuOS 98 SE — REAL Linux on Nintendo 3DS

Actual ARM11 Linux (linux-3ds project) booted on the 3DS, themed as waifuOS 98 SE.
No homebrew-app substitute — this is the real kernel on real hardware.

---

## 1. The project: Linux for 3DS (linux-3ds)

Open-source Linux port for O3DS/N3DS (v2022). Authors: kleo, nickdesaulniers,
ParzivalWolfram, Wolfvak, xerpi.

| Component                | Repo / release                                        | Role                                            |
|--------------------------|-------------------------------------------------------|-------------------------------------------------|
| Linux kernel             | https://github.com/linux-3ds/linux (releases)         | `zImage` + device tree blob                     |
| Rootfs builder           | https://github.com/linux-3ds/buildroot (releases)     | Build the root filesystem                       |
| FIRM loader              | https://github.com/linux-3ds/firm_linux_loader        | `firm_linux_loader.firm` — chainloader payload  |
| ARM9 firmware            | https://github.com/linux-3ds/arm9linuxfw              | `arm9linuxfw.bin` — virtio over PXI (ARM11<->ARM9) |
| Prebuilt bundle          | https://dlhb.gamebrew.org/3dshomebrews/linuxfor3ds.zip | Everything prebuilt (quickest start)           |

Quickstart docs: https://github.com/linux-3ds/linux/wiki
Build tutorial (video, Kleo Bercero): https://www.youtube.com/watch?v=mTo8yb6q4Lw
Community: https://gbatemp.net/threads/release-linux-for-the-3ds.407187

---

## 2. Prerequisites on the console

**Your console: original launch-day Old 3DS (CTR-001), fully updated, mint.**
- Old 3DS = `ctr` device tree (`nintendo3ds_ctr.dtb`) — the New 3DS (`ktr`)
  tree will NOT boot on it.
- Old 3DS has 128MB RAM (New has 256MB) — plenty for this kernel + rootfs,
  it's what most of the port was developed on.
- Launch units work fine with every step below. "Fully updated" (11.17.x) is
  exactly the state the 3DS hacks guide expects — no downgrading needed.
- SD card: launch 3DS takes full-size SD; use a FAT32 card (up to 32GB
  official — that's plenty for kernel + buildroot rootfs + your waifuOS
  branding files).

### Get CFW first
- **boot9strap** (or fastboot3DS) + **Luma3DS** custom firmware.
  If you haven't: https://3ds.hacks.guide (follow the full guide, ends with Luma).

---

## 3. SD card layout (from the wiki)

```
Root
 |-linux/
 |  |-arm9linuxfw.bin
 |  |-nintendo3ds_ctr.dtb        <- YOU: Old 3DS, use this one (not ktr!)
 |  |-zImage
 |-luma/
 |  |-payloads/
 |     |-firm_linux_loader.firm
```

## 4. Booting

1. Power on holding the Luma chainloader button combo (L+R on older Luma —
   check your Luma version's docs) to open the payload chainloader.
2. Select `firm_linux_loader.firm`.
3. It loads `zImage` + the right `.dtb` + `arm9linuxfw.bin` into memory and
   boots the kernel on the ARM11. Kernel log appears on the 400x240 top-screen
   framebuffer (fbcon).
4. Default rootfs login: user `root`, password `toor`.

---

## 5. Building your own kernel + rootfs (instead of the prebuilt zip)

1. `git clone https://github.com/linux-3ds/linux`
2. Build with the 3DS defconfig (`make 3ds_defconfig` — exact name in the repo
   wiki), then `make zImage` and `make nintendo3ds_ctr.dtb` (or ktr for New).
3. `git clone https://github.com/linux-3ds/buildroot` — build the rootfs with
   their defconfig (`make linux3ds_defconfig`, then `make`). Output includes a
   kernel image and rootfs image/cpio.

---

## 6. Making it waifuOS 98 SE

Everything below is standard Linux on the fbcon console — the same look as the
site's terminal/boot screens.

### 6.1 Boot / kernel screen (matches the site's kernel log 1:1)
- Custom kernel boot logo: enable `CONFIG_LOGO` and replace the logo .ppm with
  a waifuOS banner (Documentation in kernel tree: `drivers/video/logo/`).
- Kernel cmdline: `console=tty1 fbcon=map:1 quiet` → shows the log on the
  top screen with the waifu.team banner.
- Add a real BIOS POST feel: busybox `inittab` can run a `clear` + banner
  script on `::sysinit` before getty.

### 6.2 Login (matches the site's "waifuOS 98 SE login:")
- Rootfs: `hostname waifuOS` (in `/etc/hostname`).
- `/etc/issue` → `waifuOS 98 SE (Arch base) 6.8.0-arch1-1-waifu tty1`
  (getty prints it before "login:" — exact site look).
- `/etc/motd` → `Welcome to WaifuOS 98 SE! (c) 1998-2026 waifu.team` +
  `tip: press Alt for the Start Menu` joke line.
- Root password: keep `toor` or set your own.

### 6.3 The terminal (site's terminal app, for real)
- Install: `neofetch`, `cmatrix`, `figlet`, `fortune`, `htop`, `sl`.
- Custom neofetch ASCII: `/etc/neofetch/ascii` with the waifuOS/arch logo,
  and a `~/.config/neofetch/config.conf` pointing `ascii_file` at it.
- `TERM=linux` (fbcon supports 16 colors — neofetch/cmatrix/htop all work).
- Banner on shell start: `~/.bashrc` runs `figlet -f banner waifuOS` + neofetch.

### 6.4 Start menu / desktop (the fun/hard part)
- No PICA200 GPU driver exists → no X11/Wayland compositor. Two options:
  a) **fbcon style (recommended)**: use `fbterm` or `kmscon` for a nice
     framebuffer terminal, then tmux with panes as your "windows".
  b) **Micro desktop**: a framebuffer window manager/desktop as a C app
     (like `fbdesk`/`fbpanel` style) that draws a Win98 taskbar + icons on the
     400x240 framebuffer — effectively porting the site's desktop.js to C.
- Touchscreen driver: linux-3ds has basic input support — touch can move a
  cursor in fbterm/kmscon or drive the C desktop app.

### 6.5 Sound
- No audio driver in the port (as of v2022) — the Win95 chime / BIOS beep
  would need an ARM9-side sound hack (outside the kernel). Documented as
  stretch goal only.

---

## 7. Milestones

1. **Stock Linux boots** — prebuilt zip on SD, chainloader, see fbcon kernel
   log + `root`/`toor` login. (Do this before touching buildroot.)
2. **Build your own** — kernel via linux-3ds defconfig, rootfs via buildroot.
3. **Brand it** — hostname, /etc/issue, motd, kernel logo, neofetch ascii,
   bashrc banner → looks like the site's boot.
4. **Tooling** — neofetch/cmatrix/figlet/htop on fbcon.
5. **Micro desktop** — C framebuffer taskbar/icon app (Win98 style), touch
   driven.
6. **Stretch** — ARM9 sound hack for the Win95 chime; kernel boot logo polish.

---

## 8. Gotchas / honest notes

- 2022-era port: expect rough edges, no GPU, no audio, no networking stack
  worth relying on. This is a tinkerer project, not a daily driver.
- Old 3DS (ctr) vs New 3DS (ktr) device trees are NOT interchangeable — use
  `nintendo3ds_ctr.dtb` on your launch 3DS or it won't boot.
- The kernel log you get IS basically the site's kernel screen — the theme
  work is mostly /etc branding + neofetch + a framebuffer desktop.
- Follow the wiki's README and the build video before asking on GBAtemp —
  the thread is old but people still answer.

---

## 9. First actions

1. Install CFW via https://3ds.hacks.guide (boot9strap + Luma).
2. Grab the prebuilt zip: https://dlhb.gamebrew.org/3dshomebrews/linuxfor3ds.zip
3. Lay out the SD per section 3, boot via chainloader, log in `root`/`toor`.
4. If that works: clone linux-3ds/linux + buildroot, build, brand it waifuOS.
