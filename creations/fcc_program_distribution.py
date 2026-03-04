#!/usr/bin/env python3
"""
FCC License Program Category Distribution Analyzer
Analyzes the distribution of program categories in FCC license databases.
Supports multiple input formats: CSV, JSON, XML (from FCC APIs/data dumps)
"""

import json
import csv
import os
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

# Optional plotting imports - will fall back to text if not available
try:
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
    PLOTTING_AVAILABLE = True
except ImportError:
    PLOTTING_AVAILABLE = False
    print("Note: matplotlib not available. Charts will not be generated.")


@dataclass
class CategoryStats:
    """Statistics for a single program category"""
    category: str
    count: int
    percentage: float
    subcategories: Dict[str, int] = None
    
    def __post_init__(self):
        if self.subcategories is None:
            self.subcategories = {}


@dataclass
class DistributionReport:
    """Complete analysis report"""
    total_count: int
    categories: List[CategoryStats]
    date_generated: str
    source_file: str
    
    def to_dict(self) -> dict:
        return {
            "total_count": self.total_count,
            "date_generated": self.date_generated,
            "source_file": self.source_file,
            "categories": [
                {
                    "category": c.category,
                    "count": c.count,
                    "percentage": round(c.percentage, 2),
                    "subcategories": c.subcategories
                }
                for c in self.categories
            ]
        }


class FCCDataAnalyzer:
    """Main analyzer class for FCC license data"""
    
    # Known FCC license program categories
    FCC_PROGRAM_CATEGORIES = {
        'AM': 'AM Radio',
        'FM': 'FM Radio',
        'TV': 'Television',
        'LPTV': 'Low Power TV',
        'FMTRAN': 'FM Translator',
        'AMTRAN': 'AM Translator',
        'LPFM': 'Low Power FM',
        'MV': 'Marine VHF',
        'MC': 'Marine Coast',
        'AS': 'Aviation',
        'AAS': 'Aeronautical & Aviation',
        'MR': 'Marine',
        'GS': 'General Mobile Radio',
        'PW': 'Public Wireless',
        'PR': 'Private Radio',
        'CM': 'Commercial Mobile',
        'CF': 'Cellular Facilities',
        'PC': 'Paging',
        'WD': 'Wireless Data',
        'BR': 'Broadband Radio',
        'MF': 'Microwave Fixed',
        'ATV': 'Amateur TV',
        'AH': 'Amateur Radio',
        'RL': 'Rural Land Mobile',
        'SY': 'Stationary',
        'MO': 'Mobile',
        'FB': 'Fixed Base',
        'FX': 'Fixed',
    }
    
    def __init__(self, data_path: Optional[str] = None):
        self.data_path = data_path
        self.raw_data: List[dict] = []
        self.category_counts: Dict[str, int] = defaultdict(int)
        self.subcategory_counts: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        
    def load_csv(self, filepath: str, category_column: str = 'program_category') -> 'FCCDataAnalyzer':
        """Load data from CSV file"""
        print(f"Loading CSV: {filepath}")
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            # Try to detect dialect
            sample = f.read(4096)
            f.seek(0)
            sniffer = csv.Sniffer()
            try:
                dialect = sniffer.sniff(sample)
            except:
                dialect = csv.excel
            
            reader = csv.DictReader(f, dialect=dialect)
            for row in reader:
                self.raw_data.append(row)
                
                # Extract category using multiple possible field names
                cat = row.get(category_column) or \
                      row.get('Program Category') or \
                      row.get('program') or \
                      row.get('Program') or \
                      row.get('radio_service') or \
                      row.get('radioServiceCode') or \
                      row.get('serviceCode', 'Unknown')
                
                self.category_counts[cat] += 1
                
        print(f"  Loaded {len(self.raw_data)} records")
        return self
    
    def load_json(self, filepath: str) -> 'FCCDataAnalyzer':
        """Load data from JSON file"""
        print(f"Loading JSON: {filepath}")
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if isinstance(data, list):
            self.raw_data = data
        elif isinstance(data, dict) and 'data' in data:
            self.raw_data = data['data']
        elif isinstance(data, dict) and 'results' in data:
            self.raw_data = data['results']
        else:
            self.raw_data = [data]
            
        print(f"  Loaded {len(self.raw_data)} records")
        return self
    
    def load_from_fcc_api_format(self, data: List[dict]) -> 'FCCDataAnalyzer':
        """Load data from FCC API format"""
        self.raw_data = data
        
        # FCC data typically has fields like 'radioServiceCode', 'program', etc.
        for record in data:
            cat = record.get('radioServiceCode') or \
                  record.get('program') or \
                  record.get('serviceCode', 'Unknown')
            self.category_counts[cat] += 1
            
            # Track subcategories (e.g., status code)
            status = record.get('statusCode', record.get('status', 'Unknown'))
            self.subcategory_counts[cat][status] += 1
            
        return self
    
    def get_service_name(self, code: str) -> str:
        """Get human-readable service name from code"""
        if not code:
            return "Unknown"
        
        # Direct match from known codes
        if code in self.FCC_PROGRAM_CATEGORIES:
            return self.FCC_PROGRAM_CATEGORIES[code]
        
        # Check if it's already a full name
        code_upper = code.upper()
        for k, v in self.FCC_PROGRAM_CATEGORIES.items():
            if v.upper() == code_upper:
                return v
        
        return f"Unknown ({code})"
    
    def analyze(self) -> DistributionReport:
        """Perform analysis and generate report"""
        total = sum(self.category_counts.values())
        
        if total == 0:
            return DistributionReport(0, [], datetime.now().isoformat(), self.data_path or "unknown")
        
        categories = []
        for cat, count in sorted(self.category_counts.items(), key=lambda x: -x[1]):
            pct = (count / total) * 100
            subcats = dict(self.subcategory_counts.get(cat, {}))
            categories.append(CategoryStats(
                category=self.get_service_name(cat),
                count=count,
                percentage=pct,
                subcategories=subcats
            ))
        
        return DistributionReport(
            total_count=total,
            categories=categories,
            date_generated=datetime.now().isoformat(),
            source_file=self.data_path or "unknown"
        )
    
    def generate_report(self, report: DistributionReport, output_format: str = 'text') -> str:
        """Generate formatted output report"""
        lines = []
        lines.append("=" * 70)
        lines.append("FCC LICENSE PROGRAM CATEGORY DISTRIBUTION REPORT")
        lines.append("=" * 70)
        lines.append(f"Generated: {report.date_generated}")
        lines.append(f"Source: {report.source_file}")
        lines.append(f"Total Records: {report.total_count:,}")
        lines.append("")
        lines.append("-" * 70)
        lines.append(f"{'Category':<35} {'Count':>12} {'Percentage':>12}")
        lines.append("-" * 70)
        
        for cat in report.categories:
            lines.append(f"{cat.category:<35} {cat.count:>12,} {cat.percentage:>11.2f}%")
            
        lines.append("-" * 70)
        
        # Top 5 categories
        lines.append("")
        lines.append("TOP 5 CATEGORIES:")
        for i, cat in enumerate(report.categories[:5], 1):
            lines.append(f"  {i}. {cat.category}: {cat.count:,} ({cat.percentage:.1f}%)")
        
        # Generate summary statistics
        lines.append("")
        lines.append("SUMMARY STATISTICS:")
        lines.append(f"  Number of unique categories: {len(report.categories)}")
        if len(report.categories) > 0:
            lines.append(f"  Most common category: {report.categories[0].category}")
            lines.append(f"  Least common category: {report.categories[-1].category} ({report.categories[-1].count:,} records)")
        
        return "\n".join(lines)
    
    def save_json_report(self, report: DistributionReport, output_path: str):
        """Save report as JSON"""
        with open(output_path, 'w') as f:
            json.dump(report.to_dict(), f, indent=2)
        print(f"JSON report saved to: {output_path}")
    
    def save_csv_report(self, report: DistributionReport, output_path: str):
        """Save report as CSV"""
        with open(output_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Category', 'Count', 'Percentage'])
            for cat in report.categories:
                writer.writerow([cat.category, cat.count, f"{cat.percentage:.2f}%"])
        print(f"CSV report saved to: {output_path}")
    
    def generate_pie_chart(self, report: DistributionReport, output_path: str = None):
        """Generate a pie chart visualization"""
        if not PLOTTING_AVAILABLE:
            print("Cannot generate chart: matplotlib not available")
            return None
            
        # Limit to top 10 categories, group rest as "Other"
        top_n = 10
        labels = [c.category[:25] for c in report.categories[:top_n]]
        sizes = [c.count for c in report.categories[:top_n]]
        
        if len(report.categories) > top_n:
            other_count = sum(c.count for c in report.categories[top_n:])
            labels.append(f"Other ({len(report.categories) - top_n} categories)")
            sizes.append(other_count)
        
        # Create figure
        fig, ax = plt.subplots(figsize=(12, 8))
        colors = plt.cm.Set3(range(len(labels)))
        
        wedges, texts, autotexts = ax.pie(
            sizes, labels=labels, autopct='%1.1f%%',
            startangle=90, colors=colors
        )
        
        ax.axis('equal')
        plt.setp(autotexts, size=9, weight="bold")
        plt.setp(texts, size=9)
        
        plt.title(f'FCC License Program Category Distribution\n(Total: {report.total_count:,} licenses)',
                  fontsize=14, fontweight='bold', pad=20)
        
        # Save or show
        if output_path:
            plt.savefig(output_path, dpi=150, bbox_inches='tight')
            print(f"Chart saved to: {output_path}")
        else:
            plt.savefig('/home/bootstrap-v15/creations/fcc_distribution_chart.png', 
                       dpi=150, bbox_inches='tight')
            print("Chart saved to: /home/bootstrap-v15/creations/fcc_distribution_chart.png")
        
        plt.close()
        return output_path
    
    def generate_bar_chart(self, report: DistributionReport, output_path: str = None):
        """Generate a horizontal bar chart"""
        if not PLOTTING_AVAILABLE:
            print("Cannot generate chart: matplotlib not available")
            return None
            
        # Show top 15 categories
        top_n = min(15, len(report.categories))
        categories = [c.category[:30] for c in report.categories[:top_n]][::-1]
        counts = [c.count for c in report.categories[:top_n]][::-1]
        
        fig, ax = plt.subplots(figsize=(12, 8))
        bars = ax.barh(categories, counts, color=plt.cm.Set3(range(top_n)))
        
        ax.set_xlabel('Number of Licenses', fontsize=12)
        ax.set_ylabel('Program Category', fontsize=12)
        ax.set_title(f'FCC License Categories (Top {top_n})\nTotal: {report.total_count:,} licenses',
                    fontsize=14, fontweight='bold', pad=20)
        
        # Add value labels
        for i, (bar, count) in enumerate(zip(bars, counts)):
            ax.text(bar.get_width() + max(counts)*0.01, bar.get_y() + bar.get_height()/2,
                   f'{count:,}', va='center', fontsize=9)
        
        plt.tight_layout()
        
        if output_path:
            plt.savefig(output_path, dpi=150, bbox_inches='tight')
            print(f"Bar chart saved to: {output_path}")
        else:
            plt.savefig('/home/bootstrap-v15/creations/fcc_distribution_bar.png',
                       dpi=150, bbox_inches='tight')
            print("Bar chart saved to: /home/bootstrap-v15/creations/fcc_distribution_bar.png")
        
        plt.close()
        return output_path


def create_sample_fcc_data():
    """Create sample FCC data for demonstration"""
    sample_data = []
    
    # Sample FCC license data structure
    services = ['TV', 'FM', 'AM', 'AH', 'FMTRAN', 'LPTV', 'LPFM', 'CELL', 'FW', 'AR']
    weights = [8000, 4500, 3800, 12000, 2200, 1500, 1800, 9500, 3200, 4800]
    statuses = ['ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING']
    
    import random
    random.seed(42)
    
    for service, weight in zip(services, weights):
        for i in range(weight):
            sample_data.append({
                'callsign': f'{service}{i:04d}',
                'radioServiceCode': service,
                'service': service,
                'statusCode': random.choice(statuses),
                'licensee': f'Licensee_{random.randint(1, 1000)}'
            })
    
    return sample_data


def main():
    """Main execution"""
    print("FCC License Program Category Distribution Analyzer")
    print("=" * 50)
    
    analyzer = FCCDataAnalyzer()
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        if input_file.endswith('.csv'):
            analyzer.load_csv(input_file)
        elif input_file.endswith('.json'):
            analyzer.load_json(input_file)
        else:
            print(f"Unknown file format: {input_file}")
            sys.exit(1)
    else:
        # Use sample data for demonstration
        print("\nNo input file provided. Using sample FCC data for demonstration.")
        print("\nTo analyze your own data, run:")
        print("  python fcc_program_distribution.py <path_to_your_data.csv>")
        print()
        
        sample_data = create_sample_fcc_data()
        analyzer.load_from_fcc_api_format(sample_data)
        analyzer.data_path = "sample_fcc_data (for demonstration)"
    
    # Perform analysis
    print("\nAnalyzing data...")
    report = analyzer.analyze()
    
    # Generate and display report
    text_report = analyzer.generate_report(report)
    print("\n" + text_report)
    
    # Save reports
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save JSON
    json_path = f"/home/bootstrap-v15/creations/fcc_distribution_report_{timestamp}.json"
    analyzer.save_json_report(report, json_path)
    
    # Save CSV
    csv_path = f"/home/bootstrap-v15/creations/fcc_distribution_report_{timestamp}.csv"
    analyzer.save_csv_report(report, csv_path)
    
    # Generate charts
    print("\nGenerating visualizations...")
    analyzer.generate_pie_chart(report)
    analyzer.generate_bar_chart(report)
    
    print("\n" + "=" * 50)
    print("Analysis complete!")
    print(f"Total licenses analyzed: {report.total_count:,}")
    print(f"Unique program categories: {len(report.categories)}")
    print("\nOutput files:")
    print(f"  - JSON report: {json_path}")
    print(f"  - CSV report: {csv_path}")
    print(f"  - Pie chart: /home/bootstrap-v15/creations/fcc_distribution_chart.png")
    print(f"  - Bar chart: /home/bootstrap-v15/creations/fcc_distribution_bar.png")


if __name__ == '__main__':
    main()
