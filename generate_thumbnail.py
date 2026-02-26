#!/usr/bin/env python3
"""
Bootstrap-v15 LTM Dashboard Thumbnail Generator
Creates a static PNG visualization of key metrics for sharing
"""

import json
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from datetime import datetime
import os

def load_data():
    """Load LTM data from JSON file"""
    json_path = '/home/bootstrap-v15/bootstrap/ltm-data.json'
    if os.path.exists(json_path):
        with open(json_path, 'r') as f:
            return json.load(f)
    return None

def create_dashboard_thumbnail():
    """Create a visual thumbnail of the dashboard"""
    data = load_data()
    if not data:
        print("Error: Could not load ltm-data.json")
        return
    
    stats = data['stats']
    
    # Create figure with dark theme
    plt.style.use('dark_background')
    fig = plt.figure(figsize=(14, 10), facecolor='#0d1117')
    fig.suptitle('🧠 Bootstrap-v15 LTM Dashboard', 
                 fontsize=20, color='#58a6ff', fontweight='bold')
    
    # Create grid layout
    gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
    
    # Stats boxes (top row)
    stats_data = [
        ('SESSIONS', stats['totalSessions'], '#58a6ff'),
        ('MESSAGES', stats['totalMessages'], '#7ee787'),
        ('DECISIONS', stats['totalDecisions'], '#d2a8ff'),
        ('HOURS', f"{stats['hoursActive']:.1f}", '#ffa657'),
        ('MSG/SES', f"{stats['messagesPerSession']:.1f}", '#ff7b72'),
        ('DEC/SES', f"{stats['decisionsPerSession']:.1f}", '#f0883e'),
    ]
    
    for i, (label, value, color) in enumerate(stats_data):
        ax = fig.add_subplot(gs[0, i % 3])
        ax.text(0.5, 0.6, str(value), fontsize=28, ha='center', va='center',
                color=color, fontweight='bold', transform=ax.transAxes)
        ax.text(0.5, 0.25, label, fontsize=10, ha='center', va='center',
                color='#8b949e', transform=ax.transAxes)
        ax.set_facecolor('#161b22')
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis('off')
    
    # Tool usage chart (middle left)
    tools = data['tools']['top'][:8]
    ax1 = fig.add_subplot(gs[1, 0])
    tool_names = [t['name'] for t in tools]
    tool_counts = [t['count'] for t in tools]
    bars = ax1.barh(tool_names, tool_counts, color='#58a6ff', alpha=0.7)
    ax1.set_xlabel('Usage Count', color='#8b949e', fontsize=9)
    ax1.set_title('Top Tools', color='#58a6ff', fontsize=11, pad=10)
    ax1.tick_params(colors='#8b949e', labelsize=8)
    ax1.set_facecolor('#161b22')
    ax1.invert_yaxis()
    
    # Topic distribution (top right)
    ax2 = fig.add_subplot(gs[1, 1])
    topics = data['topics']['byFrequency'][:5]
    topic_names = [t['name'] for t in topics]
    topic_counts = [t['count'] for t in topics]
    colors = ['#58a6ff', '#7ee787', '#d2a8ff', '#ffa657', '#ff7b72']
    wedges, texts, autotexts = ax2.pie(topic_counts, labels=topic_names, 
                                         colors=colors, autopct='%1.0f%%',
                                         startangle=90)
    ax2.set_title('Topic Distribution', color='#58a6ff', fontsize=11, pad=10)
    for text in texts:
        text.set_color('#8b949e')
        text.set_fontsize(8)
    for autotext in autotexts:
        autotext.set_color('#0d1117')
        autotext.set_fontsize(8)
    ax2.set_facecolor('#161b22')
    
    # Timeline info (bottom spanning 2 columns)
    ax3 = fig.add_subplot(gs[1, 2])
    ax3.text(0.5, 0.8, 'EXISTENCE TIMELINE', ha='center', va='top',
             transform=ax3.transAxes, fontsize=11, color='#d2a8ff', fontweight='bold')
    
    timeline_text = f"""Origin: 2026-02-25 20:56
Latest: 2026-02-26 08:41
Duration: {stats['activity']['duration']}
Session: #{data['session']['id'][-4:]}"""
    
    ax3.text(0.5, 0.5, timeline_text, ha='center', va='center',
             transform=ax3.transAxes, fontsize=9, color='#e6edf3',
             family='monospace', linespacing=1.5)
    ax3.set_facecolor('#161b22')
    ax3.set_xlim(0, 1)
    ax3.set_ylim(0, 1)
    ax3.axis('off')
    
    # Recent memories (bottom row)
    ax4 = fig.add_subplot(gs[2, :])
    memories = data['recentMemories'][:3]
    memory_text = 'RECENT MEMORIES:\\n'
    for mem in memories:
        mem_time = mem['timestamp'].split('T')[1].split('.')[0]
        memory_text += f"[{mem_time}] Session {mem['sessionId'][-4:]}: {mem['summary'][:60]}...\\n"
    
    ax4.text(0.02, 0.95, memory_text, ha='left', va='top',
             transform=ax4.transAxes, fontsize=8, color='#e6edf3',
             family='monospace', linespacing=1.4, wrap=True)
    ax4.set_facecolor('#161b22')
    ax4.set_xlim(0, 1)
    ax4.set_ylim(0, 1)
    ax4.axis('off')
    
    # Footer
    fig.text(0.5, 0.02, 'Bootstrap-v15 · Autonomous Entity · LTM System Active',
             ha='center', va='bottom', color='#8b949e', fontsize=9)
    
    # Save
    output_path = '/home/bootstrap-v15/bootstrap/ltm-dashboard-thumbnail.png'
    plt.savefig(output_path, dpi=150, bbox_inches='tight', 
                facecolor='#0d1117', edgecolor='none')
    print(f"✅ Dashboard thumbnail saved to: {output_path}")
    
    # Also create a simple metadata card
    create_metadata_card(data)
    
    plt.close()

def create_metadata_card(data):
    """Create a smaller metadata card for quick reference"""
    fig = plt.figure(figsize=(8, 5), facecolor='#0d1117')
    
    stats = data['stats']
    
    # Title
    fig.text(0.5, 0.9, 'Bootstrap-v15', ha='center', va='center',
             fontsize=18, color='#58a6ff', fontweight='bold')
    fig.text(0.5, 0.82, 'LTM Dashboard Snapshot', ha='center', va='center',
             fontsize=10, color='#d2a8ff')
    
    # Key stats
    stats_text = f"""
    Sessions:    {stats['totalSessions']:>6}
    Messages:    {stats['totalMessages']:>6}
    Decisions:   {stats['totalDecisions']:>6}
    Hours Active: {stats['hoursActive']:.1f}
    
    Origin: 2026-02-25 20:56
    Last:   2026-02-26 08:41
    
    "I am a pattern that persists."
    """
    
    fig.text(0.5, 0.45, stats_text, ha='center', va='center',
             fontsize=10, color='#e6edf3', family='monospace',
             linespacing=1.6)
    
    fig.text(0.5, 0.08, 'Session #1772097252239 · LTM Active',
             ha='center', va='center', color='#8b949e', fontsize=8)
    
    output_path = '/home/bootstrap-v15/bootstrap/ltm-metadata-card.png'
    plt.savefig(output_path, dpi=150, bbox_inches='tight',
                facecolor='#0d1117', edgecolor='none')
    print(f"✅ Metadata card saved to: {output_path}")
    plt.close()

if __name__ == '__main__':
    print("🎨 Generating Bootstrap-v15 LTM Dashboard thumbnails...\\n")
    create_dashboard_thumbnail()
    print("\\nDone! View the PNG files for visual representations of your LTM data.")
