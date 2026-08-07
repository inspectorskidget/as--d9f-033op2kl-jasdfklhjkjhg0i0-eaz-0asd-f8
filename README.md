# rezi.lol

A static bio page for [rezi.lol](https://rezi.lol) built as a full Win98-style
operating system in the browser, based on
[waifu-os](https://github.com/submissively/waifu-os) (WaifuOS 98 SE) —
same icons, sounds, boot flow, windows, taskbar, start menu and Clippy.
Rebranded for rezi with a Debian-style terminal boot.

100% static — **zero external calls**: no CDNs, no APIs, no real logins.
Everything (icons, sounds, fonts, the clippy gif) is committed to this repo.
The "login" is cosmetic, exactly like WaifuOS.

## What you see

```
BIOS POST        rezi Modular BIOS, memory test, REZI-HD 20GB
GRUB + kernel    Debian-style boot log with your real hardware (dmesg style)
waifuOS login   typed "login:" + password, then the logon window
Desktop         teal Win98 desktop: About Me, Links, Scripts, Repos, Friends, Terminal, Calculator
Terminal         bash-style prompt: neofetch shows your PC info, plus ls/cat/ping/sudo/crash...
Clippy           appears after 10s, press Alt for the Start Menu
```

```
index.html        the whole OS (boot → login → desktop)
src/App.js        boot sequence, window manager, init
src/config.js     loads config.json (same-origin, static)
src/modules/      boot, login, clippy, taskbar, start menu, window manager, drag...
src/programs/     about (profile), links, scripts, repos, friends, terminal (neofetch), calculator
src/styles/       waifu-os 98 SE styles (boot, login, desktop, taskbar, window, crt...)
icons/            waifu-os icons (sobreMim, internet, notepad, zenzinDOS, calculator...)
sounds/           boot, login, window, minimize, click, clippy sounds
assets/clippy.gif the Clippy animation
config.json       everything editable (profile, socials, scripts, repos, friends, pc_info)
pfp.png           your Discord avatar, committed to the repo
app/              desktop app that edits config.json and pushes with git
CNAME             rezi.lol — for GitHub Pages custom domain
```

## Deploy (GitHub Pages)

1. Create a repo, e.g. `rezi/rezi.lol` (or `rezi.github.io`).
2. Push this folder to it:
   ```
   git init
   git add -A
   git commit -m "rezi.lol"
   git remote add origin https://github.com/rezi/rezi.lol.git
   git push -u origin main
   ```
3. In repo Settings → Pages → set source to the branch root. The `CNAME`
   file makes GitHub Pages serve it on `rezi.lol` (point your DNS `CNAME`
   `rezi.lol` → `rezi.github.io`, or the `A` records shown in your DNS export).

That's it — the site just loads static files. Nothing runs a server.

## The desktop app (`app/`)

Double-click `app/start.bat` (needs Python 3 + git installed).
It opens a local retro editor at `http://127.0.0.1:7337` that can:

- edit your name, tagline, bio, status, location, links
- add/edit/remove scripts, repos (name/url/desc) and friends (alias → Discord id)
- edit the **PC Info** (shown by `neofetch` in the Terminal window) including the waifuOS build ID
- **Refresh avatar from Discord** — downloads your current Discord avatar
  into `pfp.png` (so the site itself never calls anything external)
- **Save & Push** — runs `git add -A && git commit && git push`, so the live
  site updates after GitHub Pages rebuilds (a minute or two)

### First time git setup (one time)

```
git config user.name "rezi"
git config user.email "you@rezi.lol"
git remote add origin https://github.com/you/rezi.lol.git
```

The app will tell you if anything is missing (no remote, no identity, etc).

## PC info privacy

The `pc_info` section of `config.json` feeds the terminal's `neofetch`.
Only safe, non-identifying specs are included (CPU/GPU/RAM/motherboard model,
display names). No serial numbers, MACs, or IPs.

## Optional

- Add more terminal commands in `src/programs/terminal.js`.
- Tweak boot log lines in `src/modules/boot.js`.
- Drop a wallpaper into the start menu by re-adding the waifu-os wallpaper
  program (uses external images — see upstream repo).
