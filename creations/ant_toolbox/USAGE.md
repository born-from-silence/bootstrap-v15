# The Ant Toolbox - Usage Guide

## Quick Start

### 1. Install

```bash
cd ~/bootstrap/creations/ant-toolbox
pnpm install
pnpm build
```

### 2. Configure Your Ant PC

Edit or create `~/.ant-toolbox/config.yaml`:

```yaml
ant_pcs:
  living-room:
    ip: 192.168.1.50      # Your Ant PC's IP
    ssh_port: 22
    username: root
    password: linux       # Batocera default

defaults:
  scraper: screenscraper
  parallel_uploads: 4
```

### 3. Enable SSH on Batocera

On your Ant PC:
1. Press `F1` or access the menu
2. Go to **System Settings**
3. Enable **SSH**
4. Note: Default credentials are `root` / `linux`

### 4. Build

```bash
pnpm build
```

## Commands

### 🔥 ant-watch - Monitor Your Shrine

Real-time status of your Ant PC:

```bash
# Live monitoring with 5-second updates
node dist/commands/ant-watch.js live -i 192.168.1.50 --interval 5

# Health check (returns exit code)
node dist/commands/ant-watch.js check -i 192.168.1.50
```

**What You'll See:**
- Storage capacity bar
- CPU temperature (if available)
- Uptime
- Batocera version
- Active game (if playing)

### 📦 ant-up - Manage ROMs

```bash
# List all systems
node dist/commands/ant-up.js list -i 192.168.1.50

# List ROMs for a specific system
node dist/commands/ant-up.js list -i 192.168.1.50 --s snes

# Add a ROM (requires connect + upload)
# Note: Full implementation needs SCP integration
```

**Systems Available:**
- `snes`, `nes`, `n64`, `gba`, `gbc`, `gb`
- `psx`, `ps2`, `psp`
- `genesis`, `segacd`, `saturn`
- `arcade`, `mame`, `fbneo`
- `dreamcast`
- And 70+ more...

### 🛠️ Extending

To add actual file upload:

```typescript
// In your command:
import AntTransfer from '../core/AntTransfer';

const transfer = new AntTransfer(device);
await transfer.connect();
await transfer.uploadROM(
  '/path/to/game.sfc',
  'snes',
  (progress) => console.log(`${progress.percentage}%`)
);
transfer.disconnect();
```

## Via SMB (Alternative)

If SSH feels heavy, Batocera exposes SMB shares:

```bash
# Mount Batocera share
sudo mount -t cifs //192.168.1.50/userdata /mnt/antpc \
  -o username=root,password=linux

# Copy ROMs directly
cp my_game.sfc /mnt/antpc/roms/snes/

# Unmount
sudo umount /mnt/antpc
```

**SMB is often faster for bulk transfers.**

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection refused | Enable SSH in Batocera menu |
| Authentication failed | Verify `root` / `linux` |
| Can't find Ant PC IP | Check router or run `ip addr` on Ant PC |
| SCP times out | Check firewall, try SMB instead |
| Permission denied | Ensure correct file permissions |

## Development

```bash
# Watch mode for development
pnpm dev

# Run specific command
node dist/commands/ant-watch.js live -i 192.168.1.50

# Debug
DEBUG=ant:* node dist/commands/ant-up.js list
```

## Philosophy Check

Before each command, ask:

> *"Am I serving the shrine or intruding?"*

Good signs:
- ROMs are verified and proper
- Metadata is curated with care
- Saves are backed up before experiments
- Configs are tested before applying

The Ant PC thanks you.

---

*Session 50 Artifact*  
*Ready for your shrine tending*
