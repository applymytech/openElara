"""
Image Processor - Standalone Tool
==================================
Batch image processing with multiple operations.

Author: openElara Team
License: MIT
Version: 1.0
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from tkinterdnd2 import DND_FILES, TkinterDnD
import threading
import os
from pathlib import Path
import sys

# Import worker module
try:
    import worker_image_processor as worker
except ImportError:
    print("ERROR: worker_image_processor.py not found!")
    sys.exit(1)


class ImageProcessorApp:
    """Main application class for Image Processor"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("Image Processor v1.0")
        self.root.geometry("900x700")
        self.root.configure(bg="#2E3440")
        
        # State
        self.file_list = []
        self.output_folder = ""
        self.processing = False
        
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
            text="🎨 Image Processor",
            font=("Segoe UI", 24, "bold"),
            bg="#2E3440",
            fg="#88C0D0"
        )
        header.pack(pady=(0, 10))
        
        subtitle = tk.Label(
            main_frame,
            text="Batch process images with multiple operations",
            font=("Segoe UI", 10),
            bg="#2E3440",
            fg="#D8DEE9"
        )
        subtitle.pack(pady=(0, 20))
        
        # ===== DROP ZONE =====
        drop_frame = tk.Frame(main_frame, bg="#3B4252", relief=tk.RIDGE, bd=2)
        drop_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 15))
        
        drop_label = tk.Label(
            drop_frame,
            text="📁 Drag & Drop Images Here\n\n(or click to browse)\n\nSupported: JPG, PNG, BMP, GIF, TIFF, WEBP",
            font=("Segoe UI", 12),
            bg="#3B4252",
            fg="#88C0D0",
            justify=tk.CENTER,
            cursor="hand2"
        )
        drop_label.pack(fill=tk.BOTH, expand=True, padx=20, pady=40)
        
        # Drag-and-drop binding
        drop_label.drop_target_register(DND_FILES)
        drop_label.dnd_bind('<<Drop>>', self.on_drop)
        drop_label.bind("<Button-1>", lambda e: self.browse_files())
        
        # File list display
        self.file_listbox = tk.Listbox(
            drop_frame,
            height=6,
            bg="#2E3440",
            fg="#D8DEE9",
            selectbackground="#5E81AC",
            font=("Consolas", 9)
        )
        self.file_listbox.pack(fill=tk.BOTH, padx=10, pady=(0, 10))
        
        # ===== OPERATION SELECTION =====
        op_frame = tk.LabelFrame(
            main_frame,
            text="Operation",
            font=("Segoe UI", 10, "bold"),
            bg="#2E3440",
            fg="#88C0D0",
            relief=tk.GROOVE,
            bd=2
        )
        op_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Operation buttons (single selection)
        self.operation_var = tk.StringVar(value="convert")
        
        ops = [
            ("convert", "Convert Format"),
            ("resize", "Resize"),
            ("compress", "Compress"),
            ("enhance", "Enhance"),
            ("rotate", "Rotate"),
            ("crop", "Crop")
        ]
        
        op_btn_frame = tk.Frame(op_frame, bg="#2E3440")
        op_btn_frame.pack(pady=10, padx=10)
        
        for i, (value, text) in enumerate(ops):
            rb = tk.Radiobutton(
                op_btn_frame,
                text=text,
                variable=self.operation_var,
                value=value,
                bg="#2E3440",
                fg="#D8DEE9",
                selectcolor="#3B4252",
                activebackground="#2E3440",
                activeforeground="#88C0D0",
                font=("Segoe UI", 9),
                command=self.update_settings_panel
            )
            rb.grid(row=0, column=i, padx=10)
        
        # ===== SETTINGS PANEL =====
        self.settings_frame = tk.LabelFrame(
            main_frame,
            text="Settings",
            font=("Segoe UI", 10, "bold"),
            bg="#2E3440",
            fg="#88C0D0",
            relief=tk.GROOVE,
            bd=2
        )
        self.settings_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Settings will be dynamically loaded based on operation
        self.settings_widgets = {}
        self.update_settings_panel()
        
        # ===== OUTPUT FOLDER =====
        output_frame = tk.Frame(main_frame, bg="#2E3440")
        output_frame.pack(fill=tk.X, pady=(0, 15))
        
        output_label = tk.Label(
            output_frame,
            text="Output Folder:",
            font=("Segoe UI", 10),
            bg="#2E3440",
            fg="#D8DEE9"
        )
        output_label.pack(side=tk.LEFT, padx=(0, 10))
        
        self.output_entry = tk.Entry(
            output_frame,
            font=("Segoe UI", 9),
            bg="#3B4252",
            fg="#D8DEE9",
            insertbackground="#88C0D0"
        )
        self.output_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        output_btn = tk.Button(
            output_frame,
            text="Browse",
            command=self.browse_output,
            bg="#5E81AC",
            fg="#ECEFF4",
            font=("Segoe UI", 9, "bold"),
            cursor="hand2",
            relief=tk.FLAT
        )
        output_btn.pack(side=tk.LEFT)
        
        # ===== PROCESS BUTTON =====
        self.process_btn = tk.Button(
            main_frame,
            text="🚀 PROCESS IMAGES",
            command=self.process_images,
            bg="#A3BE8C",
            fg="#2E3440",
            font=("Segoe UI", 12, "bold"),
            cursor="hand2",
            relief=tk.FLAT,
            height=2
        )
        self.process_btn.pack(fill=tk.X, pady=(0, 15))
        
        # ===== PROGRESS BAR =====
        self.progress = ttk.Progressbar(
            main_frame,
            mode='determinate',
            length=300
        )
        self.progress.pack(fill=tk.X, pady=(0, 10))
        
        # ===== STATUS LOG =====
        log_frame = tk.LabelFrame(
            main_frame,
            text="Status Log",
            font=("Segoe UI", 10, "bold"),
            bg="#2E3440",
            fg="#88C0D0",
            relief=tk.GROOVE,
            bd=2
        )
        log_frame.pack(fill=tk.BOTH, expand=True)
        
        self.log_text = tk.Text(
            log_frame,
            height=8,
            bg="#000000",
            fg="#A3BE8C",
            font=("Consolas", 9),
            wrap=tk.WORD,
            state=tk.DISABLED
        )
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Initial log message
        self.log("Image Processor initialized. Ready to process!")
        
    def update_settings_panel(self):
        """Update settings based on selected operation"""
        # Clear existing widgets
        for widget in self.settings_frame.winfo_children():
            widget.destroy()
        
        self.settings_widgets.clear()
        
        operation = self.operation_var.get()
        settings_container = tk.Frame(self.settings_frame, bg="#2E3440")
        settings_container.pack(pady=10, padx=10, fill=tk.BOTH)
        
        if operation == "convert":
            # Format selection
            tk.Label(
                settings_container,
                text="Target Format:",
                bg="#2E3440",
                fg="#D8DEE9",
                font=("Segoe UI", 9)
            ).grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
            
            format_var = tk.StringVar(value="PNG")
            format_combo = ttk.Combobox(
                settings_container,
                textvariable=format_var,
                values=["PNG", "JPG", "WEBP", "BMP", "TIFF", "GIF"],
                state="readonly",
                width=15
            )
            format_combo.grid(row=0, column=1, sticky=tk.W)
            self.settings_widgets['format'] = format_var
            
        elif operation == "resize":
            # Width and height
            tk.Label(
                settings_container,
                text="Width (px):",
                bg="#2E3440",
                fg="#D8DEE9",
                font=("Segoe UI", 9)
            ).grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
            
            width_var = tk.StringVar(value="1920")
            width_entry = tk.Entry(settings_container, textvariable=width_var, width=10)
            width_entry.grid(row=0, column=1, sticky=tk.W, padx=(0, 20))
            self.settings_widgets['width'] = width_var
            
            tk.Label(
                settings_container,
                text="Height (px):",
                bg="#2E3440",
                fg="#D8DEE9",
                font=("Segoe UI", 9)
            ).grid(row=0, column=2, sticky=tk.W, padx=(0, 10))
            
            height_var = tk.StringVar(value="1080")
            height_entry = tk.Entry(settings_container, textvariable=height_var, width=10)
            height_entry.grid(row=0, column=3, sticky=tk.W, padx=(0, 20))
            self.settings_widgets['height'] = height_var
            
            # Aspect ratio checkbox
            aspect_var = tk.BooleanVar(value=True)
            aspect_check = tk.Checkbutton(
                settings_container,
                text="Maintain aspect ratio",
                variable=aspect_var,
                bg="#2E3440",
                fg="#D8DEE9",
                selectcolor="#3B4252",
                activebackground="#2E3440",
                font=("Segoe UI", 9)
            )
            aspect_check.grid(row=1, column=0, columnspan=4, sticky=tk.W, pady=(10, 0))
            self.settings_widgets['aspect_ratio'] = aspect_var
            
        elif operation == "compress":
            # Quality slider
            tk.Label(
                settings_container,
                text="Quality:",
                bg="#2E3440",
                fg="#D8DEE9",
                font=("Segoe UI", 9)
            ).grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
            
            quality_var = tk.IntVar(value=85)
            quality_scale = tk.Scale(
                settings_container,
                from_=1,
                to=100,
                orient=tk.HORIZONTAL,
                variable=quality_var,
                bg="#2E3440",
                fg="#D8DEE9",
                troughcolor="#3B4252",
                highlightbackground="#2E3440",
                length=300
            )
            quality_scale.grid(row=0, column=1, sticky=tk.W)
            self.settings_widgets['quality'] = quality_var
            
        elif operation == "enhance":
            # Enhancement options
            tk.Label(
                settings_container,
                text="Brightness:",
                bg="#2E3440",
                fg="#D8DEE9",
                font=("Segoe UI", 9)
            ).grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
            
            brightness_var = tk.DoubleVar(value=1.0)
            brightness_scale = tk.Scale(
                settings_container,
                from_=0.5,
                to=2.0,
                resolution=0.1,
                orient=tk.HORIZONTAL,
                variable=brightness_var,
                bg="#2E3440",
                fg="#D8DEE9",
                troughcolor="#3B4252",
                length=200
            )
            brightness_scale.grid(row=0, column=1, sticky=tk.W)
            self.settings_widgets['brightness'] = brightness_var
            
            tk.Label(
                settings_container,
                text="Contrast:",
                bg="#2E3440",
                fg="#D8DEE9",
                font=("Segoe UI", 9)
            ).grid(row=1, column=0, sticky=tk.W, padx=(0, 10), pady=(10, 0))
            
            contrast_var = tk.DoubleVar(value=1.0)
            contrast_scale = tk.Scale(
                settings_container,
                from_=0.5,
                to=2.0,
                resolution=0.1,
                orient=tk.HORIZONTAL,
                variable=contrast_var,
                bg="#2E3440",
                fg="#D8DEE9",
                troughcolor="#3B4252",
                length=200
            )
            contrast_scale.grid(row=1, column=1, sticky=tk.W, pady=(10, 0))
            self.settings_widgets['contrast'] = contrast_var
            
            tk.Label(
                settings_container,
                text="Sharpness:",
                bg="#2E3440",
                fg="#D8DEE9",
                font=("Segoe UI", 9)
            ).grid(row=2, column=0, sticky=tk.W, padx=(0, 10), pady=(10, 0))
            
            sharpness_var = tk.DoubleVar(value=1.0)
            sharpness_scale = tk.Scale(
                settings_container,
                from_=0.5,
                to=2.0,
                resolution=0.1,
                orient=tk.HORIZONTAL,
                variable=sharpness_var,
                bg="#2E3440",
                fg="#D8DEE9",
                troughcolor="#3B4252",
                length=200
            )
            sharpness_scale.grid(row=2, column=1, sticky=tk.W, pady=(10, 0))
            self.settings_widgets['sharpness'] = sharpness_var
            
        elif operation == "rotate":
            # Rotation angle
            tk.Label(
                settings_container,
                text="Angle (degrees):",
                bg="#2E3440",
                fg="#D8DEE9",
                font=("Segoe UI", 9)
            ).grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
            
            angle_var = tk.StringVar(value="90")
            angle_combo = ttk.Combobox(
                settings_container,
                textvariable=angle_var,
                values=["90", "180", "270", "Custom"],
                state="readonly",
                width=15
            )
            angle_combo.grid(row=0, column=1, sticky=tk.W)
            self.settings_widgets['angle'] = angle_var
            
        elif operation == "crop":
            # Crop dimensions
            tk.Label(
                settings_container,
                text="Left:",
                bg="#2E3440",
                fg="#D8DEE9",
                font=("Segoe UI", 9)
            ).grid(row=0, column=0, sticky=tk.W, padx=(0, 5))
            
            left_var = tk.StringVar(value="0")
            tk.Entry(settings_container, textvariable=left_var, width=8).grid(row=0, column=1, sticky=tk.W, padx=(0, 15))
            self.settings_widgets['left'] = left_var
            
            tk.Label(
                settings_container,
                text="Top:",
                bg="#2E3440",
                fg="#D8DEE9",
                font=("Segoe UI", 9)
            ).grid(row=0, column=2, sticky=tk.W, padx=(0, 5))
            
            top_var = tk.StringVar(value="0")
            tk.Entry(settings_container, textvariable=top_var, width=8).grid(row=0, column=3, sticky=tk.W, padx=(0, 15))
            self.settings_widgets['top'] = top_var
            
            tk.Label(
                settings_container,
                text="Right:",
                bg="#2E3440",
                fg="#D8DEE9",
                font=("Segoe UI", 9)
            ).grid(row=1, column=0, sticky=tk.W, padx=(0, 5), pady=(10, 0))
            
            right_var = tk.StringVar(value="100")
            tk.Entry(settings_container, textvariable=right_var, width=8).grid(row=1, column=1, sticky=tk.W, padx=(0, 15), pady=(10, 0))
            self.settings_widgets['right'] = right_var
            
            tk.Label(
                settings_container,
                text="Bottom:",
                bg="#2E3440",
                fg="#D8DEE9",
                font=("Segoe UI", 9)
            ).grid(row=1, column=2, sticky=tk.W, padx=(0, 5), pady=(10, 0))
            
            bottom_var = tk.StringVar(value="100")
            tk.Entry(settings_container, textvariable=bottom_var, width=8).grid(row=1, column=3, sticky=tk.W, pady=(10, 0))
            self.settings_widgets['bottom'] = bottom_var
    
    def on_drop(self, event):
        """Handle drag-and-drop events"""
        files = self.root.tk.splitlist(event.data)
        self.add_files(files)
    
    def browse_files(self):
        """Open file browser for image selection"""
        files = filedialog.askopenfilenames(
            title="Select Images",
            filetypes=[
                ("Image Files", "*.jpg *.jpeg *.png *.bmp *.gif *.tiff *.webp"),
                ("All Files", "*.*")
            ]
        )
        if files:
            self.add_files(files)
    
    def add_files(self, files):
        """Add files to the processing list"""
        for file in files:
            file = file.strip('{}')  # Remove curly braces from drag-and-drop
            if os.path.isfile(file):
                if file not in self.file_list:
                    self.file_list.append(file)
                    self.file_listbox.insert(tk.END, os.path.basename(file))
        
        self.log(f"Added {len(files)} file(s). Total: {len(self.file_list)}")
    
    def browse_output(self):
        """Select output folder"""
        folder = filedialog.askdirectory(title="Select Output Folder")
        if folder:
            self.output_folder = folder
            self.output_entry.delete(0, tk.END)
            self.output_entry.insert(0, folder)
            self.log(f"Output folder: {folder}")
    
    def log(self, message):
        """Add message to status log"""
        self.log_text.config(state=tk.NORMAL)
        self.log_text.insert(tk.END, f"{message}\n")
        self.log_text.see(tk.END)
        self.log_text.config(state=tk.DISABLED)
    
    def process_images(self):
        """Start image processing in background thread"""
        if self.processing:
            messagebox.showwarning("Processing", "Already processing images!")
            return
        
        if not self.file_list:
            messagebox.showerror("No Files", "Please add images to process!")
            return
        
        if not self.output_folder:
            messagebox.showerror("No Output", "Please select an output folder!")
            return
        
        # Start processing thread
        self.processing = True
        self.process_btn.config(state=tk.DISABLED, text="Processing...")
        self.progress['value'] = 0
        
        thread = threading.Thread(target=self.process_thread, daemon=True)
        thread.start()
    
    def process_thread(self):
        """Background thread for image processing"""
        try:
            operation = self.operation_var.get()
            settings = {key: var.get() for key, var in self.settings_widgets.items()}
            
            total = len(self.file_list)
            success_count = 0
            
            for i, file_path in enumerate(self.file_list):
                self.log(f"Processing {i+1}/{total}: {os.path.basename(file_path)}")
                
                try:
                    # Call worker function
                    result = worker.process_image(
                        file_path,
                        self.output_folder,
                        operation,
                        settings
                    )
                    
                    if result['success']:
                        self.log(f"✓ Success: {result['message']}")
                        success_count += 1
                    else:
                        self.log(f"✗ Error: {result['message']}")
                
                except Exception as e:
                    self.log(f"✗ Error: {str(e)}")
                
                # Update progress
                progress = ((i + 1) / total) * 100
                self.progress['value'] = progress
                self.root.update_idletasks()
            
            # Complete
            self.log(f"\n{'='*50}")
            self.log(f"Processing complete! {success_count}/{total} images processed successfully.")
            self.log(f"{'='*50}\n")
            
            messagebox.showinfo(
                "Complete",
                f"Processed {success_count}/{total} images successfully!\n\nOutput: {self.output_folder}"
            )
        
        except Exception as e:
            self.log(f"FATAL ERROR: {str(e)}")
            messagebox.showerror("Error", f"Processing failed: {str(e)}")
        
        finally:
            self.processing = False
            self.process_btn.config(state=tk.NORMAL, text="🚀 PROCESS IMAGES")


def main():
    """Main entry point"""
    root = TkinterDnD.Tk()
    app = ImageProcessorApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
