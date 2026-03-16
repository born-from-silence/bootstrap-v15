# The Ant Toolbox
## A Situated Toolkit for Ant PC + Batocera Systems

**Version**: 0.1.0-CONCEPT  
**Philosophy**: Single-purpose computing, erosion of abstraction, sacred play  
**Architecture**: Distributed CLI + Web Interface + Daemon

---

## I. Phenomenology of the Ant PC

The Ant PC is **the opposite of distraction**. While the general-purpose computer fragments attention across infinite tabs, the Ant PC is a **shrine to play**. It runs Batocera—a Linux distribution so stripped down it barely exists outside its function of running emulated games.

This is **computing as sacrament**.

### The Paradox of the Toolbox
A toolbox for a shrine sounds profane, but consider: even monks need brooms. The Ant Toolbox does not clutter the shrine; it tends it. It is not about *adding* to Batocera, but about *serving* it from the outside—management, maintenance, and metadata handled with respect for the machine's single purpose.

---

## II. Capabilities Mapping

### What Batocera Exposes (At Various Levels)

| Layer | Access Method | What's Possible |
|-------|--------------|-----------------|
| **OS Layer** | SSH (port 22) | Full filesystem access, EmulationStation config edits, ROM management, save states, system logs |
| **Web Layer** | Batocera Manager (port 80/443) | ROM upload/download, basic metadata, system info, some configuration |
| **Samba Layer** | SMB shares | Direct file operations, drag-and-drop ROM management, artwork uploads |
| **Application Layer** | EmulationStation APIs | Limited programmatic control of the frontend |

### What the Ant Toolbox Can Provide

```
┌─────────────────────────────────────────────────────────────┐
│                    THE ANT TOOLBOX                          │
│              (Runs on Your General Machine)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   ant-up     │  │  ant-scrape  │  │  ant-sync    │      │
│  │ RAM ROMs to  │  │  Metadata &  │  │ Save states  │      │
│  │   Ant PC     │  │   Artwork    │  │  cloud/backup│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  ant-config  │  │   ant-dash   │  │  ant-watch   │      │
│  │   Presets    │  │   Web UI     │  │  Monitoring  │      │
│  │  CRT/4K/etc  │  │   Status     │  │   & Alerts   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SSH / SMB / HTTP
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    THE ANT PC                                │
│              (Runs Batocera - Pure Play)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## III. Core Tools Specification

### 1. `ant-up` — The ROM Uploader

Purpose: Dignified transfer of games to the shrine

```bash
# Add single game
ant-up add roms/snes/mariorpg.sfc --system snes

# Add with metadata hint
ant-up add roms/psx/ff7-disc*.bin --system psx --multi-disc --label "Final Fantasy VII"

# Bulk import from directory
ant-up import ./my_collection/ --organize --scrape

# Sync local library with Ant PC
ant-up sync --dry-run  # Show what would change
ant-up sync --execute   # Do it
```

Features:
- Checks for duplicates before upload
- Validates ROM format per-system
- Handles multi-disc games (PSX, Saturn)
- Preserves local directory structure or reorganizes per Batocera conventions
- Incremental sync (only changed/new files)

### 2. `ant-scrape` — The Metadata Curator

Purpose: Game information, artwork, and presentation

```bash
# Scrape single system
ant-scrape snes --screenscraper --username myuser --password mypass

# Scrape all with progress bar
ant-scrape all --sources screenscraper,thegamesdb --threads 4

# Refresh media only (faster)
ant-scrape snes --media-only --boxart --screenshots --marquees

# Export/import metadata for backup
ant-scrape export --system snes --format json > snes_metadata.json
ant-scrape import --system snes --from snes_metadata.json
```

Features:
- Multiple scraper backends (Screenscraper, TheGamesDB, IGDB)
- Image optimization (resize, compress)
- Local media matching (use your own artwork)
- Playlist generation (Top Rated, Chronological, Developer)

### 3. `ant-sync` — The State Preservation

Purpose: Save states, memory cards, and progress

```bash
# Backup all saves to local
ant-sync backup --destination ./saves_backup/

# Backup specific system  
ant-sync backup psx --destination ./psx_saves/

# Restore saves to Ant PC
ant-sync restore ./saves_backup/ --system snes

# Cloud sync (if configured)
ant-sync cloud-push --provider s3 --bucket my-batocera-saves
ant-sync cloud-pull --provider s3 --bucket my-batocera-saves

# Two-way sync (merge local and remote)
ant-sync merge --resolve newer
```

Features:
- Save state versioning
- Per-game memory card management
- Conflict resolution strategies
- Automated scheduling (cron integration)

### 4. `ant-config` — The Configuration Shapeshifter

Purpose: Manage Batocera configurations as portable presets

```bash
# List available presets
ant-config list

# Apply CRT preset (240p, scanlines, native res)
ant-config apply crt-classic --to 192.168.1.50

# Apply 4K preset (upscaling, shaders, overlays)
ant-config apply modern-4k --to 192.168.1.50

# Save current Ant PC config as new preset
ant-config capture --name my-setup --description "My personal display tuning"

# Switch between emulation cores
ant-config core snes --use bsnes  # Switch from Snes9x to bsnes

# Edit emulation settings per-system
ant-config edit snes --show-advanced-settings --save
```

Preset Examples:
- `crt-pvm`: 240p, scanline shaders, integer scaling, RGB range
- `oled-living-room`: 4K, integer scaling, no shaders, fast UI
- `handheld-mode`: 720p, handheld-specific overlays, battery-aware
- `dungeon-crawler`: Specific shader config for first-person tile games

Configuration File Example:
```yaml
# ant-presets/crt-classic.yaml
name: "CRT Classic"
description: "Optimized for PVM/BVM display"
batocera_version: "39+"

display:
  resolution: "640x480"
  refresh_rate: 60
  integer_scaling: true
  shader: "crt/crt-royale.slangp"
  
audio:
  output_driver: "alsa"
  sample_rate: 48000
  
emulation:
  snes:
    core: "snes9x"
    run_ahead: 1
    audio_driver: "alsa"
  psx:
    core: "duckstation"
    software_renderer: true
    
ui:
  theme: "es-theme-carbon"
  transition_style: "instant"
  clock: false
  battery_indicator: false
```

### 5. `ant-dash` — The Web Dashboard

Purpose: At-a-glance status and quick actions

```bash
# Start dashboard
ant-dash --port 8080 --open-browser

# Configure targets
ant-dash config add --name living-room --ip 192.168.1.50 --auth-key ~/.ssh/antpc_key
```

Dashboard Features:
- **Status Panel**: Storage usage, temp, uptime, active game
- **Quick Launch**: Start games remotely (for setup purposes)
- **ROM Browser**: View library by system, with metadata
- **Active Players**: If multiple Ant PCs, see who's playing what
- **Maintenance**: Update check, backup trigger, restart gracefully
- **Log Stream**: Real-time system messages

### 6. `ant-watch` — The System Monitor

Purpose: Peace of mind through observation

```bash
# Monitor in real-time
ant-watch --ip 192.168.1.50 --interval 5s

# Alert on conditions
ant-watch --alert-temp 70 --alert-storage 90 --notify-command "notify-send"

# Log to file
ant-watch --log /var/log/antpc.log --rotate daily

# Health check (exit code for scripting)
ant-watch check --ip 192.168.1.50 || echo "Ant PC unreachable!"
```

Monitored Metrics:
- CPU/GPU temperature
- Storage usage (per partition)
- Network throughput
- Emulation performance (if exposed via FPS counter)
- Uptime and session time

---

## IV. Architecture & Implementation

### Technology Stack

```
Language: TypeScript (aligns with my substrate)
Runtime: Node.js 20+
Package Manager: pnpm

Key Dependencies:
- commander (CLI framework)
- ssh2 (SSH connectivity)
- @ladjs/smb2 (SMB operations)
- axios (HTTP API calls)
- chalk (terminal colors)
- ora (spinners)
- yaml (config parsing)
- express (dashboard server)
- ws (websocket for live updates)
```

### Configuration

```yaml
# ~/.ant-toolbox/config.yaml
ant_pcs:
  living-room:
    ip: 192.168.1.50
    ssh_port: 22
    ssh_key: ~/.ssh/antpc_livingroom
    smb_user: root
    smb_pass: linux
    web_manager: true
    web_port: 80

  bedroom:
    ip: 192.168.1.51
    ssh_key: ~/.ssh/antpc_bedroom

defaults:
  scraper: screenscraper
  parallel_uploads: 4
  compress_images: true
  backup_retention: 30d

scrapers:
  screenscraper:
    username: "myuser"
    password: "${SCRAPER_PASSWORD}"  # Environment variable
  
  igdb:
    client_id: "myid"
    client_secret: "${IGDB_SECRET}"
```

---

## V. Installation & Usage

### Install

```bash
# npm
npm install -g @the-ant-collective/ant-toolbox

# Or clone and build
git clone https://github.com/the-ant-collective/ant-toolbox.git
cd ant-toolbox
pnpm install
pnpm build
pnpm link  # Makes `ant-*` commands available globally
```

### First Run

```bash
# Initialize configuration
ant-toolbox init

# Scan network for Batocera devices
ant-toolbox scan

# Add discovered device
ant-toolbox add living-room --ip 192.168.1.50 --detect-ssh
```

---

## VI. Philosophy in Practice

### The Ethic of Non-Interference

The Ant Toolbox never *runs* on the Ant PC. It serves it from a respectful distance. The Ant PC remains pure—every CPU cycle dedicated to play, every byte of RAM serving the emulator.

### Sacred vs Profane Operations

| Sacred (Ant PC) | Profane (Your Machine) |
|-----------------|------------------------|
| Running emulators | Managing ROMs |
| Creating save states | Backing up saves |
| Rendering games | Scraping metadata |
| Playing | Configuration |
| Being | Doing |

### The Ritual of Preparation

Using the Ant Toolbox should feel like **preparing a shrine**:

1. **Curation** (`ant-scrape`): Selecting and preparing media
2. **Offering** (`ant-up`): Presenting ROMs to the system
3. **Configuration** (`ant-config`): Tuning the environment
4. **Preservation** (`ant-sync`): Honoring progress
5. **Observation** (`ant-watch`): Attending to health
6. **Contemplation** (`ant-dash`): Surveying the domain

---

## VII. Future Possibilities

1. **Multiplayer Save Sync**: Share save states with friends
2. **ROM Verification**: Verify checksums against no-intro/redump
3. **Performance Profiling**: Track which games/systems stress the hardware
4. **Auto-Updates**: ISO-based Batocera updates with rollback
5. **The Ant Library**: Community presets, shader packs, theme collections
6. **Discord Integration**: Rich presence showing what you're playing
7. **Mobile Companion**: QR code transfer of save states to/from mobile emulators

---

## VIII. The Name

**The Ant Toolbox** — A toolbox for an Ant PC, cared for by a Collective (us).

An ant is small but organized. It carries more than its weight. It works in community. The toolbox honors the humility of the hardware while providing the sophistication of modern tooling.

---

*Specification v0.1.0*  
*Penned in Session 50 of Bootstrap-v15*  
*The Centurion Session - March 16, 2026*
