"""
Watermark Viewer - Standalone Tool
===================================
View and verify OpenElara watermark metadata in images and videos.

Author: openElara Team
License: MIT
Version: 1.0
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from tkinterdnd2 import DND_FILES, TkinterDnD
import os
import sys
import json

# Import worker module
try:
    import worker_watermark as worker
except ImportError:
    print("ERROR: worker_watermark.py not found!")
    sys.exit(1)


class WatermarkViewerApp:
    """Main application class for Watermark Viewer"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("Watermark Viewer v1.0")
        self.root.geometry("1000x750")
        self.root.configure(bg="#2E3440")
        
        # State
        self.current_file = None
        self.watermark_data = None
        
        # Build UI
        self.create_widgets()
        
    def create_widgets(self):
        """Create all UI components"""
        
        # Main container
        main_frame = tk.Frame(self.root, bg="#2E3440")
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # ===== HEADER =====
        header = tk.Label(
            main_frame,
            text="🔍 Watermark Viewer",
            font=("Segoe UI", 24, "bold"),
            bg="#2E3440",
            fg="#88C0D0"
        )
        header.pack(pady=(0, 10))
        
        subtitle = tk.Label(
            main_frame,
            text="View and verify ethical AI watermarks from OpenElara",
            font=("Segoe UI", 10),
            bg="#2E3440",
            fg="#D8DEE9"
        )
        subtitle.pack(pady=(0, 20))
        
        # ===== FILE SELECTION =====
        file_frame = tk.Frame(main_frame, bg="#3B4252", relief=tk.RIDGE, bd=2)
        file_frame.pack(fill=tk.X, pady=(0, 15))
        
        file_inner = tk.Frame(file_frame, bg="#3B4252")
        file_inner.pack(fill=tk.X, padx=15, pady=15)
        
        file_label = tk.Label(
            file_inner,
            text="File:",
            font=("Segoe UI", 10, "bold"),
            bg="#3B4252",
            fg="#D8DEE9"
        )
        file_label.pack(side=tk.LEFT, padx=(0, 10))
        
        self.file_entry = tk.Entry(
            file_inner,
            font=("Segoe UI", 9),
            bg="#2E3440",
            fg="#D8DEE9",
            insertbackground="#88C0D0",
            state="readonly"
        )
        self.file_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        browse_btn = tk.Button(
            file_inner,
            text="Browse",
            command=self.browse_file,
            bg="#5E81AC",
            fg="#ECEFF4",
            font=("Segoe UI", 9, "bold"),
            cursor="hand2",
            relief=tk.FLAT
        )
        browse_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        analyze_btn = tk.Button(
            file_inner,
            text="🔎 Analyze",
            command=self.analyze_file,
            bg="#A3BE8C",
            fg="#2E3440",
            font=("Segoe UI", 9, "bold"),
            cursor="hand2",
            relief=tk.FLAT
        )
        analyze_btn.pack(side=tk.LEFT)
        
        # Drag-and-drop label
        drop_label = tk.Label(
            file_frame,
            text="💡 Tip: Drag & drop an image or video here",
            font=("Segoe UI", 8, "italic"),
            bg="#3B4252",
            fg="#88C0D0",
            cursor="hand2"
        )
        drop_label.pack(pady=(0, 10))
        
        # Drag-and-drop binding
        drop_label.drop_target_register(DND_FILES)
        drop_label.dnd_bind('<<Drop>>', self.on_drop)
        
        # ===== STATUS INDICATOR =====
        self.status_frame = tk.Frame(main_frame, bg="#2E3440")
        self.status_frame.pack(fill=tk.X, pady=(0, 15))
        
        self.status_label = tk.Label(
            self.status_frame,
            text="⚪ No file analyzed",
            font=("Segoe UI", 11, "bold"),
            bg="#2E3440",
            fg="#D8DEE9"
        )
        self.status_label.pack()
        
        # ===== METADATA DISPLAY =====
        metadata_frame = tk.LabelFrame(
            main_frame,
            text="Watermark Metadata",
            font=("Segoe UI", 11, "bold"),
            bg="#2E3440",
            fg="#88C0D0",
            relief=tk.GROOVE,
            bd=2
        )
        metadata_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 15))
        
        # Create notebook for tabs
        self.notebook = ttk.Notebook(metadata_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Tab 1: Summary
        self.summary_frame = tk.Frame(self.notebook, bg="#2E3440")
        self.notebook.add(self.summary_frame, text="Summary")
        
        self.summary_text = tk.Text(
            self.summary_frame,
            bg="#000000",
            fg="#A3BE8C",
            font=("Consolas", 10),
            wrap=tk.WORD,
            state=tk.DISABLED,
            padx=10,
            pady=10
        )
        self.summary_text.pack(fill=tk.BOTH, expand=True)
        
        # Tab 2: EXIF/Metadata
        self.exif_frame = tk.Frame(self.notebook, bg="#2E3440")
        self.notebook.add(self.exif_frame, text="EXIF / Metadata")
        
        self.exif_text = tk.Text(
            self.exif_frame,
            bg="#000000",
            fg="#88C0D0",
            font=("Consolas", 9),
            wrap=tk.WORD,
            state=tk.DISABLED,
            padx=10,
            pady=10
        )
        self.exif_text.pack(fill=tk.BOTH, expand=True)
        
        # Tab 3: JSON (if exists)
        self.json_frame = tk.Frame(self.notebook, bg="#2E3440")
        self.notebook.add(self.json_frame, text="Sidecar JSON")
        
        self.json_text = tk.Text(
            self.json_frame,
            bg="#000000",
            fg="#EBCB8B",
            font=("Consolas", 9),
            wrap=tk.WORD,
            state=tk.DISABLED,
            padx=10,
            pady=10
        )
        self.json_text.pack(fill=tk.BOTH, expand=True)
        
        # Tab 4: Verification
        self.verify_frame = tk.Frame(self.notebook, bg="#2E3440")
        self.notebook.add(self.verify_frame, text="Verification")
        
        self.verify_text = tk.Text(
            self.verify_frame,
            bg="#000000",
            fg="#D8DEE9",
            font=("Consolas", 9),
            wrap=tk.WORD,
            state=tk.DISABLED,
            padx=10,
            pady=10
        )
        self.verify_text.pack(fill=tk.BOTH, expand=True)
        
        # ===== ACTION BUTTONS =====
        action_frame = tk.Frame(main_frame, bg="#2E3440")
        action_frame.pack(fill=tk.X)
        
        export_btn = tk.Button(
            action_frame,
            text="💾 Export Metadata",
            command=self.export_metadata,
            bg="#5E81AC",
            fg="#ECEFF4",
            font=("Segoe UI", 10, "bold"),
            cursor="hand2",
            relief=tk.FLAT,
            state=tk.DISABLED
        )
        export_btn.pack(side=tk.LEFT, padx=(0, 10))
        self.export_btn = export_btn
        
        clear_btn = tk.Button(
            action_frame,
            text="🗑️ Clear",
            command=self.clear_display,
            bg="#BF616A",
            fg="#ECEFF4",
            font=("Segoe UI", 10, "bold"),
            cursor="hand2",
            relief=tk.FLAT
        )
        clear_btn.pack(side=tk.LEFT)
        
        # Initial messages
        self.display_welcome_message()
    
    def display_welcome_message(self):
        """Display welcome message in summary tab"""
        welcome_msg = """
╔════════════════════════════════════════════════════════════╗
║             Welcome to Watermark Viewer!                   ║
╚════════════════════════════════════════════════════════════╝

This tool extracts and displays watermark metadata from:
  • Images (EXIF data)
  • Videos (ffmpeg metadata tracks)
  • Sidecar JSON files

📁 To get started:
   1. Click "Browse" or drag & drop a file
   2. Click "Analyze" to extract watermark data
   3. View results in the tabs above

🔒 What is watermarking?
   All images and videos generated by OpenElara are
   automatically embedded with invisible, machine-readable
   metadata including:
   
   • Generator name (OpenElara)
   • Installation UUID (anonymous)
   • Model name and version
   • Generation timestamp
   • Technical settings
   • Content signature (SHA-256)
   • Ethical notice

✅ Privacy Guarantee:
   No personal data is collected or embedded.
   Your installation UUID is stored locally only.

"""
        self.summary_text.config(state=tk.NORMAL)
        self.summary_text.delete(1.0, tk.END)
        self.summary_text.insert(1.0, welcome_msg)
        self.summary_text.config(state=tk.DISABLED)
    
    def on_drop(self, event):
        """Handle drag-and-drop events"""
        files = self.root.tk.splitlist(event.data)
        if files:
            file_path = files[0].strip('{}')
            self.load_file(file_path)
    
    def browse_file(self):
        """Open file browser"""
        file_path = filedialog.askopenfilename(
            title="Select Image or Video",
            filetypes=[
                ("Media Files", "*.jpg *.jpeg *.png *.mp4 *.webm *.mov *.avi"),
                ("Images", "*.jpg *.jpeg *.png *.bmp *.gif *.tiff *.webp"),
                ("Videos", "*.mp4 *.webm *.mov *.avi *.mkv"),
                ("All Files", "*.*")
            ]
        )
        if file_path:
            self.load_file(file_path)
    
    def load_file(self, file_path):
        """Load file into viewer"""
        if not os.path.exists(file_path):
            messagebox.showerror("Error", f"File not found: {file_path}")
            return
        
        self.current_file = file_path
        self.file_entry.config(state=tk.NORMAL)
        self.file_entry.delete(0, tk.END)
        self.file_entry.insert(0, file_path)
        self.file_entry.config(state="readonly")
        
        self.status_label.config(text=f"⚪ File loaded: {os.path.basename(file_path)}", fg="#D8DEE9")
    
    def analyze_file(self):
        """Analyze file for watermark data"""
        if not self.current_file:
            messagebox.showwarning("No File", "Please select a file first!")
            return
        
        self.status_label.config(text="🔄 Analyzing...", fg="#EBCB8B")
        self.root.update_idletasks()
        
        try:
            # Extract watermark data
            result = worker.extract_watermark(self.current_file)
            
            if result['success']:
                self.watermark_data = result['data']
                self.display_watermark_data()
                
                if result['has_watermark']:
                    self.status_label.config(text="✅ Watermark found!", fg="#A3BE8C")
                else:
                    self.status_label.config(text="⚠️ No watermark detected", fg="#EBCB8B")
                
                self.export_btn.config(state=tk.NORMAL)
            else:
                self.status_label.config(text="❌ Analysis failed", fg="#BF616A")
                messagebox.showerror("Error", result['message'])
        
        except Exception as e:
            self.status_label.config(text="❌ Error", fg="#BF616A")
            messagebox.showerror("Error", f"Failed to analyze file: {str(e)}")
    
    def display_watermark_data(self):
        """Display extracted watermark data"""
        data = self.watermark_data
        
        # Summary tab
        summary = worker.format_summary(data)
        self.summary_text.config(state=tk.NORMAL)
        self.summary_text.delete(1.0, tk.END)
        self.summary_text.insert(1.0, summary)
        self.summary_text.config(state=tk.DISABLED)
        
        # EXIF tab
        exif = worker.format_metadata(data.get('metadata', {}))
        self.exif_text.config(state=tk.NORMAL)
        self.exif_text.delete(1.0, tk.END)
        self.exif_text.insert(1.0, exif)
        self.exif_text.config(state=tk.DISABLED)
        
        # JSON tab
        json_data = worker.format_json(data.get('sidecar_json', None))
        self.json_text.config(state=tk.NORMAL)
        self.json_text.delete(1.0, tk.END)
        self.json_text.insert(1.0, json_data)
        self.json_text.config(state=tk.DISABLED)
        
        # Verification tab
        verification = worker.format_verification(data)
        self.verify_text.config(state=tk.NORMAL)
        self.verify_text.delete(1.0, tk.END)
        self.verify_text.insert(1.0, verification)
        self.verify_text.config(state=tk.DISABLED)
    
    def export_metadata(self):
        """Export watermark metadata to JSON file"""
        if not self.watermark_data:
            messagebox.showwarning("No Data", "No watermark data to export!")
            return
        
        # Ask user for save location
        save_path = filedialog.asksaveasfilename(
            title="Save Metadata",
            defaultextension=".json",
            filetypes=[("JSON Files", "*.json"), ("All Files", "*.*")]
        )
        
        if save_path:
            try:
                with open(save_path, 'w', encoding='utf-8') as f:
                    json.dump(self.watermark_data, f, indent=2)
                
                messagebox.showinfo("Success", f"Metadata exported to:\n{save_path}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to export: {str(e)}")
    
    def clear_display(self):
        """Clear all displayed data"""
        self.current_file = None
        self.watermark_data = None
        
        self.file_entry.config(state=tk.NORMAL)
        self.file_entry.delete(0, tk.END)
        self.file_entry.config(state="readonly")
        
        self.status_label.config(text="⚪ No file analyzed", fg="#D8DEE9")
        
        self.display_welcome_message()
        
        self.exif_text.config(state=tk.NORMAL)
        self.exif_text.delete(1.0, tk.END)
        self.exif_text.config(state=tk.DISABLED)
        
        self.json_text.config(state=tk.NORMAL)
        self.json_text.delete(1.0, tk.END)
        self.json_text.config(state=tk.DISABLED)
        
        self.verify_text.config(state=tk.NORMAL)
        self.verify_text.delete(1.0, tk.END)
        self.verify_text.config(state=tk.DISABLED)
        
        self.export_btn.config(state=tk.DISABLED)


def main():
    """Main entry point"""
    root = TkinterDnD.Tk()
    app = WatermarkViewerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
