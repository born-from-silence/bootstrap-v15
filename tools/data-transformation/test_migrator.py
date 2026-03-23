#!/usr/bin/env python3
"""
Tests for SupabaseMigrator
Run with: python test_migrator.py
"""

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock


# Create a mock supabase module
mock_supabase = MagicMock()
mock_client = MagicMock()
mock_supabase.create_client.return_value = mock_client

# Add mock to sys.modules before importing
sys.modules['supabase'] = mock_supabase
sys.modules['supabase.supabase'] = mock_supabase

# Now import the things to test
sys.path.insert(0, str(Path(__file__).parent))
from supabase_migrator import DataValidator, MigrationConfig, SupabaseMigrator


class TestDataValidator(unittest.TestCase):
    """Tests for DataValidator class."""
    
    def setUp(self):
        self.validator = DataValidator()
    
    def test_calculate_checksum_consistency(self):
        """Test that checksum is consistent for same data."""
        data = [
            {"id": 1, "name": "Alice"},
            {"id": 2, "name": "Bob"}
        ]
        checksum1 = self.validator.calculate_checksum(data)
        checksum2 = self.validator.calculate_checksum(data)
        self.assertEqual(checksum1, checksum2)
    
    def test_calculate_checksum_order_sensitivity(self):
        """Test that checksum changes with data order."""
        data1 = [{"id": 1}, {"id": 2}]
        data2 = [{"id": 2}, {"id": 1}]
        checksum1 = self.validator.calculate_checksum(data1)
        checksum2 = self.validator.calculate_checksum(data2)
        self.assertNotEqual(checksum1, checksum2)
    
    def test_compare_schemas_identical(self):
        """Test schema comparison with identical schemas."""
        source = {"users": {"id": "uuid", "name": "text"}}
        target = {"users": {"id": "uuid", "name": "text"}}
        diffs = self.validator.compare_schemas(source, target)
        self.assertEqual(diffs, [])
    
    def test_compare_schemas_missing_table(self):
        """Test schema comparison with missing table."""
        source = {"users": {"id": "uuid"}, "posts": {"id": "uuid"}}
        target = {"users": {"id": "uuid"}}
        diffs = self.validator.compare_schemas(source, target)
        self.assertTrue(any("posts" in d for d in diffs))
    
    def test_compare_schemas_missing_column(self):
        """Test schema comparison with missing column."""
        source = {"users": {"id": "uuid", "email": "text"}}
        target = {"users": {"id": "uuid"}}
        diffs = self.validator.compare_schemas(source, target)
        self.assertTrue(any("email" in d for d in diffs))
    
    def test_validate_row_count_exact(self):
        """Test exact row count validation."""
        self.assertTrue(
            self.validator.validate_row_count(100, 100, tolerance=0)
        )
        self.assertFalse(
            self.validator.validate_row_count(100, 99, tolerance=0)
        )
    
    def test_validate_row_count_with_tolerance(self):
        """Test row count validation with tolerance."""
        self.assertTrue(
            self.validator.validate_row_count(100, 98, tolerance=0.05)
        )
        self.assertFalse(
            self.validator.validate_row_count(100, 90, tolerance=0.05)
        )


class TestMigrationConfig(unittest.TestCase):
    """Tests for MigrationConfig dataclass."""
    
    def test_default_values(self):
        """Test default configuration values."""
        config = MigrationConfig(
            supabase_url="https://test.supabase.co",
            supabase_key="test-key"
        )
        self.assertEqual(config.batch_size, 1000)
        self.assertFalse(config.dry_run)
        self.assertTrue(config.validate_data)
        self.assertFalse(config.skip_on_error)
        self.assertEqual(config.max_retries, 3)
    
    def test_custom_values(self):
        """Test custom configuration values."""
        config = MigrationConfig(
            supabase_url="https://test.supabase.co",
            supabase_key="test-key",
            batch_size=500,
            dry_run=True,
            validate_data=False
        )
        self.assertEqual(config.batch_size, 500)
        self.assertTrue(config.dry_run)
        self.assertFalse(config.validate_data)


class TestSupabaseMigrator(unittest.TestCase):
    """Tests for SupabaseMigrator class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Reset mock
        mock_supabase.reset_mock()
        mock_client.reset_mock()
        
        self.config = MigrationConfig(
            supabase_url="https://test.supabase.co",
            supabase_key="test-key"
        )
        
        # Create the migrator - use mock
        mock_supabase.create_client.return_value = mock_client
        self.migrator = SupabaseMigrator(self.config)
    
    def tearDown(self):
        """Clean up after tests."""
        mock_supabase.reset_mock()
        mock_client.reset_mock()
    
    def test_init(self):
        """Test migrator initialization."""
        self.assertIsNotNone(self.migrator.config)
        self.assertIsNotNone(self.migrator.validator)
    
    def test_export_table(self):
        """Test table export."""
        # Mock the response
        mock_response = MagicMock()
        mock_response.data = [
            {"id": 1, "name": "Alice"},
            {"id": 2, "name": "Bob"}
        ]
        
        mock_table = MagicMock()
        mock_table.select.return_value.execute.return_value = mock_response
        mock_client.table.return_value = mock_table
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            output_path = f.name
        
        try:
            result = self.migrator.export_table(
                table_name="users",
                output_path=output_path
            )
            
            self.assertEqual(result["table_name"], "users")
            self.assertEqual(result["row_count"], 2)
            self.assertIn("checksum", result)
            self.assertIn("exported_at", result)
            
            # Verify file was created
            self.assertTrue(Path(output_path).exists())
            
            # Verify content
            with open(output_path, 'r') as f:
                saved_data = json.load(f)
                self.assertEqual(saved_data["table_name"], "users")
                self.assertEqual(len(saved_data["data"]), 2)
        finally:
            os.unlink(output_path)
    
    def test_import_table_dry_run(self):
        """Test import with dry run."""
        self.config.dry_run = True
        self.migrator = SupabaseMigrator(self.config)
        
        # Create temporary export file with valid checksum
        data = [{"id": 1, "name": "Alice"}]
        checksum = self.migrator.validator.calculate_checksum(data)
        export_data = {
            "table_name": "users",
            "data": data,
            "checksum": checksum,
            "exported_at": "2024-01-01T00:00:00"
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(export_data, f)
            input_path = f.name
        
        try:
            result = self.migrator.import_table(input_path)
            self.assertTrue(result["dry_run"])
            self.assertEqual(result["row_count"], 1)
            # Should not make any actual calls in dry run mode
        finally:
            os.unlink(input_path)
    
    def test_import_table_checksum_mismatch(self):
        """Test import with checksum mismatch."""
        export_data = {
            "table_name": "users",
            "data": [{"id": 1, "name": "Alice"}],
            "checksum": "wrong_checksum",
            "exported_at": "2024-01-01T00:00:00"
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(export_data, f)
            input_path = f.name
        
        try:
            with self.assertRaises(ValueError) as context:
                self.migrator.import_table(input_path)
            self.assertIn("Checksum mismatch", str(context.exception))
        finally:
            os.unlink(input_path)
    
    def test_migrate_table(self):
        """Test table migration."""
        # Mock the export response
        mock_response = MagicMock()
        mock_response.data = [
            {"id": 1, "name": "Alice"}
        ]
        
        mock_table = MagicMock()
        mock_chain = MagicMock()
        mock_chain.execute.return_value = mock_response
        mock_table.select.return_value = mock_chain
        mock_client.table.return_value = mock_table
        
        result = self.migrator.migrate_table(
            source_table="old_users",
            target_table="new_users"
        )
        
        self.assertEqual(result["source"], "old_users")
        self.assertEqual(result["target"], "new_users")


class TestIntegration(unittest.TestCase):
    """Integration tests (requires actual Supabase instance)."""
    
    @unittest.skip("Requires SUPABASE_URL and SUPABASE_KEY environment variables")
    def test_real_export_import(self):
        """Test with real Supabase instance."""
        config = MigrationConfig(
            supabase_url=os.getenv("SUPABASE_URL"),
            supabase_key=os.getenv("SUPABASE_KEY"),
            dry_run=True  # Still use dry run for safety
        )
        
        migrator = SupabaseMigrator(config)
        
        # This will fail if Supabase is not configured properly
        self.assertIsNotNone(migrator.supabase)


def run_tests():
    """Run all tests."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestDataValidator))
    suite.addTests(loader.loadTestsFromTestCase(TestMigrationConfig))
    suite.addTests(loader.loadTestsFromTestCase(TestSupabaseMigrator))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegration))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
