"""
Token Manager Worker Module
============================
Token counting and cost estimation for RAG + LLM workflows.

Features:
- Multi-model token counting (GPT-4, Claude, Llama, etc.)
- RAG chunk analysis
- Cost calculation (prompt + completion + embeddings)
- Per-file breakdowns

Dependencies: tiktoken, transformers (optional for non-OpenAI models)
"""

import os
from pathlib import Path
import json
import math

# Try to import tiktoken (OpenAI tokenizer)
try:
    import tiktoken
    HAS_TIKTOKEN = True
except ImportError:
    HAS_TIKTOKEN = False
    print("WARNING: tiktoken not installed. Using approximate counting.")


# Model pricing (per 1M tokens) - Updated Oct 2024
MODEL_PRICING = {
    # OpenAI
    'gpt-4': {'prompt': 30.00, 'completion': 60.00, 'embedding': 0.13},
    'gpt-4-turbo': {'prompt': 10.00, 'completion': 30.00, 'embedding': 0.13},
    'gpt-3.5-turbo': {'prompt': 0.50, 'completion': 1.50, 'embedding': 0.13},
    
    # Anthropic Claude
    'claude-3-opus': {'prompt': 15.00, 'completion': 75.00, 'embedding': 0.00},
    'claude-3-sonnet': {'prompt': 3.00, 'completion': 15.00, 'embedding': 0.00},
    'claude-3-haiku': {'prompt': 0.25, 'completion': 1.25, 'embedding': 0.00},
    
    # Meta Llama (via TogetherAI/OpenRouter - approximate)
    'llama-3-70b': {'prompt': 0.90, 'completion': 0.90, 'embedding': 0.00},
    'llama-3-8b': {'prompt': 0.20, 'completion': 0.20, 'embedding': 0.00},
    
    # Mistral
    'mistral-large': {'prompt': 4.00, 'completion': 12.00, 'embedding': 0.00},
    
    # Google Gemini
    'gemini-pro': {'prompt': 0.50, 'completion': 1.50, 'embedding': 0.00},
}


# Tokenizer encodings for different models
MODEL_ENCODINGS = {
    'gpt-4': 'cl100k_base',
    'gpt-4-turbo': 'cl100k_base',
    'gpt-3.5-turbo': 'cl100k_base',
    'claude-3-opus': 'cl100k_base',  # Approximate with OpenAI encoding
    'claude-3-sonnet': 'cl100k_base',
    'claude-3-haiku': 'cl100k_base',
    'llama-3-70b': 'cl100k_base',  # Approximate
    'llama-3-8b': 'cl100k_base',
    'mistral-large': 'cl100k_base',
    'gemini-pro': 'cl100k_base',
}


def count_tokens(text, model='gpt-4'):
    """
    Count tokens in text for specified model.
    
    Args:
        text (str): Text to count
        model (str): Model name
    
    Returns:
        int: Token count
    """
    if not HAS_TIKTOKEN:
        # Fallback: approximate counting (4 chars ≈ 1 token)
        return len(text) // 4
    
    try:
        encoding_name = MODEL_ENCODINGS.get(model, 'cl100k_base')
        encoding = tiktoken.get_encoding(encoding_name)
        return len(encoding.encode(text))
    except Exception:
        # Fallback
        return len(text) // 4


def analyze_tokens(file_paths, model, chunk_size, include_embeddings=True):
    """
    Analyze token usage for list of files.
    
    Args:
        file_paths (list): List of file paths
        model (str): Model name
        chunk_size (int): RAG chunk size in tokens
        include_embeddings (bool): Include embedding costs
    
    Returns:
        dict: Analysis results
    """
    results = {
        'model': model,
        'chunk_size': chunk_size,
        'total_files': len(file_paths),
        'total_tokens': 0,
        'total_chunks': 0,
        'total_chars': 0,
        'files': [],
        'costs': {},
        'rag_stats': {},
        'include_embeddings': include_embeddings
    }
    
    for file_path in file_paths:
        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Count tokens
            token_count = count_tokens(content, model)
            char_count = len(content)
            
            # Calculate chunks
            num_chunks = math.ceil(token_count / chunk_size)
            
            # Store file data
            file_data = {
                'path': file_path,
                'name': os.path.basename(file_path),
                'size_bytes': os.path.getsize(file_path),
                'chars': char_count,
                'tokens': token_count,
                'chunks': num_chunks,
                'avg_chunk_size': token_count / num_chunks if num_chunks > 0 else 0
            }
            
            results['files'].append(file_data)
            results['total_tokens'] += token_count
            results['total_chunks'] += num_chunks
            results['total_chars'] += char_count
        
        except Exception as e:
            # Log error but continue
            results['files'].append({
                'path': file_path,
                'name': os.path.basename(file_path),
                'error': str(e)
            })
    
    # Calculate costs
    results['costs'] = calculate_costs(results, model, include_embeddings)
    
    # RAG statistics
    results['rag_stats'] = calculate_rag_stats(results)
    
    return results


def calculate_costs(results, model, include_embeddings):
    """Calculate cost estimates"""
    pricing = MODEL_PRICING.get(model, {'prompt': 0.00, 'completion': 0.00, 'embedding': 0.00})
    
    total_tokens = results['total_tokens']
    total_chunks = results['total_chunks']
    
    # Prompt cost (RAG context + user query)
    # Assume average query is 100 tokens, RAG context varies by chunk count
    avg_rag_context = min(total_chunks * results['chunk_size'] * 0.1, 8000)  # Max 8K context
    prompt_tokens_per_query = avg_rag_context + 100
    
    # Completion cost (assume average response is 500 tokens)
    completion_tokens_per_query = 500
    
    # Embedding cost (all chunks need to be embedded for RAG)
    embedding_tokens = total_tokens if include_embeddings else 0
    
    costs = {
        'prompt_per_million': pricing['prompt'],
        'completion_per_million': pricing['completion'],
        'embedding_per_million': pricing['embedding'],
        
        'total_tokens': total_tokens,
        'total_chunks': total_chunks,
        
        # One-time costs
        'embedding_cost_total': (embedding_tokens / 1_000_000) * pricing['embedding'],
        
        # Per-query costs
        'prompt_tokens_per_query': prompt_tokens_per_query,
        'completion_tokens_per_query': completion_tokens_per_query,
        'cost_per_query': (
            (prompt_tokens_per_query / 1_000_000) * pricing['prompt'] +
            (completion_tokens_per_query / 1_000_000) * pricing['completion']
        ),
        
        # Projections
        'cost_10_queries': 0,
        'cost_100_queries': 0,
        'cost_1000_queries': 0,
    }
    
    # Calculate projections
    one_time_cost = costs['embedding_cost_total'] if include_embeddings else 0
    per_query_cost = costs['cost_per_query']
    
    costs['cost_10_queries'] = one_time_cost + (per_query_cost * 10)
    costs['cost_100_queries'] = one_time_cost + (per_query_cost * 100)
    costs['cost_1000_queries'] = one_time_cost + (per_query_cost * 1000)
    
    return costs


def calculate_rag_stats(results):
    """Calculate RAG-specific statistics"""
    if not results['files']:
        return {}
    
    chunk_sizes = [f['avg_chunk_size'] for f in results['files'] if 'chunks' in f and f['chunks'] > 0]
    
    stats = {
        'total_chunks': results['total_chunks'],
        'avg_chunk_size': sum(chunk_sizes) / len(chunk_sizes) if chunk_sizes else 0,
        'target_chunk_size': results['chunk_size'],
        'efficiency': 0,
        'storage_estimate_mb': 0,
    }
    
    # Efficiency (how close to target chunk size)
    if stats['target_chunk_size'] > 0:
        stats['efficiency'] = (stats['avg_chunk_size'] / stats['target_chunk_size']) * 100
    
    # Storage estimate (rough - vectors are ~1KB per chunk with metadata)
    stats['storage_estimate_mb'] = (results['total_chunks'] * 1024) / (1024 * 1024)
    
    return stats


def format_summary(results):
    """Format summary view"""
    summary = f"""
╔═══════════════════════════════════════════════════════════════╗
║                    TOKEN ANALYSIS SUMMARY                     ║
╚═══════════════════════════════════════════════════════════════╝

📊 Overview:
   Model: {results['model']}
   Files Analyzed: {results['total_files']}
   RAG Chunk Size: {results['chunk_size']} tokens

📈 Token Statistics:
   Total Characters: {results['total_chars']:,}
   Total Tokens: {results['total_tokens']:,}
   Total RAG Chunks: {results['total_chunks']:,}
   Avg Tokens/File: {results['total_tokens'] // results['total_files'] if results['total_files'] > 0 else 0:,}

💰 Cost Estimates (USD):
"""
    
    costs = results['costs']
    
    if results['include_embeddings']:
        summary += f"   One-time Embedding: ${costs['embedding_cost_total']:.4f}\n"
    
    summary += f"""   Per Query: ${costs['cost_per_query']:.4f}
   
   Projected Costs:
   • 10 queries:    ${costs['cost_10_queries']:.2f}
   • 100 queries:   ${costs['cost_100_queries']:.2f}
   • 1,000 queries: ${costs['cost_1000_queries']:.2f}

🔍 RAG Analysis:
   Total Chunks: {results['rag_stats']['total_chunks']:,}
   Avg Chunk Size: {results['rag_stats']['avg_chunk_size']:.0f} tokens
   Target Chunk Size: {results['rag_stats']['target_chunk_size']} tokens
   Chunk Efficiency: {results['rag_stats']['efficiency']:.1f}%
   Vector Storage Est: {results['rag_stats']['storage_estimate_mb']:.2f} MB

"""
    
    summary += "=" * 67 + "\n"
    
    return summary


def format_cost_breakdown(results):
    """Format detailed cost breakdown"""
    costs = results['costs']
    pricing = MODEL_PRICING.get(results['model'], {})
    
    breakdown = f"""
COST BREAKDOWN - {results['model'].upper()}
{'=' * 67}

Pricing (per 1M tokens):
  Prompt Tokens:     ${pricing.get('prompt', 0):.2f}
  Completion Tokens: ${pricing.get('completion', 0):.2f}
  Embeddings:        ${pricing.get('embedding', 0):.2f}

Token Counts:
  Total Tokens:      {costs['total_tokens']:,}
  Total Chunks:      {costs['total_chunks']:,}
  Prompt/Query:      {costs['prompt_tokens_per_query']:,.0f}
  Completion/Query:  {costs['completion_tokens_per_query']:,.0f}

Cost Components:
"""
    
    if results['include_embeddings']:
        breakdown += f"""
  EMBEDDINGS (One-time):
    Tokens: {costs['total_tokens']:,}
    Rate:   ${costs['embedding_per_million']:.2f} per 1M
    Total:  ${costs['embedding_cost_total']:.4f}
"""
    
    breakdown += f"""
  PROMPT (Per Query):
    Tokens: {costs['prompt_tokens_per_query']:,.0f}
    Rate:   ${costs['prompt_per_million']:.2f} per 1M
    Cost:   ${(costs['prompt_tokens_per_query'] / 1_000_000) * costs['prompt_per_million']:.4f}

  COMPLETION (Per Query):
    Tokens: {costs['completion_tokens_per_query']:,.0f}
    Rate:   ${costs['completion_per_million']:.2f} per 1M
    Cost:   ${(costs['completion_tokens_per_query'] / 1_000_000) * costs['completion_per_million']:.4f}

  TOTAL PER QUERY: ${costs['cost_per_query']:.4f}

Scaling Projections:
  10 queries:    ${costs['cost_10_queries']:.2f}
  100 queries:   ${costs['cost_100_queries']:.2f}
  1,000 queries: ${costs['cost_1000_queries']:.2f}
  10,000 queries: ${costs['embedding_cost_total'] + (costs['cost_per_query'] * 10000):.2f}

{'=' * 67}

💡 Cost Optimization Tips:
   • Use smaller chunk sizes to reduce prompt tokens
   • Cache frequently accessed chunks
   • Use cheaper models for simple queries
   • Batch similar queries together
   • Consider local models (Ollama) for dev/testing

"""
    
    return breakdown


def format_rag_analysis(results):
    """Format RAG-specific analysis"""
    rag = results['rag_stats']
    
    analysis = f"""
RAG WORKFLOW ANALYSIS
{'=' * 67}

Chunk Configuration:
  Target Chunk Size: {rag['target_chunk_size']} tokens
  Actual Avg Size:   {rag['avg_chunk_size']:.0f} tokens
  Efficiency:        {rag['efficiency']:.1f}%

Chunk Distribution:
  Total Chunks:      {rag['total_chunks']:,}
  Total Tokens:      {results['total_tokens']:,}
  Avg Tokens/Chunk:  {results['total_tokens'] // rag['total_chunks'] if rag['total_chunks'] > 0 else 0:,}

Storage Requirements:
  Vector DB Size:    ~{rag['storage_estimate_mb']:.2f} MB
  (Estimate: 1KB per chunk with metadata)

RAG Context Retrieval:
  Typical Retrieval: 5-10 chunks per query
  Context Size:      {rag['target_chunk_size'] * 7:,} tokens (avg 7 chunks)
  Max Context (8K):  Fits ~{8000 // rag['target_chunk_size']} chunks

Performance Considerations:
"""
    
    if rag['efficiency'] < 80:
        analysis += "  ⚠️  Chunk efficiency low - many files < target size\n"
        analysis += "     Consider smaller chunk size or combine small files\n"
    elif rag['efficiency'] > 120:
        analysis += "  ⚠️  Chunk efficiency high - many files > target size\n"
        analysis += "     Consider larger chunk size or split large files\n"
    else:
        analysis += "  ✅ Chunk size well-optimized for file set\n"
    
    if rag['total_chunks'] > 10000:
        analysis += "  ⚠️  Large chunk count - consider indexing strategy\n"
        analysis += "     Recommend: Vector DB with HNSW or IVF indexing\n"
    
    analysis += f"""

Recommended RAG Strategy:
  • Chunk Size: {rag['target_chunk_size']} tokens
  • Overlap:    {int(rag['target_chunk_size'] * 0.1)} tokens (10%)
  • Retrieval:  Top-K = 5-10 chunks
  • Reranking:  Use cross-encoder for best results
  • Caching:    Cache top 20% most accessed chunks

{'=' * 67}
"""
    
    return analysis


def format_file_details(results):
    """Format per-file details"""
    details = "PER-FILE TOKEN BREAKDOWN\n"
    details += "=" * 67 + "\n\n"
    
    # Sort files by token count (descending)
    files = sorted(results['files'], key=lambda x: x.get('tokens', 0), reverse=True)
    
    for i, file_data in enumerate(files, 1):
        if 'error' in file_data:
            details += f"{i}. {file_data['name']}\n"
            details += f"   ERROR: {file_data['error']}\n\n"
            continue
        
        details += f"{i}. {file_data['name']}\n"
        details += f"   Path:       {file_data['path']}\n"
        details += f"   Size:       {file_data['size_bytes']:,} bytes\n"
        details += f"   Characters: {file_data['chars']:,}\n"
        details += f"   Tokens:     {file_data['tokens']:,}\n"
        details += f"   RAG Chunks: {file_data['chunks']}\n"
        details += f"   Avg/Chunk:  {file_data['avg_chunk_size']:.0f} tokens\n"
        details += "\n"
    
    return details


def check_dependencies():
    """Check if required dependencies are installed"""
    missing = []
    
    if not HAS_TIKTOKEN:
        missing.append('tiktoken')
    
    return len(missing) == 0, missing


if __name__ == "__main__":
    # Test script
    print("Token Manager Worker Module")
    print("=" * 50)
    
    ready, missing = check_dependencies()
    if ready:
        print("✓ All dependencies installed")
    else:
        print(f"⚠️  Missing dependencies: {', '.join(missing)}")
        print("  Run: pip install tiktoken")
        print("\n  Note: Tool will work with approximate counting if tiktoken is missing")
