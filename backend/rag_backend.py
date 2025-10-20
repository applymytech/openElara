# backend/rag_backend.py

import chromadb
import os
import sys
import json
import traceback
import re
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional, cast

def get_recent_turns(collection: Any, n_turns: int, token_limit: int, persona_filter: Optional[str] = None) -> Tuple[List[str], int, bool]:
    print(f"DEBUG: Fetching {n_turns} most recent turns from {collection.name}", file=sys.stderr)
    
    try:
        all_results: Dict[str, Any] = collection.get(include=["documents", "metadatas"])
        
        if not all_results or not all_results.get('documents'):
            print("DEBUG: No chat history found", file=sys.stderr)
            return [], 0, False
        
        docs_with_meta: List[Tuple[str, Any]] = list(zip(all_results['documents'], all_results['metadatas']))
        if persona_filter is not None:
            try:
                docs_with_meta = [pair for pair in docs_with_meta if isinstance(pair[1], dict) and str(cast(Dict[str, Any], pair[1]).get('persona', '')).lower() == str(persona_filter).lower()]
            except Exception:
                pass
        
        sorted_docs: List[Tuple[str, Any]] = sorted(docs_with_meta, key=lambda item: cast(Dict[str, Any], item[1]).get('timestamp', 0) if isinstance(item[1], dict) else 0, reverse=True)
        recent_n: List[Tuple[str, Any]] = sorted_docs[:n_turns] if len(sorted_docs) >= n_turns else sorted_docs
        
        recent_n.reverse()
        
        final_turns: List[str] = []
        total_tokens: int = 0
        was_truncated: bool = False
        
        for doc, _ in recent_n:
            if not doc:
                continue
            doc_tokens = len(doc) // 4
            
            if total_tokens + doc_tokens <= token_limit:
                final_turns.append(doc)
                total_tokens += doc_tokens
            else:
                if len(final_turns) == 0:
                    chars_available = token_limit * 4
                    truncated_doc = doc[:chars_available] + "\n[... conversation truncated due to length ...]"
                    final_turns.append(truncated_doc)
                    total_tokens = len(truncated_doc) // 4
                    was_truncated = True
                    print(f"DEBUG: Truncated most recent turn to fit {token_limit} tokens", file=sys.stderr)
                break
        
        print(f"DEBUG: Packed {len(final_turns)} recent turns. Total tokens: {total_tokens}. Truncated: {was_truncated}", file=sys.stderr)
        return final_turns, total_tokens, was_truncated
        
    except Exception as e:
        print(f"DEBUG: Error fetching recent turns: {str(e)}", file=sys.stderr)
        print(f"DEBUG: Traceback: {traceback.format_exc()}", file=sys.stderr)
        return [], 0, False

def search_knowledge(collection: Any, query_text: str, token_limit: int, n_results: int = 15, persona_filter: Optional[str] = None) -> List[str]:
    if collection.name == "knowledge_base":
        n_results = 20
    
    print(f"DEBUG: Searching collection '{collection.name}' with n_results={n_results}", file=sys.stderr)
    print(f"DEBUG: Query preview: {str(query_text)[:100]}...", file=sys.stderr)
    
    try:
        query_kwargs: Dict[str, Any] = {
            "query_texts": [query_text],
            "n_results": n_results
        }
        if collection.name == "chat_history" and persona_filter:
            query_kwargs["where"] = {"persona": str(persona_filter)}
        results: Dict[str, Any] = collection.query(**query_kwargs)
        
        num_docs: int = len(results.get('documents', [[]])[0]) if results else 0
        print(f"DEBUG: Query returned {num_docs} documents", file=sys.stderr)
        
        if collection.name == "chat_history" and results.get('metadatas') and results['metadatas'][0]:
            docs_with_meta: List[Tuple[str, Any]] = list(zip(results['documents'][0], results['metadatas'][0]))
            sorted_docs: List[Tuple[str, Any]] = sorted(docs_with_meta, key=lambda item: cast(Dict[str, Any], item[1]).get('timestamp', 0) if isinstance(item[1], dict) else 0, reverse=True)
            candidate_chunks: List[str] = [doc for doc, _ in sorted_docs]
        else:
            candidate_chunks: List[str] = results.get('documents', [[]])[0] if results else []

        final_context: List[str] = []
        total_tokens: int = 0
        
        for chunk in candidate_chunks:
            if not chunk:
                continue
            chunk_tokens = len(chunk) // 4
            if total_tokens + chunk_tokens <= token_limit:
                final_context.append(chunk)
                total_tokens += chunk_tokens
            else:
                break
                
        print(f"DEBUG: Packed {len(final_context)} chunks from '{collection.name}'. Total tokens: {total_tokens}", file=sys.stderr)
        return final_context
        
    except Exception as e:
        print(f"DEBUG: Search error in {collection.name}: {str(e)}", file=sys.stderr)
        print(f"DEBUG: Traceback: {traceback.format_exc()}", file=sys.stderr)
        return []

def list_all_items(collection: Any, limit: Optional[int] = None, offset: int = 0, full_content: bool = False, ids: Optional[List[str]] = None) -> Dict[str, Any]:
    try:
        include: List[str] = ["metadatas"]
        if full_content:
            include.append("documents")
        
        total_count: int = collection.count()
        
        if ids:
            results: Dict[str, Any] = collection.get(
                ids=ids,
                include=include
            )
            return_data: Dict[str, Any] = results if full_content else {
                "ids": results.get("ids", []),
                "metadatas": results.get("metadatas", []),
                "previews": [],
                "total_count": len(results.get("ids", [])),
                "offset": 0,
                "limit": len(results.get("ids", []))
            }
            return return_data
            
        results: Dict[str, Any] = collection.get(include=include)
        
        if not results.get("ids"):
            return {
                "ids": [], 
                "metadatas": [], 
                "previews": [],
                "total_count": 0,
                "offset": 0,
                "limit": 0
            }

        if "metadatas" in results and results["metadatas"]:
            timestamp_pairs: List[Tuple[int, float]] = []
            for i, meta in enumerate(results["metadatas"]):
                if meta is None or not isinstance(meta, dict):
                    timestamp_pairs.append((i, float(i)))
                    continue
                meta_dict: Dict[str, Any] = cast(Dict[str, Any], meta)
                ts: Any = meta_dict.get("timestamp")
                parsed_ts: float = float(i) 
                if ts is not None:
                    try:
                        parsed_ts = float(ts)
                    except (ValueError, TypeError):
                        pass  
                timestamp_pairs.append((i, parsed_ts))
            timestamp_pairs.sort(key=lambda x: x[1], reverse=True)
            sorted_indices: List[int] = [idx for idx, _ in timestamp_pairs]
            results["ids"] = [results["ids"][j] for j in sorted_indices]
            results["metadatas"] = [results["metadatas"][j] for j in sorted_indices]
            if "documents" in results and results["documents"] is not None:
                results["documents"] = [results["documents"][j] for j in sorted_indices]

        start_idx: int = offset
        end_idx: int = start_idx + limit if limit else len(results["ids"])
        
        paginated_ids: List[str] = results["ids"][start_idx:end_idx]
        paginated_metadatas: List[Any] = results.get("metadatas", [])[start_idx:end_idx] if results.get("metadatas") else [None] * len(paginated_ids)
        
        documents: Any = results.get("documents")
        if documents is not None and isinstance(documents, list):
            paginated_documents: List[Any] = cast(List[Any], documents)[start_idx:end_idx]
        else:
            paginated_documents: List[Any] = [None] * len(paginated_ids)

        previews: List[str] = []
        for i, doc in enumerate(paginated_documents):
            if doc and doc.strip():
                if collection.name == "chat_history":
                    timestamp_match = re.search(r'\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]', doc)
                    role_match = re.search(r'\[([USER|ASSISTANT]+)\]', doc)
                    timestamp = timestamp_match.group(1) if timestamp_match else "Unknown"
                    role = role_match.group(1) if role_match else "Message"
                    message_start = doc.find(']') + 1 if doc.find(']') != -1 else 0
                    snippet = f"[{timestamp}] [{role}]: {doc[message_start:message_start+100]}..."
                    previews.append(snippet.strip())
                else:
                    metadata: Dict[str, Any] = cast(Dict[str, Any], paginated_metadatas[i]) if i < len(paginated_metadatas) and isinstance(paginated_metadatas[i], dict) else {}
                    source: str = metadata.get("source", "Unknown Source")
                    snippet = f"Source: {source} | Chunk: {doc[:80]}..."
                    previews.append(snippet.strip())
            else:
                previews.append(paginated_ids[i][:50] + "..." if i < len(paginated_ids) else "Unknown")

        lightweight: Dict[str, Any] = {
            "ids": paginated_ids,
            "metadatas": paginated_metadatas,
            "previews": previews,
            "total_count": total_count,
            "offset": offset,
            "limit": len(paginated_ids)
        }
        
        print(f"DEBUG: List returned {len(previews)} items (offset: {offset}, total: {total_count})", file=sys.stderr)
        return lightweight if not full_content else results
        
    except Exception as e:
        print(f"DEBUG: Error in list_all_items: {str(e)}", file=sys.stderr)
        print(f"DEBUG: Traceback: {traceback.format_exc()}", file=sys.stderr)
        try:
            raw_results = collection.get(limit=limit or None, include=[])
            ids = raw_results.get("ids", [])
            if ids is None:
                ids = []
            previews = [id[:50] + "..." for id in ids]
            print(f"DEBUG: Emergency fallback - {len(ids)} IDs returned (error: {str(e)})", file=sys.stderr)
            return {
                "ids": ids, 
                "metadatas": [], 
                "previews": previews,
                "total_count": len(ids),
                "offset": 0,
                "limit": len(ids)
            }
        except:
            print(f"DEBUG: Total failure in list_all_items: {str(e)}", file=sys.stderr)
            return {
                "ids": [], 
                "metadatas": [], 
                "previews": [],
                "total_count": 0,
                "offset": 0,
                "limit": 0
            }

def get_collection_count(writable_path: str, collection_name: str) -> Dict[str, int]:
    db_path = os.path.join(writable_path, "db")
    client = chromadb.PersistentClient(path=db_path) 
    collection = client.get_or_create_collection(collection_name)
    return {"count": collection.count()}

def delete_items_by_id(collection: Any, ids: List[str]) -> Dict[str, Any]:
    try:
        collection.delete(ids=ids)
        print(f"DEBUG: Deleted {len(ids)} items", file=sys.stderr)
        return {"success": True, "message": f"Deleted {len(ids)} item(s)."}
    except Exception as e:
        print(f"DEBUG: Delete error: {str(e)}", file=sys.stderr)
        return {"success": False, "error": str(e)}

def delete_items_by_source(collection: Any, source_filename: str) -> Dict[str, Any]:
    try:
        collection.delete(where={"source": source_filename})
        print(f"DEBUG: Deleted chunks from source: {source_filename}", file=sys.stderr)
        return {"success": True, "message": f"Deleted all chunks from source: {source_filename}"}
    except Exception as e:
        print(f"DEBUG: Source delete error: {str(e)}", file=sys.stderr)
        return {"success": False, "error": str(e)}

def clear_collection(client: Any, collection_name: str) -> Dict[str, Any]:
    try:
        client.delete_collection(name=collection_name)
        client.get_or_create_collection(name=collection_name)
        return {"success": True, "message": f"Collection '{collection_name}' cleared successfully."}
    except Exception as e:
        return {"success": False, "error": str(e)}

def add_chat_turn_to_rag(collection: Any, chat_turn_json: str) -> Dict[str, Any]:
    try:
        turn = json.loads(chat_turn_json)
        
        if 'id' not in turn or 'timestamp' not in turn:
            print("DEBUG: Chat turn missing 'id' or 'timestamp'. Skipping save.", file=sys.stderr)
            return {"success": False, "error": "Chat turn object is malformed (missing id or timestamp)."}

        document = ""
        for msg in turn.get('history', []):
            role = msg.get('role', 'UNKNOWN').upper()
            content = msg.get('content', '')
            
            if content is None:
                content = ""
            elif not isinstance(content, str):
                print(f"DEBUG: WARNING - message content is not a string, got type: {type(content)}", file=sys.stderr)
                print(f"DEBUG: Content value: {repr(content)[:200]}", file=sys.stderr)
                if isinstance(content, (list, dict)):
                    content = json.dumps(content)
                else:
                    content = str(content)
            
            content = content.strip()
            
            timestamp_iso = re.sub(r'\.\d+', '', str(datetime.fromtimestamp(turn['timestamp'] / 1000).isoformat()))
            
            document += f"[{timestamp_iso}] [{role}]: {content}\n\n"

        if not document.strip():
            return {"success": True, "message": "Empty chat turn, skipping save."}

        metadata: Dict[str, Any] = {
            "source": str(turn['id']),
            "timestamp": float(turn['timestamp'])
        }
        
        if 'persona' in turn and turn['persona']:
            metadata['persona'] = str(turn['persona'])
        
        final_document = document.strip()
        
        try:
            final_document = re.sub(r'<[^>]+>', '', final_document)
            final_document = ''.join(char for char in final_document 
                                    if ord(char) >= 32 or char in '\n\r\t')
            final_document = re.sub(r'\s+', ' ', final_document)
            final_document = final_document.replace('\x00', '')
            final_document = final_document.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
            final_document = final_document.strip()
            
        except Exception as cleanup_error:
            print(f"DEBUG: Error during document sanitization: {cleanup_error}", file=sys.stderr)
            final_document = "Chat turn content could not be sanitized for storage."
        
        if not final_document:
            print(f"DEBUG: Document became empty after sanitization, skipping save.", file=sys.stderr)
            return {"success": True, "message": "Document empty after sanitization, skipped."}
        
        turn_id = str(turn['id'])
        
        print(f"DEBUG: Adding document of length {len(final_document)} chars to collection", file=sys.stderr)
        print(f"DEBUG: Document type: {type(final_document)}, ID type: {type(turn_id)}", file=sys.stderr)
        print(f"DEBUG: Metadata: {metadata}", file=sys.stderr)

        collection.add(
            documents=[str(final_document)],
            metadatas=[metadata],
            ids=[turn_id]
        )
        
        print(f"DEBUG: Successfully added chat turn ID: {turn['id']} to {collection.name}.", file=sys.stderr)
        return {"success": True, "message": f"Saved chat turn {turn['id']}."}
    except json.JSONDecodeError as e:
        print(f"DEBUG: JSON decode error in add_chat_turn_to_rag: {str(e)}", file=sys.stderr)
        return {"success": False, "error": f"Invalid JSON input for chat turn: {str(e)}"}
    except Exception as e:
        print(f"DEBUG: Error adding chat turn: {str(e)}", file=sys.stderr)
        print(f"DEBUG: Traceback: {traceback.format_exc()}", file=sys.stderr)
        return {"success": False, "error": str(e)}

if __name__ == '__main__':
    try:
        if len(sys.argv) < 4:
            print(json.dumps({"error": "Insufficient arguments"}), flush=True)
            sys.exit(1)
            
        command = sys.argv[1]
        collection_name = sys.argv[2]
        writable_path = sys.argv[3]
        
        if not os.path.isabs(writable_path):
            writable_path = os.path.abspath(writable_path)
        if not os.path.exists(writable_path):
            print(json.dumps({"error": f"Database path does not exist: {writable_path}"}), flush=True)
            sys.exit(1)
        db_path = os.path.join(writable_path, "db")
        os.makedirs(db_path, exist_ok=True)
        client = chromadb.PersistentClient(path=db_path)
        
        collection = None
        if command != 'clear_collection':
            collection = client.get_or_create_collection(name=collection_name)

        if command == "search":
            potential_token_limit_or_query: str = sys.argv[4]
            query_from_stdin: str = sys.stdin.read().strip()
            query: str = ""
            token_limit: int = 0
            n_results: int = 15
            persona_filter: Optional[str] = None

            if potential_token_limit_or_query.isdigit():
                token_limit = int(potential_token_limit_or_query)
                n_results = int(sys.argv[5]) if len(sys.argv) > 5 else 15
                if len(sys.argv) > 6:
                    persona_filter = sys.argv[6]
                query = query_from_stdin
            else:
                if len(sys.argv) < 6:
                    err_msg: str = f"Invalid arguments. Expected token_limit, but got a string: '{potential_token_limit_or_query}'. The token_limit argument is likely missing."
                    print(json.dumps({"error": err_msg}), flush=True)
                    sys.exit(1)
                query = potential_token_limit_or_query
                token_limit = int(sys.argv[5])
                n_results = int(sys.argv[6]) if len(sys.argv) > 6 else 15
                if len(sys.argv) > 7:
                    persona_filter = sys.argv[7]

            if query:
                search_results: List[str] = search_knowledge(collection, query, token_limit, n_results, persona_filter)
                print(json.dumps(search_results), flush=True)
            else:
                print(json.dumps([]), flush=True)

        elif command == "get_recent_turns":
            if len(sys.argv) < 6:
                print(json.dumps({"error": "get_recent_turns requires n_turns and token_limit"}), flush=True)
                sys.exit(1)
            
            n_turns: int = int(sys.argv[4])
            token_limit: int = int(sys.argv[5])
            persona_filter: Optional[str] = sys.argv[6] if len(sys.argv) > 6 else None
            
            recent_turns: List[str]
            total_tokens: int
            was_truncated: bool
            recent_turns, total_tokens, was_truncated = get_recent_turns(collection, n_turns, token_limit, persona_filter)
            result: Dict[str, Any] = {
                "turns": recent_turns,
                "total_tokens": total_tokens,
                "was_truncated": was_truncated
            }
            print(json.dumps(result), flush=True)

        elif command == "list_items":
            payload_str: str = sys.stdin.read().strip()
            payload: Dict[str, Any] = json.loads(payload_str) if payload_str else {}
            all_items: Dict[str, Any] = list_all_items(
                collection, 
                limit=payload.get("limit"), 
                offset=payload.get("offset", 0),
                full_content=payload.get("full_content", False), 
                ids=payload.get("ids")
            )
            print(json.dumps(all_items), flush=True)

        elif command == "get_collection_count":
            count_result = get_collection_count(writable_path, collection_name)
            print(json.dumps(count_result), flush=True)

        elif command == "delete_items":
            ids_to_delete = json.loads(sys.stdin.read())
            result = delete_items_by_id(collection, ids_to_delete)
            print(json.dumps(result), flush=True)

        elif command == "delete_source":
            source_file = sys.stdin.read().strip()
            result = delete_items_by_source(collection, source_file)
            print(json.dumps(result), flush=True)

        elif command == "clear_collection":
            result = clear_collection(client, collection_name)
            print(json.dumps(result), flush=True)
        
        elif command == "save_chat_turn":
            chat_turn_data = sys.stdin.read()
            result = add_chat_turn_to_rag(collection, chat_turn_data)
            print(json.dumps(result), flush=True)

    except Exception as e:
        error_msg = f"CRITICAL ERROR in rag_backend.py: {str(e)}"
        print(error_msg, file=sys.stderr)
        print(f"DEBUG: Full traceback: {traceback.format_exc()}", file=sys.stderr)
        print(json.dumps({"error": str(e)}), flush=True)
        sys.exit(1)
