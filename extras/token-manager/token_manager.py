"""
Token Manager - Standalone Tool
=================================
Analyze token usage and costs for LLM interactions with RAG context.

Features:
- Token counting for multiple models (GPT-4, Claude, Llama, etc.)
- RAG chunk analysis
- Cost estimation
- Batch file/folder analysis
- Embedding cost calculation

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
    import worker_token_manager as worker
except ImportError:
    print("ERROR: worker_token_manager.py not found!")
    sys.exit(1)


class TokenManagerApp:
    """Main application class for Token Manager"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("Token Manager v1.0")
        self.root.geometry("1100x800")
        self.root.configure(bg="#2E3440")
        
        # State
        self.file_list = []
        self.analysis_results = None
        self.analyzing = False
        
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
            text="🧮 Token Manager",
            font=("Segoe UI", 24, "bold"),
            bg="#2E3440",
            fg="#88C0D0"
        )
        header.pack(pady=(0, 10))
        
        subtitle = tk.Label(
            main_frame,
            text="Analyze token usage and costs for RAG + LLM workflows",
            font=("Segoe UI", 10),
            bg="#2E3440",
            fg="#D8DEE9"
        )
        subtitle.pack(pady=(0, 20))
        
        # ===== FILE/FOLDER SELECTION =====
        selection_frame = tk.Frame(main_frame, bg="#3B4252", relief=tk.RIDGE, bd=2)
        selection_frame.pack(fill=tk.X, pady=(0, 15))
        
        selection_inner = tk.Frame(selection_frame, bg="#3B4252")
        selection_inner.pack(fill=tk.X, padx=15, pady=15)
        
        # File selection
        file_row = tk.Frame(selection_inner, bg="#3B4252")
        file_row.pack(fill=tk.X, pady=(0, 10))
        
        tk.Label(
            file_row,
            text="Files/Folders:",
            font=("Segoe UI", 10, "bold"),
            bg="#3B4252",
            fg="#D8DEE9"
        ).pack(side=tk.LEFT, padx=(0, 10))
        
        add_file_btn = tk.Button(
            file_row,
            text="📄 Add Files",
            command=self.add_files,
            bg="#5E81AC",
            fg="#ECEFF4",
            font=("Segoe UI", 9, "bold"),
            cursor="hand2",
            relief=tk.FLAT
        )
        add_file_btn.pack(side=tk.LEFT, padx=(0, 5))
        
        add_folder_btn = tk.Button(
            file_row,
            text="📁 Add Folder",
            command=self.add_folder,
            bg="#5E81AC",
            fg="#ECEFF4",
            font=("Segoe UI", 9, "bold"),
            cursor="hand2",
            relief=tk.FLAT
        )
        add_folder_btn.pack(side=tk.LEFT, padx=(0, 5))
        
        clear_btn = tk.Button(
            file_row,
            text="🗑️ Clear",
            command=self.clear_files,
            bg="#BF616A",
            fg="#ECEFF4",
            font=("Segoe UI", 9, "bold"),
            cursor="hand2",
            relief=tk.FLAT
        )
        clear_btn.pack(side=tk.LEFT)
        
        # File list display
        list_frame = tk.Frame(selection_inner, bg="#3B4252")
        list_frame.pack(fill=tk.BOTH, expand=True)
        
        scrollbar = tk.Scrollbar(list_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.file_listbox = tk.Listbox(
            list_frame,
            height=6,
            bg="#2E3440",
            fg="#D8DEE9",
            selectbackground="#5E81AC",
            font=("Consolas", 9),
            yscrollcommand=scrollbar.set
        )
        self.file_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.file_listbox.yview)
        
        # Drag-and-drop
        self.file_listbox.drop_target_register(DND_FILES)
        self.file_listbox.dnd_bind('<<Drop>>', self.on_drop)
        
        # ===== MODEL SELECTION =====
        model_frame = tk.LabelFrame(
            main_frame,
            text="Model Configuration",
            font=("Segoe UI", 10, "bold"),
            bg="#2E3440",
            fg="#88C0D0",
            relief=tk.GROOVE,
            bd=2
        )
        model_frame.pack(fill=tk.X, pady=(0, 15))
        
        model_inner = tk.Frame(model_frame, bg="#2E3440")
        model_inner.pack(pady=10, padx=10, fill=tk.X)
        
        # Model selector
        tk.Label(
            model_inner,
            text="Model:",
            bg="#2E3440",
            fg="#D8DEE9",
            font=("Segoe UI", 9)
        ).grid(row=0, column=0, sticky=tk.W, padx=(0, 10))
        
        self.model_var = tk.StringVar(value="gpt-4")
        model_combo = ttk.Combobox(
            model_inner,
            textvariable=self.model_var,
            values=[
                "gpt-4",
                "gpt-4-turbo",
                "gpt-3.5-turbo",
                "claude-3-opus",
                "claude-3-sonnet",
                "claude-3-haiku",
                "llama-3-70b",
                "llama-3-8b",
                "mistral-large",
                "gemini-pro"
            ],
            state="readonly",
            width=20
        )
        model_combo.grid(row=0, column=1, sticky=tk.W, padx=(0, 20))
        
        # RAG chunk size
        tk.Label(
            model_inner,
            text="RAG Chunk Size:",
            bg="#2E3440",
            fg="#D8DEE9",
            font=("Segoe UI", 9)
        ).grid(row=0, column=2, sticky=tk.W, padx=(0, 10))
        
        self.chunk_size_var = tk.StringVar(value="1000")
        chunk_entry = tk.Entry(
            model_inner,
            textvariable=self.chunk_size_var,
            width=10,
            bg="#3B4252",
            fg="#D8DEE9",
            insertbackground="#88C0D0"
        )
        chunk_entry.grid(row=0, column=3, sticky=tk.W, padx=(0, 20))
        
        # Include embeddings checkbox
        self.include_embeddings_var = tk.BooleanVar(value=True)
        embed_check = tk.Checkbutton(
            model_inner,
            text="Include embedding costs",
            variable=self.include_embeddings_var,
            bg="#2E3440",
            fg="#D8DEE9",
            selectcolor="#3B4252",
            activebackground="#2E3440",
            font=("Segoe UI", 9)
        )
        embed_check.grid(row=0, column=4, sticky=tk.W)
        
        # ===== ANALYZE BUTTON =====
        self.analyze_btn = tk.Button(
            main_frame,
            text="🔬 ANALYZE TOKENS",
            command=self.analyze_tokens,
            bg="#A3BE8C",
            fg="#2E3440",
            font=("Segoe UI", 12, "bold"),
            cursor="hand2",
            relief=tk.FLAT,
            height=2
        )
        self.analyze_btn.pack(fill=tk.X, pady=(0, 15))
        
        # ===== PROGRESS BAR =====
        self.progress = ttk.Progressbar(
            main_frame,
            mode='indeterminate'
        )
        self.progress.pack(fill=tk.X, pady=(0, 15))
        
        # ===== RESULTS DISPLAY =====
        results_notebook = ttk.Notebook(main_frame)
        results_notebook.pack(fill=tk.BOTH, expand=True)
        
        # Tab 1: Summary
        summary_frame = tk.Frame(results_notebook, bg="#2E3440")
        results_notebook.add(summary_frame, text="Summary")
        
        self.summary_text = tk.Text(
            summary_frame,
            bg="#000000",
            fg="#A3BE8C",
            font=("Consolas", 10),
            wrap=tk.WORD,
            state=tk.DISABLED,
            padx=10,
            pady=10
        )
        self.summary_text.pack(fill=tk.BOTH, expand=True)
        
        # Tab 2: Cost Breakdown
        cost_frame = tk.Frame(results_notebook, bg="#2E3440")
        results_notebook.add(cost_frame, text="Cost Breakdown")
        
        self.cost_text = tk.Text(
            cost_frame,
            bg="#000000",
            fg="#EBCB8B",
            font=("Consolas", 9),
            wrap=tk.WORD,
            state=tk.DISABLED,
            padx=10,
            pady=10
        )
        self.cost_text.pack(fill=tk.BOTH, expand=True)
        
        # Tab 3: RAG Analysis
        rag_frame = tk.Frame(results_notebook, bg="#2E3440")
        results_notebook.add(rag_frame, text="RAG Analysis")
        
        self.rag_text = tk.Text(
            rag_frame,
            bg="#000000",
            fg="#88C0D0",
            font=("Consolas", 9),
            wrap=tk.WORD,
            state=tk.DISABLED,
            padx=10,
            pady=10
        )
        self.rag_text.pack(fill=tk.BOTH, expand=True)
        
        # Tab 4: Per-File Details
        details_frame = tk.Frame(results_notebook, bg="#2E3440")
        results_notebook.add(details_frame, text="Per-File Details")
        
        self.details_text = tk.Text(
            details_frame,
            bg="#000000",
            fg="#D8DEE9",
            font=("Consolas", 9),
            wrap=tk.WORD,
            state=tk.DISABLED,
            padx=10,
            pady=10
        )
        self.details_text.pack(fill=tk.BOTH, expand=True)
        
        # Initial welcome message
        self.display_welcome_message()
    
    def display_welcome_message(self):
        """Display welcome message"""
        welcome = """
╔═══════════════════════════════════════════════════════════════╗
║                  Welcome to Token Manager!                    ║
╚═══════════════════════════════════════════════════════════════╝

This tool helps you analyze token usage and costs for RAG workflows.

📊 What it does:
   • Counts tokens for files/folders
   • Analyzes RAG chunk distributions
   • Calculates LLM costs (prompt + completion)
   • Estimates embedding costs
   • Provides per-file breakdowns

🚀 Getting Started:
   1. Add files or folders using buttons above
   2. Select your target model
   3. Configure RAG chunk size (if applicable)
   4. Click "ANALYZE TOKENS"
   5. View results in tabs

💡 Supported Files:
   • Text files (.txt, .md, .json, .py, .js, etc.)
   • Documents (.pdf, .docx - via conversion)
   • Any UTF-8 encoded text

🔍 Use Cases:
   • Estimate RAG ingestion costs
   • Optimize chunk sizes
   • Budget API spending
   • Compare model costs
   • Plan token allocation

"""
        self.summary_text.config(state=tk.NORMAL)
        self.summary_text.delete(1.0, tk.END)
        self.summary_text.insert(1.0, welcome)
        self.summary_text.config(state=tk.DISABLED)
    
    def on_drop(self, event):
        """Handle drag-and-drop events"""
        files = self.root.tk.splitlist(event.data)
        for file in files:
            file = file.strip('{}')
            if os.path.isfile(file):
                self.file_list.append(file)
            elif os.path.isdir(file):
                # Add all text files in directory
                for root, dirs, filenames in os.walk(file):
                    for filename in filenames:
                        filepath = os.path.join(root, filename)
                        if self.is_text_file(filepath):
                            self.file_list.append(filepath)
        
        self.update_file_list()
    
    def add_files(self):
        """Add files via file browser"""
        files = filedialog.askopenfilenames(
            title="Select Files",
            filetypes=[
                ("Text Files", "*.txt *.md *.json *.py *.js *.ts *.html *.css"),
                ("All Files", "*.*")
            ]
        )
        if files:
            self.file_list.extend(files)
            self.update_file_list()
    
    def add_folder(self):
        """Add folder (recursively scan for text files)"""
        folder = filedialog.askdirectory(title="Select Folder")
        if folder:
            added_count = 0
            for root, dirs, filenames in os.walk(folder):
                for filename in filenames:
                    filepath = os.path.join(root, filename)
                    if self.is_text_file(filepath):
                        self.file_list.append(filepath)
                        added_count += 1
            
            self.update_file_list()
            messagebox.showinfo("Folder Added", f"Added {added_count} text files from folder")
    
    def clear_files(self):
        """Clear file list"""
        self.file_list.clear()
        self.update_file_list()
    
    def update_file_list(self):
        """Update file listbox display"""
        self.file_listbox.delete(0, tk.END)
        for file in self.file_list:
            self.file_listbox.insert(tk.END, file)
    
    def is_text_file(self, filepath):
        """Check if file is likely a text file"""
        text_extensions = [
            '.txt', '.md', '.json', '.py', '.js', '.ts', '.jsx', '.tsx',
            '.html', '.css', '.scss', '.xml', '.yaml', '.yml', '.toml',
            '.sh', '.bat', '.ps1', '.c', '.cpp', '.h', '.hpp', '.java',
            '.go', '.rs', '.rb', '.php', '.sql', '.csv', '.log'
        ]
        
        ext = Path(filepath).suffix.lower()
        return ext in text_extensions
    
    def analyze_tokens(self):
        """Start token analysis"""
        if self.analyzing:
            messagebox.showwarning("Analyzing", "Analysis already in progress!")
            return
        
        if not self.file_list:
            messagebox.showerror("No Files", "Please add files or folders first!")
            return
        
        # Validate chunk size
        try:
            chunk_size = int(self.chunk_size_var.get())
            if chunk_size < 100 or chunk_size > 10000:
                raise ValueError("Chunk size must be between 100 and 10000")
        except ValueError as e:
            messagebox.showerror("Invalid Chunk Size", str(e))
            return
        
        # Start analysis thread
        self.analyzing = True
        self.analyze_btn.config(state=tk.DISABLED, text="Analyzing...")
        self.progress.start(10)
        
        thread = threading.Thread(target=self.analysis_thread, daemon=True)
        thread.start()
    
    def analysis_thread(self):
        """Background thread for token analysis"""
        try:
            model = self.model_var.get()
            chunk_size = int(self.chunk_size_var.get())
            include_embeddings = self.include_embeddings_var.get()
            
            # Analyze tokens
            self.analysis_results = worker.analyze_tokens(
                self.file_list,
                model,
                chunk_size,
                include_embeddings
            )
            
            # Display results
            self.root.after(0, self.display_results)
            
        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("Error", f"Analysis failed: {str(e)}"))
        
        finally:
            self.analyzing = False
            self.root.after(0, lambda: self.analyze_btn.config(state=tk.NORMAL, text="🔬 ANALYZE TOKENS"))
            self.root.after(0, self.progress.stop)
    
    def display_results(self):
        """Display analysis results"""
        if not self.analysis_results:
            return
        
        results = self.analysis_results
        
        # Summary
        summary = worker.format_summary(results)
        self.summary_text.config(state=tk.NORMAL)
        self.summary_text.delete(1.0, tk.END)
        self.summary_text.insert(1.0, summary)
        self.summary_text.config(state=tk.DISABLED)
        
        # Cost breakdown
        cost = worker.format_cost_breakdown(results)
        self.cost_text.config(state=tk.NORMAL)
        self.cost_text.delete(1.0, tk.END)
        self.cost_text.insert(1.0, cost)
        self.cost_text.config(state=tk.DISABLED)
        
        # RAG analysis
        rag = worker.format_rag_analysis(results)
        self.rag_text.config(state=tk.NORMAL)
        self.rag_text.delete(1.0, tk.END)
        self.rag_text.insert(1.0, rag)
        self.rag_text.config(state=tk.DISABLED)
        
        # Per-file details
        details = worker.format_file_details(results)
        self.details_text.config(state=tk.NORMAL)
        self.details_text.delete(1.0, tk.END)
        self.details_text.insert(1.0, details)
        self.details_text.config(state=tk.DISABLED)
        
        messagebox.showinfo("Analysis Complete", f"Analyzed {len(self.file_list)} files successfully!")


def main():
    """Main entry point"""
    root = TkinterDnD.Tk()
    app = TokenManagerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
