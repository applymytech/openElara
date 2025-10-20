import os
import sys
import subprocess
import json
from typing import List, cast
from file_to_markdown_worker import convert_to_markdown

def process_single_file(file_path: str, temp_md_dir: str) -> bool:
    try:
        filename: str = os.path.basename(file_path)
        if filename.lower().endswith((".md", ".markdown")):
            output_filename: str = filename
            print(f"   - Copying existing markdown file: {filename}", flush=True)
            with open(file_path, 'r', encoding='utf-8') as f_in, \
                 open(os.path.join(temp_md_dir, output_filename), 'w', encoding='utf-8') as f_out:
                f_out.write(f_in.read())
            return True
        elif filename.lower().endswith((".docx", ".pdf", ".txt", ".csv", ".xlsx", ".py", ".js", ".html", ".css", ".cpp", ".c", ".java", ".cs", ".ts", ".json", ".xml", ".log", ".sql", ".php", ".rb", ".go", ".rs", ".yml", ".yaml", ".ini", ".cfg", ".conf", ".sh", ".bat", ".ps1", ".lua", ".pl", ".tcl", ".r", ".m", ".swift", ".kt", ".scala", ".dart", ".hs", ".ml", ".fs", ".vb", ".asm", ".s", ".tex", ".bib", ".sty")):
            print(f"   - Converting {filename} to markdown...", flush=True)
            output_filename: str = os.path.splitext(filename)[0] + ".md"
            output_path: str = os.path.join(temp_md_dir, output_filename)
            success, message = convert_to_markdown(file_path, output_path)
            if success:
                print(f"     - CONVERSION SUCCESS: {message}", flush=True)
                return True
            else:
                print(f"     - ERROR: Conversion failed for {filename}: {message}", flush=True)
                return False
        else:
            print(f"   - Skipping unsupported file type: {filename}", flush=True)
            return False
    except Exception as e:
        print(f"     - ERROR processing {os.path.basename(file_path)}: {str(e)}", flush=True)
        return False

def main(input_paths: List[str], writable_path: str) -> None:
    print(f"DEBUG: Starting Ingestion - Files: {len(input_paths)}, Writable: {writable_path}", flush=True)
    
    if not os.path.isabs(writable_path):
        writable_path = os.path.abspath(writable_path)
    if not os.path.exists(writable_path):
        print(f"ERROR: Writable path does not exist: {writable_path}", flush=True)
        sys.exit(1)
    
    temp_md_dir: str = os.path.join(writable_path, "temp_markdown")
    try:
        os.makedirs(temp_md_dir, exist_ok=True)
    except Exception as e:
        print(f"ERROR: Failed to create temp directory: {str(e)}", flush=True)
        sys.exit(1)

    file_count: int = 0
    
    for file_path in input_paths:
        if os.path.isfile(file_path):
            if process_single_file(file_path, temp_md_dir):
                file_count += 1
        else:
             print(f"WARNING: Input path is not a valid file: {file_path}", flush=True)

    if file_count == 0:
        print("--- No compatible files found to process. Aborting ingestion. ---", flush=True)
        try:
            os.rmdir(temp_md_dir)
        except OSError:
            pass
        return

    print(f"DEBUG: Processed {file_count} files for ingestion.", flush=True)
    
    try:
        print("--- Calling ingest.py with converted files... ---", flush=True)
        ingest_script_path: str = os.path.join(os.path.dirname(__file__), 'ingest.py')
        
        ingest_process = subprocess.Popen(
            [sys.executable, ingest_script_path, 'ingest', temp_md_dir, writable_path], 
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, universal_newlines=True
        )

        if ingest_process.stdout is not None:
            for line in iter(ingest_process.stdout.readline, ''):
                print(line.strip(), flush=True)
        
        ingest_process.wait()
        if ingest_process.returncode != 0:
            raise subprocess.CalledProcessError(ingest_process.returncode, ingest_process.args)
            
    except Exception as e:
        print(f"CRITICAL ERROR in ingestion_orchestrator: {str(e)}", flush=True)
        sys.exit(1)
        
    finally:
        print("--- Cleaning up temporary markdown files ---", flush=True)
        try:
            for filename in os.listdir(temp_md_dir):
                os.remove(os.path.join(temp_md_dir, filename))
            os.rmdir(temp_md_dir)
        except Exception as e:
            print(f"WARNING: Cleanup failed: {str(e)}", flush=True)

    print("--- Ingestion Process Complete ---", flush=True)

if __name__ == '__main__':
    if len(sys.argv) > 2:
        path_arg = sys.argv[1]
        writable_path_arg = sys.argv[2]
        
        try:
            input_paths = json.loads(path_arg)
            if not isinstance(input_paths, list):
                raise TypeError("Input was JSON but not a list.")
        except (json.JSONDecodeError, TypeError):
            input_paths = [path_arg]
            
        main(cast(List[str], input_paths), writable_path_arg)
    else:
        print("ERROR: Missing input path(s) and/or writable path.", flush=True)
        sys.exit(1)