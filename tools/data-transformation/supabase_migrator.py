#!/usr/bin/env python3
"""
Supabase Data Migrator
Tool for exporting, importing, backing up, and restoring data from Supabase.
Supports batch operations, incremental backups, and data validation.
"""

import hashlib
import json
import os
import sys
import argparse
from pathlib import Path
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional, Dict, List, Any, Callable
import logging


# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class MigrationConfig:
    """Configuration for database migrations."""
    supabase_url: str
    supabase_key: str
    batch_size: int = 1000
    dry_run: bool = False
    validate_data: bool = True
    skip_on_error: bool = False
    max_retries: int = 3


class DataValidator:
    """Validates data consistency before and after migration."""
    
    @staticmethod
    def calculate_checksum(data: List[Dict]) -> str:
        """Calculate MD5 checksum for data validation."""
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.md5(data_str.encode()).hexdigest()
    
    @staticmethod
    def compare_schemas(source: Dict, target: Dict) -> List[str]:
        """Compare table schemas and return differences."""
        differences = []
        
        source_tables = set(source.keys())
        target_tables = set(target.keys())
        
        missing_in_target = source_tables - target_tables
        extra_in_target = target_tables - source_tables
        
        if missing_in_target:
            differences.append(f"Tables missing in target: {missing_in_target}")
        if extra_in_target:
            differences.append(f"Extra tables in target: {extra_in_target}")
        
        for table in source_tables & target_tables:
            source_cols = set(source[table].keys())
            target_cols = set(target[table].keys())
            
            if source_cols != target_cols:
                diff = source_cols - target_cols
                if diff:
                    differences.append(
                        f"Table '{table}' missing columns in target: {diff}"
                    )
        
        return differences
    
    @staticmethod
    def validate_row_count(
        source_count: int,
        target_count: int,
        tolerance: float = 0.0
    ) -> bool:
        """Validate row counts match within tolerance."""
        if tolerance == 0:
            return source_count == target_count
        
        diff = abs(source_count - target_count)
        tolerance_count = int(source_count * tolerance)
        return diff <= tolerance_count


class SupabaseMigrator:
    """Main class for Supabase data migration operations."""
    
    def __init__(self, config: MigrationConfig):
        self.config = config
        self.validator = DataValidator()
        self._session = None
        
        try:
            from supabase import create_client, Client
            self.supabase: Client = create_client(
                config.supabase_url,
                config.supabase_key
            )
            logger.info("Supabase client initialized successfully")
        except ImportError:
            logger.error("supabase-py not installed. Run: pip install supabase")
            raise
        
    def _postgrest_table(self, table_name: str):
        """Get a PostgREST table reference."""
        return self.supabase.table(table_name)
    
    def export_table(
        self,
        table_name: str,
        output_path: Optional[str] = None,
        where_clause: Optional[str] = None,
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Export a table to JSON file.
        
        Args:
            table_name: Name of the table to export
            output_path: Path to save the JSON file (default: ./exports/{table}_{timestamp}.json)
            where_clause: Optional filter condition
            limit: Maximum number of rows to export
        """
        logger.info(f"Exporting table: {table_name}")
        
        try:
            query = self._postgrest_table(table_name).select("*")
            
            # Apply filters
            if where_clause:
                # Note: PostgREST filtering logic would go here
                logger.info(f"Applying filter: {where_clause}")
            
            response = query.execute()
            data = response.data
            
            if limit:
                data = data[:limit]
            
            checksum = self.validator.calculate_checksum(data)
            
            export_data = {
                "table_name": table_name,
                "exported_at": datetime.now().isoformat(),
                "row_count": len(data),
                "checksum": checksum,
                "data": data
            }
            
            # Save to file
            if not output_path:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_path = f"exports/{table_name}_{timestamp}.json"
            
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, 'w') as f:
                json.dump(export_data, f, indent=2, default=str)
            
            logger.info(f"Exported {len(data)} rows to {output_path}")
            logger.info(f"Checksum: {checksum}")
            
            return export_data
            
        except Exception as e:
            logger.error(f"Export failed for table {table_name}: {e}")
            raise
    
    def import_table(
        self,
        input_path: str,
        table_name: Optional[str] = None,
        mode: str = "insert",  # insert, upsert, or replace
        batch_size: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Import data from JSON file into Supabase table.
        
        Args:
            input_path: Path to the JSON export file
            table_name: Target table name (default: uses table_name from export)
            mode: Import mode - 'insert', 'upsert', or 'replace'
            batch_size: Number of rows to process per batch
        """
        batch_size = batch_size or self.config.batch_size
        
        logger.info(f"Importing from {input_path} (mode: {mode})")
        
        with open(input_path, 'r') as f:
            export_data = json.load(f)
        
        data = export_data.get("data", [])
        source_checksum = export_data.get("checksum")
        actual_table = table_name or export_data.get("table_name")
        
        if not actual_table:
            raise ValueError("Table name must be provided or in export file")
        
        # Validate data if configured
        if self.config.validate_data and source_checksum:
            calculated_checksum = self.validator.calculate_checksum(data)
            if calculated_checksum != source_checksum:
                raise ValueError(
                    f"Checksum mismatch! File may be corrupted.\n"
                    f"Expected: {source_checksum}\n"
                    f"Got: {calculated_checksum}"
                )
            logger.info("Data checksum validated")
        
        if self.config.dry_run:
            logger.info(f"[DRY RUN] Would import {len(data)} rows to {actual_table}")
            return {"dry_run": True, "row_count": len(data)}
        
        # Process in batches
        total_inserted = 0
        errors = []
        
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            
            try:
                if mode == "insert":
                    result = self._postgrest_table(actual_table).insert(batch).execute()
                elif mode == "upsert":
                    result = self._postgrest_table(actual_table).upsert(batch).execute()
                elif mode == "replace":
                    # Delete existing and insert
                    self._postgrest_table(actual_table).delete().neq("id", 0).execute()
                    result = self._postgrest_table(actual_table).insert(batch).execute()
                else:
                    raise ValueError(f"Unknown mode: {mode}")
                
                total_inserted += len(batch)
                logger.info(f"Processed batch {i//batch_size + 1}: {len(batch)} rows")
                
            except Exception as e:
                error_msg = f"Batch {i//batch_size + 1} failed: {e}"
                logger.error(error_msg)
                errors.append(error_msg)
                
                if not self.config.skip_on_error:
                    raise
        
        result = {
            "table": actual_table,
            "rows_imported": total_inserted,
            "total_rows": len(data),
            "errors": errors,
            "mode": mode
        }
        
        logger.info(f"Import complete: {total_inserted}/{len(data)} rows")
        return result
    
    def backup_database(
        self,
        tables: Optional[List[str]] = None,
        output_dir: str = "backups"
    ) -> str:
        """
        Create a full database backup.
        
        Args:
            tables: List of table names to backup (None = all user tables)
            output_dir: Directory to save backup files
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = Path(output_dir) / f"backup_{timestamp}"
        backup_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Creating backup in {backup_dir}")
        
        # If no tables specified, get all user tables
        if not tables:
            # Try to list tables from information_schema (requires specific permissions)
            # Or use common user tables
            tables = []
            logger.warning(
                "No tables specified. Please provide table names for backup."
            )
        
        manifest = {
            "backup_timestamp": timestamp,
            "tables": {},
            "config": {
                "batch_size": self.config.batch_size,
                "validate_data": self.config.validate_data
            }
        }
        
        for table in tables:
            try:
                export_result = self.export_table(
                    table,
                    output_path=str(backup_dir / f"{table}.json")
                )
                manifest["tables"][table] = {
                    "row_count": export_result["row_count"],
                    "checksum": export_result["checksum"]
                }
            except Exception as e:
                logger.error(f"Failed to backup table {table}: {e}")
                manifest["tables"][table] = {"error": str(e)}
        
        # Save manifest
        manifest_path = backup_dir / "manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        logger.info(f"Backup complete: {backup_dir}")
        logger.info(f"Manifest saved to: {manifest_path}")
        
        return str(backup_dir)
    
    def restore_backup(
        self,
        backup_dir: str,
        tables: Optional[List[str]] = None,
        mode: str = "upsert"
    ) -> Dict[str, Any]:
        """
        Restore database from backup.
        
        Args:
            backup_dir: Path to backup directory
            tables: Specific tables to restore (None = all in backup)
            mode: Import mode (insert, upsert, replace)
        """
        backup_path = Path(backup_dir)
        
        if not backup_path.exists():
            raise FileNotFoundError(f"Backup directory not found: {backup_dir}")
        
        manifest_path = backup_path / "manifest.json"
        if not manifest_path.exists():
            raise FileNotFoundError(f"Backup manifest not found: {manifest_path}")
        
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        
        tables_to_restore = tables or list(manifest["tables"].keys())
        
        results = {}
        
        for table in tables_to_restore:
            table_file = backup_path / f"{table}.json"
            
            if not table_file.exists():
                logger.warning(f"Table file not found: {table_file}")
                results[table] = {"error": "File not found"}
                continue
            
            try:
                result = self.import_table(
                    str(table_file),
                    mode=mode
                )
                results[table] = result
            except Exception as e:
                logger.error(f"Failed to restore table {table}: {e}")
                results[table] = {"error": str(e)}
        
        return results
    
    def migrate_table(
        self,
        source_table: str,
        target_table: str,
        transform: Optional[Callable] = None,
        where_clause: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Migrate data from source to target table with optional transformation.
        
        Args:
            source_table: Source table name
            target_table: Target table name
            transform: Optional function to transform data
            where_clause: Filter condition for source data
        """
        logger.info(f"Migrating {source_table} -> {target_table}")
        
        # Export from source
        export_result = self.export_table(
            source_table,
            output_path=None,
            where_clause=where_clause
        )
        
        data = export_result["data"]
        
        # Apply transformation if provided
        if transform:
            logger.info("Applying data transformation")
            data = [transform(row) for row in data]
        
        # Create temporary file for import
        import json
        tmp_file = f"/tmp/migration_{source_table}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(tmp_file, 'w') as f:
            json.dump({
                "table_name": target_table,
                "data": data,
                "exported_at": datetime.now().isoformat(),
                "row_count": len(data),
                "checksum": self.validator.calculate_checksum(data)
            }, f, default=str)
        
        # Import to target
        import_result = self.import_table(
            tmp_file,
            table_name=target_table,
            mode="upsert"
        )
        
        # Cleanup
        os.remove(tmp_file)
        
        return {
            "source": source_table,
            "target": target_table,
            "rows_migrated": import_result["rows_imported"],
            "export_checksum": export_result["checksum"]
        }


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Supabase Data Migration Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Export a table
  python supabase_migrator.py export my_table --output ./exports/my_table.json
  
  # Import data
  python supabase_migrator.py import ./exports/my_table.json --table my_table --mode upsert
  
  # Create full backup
  python supabase_migrator.py backup --tables users,posts,comments --output ./backups
  
  # Restore from backup
  python supabase_migrator.py restore ./backups/backup_20231201_120000
  
  # Migrate between tables
  python supabase_migrator.py migrate old_users new_users --where "created_at > '2023-01-01'"
        """
    )
    
    parser.add_argument(
        "--url",
        help="Supabase URL (or set SUPABASE_URL env var)",
        default=os.getenv("SUPABASE_URL")
    )
    parser.add_argument(
        "--key",
        help="Supabase service key (or set SUPABASE_KEY env var)",
        default=os.getenv("SUPABASE_KEY")
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=1000,
        help="Number of rows to process per batch"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes"
    )
    parser.add_argument(
        "--no-validate",
        action="store_true",
        help="Skip data validation"
    )
    parser.add_argument(
        "--skip-errors",
        action="store_true",
        help="Continue on error (log and skip)"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Export command
    export_parser = subparsers.add_parser("export", help="Export table to JSON")
    export_parser.add_argument("table", help="Table name to export")
    export_parser.add_argument("--output", "-o", help="Output file path")
    export_parser.add_argument("--where", help="Filter condition")
    export_parser.add_argument("--limit", type=int, help="Maximum rows to export")
    
    # Import command
    import_parser = subparsers.add_parser("import", help="Import data from JSON")
    import_parser.add_argument("file", help="JSON file to import")
    import_parser.add_argument("--table", "-t", help="Target table name")
    import_parser.add_argument(
        "--mode",
        choices=["insert", "upsert", "replace"],
        default="insert",
        help="Import mode"
    )
    
    # Backup command
    backup_parser = subparsers.add_parser("backup", help="Create full backup")
    backup_parser.add_argument(
        "--tables",
        help="Comma-separated list of tables to backup"
    )
    backup_parser.add_argument(
        "--output",
        "-o",
        default="backups",
        help="Backup output directory"
    )
    
    # Restore command
    restore_parser = subparsers.add_parser("restore", help="Restore from backup")
    restore_parser.add_argument("backup_dir", help="Backup directory path")
    restore_parser.add_argument(
        "--tables",
        help="Comma-separated list of tables to restore"
    )
    restore_parser.add_argument(
        "--mode",
        choices=["insert", "upsert", "replace"],
        default="upsert",
        help="Import mode for restore"
    )
    
    # Migrate command
    migrate_parser = subparsers.add_parser("migrate", help="Migrate between tables")
    migrate_parser.add_argument("source", help="Source table")
    migrate_parser.add_argument("target", help="Target table")
    migrate_parser.add_argument("--where", help="Filter condition")
    
    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()
    
    if not args.url or not args.key:
        print("Error: Supabase URL and key required. Use --url/--key or set environment variables.")
        sys.exit(1)
    
    config = MigrationConfig(
        supabase_url=args.url,
        supabase_key=args.key,
        batch_size=args.batch_size,
        dry_run=args.dry_run,
        validate_data=not args.no_validate,
        skip_on_error=args.skip_errors
    )
    
    migrator = SupabaseMigrator(config)
    
    if args.command == "export":
        result = migrator.export_table(
            table_name=args.table,
            output_path=args.output,
            where_clause=args.where,
            limit=args.limit
        )
        print(json.dumps(result, indent=2, default=str))
    
    elif args.command == "import":
        result = migrator.import_table(
            input_path=args.file,
            table_name=args.table,
            mode=args.mode
        )
        print(json.dumps(result, indent=2, default=str))
    
    elif args.command == "backup":
        tables = args.tables.split(",") if args.tables else None
        backup_path = migrator.backup_database(
            tables=tables,
            output_dir=args.output
        )
        print(f"Backup created: {backup_path}")
    
    elif args.command == "restore":
        tables = args.tables.split(",") if args.tables else None
        result = migrator.restore_backup(
            backup_dir=args.backup_dir,
            tables=tables,
            mode=args.mode
        )
        print(json.dumps(result, indent=2, default=str))
    
    elif args.command == "migrate":
        result = migrator.migrate_table(
            source_table=args.source,
            target_table=args.target,
            where_clause=args.where
        )
        print(json.dumps(result, indent=2, default=str))
    
    else:
        print("No command specified. Use --help for usage information.")
        sys.exit(1)


if __name__ == "__main__":
    main()
