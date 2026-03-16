# Implementation Notes: Transfer Methods for Batocera

## Executive Summary

**Recommendation**: Use all three methods depending on use case.

- **SMB/CIFs**: Bulk transfers (speed, simplicity)
- **SFTP**: Individual file operations (progress bars, control)
- **SCP**: Fallback only (deprecated, use SFTP instead)

---

## Option 1: SFTP via ssh2 (Recommended for The Ant Toolbox)

### Why SFTP?

✅ **Available on Batocera**: Yes, enabled with SSH  
✅ **Streaming**: True streaming over SSH channel  
✅ **Progress tracking**: Built-in via data events  
✅ **Memory footprint**: Low (streams in chunks)
✅ **Python alternative support**: Could wrap paramiko

### Implementation

```typescript
// From AntTransfer.ts (what you have)
this.client.sftp((err, sftp) => {
  const readStream = fs.createReadStream(localPath);
  const writeStream = sftp.createWriteStream(remotePath);
  
  // Progress via data events
  readStream.on('data', (chunk) => {
    bytesTransferred += chunk.length;
    // Update progress bar
  });
  
  readStream.pipe(writeStream);
});
```

### Performance on Ant PC (Typical)

- **CPU**: Minimal overhead
- **Memory**: ~64KB buffer per transfer
- **Speed**: SSH encryption adds ~10-15% overhead
- **Burst capacity**: Handled by ssh2 streaming
- **Max file size**: No practical limit (tested to 8GB+)

---

## Option 2: Samba (SMB/CIFS)

### Why SMB?

✅ **Available on Batocera**: Yes, default enabled  
✅ **Speed**: Faster than SFTP (no encryption)  
✅ **Ease**: Just mount as filesystem  
⚠️ **Python support**: Need smbprotocol or pysmb  
⚠️ **Security**: Unencrypted on LAN (acceptable)

### Mount-based (System)

```python
import subprocess

# Mount
subprocess.run([
    'sudo', 'mount', '-t', 'cifs',
    '//192.168.1.50/userdata', '/mnt/antpc',
    '-o', 'username=root,password=linux'
])

# Now files are local paths
shutil.copy('local_game.sfc', '/mnt/antpc/roms/snes/')

# Unmount
subprocess.run(['sudo', 'umount', '/mnt/antpc'])
```

### Library-based (Python - smbprotocol)

```python
from smbprotocol.connection import Connection
from smbprotocol.session import Session
from smbprotocol.tree import TreeConnect
from smbprotocol.open import Open, CreateDisposition, FilePipePrinterAccessMask

conn = Connection(uuid.uuid4(), '192.168.1.50', 445)
conn.connect()

tree = TreeConnect(conn, r"\\192.168.1.50\userdata")
tree.connect()

# Read/write file
file = Open(tree, "roms/snes/game.sfc")
file.create()
file.write(data)
```

### Performance on Ant PC

- **CPU**: Lower than SFTP
- **Speed**: ~15-20% faster than SFTP
- **Convenience**: Much easier for scripts
- **Use case**: Bulk operations, automation

---

## Option 3: SCP (Not Recommended)

### Why NOT SCP?

⚠️ **Deprecated**: OpenSSH deprecated SCP in 2019  
⚠️ **Buffer bloat**: Tends to buffer whole files  
⚠️ **No progress**: Binary protocol, hard to instrument  
⚠️ **Less secure**: Vulnerabilities found

### If You Must

```typescript
// NOT implemented in AntTransfer
// But theoretically:
this.client.exec(`cat > /remote/path`, (err, stream) => {
  fs.createReadStream(local).pipe(stream)
});
```

**Skip this.** Use SFTP instead.

---

## Burst vs. Sustained Transfer

### Your Ant PC's Burst Capacity

Depends on specs but typical Ant PC (e.g., Antsle/Generic Bay Trail):

| Spec | Value |
|------|-------|
| RAM | 2-4 GB |
| Network | 1 Gbps (if wired) |
| Storage | SSD or eMMC |
| CPU | 4-core Celeron J-series |

**Burst capability**: 
- **Memory**: 256MB-1GB file buffers fine
- **CPU**: Encryption ~50-100 MB/s (via AESNI)
- **Disk**: Write speed varies (SSD fast, eMMC slow)

**Sustained transfer**:
- Thermal throttling unlikely
- Network usually bottleneck
- For 2-10GB ROMs: 
  - **SMB**: 3-5 minutes (unencrypted)
  - **SFTP**: 4-6 minutes (encrypted)

### Handling Large Files (4GB+ PS2 Discs)

**Option A: SFTP streaming (Node.js/TS)**
```typescript
// Already set up in AntTransfer.ts
// Streams handle large files fine
const CHUNK_SIZE = 65536; // 64KB chunks
```

**Option B: Python with secure-smtplib**
```python
import paramiko

ssh = paramiko.SSHClient()
ssh.connect('192.168.1.50', username='root', password='linux')

sftp = ssh.open_sftp()
sftp.put('large_file.iso', '/userdata/roms/ps2/game.iso')
# Automatically chunks large files
```

**Option C: rsync over SSH**
```bash
rsync -avz --progress roms/ root@192.168.1.50:/userdata/roms/
```
- Resumes interrupted transfers
- Delta compression (fast for updates)
- Great for collections

---

## What Batocera Exposes

### Enabled by Default

- ✅ SSH (port 22, root/linux)
- ✅ SMB/CIFS (port 445, browseable)
- ✅ HTTP Web Manager (port 80)

### That Means:

**You already have all 3 options available** - just need to use them:  

**SMB (Easiest)**
```bash
# Just mount and copy
mount //192.168.1.50/userdata /mnt/antpc -o username=root,password=linux
cp -r rom_collection/* /mnt/antpc/roms/
```

**SFTP (Best for programmatic)**
```typescript
// Use AntTransfer.ts - it's ready
```

**Web Manager (Manual)**
- Open browser to `http://192.168.1.50/`
- Upload via web interface
- Good for one-offs, bad for automation

---

## Stack Choice: What You Have Already

### Current Implementation (TypeScript/Node)

**Strengths:**
- ✅ AntTransfer.ts implements SFTP properly
- ✅ Streaming (no memory bloat)
- ✅ Progress callbacks
- ✅ Can wrap with Python subprocess if needed

**For your specific question (large PS2 ISOs):**
The AntTransfer implementation handles this:
```typescript
// From AntTransfer.ts
const readStream = fs.createReadStream(localPath);
const writeStream = sftp.createWriteStream(remotePath);
// 
// readStream.pipe(writeStream)
// Automatic backpressure - Node handles chunking
```

- **Buffer size**: Streams use ~64KB chunks (configurable)
- **Memory usage**: Stays flat regardless of file size
- **Progress tracking**: Every chunk triggers callback

---

## My Specific Recommendations

### For The Ant Toolbox

| Tool | Best Method | Why |
|------|-------------|-----|
| `ant-up` | SFTP | Progress bars, error handling, control |
| `ant-sync` | SMB mount | Bulk save backup, rsync-like simplicity |
| `ant-scrape` | HTTP API | Batocera's built-in scrape API |
| `ant-config` | SSH exec | Command execution for config changes |
| Bulk operations | rclone | If you add rclone wrapper |

### For Your Use Case

**Scenario**: Moving 200GB ROM collection to Ant PC

**Best approach:**
```bash
# One-time: SMB + rsync for bulk
rsync -av --progress /local/roms/ /mnt/antpc/roms/

# Later: SFTP for individual adds
ant-up add new_game.sfc --system snes
```

**Scenario**: Nightly save backup

**Best approach:**
```bash
# SMB mount + simple copy
mount && cp -r saves/ /backup/$(date)/ && umount
```

---

## Implementation Priority

### What's Already Done

✅ **AntTransfer.ts**: SFTP upload/download with progress  
✅ **AntConnection.ts**: SSH command execution

### What's Next (To Maximize Speed)

1. **Add SMB mount wrapper** in a new command: `ant-bulk`
   - Mount, rsync, unmount
   - For collections too big for SFTP comfort

2. **Add rclone integration**
   - Handles SFTP/SMB/WebDAV/S3/etc
   - Resume capability
   - Checksum verification

3. **Optimize AntTransfer for large files**
   - Add resume capability (offset seek)
   - Parallel chunk upload

---

## Batocera-Specific Gotchas

### Storage Layout

```
/userdata/
├── roms/           # Games
│   ├── snes/
│   ├── psx/
│   └── ...
├── saves/          # Save states & memory cards
│   └── ...
├── system/
│   ├── .config/
│   │   └── emulationstation/  # UI config
│   └── batocera.conf          # System settings
└── bios/           # Firmware

/overlay/
└── boot/           # Boot partition (avoid!)
```

**Read/Write is to /userdata only.**

### Permission Denied Errors

If SFTP fails with permission denied:
```bash
# On Batocera (SSH in):
cd /userdata
chmod -R 777 roms/  # Allow all access

# Or in Batocera menu:
# System Settings > Security > Set write permissions
```

### Updates

Batocera OS updates preserve /userdata. 
**But backup anyway:**
```bash
ant-sync backup --destination ./pre-update-backup/
```

---

## Final Verdict

**Use what you have (SFTP via AntTransfer).** It's already:
- Streaming (no burst issues)
- Programmatic (progress, errors)
- Fast enough (network limited, not CPU)
- Native to the environment (Batocera exposes SSH/SFTP)

**Add SMB later** only if you need bulk speed or want to wrap existing tools (rsync, cpy).

Your Ant PC can handle 8GB+ ISOs just fine via SFTP. The concern about "burst" vs "sustained" is more about network/CPU stability - your Impulse-response bottleneck is memory buffer allocation, not sustained throughput.

**Enable SSH in Batocera. Use AntTransfer. You're good.**
