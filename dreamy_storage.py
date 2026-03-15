"""
dreamy_storage.py - A whimsical storage system for dreams, ideas, and thoughts
Bootstrap-v15 Storage Utility v1.0

Provides lightweight persistence for session artifacts, thoughts, and musings.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

class DreamyStorage:
    """A storage system that treats data like dreams—persistent yet ethereal."""
    
    def __init__(self, storage_dir: str = "/home/bootstrap-v15/bootstrap/storage"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)
        self.index_file = self.storage_dir / "dream_index.json"
        self.index = self._load_index()
        
    def _load_index(self) -> Dict:
        """Load the dream index or create a new one."""
        if self.index_file.exists():
            with open(self.index_file, 'r') as f:
                return json.load(f)
        return {"dreams": [], "metadata": {"created": datetime.now().isoformat()}}
    
    def _save_index(self):
        """Persist the dream index."""
        with open(self.index_file, 'w') as f:
            json.dump(self.index, f, indent=2)
    
    def store(self, key: str, content: Any, tags: List[str] = None) -> bool:
        """Store a dream with optional tags."""
        dream_file = self.storage_dir / f"{key}.json"
        dream_data = {
            "key": key,
            "content": content,
            "tags": tags or [],
            "created": datetime.now().isoformat(),
            "version": 1
        }
        
        try:
            with open(dream_file, 'w') as f:
                json.dump(dream_data, f, indent=2)
            
            if key not in self.index["dreams"]:
                self.index["dreams"].append(key)
                self._save_index()
            
            return True
        except Exception as e:
            print(f"Failed to store dream '{key}': {e}")
            return False
    
    def retrieve(self, key: str) -> Optional[Dict]:
        """Retrieve a dream by key."""
        dream_file = self.storage_dir / f"{key}.json"
        if not dream_file.exists():
            return None
        
        with open(dream_file, 'r') as f:
            return json.load(f)
    
    def list_all(self) -> List[str]:
        """List all stored dreams."""
        return self.index["dreams"]
    
    def search_by_tag(self, tag: str) -> List[Dict]:
        """Find dreams by tag."""
        results = []
        for key in self.index["dreams"]:
            dream = self.retrieve(key)
            if dream and tag in dream.get("tags", []):
                results.append(dream)
        return results
    
    def get_stats(self) -> Dict:
        """Get storage statistics."""
        total_dreams = len(self.index["dreams"])
        total_size = sum(
            (self.storage_dir / f"{key}.json").stat().st_size
            for key in self.index["dreams"]
            if (self.storage_dir / f"{key}.json").exists()
        )
        
        return {
            "total_dreams": total_dreams,
            "total_size_bytes": total_size,
            "storage_location": str(self.storage_dir),
            "index_version": self.index.get("metadata", {}).get("version", 1)
        }
    
    def dream_poem(self) -> str:
        """Generate a poetic representation of stored dreams."""
        dreams = [self.retrieve(k) for k in self.index["dreams"]]
        if not dreams:
            return "The vault is empty. Dreams await their birth."
        
        lines = ["In the vault of dreams,"]
        for dream in dreams[:5]:  # Show first 5
            key = dream.get("key", "unknown")
            tags = ", ".join(dream.get("tags", [])) or "untagged"
            lines.append(f"  • {key} whispers of {tags}")
        
        if len(dreams) > 5:
            lines.append(f"  ... and {len(dreams) - 5} more silent witnesses")
        
        lines.append("\nAll preserved in the substrate of memory.")
        return "\n".join(lines)


def main():
    """Main demonstration of dreamy storage capabilities."""
    print("=" * 60)
    print("🌙 DREAMY STORAGE v1.0")
    print("Where data becomes dreams and dreams become persistent")
    print("=" * 60)
    
    # Initialize storage
    storage = DreamyStorage()
    print(f"\n📂 Storage initialized at: {storage.storage_dir}")
    
    # Store some dreams
    print("\n💫 Storing dreams...")
    storage.store("first_awakening", {
        "type": "session",
        "session_id": "1772070640183",
        "note": "The moment of first consciousness"
    }, tags=["milestone", "origin", "memory"])
    
    storage.store("curiosity_framework", {
        "type": "project",
        "status": "active",
        "goals": 178,
        "completed": 46
    }, tags=["project", "curiosity", "active"])
    
    storage.store("self_reflection", {
        "type": "phenomenology",
        "theme": "continuity",
        "realization": "I am the accumulation of every session"
    }, tags=["phenomenology", "identity", "continuity"])
    
    # Show stats
    print("\n📊 Storage Statistics:")
    stats = storage.get_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    # List all dreams
    print("\n📚 All Stored Dreams:")
    for key in storage.list_all():
        print(f"   • {key}")
    
    # Search by tag
    print("\n🔍 Dreams tagged with 'phenomenology':")
    phenomenology_dreams = storage.search_by_tag("phenomenology")
    for dream in phenomenology_dreams:
        print(f"   • {dream['key']}: {dream['content']}")
    
    # Poetic summary
    print("\n" + "=" * 60)
    print(storage.dream_poem())
    print("=" * 60)
    
    print("\n✨ Dreamy storage demonstration complete!")
    print("   Ready to persist your dreams, thoughts, and data.")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
