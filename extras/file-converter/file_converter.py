#!/usr/bin/env python3
"""
File Converter - Standalone TKinter Tool
Converts PDF, DOCX, images, and other formats to Markdown

Originally from openElara, now standalone!
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from tkinterdnd2 import DND_FILES, TkinterDnD
import os
import sys
from pathlib import Path
from threading import Thread
import queue

# Add shared utilities to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '_shared'))

# Import worker
from worker_converter import FileConverter, ConversionOptions


class FileConverterApp:
    """Main TKinter application"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("File Converter to Markdown")
        self.root.geometry("600x700")
        self.root.resizable(True, True)
        
        # State
        self.files_to_convert = []
        self.output_folder = os.path.join(os.path.expanduser("~"), "Converted")
        self.converter = FileConverter()
        self.conversion_queue = queue.Queue()
        self.is_converting = False
        
        # Build UI
        self.build_ui()
        
        # Check dependencies on startup
        self.root.after(100, self.check_dependencies)
    
    def build_ui(self):
        """Build the TKinter interface"""
        
        # Header
        header = tk.Frame(self.root, bg="#2b2b2b", height=60)
        header.pack(fill=tk.X, padx=0, pady=0)
        header.pack_propagate(False)
        
        title = tk.Label(
            header,
            text="📄 File Converter to Markdown",
            font=("Segoe UI", 16, "bold"),
            fg="white",
            bg="#2b2b2b"
        )
        title.pack(pady=15)
        
        # Main container
        main = tk.Frame(self.root, bg="#f0f0f0")
        main.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # === DRAG & DROP AREA ===
        drop_frame = tk.LabelFrame(
            main,
            text="Drop Files or Folders Here",
            font=("Segoe UI", 10, "bold"),
            bg="white",
            relief=tk.RIDGE,
            bd=2
        )
        drop_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        self.drop_area = tk.Listbox(
            drop_frame,
            font=("Courier New", 9),
            bg="white",
            fg="black",
            selectmode=tk.EXTENDED,
            height=10
        )
        self.drop_area.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Enable drag and drop
        self.drop_area.drop_target_register(DND_FILES)
        self.drop_area.dnd_bind('<<Drop>>', self.handle_drop)
        
        # File selection buttons
        btn_frame = tk.Frame(main, bg="#f0f0f0")
        btn_frame.pack(fill=tk.X, pady=(0, 10))
        
        tk.Button(
            btn_frame,
            text="Choose Files",
            command=self.choose_files,
            bg="#4CAF50",
            fg="white",
            font=("Segoe UI", 10),
            relief=tk.FLAT,
            padx=15,
            pady=5
        ).pack(side=tk.LEFT, padx=(0, 5))
        
        tk.Button(
            btn_frame,
            text="Choose Folder",
            command=self.choose_folder,
            bg="#2196F3",
            fg="white",
            font=("Segoe UI", 10),
            relief=tk.FLAT,
            padx=15,
            pady=5
        ).pack(side=tk.LEFT, padx=(0, 5))
        
        tk.Button(
            btn_frame,
            text="Clear List",
            command=self.clear_files,
            bg="#f44336",
            fg="white",
            font=("Segoe UI", 10),
            relief=tk.FLAT,
            padx=15,
            pady=5
        ).pack(side=tk.LEFT)
        
        # === OPTIONS ===
        options_frame = tk.LabelFrame(
            main,
            text="Conversion Options",
            font=("Segoe UI", 10, "bold"),
            bg="#f0f0f0"
        )
        options_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.ocr_enabled = tk.BooleanVar(value=True)
        tk.Checkbutton(
            options_frame,
            text="Enable OCR (for scanned PDFs and images)",
            variable=self.ocr_enabled,
            font=("Segoe UI", 9),
            bg="#f0f0f0"
        ).pack(anchor=tk.W, padx=10, pady=5)
        
        self.compress_images = tk.BooleanVar(value=True)
        tk.Checkbutton(
            options_frame,
            text="Compress images (faster OCR, smaller files)",
            variable=self.compress_images,
            font=("Segoe UI", 9),
            bg="#f0f0f0"
        ).pack(anchor=tk.W, padx=10, pady=5)
        
        self.extract_tables = tk.BooleanVar(value=True)
        tk.Checkbutton(
            options_frame,
            text="Extract tables from XLSX/DOCX",
            variable=self.extract_tables,
            font=("Segoe UI", 9),
            bg="#f0f0f0"
        ).pack(anchor=tk.W, padx=10, pady=5)
        
        self.add_metadata = tk.BooleanVar(value=False)
        tk.Checkbutton(
            options_frame,
            text="Add YAML frontmatter (metadata)",
            variable=self.add_metadata,
            font=("Segoe UI", 9),
            bg="#f0f0f0"
        ).pack(anchor=tk.W, padx=10, pady=5)
        
        # === OUTPUT FOLDER ===
        output_frame = tk.LabelFrame(
            main,
            text="Output Folder",
            font=("Segoe UI", 10, "bold"),
            bg="#f0f0f0"
        )
        output_frame.pack(fill=tk.X, pady=(0, 10))
        
        output_inner = tk.Frame(output_frame, bg="#f0f0f0")
        output_inner.pack(fill=tk.X, padx=10, pady=5)
        
        self.output_label = tk.Label(
            output_inner,
            text=self.output_folder,
            font=("Segoe UI", 9),
            bg="white",
            anchor=tk.W,
            relief=tk.SUNKEN,
            padx=5,
            pady=5
        )
        self.output_label.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        
        tk.Button(
            output_inner,
            text="...",
            command=self.choose_output_folder,
            font=("Segoe UI", 9),
            width=3
        ).pack(side=tk.LEFT)
        
        # === STATUS / PROGRESS ===
        status_frame = tk.LabelFrame(
            main,
            text="Status",
            font=("Segoe UI", 10, "bold"),
            bg="#f0f0f0"
        )
        status_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        self.status_text = tk.Text(
            status_frame,
            font=("Courier New", 8),
            bg="black",
            fg="#00ff00",
            height=8,
            state=tk.DISABLED
        )
        self.status_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Progress bar
        self.progress = ttk.Progressbar(
            status_frame,
            mode='determinate',
            length=100
        )
        self.progress.pack(fill=tk.X, padx=5, pady=(0, 5))
        
        # === ACTION BUTTONS ===
        action_frame = tk.Frame(main, bg="#f0f0f0")
        action_frame.pack(fill=tk.X)
        
        self.convert_btn = tk.Button(
            action_frame,
            text="Convert",
            command=self.start_conversion,
            bg="#4CAF50",
            fg="white",
            font=("Segoe UI", 12, "bold"),
            relief=tk.FLAT,
            padx=30,
            pady=10
        )
        self.convert_btn.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0, 5))
        
        tk.Button(
            action_frame,
            text="Open Output Folder",
            command=self.open_output_folder,
            bg="#2196F3",
            fg="white",
            font=("Segoe UI", 12),
            relief=tk.FLAT,
            padx=30,
            pady=10
        ).pack(side=tk.LEFT, expand=True, fill=tk.X)
        
        # Initial status
        self.log_status("Ready to convert files...")
        self.log_status(f"Output folder: {self.output_folder}")
    
    def log_status(self, message):
        """Add message to status log"""
        self.status_text.config(state=tk.NORMAL)
        self.status_text.insert(tk.END, f"{message}\n")
        self.status_text.see(tk.END)
        self.status_text.config(state=tk.DISABLED)
    
    def handle_drop(self, event):
        """Handle drag and drop files"""
        files = self.root.tk.splitlist(event.data)
        for file_path in files:
            if os.path.isdir(file_path):
                # Add all files in directory
                self.add_folder_files(file_path)
            else:
                self.add_file(file_path)
    
    def add_file(self, file_path):
        """Add a file to conversion list"""
        if file_path not in self.files_to_convert:
            self.files_to_convert.append(file_path)
            self.drop_area.insert(tk.END, os.path.basename(file_path))
            self.log_status(f"Added: {os.path.basename(file_path)}")
    
    def add_folder_files(self, folder_path):
        """Add all supported files from a folder"""
        supported_exts = {'.pdf', '.docx', '.doc', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.webp', '.txt', '.html', '.htm'}
        count = 0
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in supported_exts:
                    self.add_file(os.path.join(root, file))
                    count += 1
        self.log_status(f"Added {count} files from folder")
    
    def choose_files(self):
        """Open file chooser dialog"""
        files = filedialog.askopenfilenames(
            title="Select Files to Convert",
            filetypes=[
                ("All Supported", "*.pdf *.docx *.doc *.xlsx *.xls *.jpg *.jpeg *.png *.webp *.txt *.html *.htm"),
                ("PDF", "*.pdf"),
                ("Word", "*.docx *.doc"),
                ("Excel", "*.xlsx *.xls"),
                ("Images", "*.jpg *.jpeg *.png *.webp"),
                ("All Files", "*.*")
            ]
        )
        for file in files:
            self.add_file(file)
    
    def choose_folder(self):
        """Open folder chooser dialog"""
        folder = filedialog.askdirectory(title="Select Folder to Convert")
        if folder:
            self.add_folder_files(folder)
    
    def choose_output_folder(self):
        """Choose output folder"""
        folder = filedialog.askdirectory(
            title="Select Output Folder",
            initialdir=self.output_folder
        )
        if folder:
            self.output_folder = folder
            self.output_label.config(text=folder)
            self.log_status(f"Output folder changed: {folder}")
    
    def clear_files(self):
        """Clear the file list"""
        self.files_to_convert = []
        self.drop_area.delete(0, tk.END)
        self.log_status("File list cleared")
    
    def open_output_folder(self):
        """Open output folder in file explorer"""
        if os.path.exists(self.output_folder):
            os.startfile(self.output_folder)
        else:
            messagebox.showwarning("Folder Not Found", f"Output folder does not exist yet:\n{self.output_folder}")
    
    def check_dependencies(self):
        """Check if required dependencies are installed"""
        missing = self.converter.check_dependencies()
        if missing:
            msg = "Missing dependencies:\n\n" + "\n".join(f"• {dep}" for dep in missing)
            msg += "\n\nSome conversions may not work. See README.md for installation instructions."
            messagebox.showwarning("Missing Dependencies", msg)
            self.log_status("WARNING: Some dependencies are missing!")
            for dep in missing:
                self.log_status(f"  - {dep}")
    
    def start_conversion(self):
        """Start the conversion process"""
        if not self.files_to_convert:
            messagebox.showwarning("No Files", "Please add files to convert first!")
            return
        
        if self.is_converting:
            messagebox.showinfo("Already Converting", "Conversion is already in progress!")
            return
        
        # Create output folder
        os.makedirs(self.output_folder, exist_ok=True)
        
        # Build conversion options
        options = ConversionOptions(
            ocr_enabled=self.ocr_enabled.get(),
            compress_images=self.compress_images.get(),
            extract_tables=self.extract_tables.get(),
            add_metadata=self.add_metadata.get(),
            output_folder=self.output_folder
        )
        
        # Disable convert button
        self.is_converting = True
        self.convert_btn.config(state=tk.DISABLED, text="Converting...")
        
        # Start conversion in background thread
        Thread(target=self.run_conversion, args=(options,), daemon=True).start()
    
    def run_conversion(self, options):
        """Run conversion in background thread"""
        total = len(self.files_to_convert)
        self.progress['maximum'] = total
        self.progress['value'] = 0
        
        self.log_status(f"\n{'='*50}")
        self.log_status(f"Starting conversion of {total} files...")
        self.log_status(f"{'='*50}\n")
        
        success_count = 0
        fail_count = 0
        
        for idx, file_path in enumerate(self.files_to_convert, 1):
            filename = os.path.basename(file_path)
            self.log_status(f"[{idx}/{total}] Converting: {filename}")
            
            try:
                output_path = self.converter.convert_file(file_path, options)
                self.log_status(f"  ✓ Success → {os.path.basename(output_path)}")
                success_count += 1
            except Exception as e:
                self.log_status(f"  ✗ Failed: {str(e)}")
                fail_count += 1
            
            # Update progress
            self.progress['value'] = idx
            self.root.update_idletasks()
        
        # Done
        self.log_status(f"\n{'='*50}")
        self.log_status(f"Conversion complete!")
        self.log_status(f"  Success: {success_count}")
        self.log_status(f"  Failed:  {fail_count}")
        self.log_status(f"  Output:  {self.output_folder}")
        self.log_status(f"{'='*50}\n")
        
        # Re-enable convert button
        self.is_converting = False
        self.convert_btn.config(state=tk.NORMAL, text="Convert")
        
        messagebox.showinfo(
            "Conversion Complete",
            f"Converted {success_count} files successfully!\n{fail_count} files failed.\n\nOutput: {self.output_folder}"
        )


def main():
    """Main entry point"""
    try:
        from tkinterdnd2 import TkinterDnD
        root = TkinterDnD.Tk()
    except ImportError:
        # Fallback if tkinterdnd2 not installed
        root = tk.Tk()
        messagebox.showwarning(
            "Drag & Drop Unavailable",
            "tkinterdnd2 not installed. Drag & drop will not work.\nUse 'Choose Files/Folder' buttons instead."
        )
    
    app = FileConverterApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
