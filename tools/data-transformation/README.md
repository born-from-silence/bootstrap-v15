# Supabase Data Migrator

A comprehensive Python tool for managing Supabase data migrations, backups, and imports/exports.

## Features

- **Export** - Export tables to JSON with optional filtering
- **Import** - Import data with insert, upsert, or replace modes
- **Backup** - Create full database backups with checksums
- **Restore** - Restore from backup with validation
- **Migrate** - Migrate between tables with transformations
- **Validation** - Built-in data integrity checking

## Installation

```bash
# Install the Supabase Python client
pip install supabase

# Set environment variables (optional)
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-service-key"
```

## Usage

### Export a Table

```bash
# Basic export
python supabase_migrator.py export users --output ./exports/users.json

# With filter and limit
python supabase_migrator.py export posts \
  --output ./exports/recent_posts.json \
  --where "created_at > '2024-01-01'" \
  --limit 1000
```

### Import Data

```bash
# Insert mode (fails on duplicates)
python supabase_migrator.py import ./data/users.json \
  --table users \
  --mode insert

# Upsert mode (update existing, insert new)
python supabase_migrator.py import ./data/users.json \
  --table users \
  --mode upsert

# Replace mode (delete all, then insert)
python supabase_migrator.py import ./data/users.json \
  --table users \
  --mode replace
```

### Create Backup

```bash
# Backup specific tables
python supabase_migrator.py backup \
  --tables users,posts,comments \
  --output ./backups

# The backup creates:
# ./backups/backup_20240115_143022/
#   ├── users.json
#   ├── posts.json
#   ├── comments.json
#   └── manifest.json
```

### Restore from Backup

```bash
# Restore all tables
python supabase_migrator.py restore ./backups/backup_20240115_143022

# Restore specific tables
python supabase_migrator.py restore ./backups/backup_20240115_143022 \
  --tables users,posts \
  --mode upsert
```

### Migrate Between Tables

```bash
# Migrate with filter
python supabase_migrator.py migrate old_users new_users \
  --where "created_at > '2023-01-01'"
```

## Python API

```python
from supabase_migrator import SupabaseMigrator, MigrationConfig

# Initialize
config = MigrationConfig(
    supabase_url="https://your-project.supabase.co",
    supabase_key="your-service-key",
    batch_size=500,
    dry_run=False
)

migrator = SupabaseMigrator(config)

# Export
result = migrator.export_table(
    table_name="users",
    output_path="./exports/users.json"
)

# Import with transformation
def transform_user(user):
    user['imported_at'] = datetime.now().isoformat()
    return user

result = migrator.import_table(
    input_path="./data/users.json",
    table_name="users",
    mode="upsert"
)

# Migrate with custom transformation
migrator.migrate_table(
    source_table="legacy_users",
    target_table="users",
    transform=transform_user
)

# Backup
backup_path = migrator.backup_database(
    tables=["users", "posts", "comments"],
    output_dir="./backups"
)

# Restore
results = migrator.restore_backup(
    backup_dir="./backups/backup_20240115_143022",
    mode="upsert"
)
```

## Data Validation

All imports and exports include MD5 checksums for data integrity:

```python
from supabase_migrator import DataValidator

validator = DataValidator()

# Compare schemas
schema_diffs = validator.compare_schemas(source_schema, target_schema)

# Validate row counts
is_valid = validator.validate_row_count(
    source_count=1000,
    target_count=998,
    tolerance=0.05  # Allow 5% difference
)

# Calculate checksum
checksum = validator.calculate_checksum(data_rows)
```

## Options

| Flag | Description |
|------|-------------|
| `--url` | Supabase URL (or use SUPABASE_URL env var) |
| `--key` | Supabase service key (or use SUPABASE_KEY env var) |
| `--batch-size` | Number of rows per batch (default: 1000) |
| `--dry-run` | Show what would be done without changes |
| `--no-validate` | Skip data validation |
| `--skip-errors` | Continue on error and log skipped rows |

## Modes

- **insert** - Insert new rows only (fails on duplicates)
- **upsert** - Insert or update existing rows (default for restore)
- **replace** - Delete all existing rows, then insert

## Important Notes

- Always use a **service role key** for migrations - anon keys don't have sufficient permissions
- Backups include a `manifest.json` with checksums for verification
- Export files include metadata: timestamp, row count, checksum
- Large tables are processed in batches to avoid timeouts
- Use `--dry-run` to preview changes before applying
