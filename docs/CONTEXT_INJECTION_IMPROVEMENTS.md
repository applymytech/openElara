# Context Injection System Improvements
**Date:** October 14, 2025

## Problem Statement
The LLM was getting confused by multiple types of context being injected without clear explanations:
- RAG memories (recent + semantic)
- Knowledge base entries
- Context Canvas files
- Attached files
- User input

This led to confusion about:
- Which data to prioritize
- What to do with different types of information
- When context was missing vs. when it was irrelevant

## Solution: Enhanced System Prompt + Consistent Placeholders

### 1. **New Context Guidelines in System Prompt**
Added comprehensive `<contextGuidelines>` section explaining each type of context:

#### Context Types Explained:
1. **CONTEXT CANVAS** - Persistent multi-file workspace
   - User's current working files
   - Should be referenced directly for code/document questions
   
2. **ATTACHED FILE** - Single-turn reference
   - Specific file for THIS turn only
   - Should be analyzed and remembered for future
   
3. **RECENT CONVERSATION CONTEXT** - Guaranteed recent history
   - Last N turns in chronological order
   - Provides immediate conversational continuity
   
4. **RELEVANT PAST MEMORIES** - Semantic long-term memory
   - Related conversations from days/weeks ago
   - "Hazy memories" of relevant discussions
   
5. **RELEVANT KNOWLEDGE** - Ingested documents
   - Authoritative reference material
   - Often more current than training data

#### Priority Order:
1. User's direct question (always highest)
2. Context Canvas files (current working context)
3. Attached file (specifically provided)
4. Relevant Knowledge (authoritative material)
5. Recent Conversation (immediate context)
6. Past Memories (historical context)

### 2. **Consistent Placeholders for Empty Context**
Previously, missing context sections were simply omitted, causing confusion.

**Now:** Every context type ALWAYS appears with clear placeholders when empty:

```
---RECENT CONVERSATION CONTEXT---
[No recent conversation history available - this appears to be the start of a new conversation]
---END RECENT CONTEXT---

---RELEVANT PAST MEMORIES---
[No relevant past conversations found for this query]
---END PAST MEMORIES---

---RELEVANT KNOWLEDGE---
[No relevant knowledge base entries found for this query]
---END KNOWLEDGE---

--- START OF CONTEXT CANVAS ---
[No files in context canvas this turn]
--- END OF CONTEXT CANVAS ---

--- START OF ATTACHED FILE CONTENT ---
[No file attached this turn]
--- END OF ATTACHED FILE CONTENT ---
```

### 3. **Files Modified**

#### `src/main/ipcHandlers.js`
- Enhanced system prompt with detailed context guidelines
- Explains format, purpose, and action for each context type
- Provides clear instructions on handling missing sections
- Defines priority order for information sources

#### `src/main/handlers/apiHandlers.js`
- Added placeholders for empty RAG context (recent, memories, knowledge)
- Added placeholders for empty Context Canvas
- Added placeholders for missing Attached File
- Ensures LLM ALWAYS sees consistent structure

## Benefits

### For the LLM:
✅ **Clear structure** - Always knows what to expect
✅ **No ambiguity** - Empty vs. missing is explicit
✅ **Priority guidance** - Knows what information to prioritize
✅ **Better reasoning** - Can explain what context it's using

### For the User:
✅ **More relevant responses** - LLM uses right context
✅ **Better file handling** - Canvas vs. Attached distinction clear
✅ **Improved memory** - LLM knows when to reference past conversations
✅ **Debugging visibility** - Can see what context was provided

## Testing Recommendations

1. **Start fresh conversation** - Verify placeholders appear for empty history
2. **Add canvas files** - Test file references work correctly
3. **Attach single file** - Ensure LLM distinguishes from canvas
4. **Test RAG retrieval** - Verify memories/knowledge properly utilized
5. **Check priority** - Confirm LLM prioritizes user question over RAG

## Future Enhancements

Potential improvements:
- Token usage stats per context type (show in UI)
- User control over context inclusion (toggle sections)
- Visual indicator in UI showing what context was sent
- Context injection audit log (for debugging)
