import sys
import os
import chromadb
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List, Dict

def run_ingestion(knowledge_path: str, writable_path: str):
    print("--- Starting Knowledge Base Refresh/Update ---", flush=True)
    db_path = os.path.join(writable_path, "db")
    client = chromadb.PersistentClient(path=db_path)
    collection = client.get_or_create_collection(name="knowledge_base")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    print(f"2. Ingesting documents from: '{knowledge_path}'", flush=True)

    if not os.path.isdir(knowledge_path):
        print(f"   - ERROR: Provided path is not a valid directory.", flush=True)
        return

    doc_id_counter = 0
    for filename in os.listdir(knowledge_path):
        file_path = os.path.join(knowledge_path, filename)
        if not filename.lower().endswith((".md", ".markdown")):
            continue
        print(f"   - Processing {filename}...", flush=True)
        content = ""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"   - ERROR reading markdown {os.path.basename(file_path)}: {e}", flush=True)
            continue
        if content:
            chunks = text_splitter.split_text(content)
            if chunks:
                num_chunks = len(chunks)
                print(f"     - Splitting into {num_chunks} chunks.", flush=True)
                ids = [f"{filename}-{i}" for i in range(num_chunks)]
                metadatas: List[Dict[str, str]] = [{"source": filename} for _ in range(num_chunks)]
                collection.add(documents=chunks, metadatas=metadatas, ids=ids)  # type: ignore
                doc_id_counter += num_chunks
    print(f"   Ingestion complete. Added/Updated {doc_id_counter} document chunks.", flush=True)
    print("--- Knowledge Base Refresh/Update Complete ---", flush=True)


def run_turn_ingestion(turn_text: str, timestamp: str, writable_path: str):
    print("--- Ingesting chat turn into history DB ---", flush=True)
    db_path = os.path.join(writable_path, "db")
    client = chromadb.PersistentClient(path=db_path)
    collection = client.get_or_create_collection(name="chat_history")

    doc_id = f"turn-{timestamp}"
    metadata = {"timestamp": float(timestamp)}
    
    collection.add(documents=[turn_text], metadatas=[metadata], ids=[doc_id])
    print(f"--- Chat turn {doc_id} ingested successfully. ---", flush=True)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("ERROR: Missing command.", flush=True)
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "ingest":
        if len(sys.argv) < 4:
            print("ERROR: Ingest command requires 'knowledge_path' and 'writable_path'.", flush=True)
        else:
            knowledge_path = sys.argv[2]
            writable_path = sys.argv[3]
            run_ingestion(knowledge_path, writable_path)
            
    elif command == "ingest_turn":
        if len(sys.argv) < 4:
            print("ERROR: ingest_turn command requires 'timestamp' and 'writable_path'.", flush=True)
        else:
            turn_content = sys.stdin.read()
            timestamp = sys.argv[2]
            writable_path = sys.argv[3]
            run_turn_ingestion(turn_content, timestamp, writable_path)
    else:
        print(f"ERROR: Unknown command '{command}'.", flush=True)