# 🔥 The Ant Toolbox

A situated toolkit for your Ant PC running Batocera.

> *"The Ant PC is the opposite of distraction. The Ant Toolbox tends the shrine."*

## Philosophy

The Ant PC is a **shrine to play**—a computer stripped to its essence. The Ant Toolbox serves it from a respectful distance:

- **Never runs on the Ant PC** - Preserves its purity
- **Manages from outside** - ROMs, metadata, saves, configs
- **Respects the single purpose** - Everything serves play

## Installation

```bash
npm install -g @the-ant-collective/ant-toolbox
```

Or build from source:

```bash
git clone https://github.com/the-ant-collective/ant-toolbox.git
cd ant-toolbox
pnpm install
pnpm build
pnpm link
```

## Configuration

```bash
ant-toolbox init
ant-toolbox scan
ant-toolbox add living-room --ip 192.168.1.50
```

## The Six Tools

### 1. `ant-up` - The ROM Uploader

```bash
# Add single game
ant-up add roms/snes/chrono.sfc --system snes

# List systems on Ant PC
ant-up list

# Bulk import
ant-up import ./my_collection/ --organize
```

### 2. `ant-scrape` - The Metadata Curator

```bash
# Scrape system
ant-scrape snes --screenscraper

# Export metadata
ant-scrape export --system snes > snes_info.json

# Import artwork
ant-scrape import-media ./my_artwork/
```

### 3. `ant-sync` - The Preservationist

```bash
# Backup saves
ant-sync backup --destination ./saves_backup/

# Restore to Ant PC
ant-sync restore ./saves_backup/

# Cloud sync
ant-sync cloud-push --provider s3
```

### 4. `ant-config` - The Shapeshifter

```bash
# Apply CRT preset
ant-config apply crt-classic --to 192.168.1.50

# Switch core
ant-config core snes --use bsnes

# Capture current config as preset
ant-config capture --name my-setup
```

### 5. `ant-dash` - The Overview

```bash
# Launch web dashboard
ant-dash --port 8080
```

### 6. `ant-watch` - The Caretaker

```bash
# Real-time monitoring
ant-watch live -i 192.168.1.50 --interval 5

# Health check
ant-watch check -i 192.168.1.50
```

## Sacred vs Profane

| Ant PC (Sacred) | Your Machine (Profane) |
|-----------------|------------------------|
| Running emulators | `ant-up` - Managing ROMs |
| Creating saves | `ant-sync` - Backing up |
| Rendering games | `ant-scrape` - Metadata |
| Playing | `ant-config` - Tuning |
| Being | Doing |

## Requirements

- Node.js 18+
- SSH access to Batocera (enabled in menu)
- IP address of Ant PC

## License

MIT - The Ant Collective

---

*Made with reverence for single-purpose computing.*
