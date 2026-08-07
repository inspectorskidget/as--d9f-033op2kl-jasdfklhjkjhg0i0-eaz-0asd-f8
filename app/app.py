#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
rezi.lol — config editor app
Runs a local editor at http://127.0.0.1:7337 that edits config.json
in this repo and pushes changes with git.
No external calls are made by the SITE itself — this app is the only
thing that talks to the internet (Discord avatar refresh).
"""

import json
import os
import subprocess
import sys
import threading
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

APP_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(APP_DIR)
CONFIG_PATH = os.path.join(REPO_ROOT, "config.json")
PFP_PATH = os.path.join(REPO_ROOT, "pfp.png")
PORT = 7337

DISCORD_API = "https://japi.rest/discord/v1/user/{uid}"
DISCORD_AVATAR = "https://cdn.discordapp.com/avatars/{uid}/{hash}.png?size=256"


def read_config():
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        return {"error": str(e)}


def write_config(cfg):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)
        f.write("\n")


def run_git(args, timeout=60):
    """Run a git command in the repo root, return (ok, output)."""
    try:
        proc = subprocess.run(
            ["git"] + args,
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        return proc.returncode == 0, out.strip()
    except FileNotFoundError:
        return False, "git not found on this system. install git: https://git-scm.com/"
    except subprocess.TimeoutExpired:
        return False, "git command timed out."
    except Exception as e:
        return False, str(e)


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "rezi.lol-editor/1.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))


def refresh_avatar():
    """Pull the avatar hash from Discord, download pfp.png, update config."""
    cfg = read_config()
    if isinstance(cfg, dict) and "error" in cfg:
        return False, cfg["error"]

    uid = str(cfg.get("discord", {}).get("id", ""))
    if not uid:
        return False, "no discord.id set in config.json"

    try:
        data = fetch_json(DISCORD_API.format(uid=uid))
    except Exception as e:
        return False, "discord lookup failed: %s" % e

    info = data.get("data") or {}
    avatar = info.get("avatar")
    if not avatar:
        return False, "no avatar found for user %s" % uid

    url = DISCORD_AVATAR.format(uid=uid, hash=avatar)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            png = r.read()
        with open(PFP_PATH, "wb") as f:
            f.write(png)
    except Exception as e:
        return False, "avatar download failed: %s" % e

    cfg.setdefault("discord", {})
    cfg["discord"]["id"] = uid
    cfg["discord"]["username"] = info.get("username") or cfg["discord"].get("username", "")
    cfg["discord"]["avatar_url"] = "https://cdn.discordapp.com/avatars/%s/%s.png?size=512" % (uid, avatar)
    write_config(cfg)

    return True, "avatar updated: %s (%s)" % (info.get("username", "?"), url.split("?")[0])


def git_status():
    lines = []
    ok, branch = run_git(["rev-parse", "--abbrev-ref", "HEAD"])
    lines.append("branch: " + (branch or "?"))
    ok, remote = run_git(["config", "--get", "remote.origin.url"])
    lines.append("remote: " + (remote or "NOT SET — add one with: git remote add origin <url>"))
    ok, out = run_git(["status", "--short"])
    lines.append("changes: " + (out if out else "(clean)"))
    ok, log = run_git(["log", "--oneline", "-3"])
    if log:
        lines.append("last commits:\n" + log)
    return "\n".join(lines)


def git_push(message):
    changes = []
    ok, out = run_git(["status", "--porcelain"])
    if not ok:
        return False, "git status failed: " + out
    changes = [l for l in out.splitlines() if l.strip()]

    if changes:
        ok, out = run_git(["add", "-A"])
        if not ok:
            return False, "git add failed:\n" + out
        ok, out = run_git(["commit", "-m", message])
        if not ok and "nothing to commit" not in out.lower():
            if "not configured" in out.lower() or "please tell me who you are" in out.lower():
                return False, ("git commit failed:\n" + out +
                               "\n\nset your identity first:\n"
                               "  git config user.name \"rezi\"\n"
                               "  git config user.email \"you@rezi.lol\"")
            return False, "git commit failed:\n" + out
    else:
        out = "(no changes to commit)"

    ok, push = run_git(["push"])
    if not ok and ("no upstream branch" in push or "set-upstream" in push):
        branch = run_git(["rev-parse", "--abbrev-ref", "HEAD"])[1].strip() or "main"
        ok, push = run_git(["push", "--set-upstream", "origin", branch])
    if not ok:
        if "no such remote" in push or "does not appear" in push:
            return False, push + "\n\nset a remote first:\n  git remote add origin https://github.com/<you>/<repo>.git"
        return False, "git push failed:\n" + push

    return True, out + ("\n" if out else "") + push


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        sys.stdout.write("  [editor] %s\n" % (fmt % args))

    # ---------- helpers ----------
    def send_ok(self, body=b"", ctype="text/html; charset=utf-8"):
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, obj, code=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return {}

    # ---------- GET ----------
    def do_GET(self):
        path = self.path.split("?")[0]

        if path == "/" or path == "/editor.html":
            return self.serve_file(os.path.join(APP_DIR, "editor.html"))

        if path.startswith("/repo/"):
            rel = path[len("/repo/"):]
            full = os.path.normpath(os.path.join(REPO_ROOT, rel))
            if not full.startswith(REPO_ROOT):
                return self.send_json({"error": "no"}, 403)
            return self.serve_file(full)

        if path == "/api/config":
            return self.send_json(read_config())

        if path == "/api/status":
            return self.send_json({"ok": True, "text": git_status()})

        if path == "/api/health":
            return self.send_json({"ok": True, "repo": REPO_ROOT})

        self.send_json({"error": "not found"}, 404)

    # ---------- POST ----------
    def do_POST(self):
        path = self.path.split("?")[0]

        if path == "/api/save":
            cfg = self.read_body()
            if not isinstance(cfg, dict) or "error" in cfg:
                return self.send_json({"ok": False, "text": "invalid config payload"}, 400)
            try:
                write_config(cfg)
                return self.send_json({"ok": True, "text": "config.json saved"})
            except Exception as e:
                return self.send_json({"ok": False, "text": "save failed: %s" % e}, 500)

        if path == "/api/push":
            body = self.read_body()
            message = (body.get("message") or "update rezi.lol config").strip()
            ok, text = git_push(message)
            return self.send_json({"ok": ok, "text": text})

        if path == "/api/avatar":
            ok, text = refresh_avatar()
            return self.send_json({"ok": ok, "text": text})

        self.send_json({"error": "not found"}, 404)

    # ---------- file serving ----------
    MIME = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".png": "image/png",
        ".ico": "image/x-icon",
        ".svg": "image/svg+xml",
        ".gif": "image/gif",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".mp3": "audio/mpeg",
    }

    def serve_file(self, full):
        if not os.path.isfile(full):
            return self.send_json({"error": "not found"}, 404)
        ext = os.path.splitext(full)[1].lower()
        ctype = self.MIME.get(ext, "application/octet-stream")
        with open(full, "rb") as f:
            data = f.read()
        self.send_ok(data, ctype)


def main():
    print()
    print("  ┌─────────────────────────────────────────┐")
    print("  │   rezi.lol — config editor             │")
    print("  │   repo: %s   │" % REPO_ROOT)
    print("  └─────────────────────────────────────────┘")
    print()
    print("  opening http://127.0.0.1:%d in your browser..." % PORT)
    print("  close this window (Ctrl+C) to stop the editor.")
    print()

    handler = Handler
    server = None
    for port in range(PORT, PORT + 10):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), handler)
            PORT_ACTIVE = port
            break
        except OSError:
            continue
    if server is None:
        print("  could not bind a port. is another editor instance running?")
        sys.exit(1)

    threading.Timer(0.6, lambda: webbrowser.open("http://127.0.0.1:%d/" % PORT_ACTIVE)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  bye.")
        server.shutdown()


if __name__ == "__main__":
    main()
