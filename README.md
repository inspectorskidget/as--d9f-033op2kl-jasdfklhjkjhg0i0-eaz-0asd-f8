# rezi.lol

## How to customize

### Site-wide settings
Edit `data.json` — payments, Discord invite, contact info, loader, etc.

### Adding / editing scripts
Each script is its own JSON file inside `/scripts/`. To add a new script:

1. Create `scripts/my-script.json`
2. Add `"my-script.json"` to `scripts/index.json`
3. Put any demo gifs/images in `/media/`

### Script file format
```json
{
  "name": "Script Name",
  "icon": "🦑",
  "description": "What it does",
  "price": "Free / Paid / TBD",
  "media": [
    { "type": "gif", "src": "media/demo.gif" },
    { "type": "video", "src": "https://youtube.com/embed/..." },
    { "type": "image", "src": "media/preview.png" }
  ],
  "tags": ["Undetected", "Free", "Source"],
  "tagStyles": ["tag-undetected", "tag-free", "tag-source"],
  "features": [
    "Auto-farm",
    "ESP",
    "Full source code included"
  ],
  "status": "released"
}
```

### Template
Copy `scripts/TEMPLATE.json` as a starting point for new scripts.

### Tag classes available
- `tag-undetected` / `tag-paid` / `tag-free` / `tag-dev` / `tag-source`

Drop gifs/videos into `/media/` and reference them in the script JSON. Done.
