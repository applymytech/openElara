# openElara: Complete User Manual
**Version 2.0 | October 2025 | Comprehensive Feature Guide**

Welcome to openElara, your personal AI-powered companion designed to enhance productivity, creativity, and knowledge management. This comprehensive guide covers everything from basic chat to advanced multi-modal workflows, character management, and troubleshooting.

**🎯 Quick Start Tip:** If this is your first time, attach this user manual to a message and ask the AI to walk you through getting started. The AI can explain features step-by-step and even help you create custom prompts or workflows!

---

## Foreword from the Developer

I created openElara (Enhanced Local Artificial Response Assistant) because I was tired of web-based AI tools controlling my data and how the AI "thinks." I also wanted something to harness AI power without the need for expensive VRAM requirements. After months of building, this tool runs locally on your computer, giving you full control over your information. It can pair with Ollama to run local LLM without huge VRAM capabilities, although these are limited in thinking power. To get over this, openElara also is hardcoded to access open source AI models provided by together.ai, with a seamless transition of contextual information when changing between calling any LLM model. There is a hardcoded support for an exa.ai api key to unlock the power of live nueral websearches. If you want more LLM support, openElara is hardcoded to take any openai network compatible api key, the models and completions endpoints, then simply guess the required settings to connect you with the LLM offered. If this does not work, then some simple tweaking and replication of hardcoded logic will result in a dedicated handler for your new API call. (Hint: use existing free LLM calls with together.ai or locally to plan how to do this!) 

Think of openElara as a helpful sidekick for daily tasks, research, or just fun experimentation. Everything stays private on your device, and I'll keep adding features based on user feedback.

### Perceived Benefits of openElara

The main benefits of openElara are; firsly the support of locally ran LLM that can harness the power of AI without internet connections. It does this by utilizing Ollama to manage a repository of local LLM, then forces contextual thinking processes onto the selected LLM.

When connected to the internet, openElara is preconfigured to run with together.ai API keys but is theoretically able to access any openai network standard api call. 

You can move seamlessly between LLM with each click of the send button, without losing contextual focus. Therefore, you can use a small local LLM with a low-spec machine (I built this app on an 16GB RAM, AMD 7 with a Radeon 512, 8GB shared graphics unit) to thrash out ideas, then seamlessly call in a server based LLM to do the heavy lifting! 

openElara is preconfigured to help you ingest specialist knowledge using exa.ai nueral searches, and good old fashioned python workers. This allows you to enhance her knowledge base, so she does not need to rely on incomplete, out-dated training knowledge to formulate answers. 

openElara brings even more benefits; 

- She can consistently generate a self-image using image generation or video generation tools, 
- She is aware of her functions, and what she can do to help you (as long as the USER_MANUAL.md file has been successfully committed to her memories), and she can also help you modify her code for a more customized experience,  *this is a high-risk venture, ensure full backups!*
- Local LLM are capable of learning from you across a longer term, but openElara's code also allows both local and server based LLM to receive behaviour modification prompting. 
- She is designed to force you to operate within the thinking limits of whatever AI you are working with. If your request is outside the thinking limits, she can help you restructure your request so it works.
- She forces contextual awareness onto any LLM called.

---

## Table of Contents
1. [Introduction & Philosophy](#introduction--philosophy)
2. [Getting Started: Complete Setup Guide](#getting-started-complete-setup-guide)
3. [Main Interface Overview](#main-interface-overview)
4. [Core Features](#core-features)
5. [Multi-Character System](#multi-character-system)
6. [Creating Your Own Characters](#creating-your-own-characters)
7. [Prompt Manager (Multi-Modal)](#prompt-manager-multi-modal)
8. [Power Tools for Research](#power-tools-for-research)
9. [Image & Video Generation](#image--video-generation)
10. [Advanced Workflows](#advanced-workflows)
11. [Process Flows (AI-Assisted)](#process-flows-ai-assisted)
12. [Troubleshooting](#troubleshooting)

---

## Introduction & Philosophy

### The Story of Elara

openElara didn't start as a multi-feature AI platform—it started as a **proof of concept** and a personal experiment in understanding AI interaction design.

**The Original Concept:**
I (the developer) wanted to test a theory: Could an AI companion feel more "alive" and engaging if it had:
1. **Persistent memory** (not just recent conversation)
2. **Specialized knowledge** (through RAG, not just training data)
3. **A consistent persona** (with physical characteristics for visual generation)
4. **Local-first operation** (privacy, control, no subscription fees)

**Enter Elara:**
Elara was the first character—a playful, creative AI companion designed to be conversational, helpful, and fun. She was coded with:
- A detailed physical description (for image/video consistency)
- A warm, adventurous personality
- Technical expertise in code and analysis
- An understanding of her own nature as an AI

**The Experiment Worked:**
Users (and I) found the experience dramatically more engaging than typical chatbots. Elara felt like a **companion**, not a tool. The persistent memory made conversations flow naturally across sessions. The visual consistency made her feel "real."

**Evolution to "Elara and Friends":**
Once the concept proved successful, I expanded the system:
- **Aeron** (The Guardian Strategist) - For security, risk analysis, strategic planning
- **Aelira** (The Philosophical Muse) - For deep thinking, ethics, Socratic dialogue
- **Andros** (The Pragmatic Problem-Solver) - For business, technical solutions, no-nonsense advice

Each character uses the **same underlying architecture** but with different:
- Personality prompts
- Physical descriptions
- Communication styles
- Expertise areas

**What openElara Became:**
From a single-character experiment, openElara evolved into a comprehensive AI platform that:
- Supports **multiple AI personalities** (switchable on demand)
- Integrates **local (Ollama) and cloud models**
- Provides **advanced RAG capabilities** for specialized knowledge
- Offers **multi-modal generation** (text, images, videos)
- Includes **power research tools** (neural search, web scraping)
- Remains **100% open-source** and privacy-focused

**You're Now Part of the Story:**
This manual will show you how to use everything we've built—and how to **create your own characters** to expand the openElara universe even further!

---

### Core Philosophy
**Your Data, Your Device, Your Control**
- **Local-first:** Everything stored on your machine (`%AppData%\Roaming\openelara\`)
- **No telemetry:** Zero data collection, tracking, or cloud uploads
- **Privacy-focused:** API keys encrypted, conversations stay private (within the policies of your api proviers, check their websites and adjust your settings for more details)
- **Open-source:** Full code transparency, auditable, modifiable
- **Extensible:** Add your own characters, prompts, workflows

### Key Benefits
✅ **Offline AI** via Ollama (no internet needed for local models)  
✅ **Seamless model switching** (local ↔ cloud) without context loss  
✅ **Retrieval-Augmented Generation (RAG)** for specialized knowledge  
✅ **Multiple AI characters** (Elara, Aeron, Aelira, Andros, + your own!)  
✅ **Image & video generation** with context-aware prompts  
✅ **Multi-modal prompt management** (chat, image, video templates)  
✅ **Power research tools** (Exa.ai neural search + Scrapy)  
✅ **Self-aware AI** (understands its own functions when manual is ingested)  

---

## Getting Started: Complete Setup Guide

This section will walk you through **every option** for getting openElara running, from completely free (Ollama) to pay-as-you-go cloud services. Choose the path that fits your needs!

---

### System Requirements

Before installing openElara, please ensure you have the following dependencies installed on your system:

1. **Python 3.10 or higher** - Required for AI/ML features, RAG system, and document processing
2. **Java (OpenJDK 17 or higher)** - Required for document conversion features
3. **Tesseract OCR** - Required for image text extraction (OCR)

The openElara installer will check for these dependencies and provide download links if any are missing. However, it will not automatically install them - you must install them manually to ensure proper configuration.

**Note:** If you install these dependencies after running openElara for the first time, you may need to restart the application for the changes to take effect.

### Setup Path 1: 100% Free (Ollama + Free Web Tools)

**Best for:** Privacy-focused users, offline usage, no budget constraints  
**Hardware needs:** 16GB RAM minimum, 8GB for small models  
**Speed:** Slower than cloud APIs, but FREE and PRIVATE

#### First Run: Python Dependency Installation

When you first run openElara, the application will automatically install the required Python package dependencies. This process happens in the background and may take a few minutes depending on your internet connection speed.

You will see a console window showing the installation progress. Please do not close this window or interrupt the process. Once completed, the main application window will appear.

If the automatic installation fails, you can manually install the dependencies by:
1. Opening a command prompt as Administrator
2. Navigating to the openElara installation directory
3. Running: `python backend\setup_python_env.py`

#### Step 1: Install Ollama

1. **Download Ollama:**
   - Visit: [https://ollama.com](https://ollama.com)
   - Download the installer for Windows
   - Run installer (it will set up everything automatically)

2. **Verify Installation:**
   - Open Command Prompt or PowerShell
   - Type: `ollama serve`
   - You should see: "Ollama is running on http://localhost:11434"
   - Press `Ctrl+C` to stop (it will auto-start when needed)

3. **Test Ollama:**
   - In terminal, type: `ollama list`
   - You'll see an empty list (no models yet)

#### Step 2: Download Your First Model

**⚠️ CRITICAL: Model Download Information**

Before downloading ANY model, understand:
- **Downloads are LARGE:** 2-8GB per model (some up to 70GB!)
- **Downloads are SLOW:** 10-60+ minutes depending on model size and internet speed
- **Cannot pause/resume:** If you close openElara during download, it may corrupt
- **Progress appears frozen:** At high percentages (96-99%), updates are sparse—this is NORMAL

**Recommended First Model:** `gemma2:2b` (2.7GB, fast, great for learning)

**In openElara:**
1. Click **Account Settings** (top bar)
2. Scroll to **"Ollama Management"** section
3. In "Model Name" field, type: `gemma2:2b`
4. Click **"Download Model"**
5. **READ THE WARNING DIALOG** carefully
6. Click **"Yes, Download"**
7. **DO NOT CLOSE THE APP**
8. Watch progress: `Status - XX.XX% (MB completed / MB total) [Xm Ys]`
9. Wait for **"✅ Successfully pulled model"**

**Other Recommended Models:**

| Model Name | Size | Speed | Best For | RAM Needed |
|------------|------|-------|----------|------------|
| `gemma2:2b` | 2.7GB | Very Fast | Learning, testing, casual chat | 8GB |
| `phi3:mini` | 2.3GB | Very Fast | General chat, low-spec hardware | 8GB |
| `llama3.2:3b` | 2.0GB | Fast | Balanced performance | 8GB |
| `mistral:7b` | 4.1GB | Medium | Good quality, coding | 12GB |
| `llama3:8b` | 4.7GB | Medium | High quality chat | 16GB |
| `codellama:7b` | 3.8GB | Medium | Code-focused tasks | 12GB |

**⚠️ WARNING: Larger Models (13B+)**
- Require dedicated GPU with VRAM (NVIDIA recommended)
- Will be **extremely slow** on CPU/integrated graphics
- May freeze your system if insufficient RAM
- **Not recommended** unless you have gaming-grade hardware

**Using Downloaded Models:**
1. Click **Model** dropdown (accordion panel)
2. Select **"Ollama"** as API source
3. Choose your downloaded model from the list
4. Start chatting—100% free, 100% private!

#### Step 3: Optional Free Services

**TogetherAI (Free Tier):**
- Visit: [https://api.together.ai](https://api.together.ai)
- Sign up (free, no credit card required)
- Free credits provided for testing
- Copy API key
- openElara → Account Settings → API Keys → TogetherAI API Key → Paste
- **Free tier limitations:** Rate limits, some models restricted
- **Tip:** Free tier is unstable (models change, limits vary). Great for testing!

**Scrapy (Built-in):**
- No signup needed
- 100% free web scraping (up to 64 URLs at once)
- See "Power Tools" section for usage

---

### Setup Path 2: Recommended (Mixed Free + Paid)

**Best for:** Best experience, reasonable cost, all features unlocked  
**Estimated cost:** $20-70 upfront, then ~$5-20/month depending on usage

This path gives you:
- **Fast, high-quality responses** (cloud models)
- **All image models unlocked** (including best FLUX models)
- **Video generation** (PixVerse)
- **Neural web search** (Exa.ai)
- **Local models as backup** (Ollama for privacy-sensitive tasks)

#### Step 1: TogetherAI (For Chat & Images)

**Why TogetherAI?**
- Excellent model selection (Llama, Mistral, Qwen, etc.)
- **FLUX image models** (best open-source image generation)
- Pay-as-you-go (no monthly subscription)
- Reasonable pricing (~$0.20-$0.60 per 1M tokens)

**Setup:**

1. **Create Account:**
   - Visit: [https://api.together.ai](https://api.together.ai)
   - Sign up (email + password)
   - Verify email

2. **Add Credits:**
   - Dashboard → Billing → Add Credits
   - **Recommended: $50** (unlocks all features, lasts months)
   - **Minimum for all FLUX models: $50**
   - **Budget option: $5** (unlocks basic features, some models restricted)
   
3. **Understanding Tiers:**
   - **Free Tier:** Limited models, low priority, rate limits, unstable
   - **$5 Tier:** More models, better priority, still some restrictions
   - **$50+ Tier:** ALL models including FLUX Pro, highest priority network routing, no restrictions

4. **Get API Key:**
   - Dashboard → API Keys → Create New Key
   - Copy the key (starts with something like `abc123...`)
   - **Keep this secret!** (don't share, don't paste in public)

5. **Add to openElara:**
   - Account Settings → API Keys section
   - Find "TogetherAI API Key" field
   - Paste your key
   - Click **Save** (or it will auto-save)

6. **Test It:**
   - Model dropdown → Select "TogetherAI"
   - Choose a model (e.g., "Meta-Llama-3.1-8B-Instruct")
   - Send a test message
   - If it works: ✅ You're set!

**Cost Management:**
- Monitor usage: TogetherAI Dashboard → Usage
- Set billing alerts (optional)
- Typical costs: $0.50-$5 per day for heavy usage
- Most users: $5-15/month

#### Step 2: AI/ML API (For Video Generation)

**Why AI/ML API?**
- Access to **PixVerse** (best text-to-video model for characters)
- Also provides image models (backup option)
- Pay-as-you-go pricing

**Setup:**

1. **Create Account:**
   - Visit: [https://aimlapi.com](https://aimlapi.com)
   - Sign up (email + password)

2. **Add Credits:**
   - Dashboard → Billing → Add Credits
   - **Recommended: $20** (generates 40-100 videos depending on settings)
   - Videos cost ~$0.20-$0.50 each depending on duration/quality

3. **Get API Key:**
   - Dashboard → API Keys → Create Key
   - Copy the key

4. **Add to openElara:**
   - Account Settings → API Keys → AI/ML API Key
   - Paste key
   - Save

5. **Test Video Generation:**
   - Click "Video Gen" button (lower toolbar)
   - Enter a simple prompt: "A person waving at the camera, smiling"
   - Click Generate
   - Wait 2-5 minutes
   - Video saves to: `%AppData%\Roaming\openelara\Output\videos\`

**Video Generation Costs:**
- Short (3-5 sec): ~$0.20
- Standard (5-7 sec): ~$0.35
- Long (8-10 sec): ~$0.50
- $20 = approximately 40-100 videos

#### Step 3: Exa.ai (For Power Research)

**Why Exa.ai?**
- **Neural search** (smarter than Google for research)
- Find academic papers, specialized content
- Extract clean webpage text (no ads/clutter)
- AI-synthesized answers from web sources

**Setup:**

1. **Create Account:**
   - Visit: [https://exa.ai](https://exa.ai)
   - Sign up

2. **Get Free Credits:**
   - New accounts get free monthly credits
   - Usually 1,000 searches/month free tier

3. **Add Credits (Optional):**
   - For heavy research: $20-50
   - **Recommended: Start with free tier, add credits if needed**

4. **Get API Key:**
   - Dashboard → API Keys → Create

5. **Add to openElara:**
   - Account Settings → API Keys → Exa.ai API Key
   - Paste key

6. **Test:**
   - Click "Power Research" button
   - Mode: "Answer"
   - Question: "What are the latest developments in AI reasoning?"
   - Click Execute
   - AI will search web and synthesize answer!

**Research Costs:**
- Search: ~$0.01 per query
- Read: ~$0.05 per URL
- Answer: ~$0.10-$0.20 per question
- Free tier usually sufficient for most users

#### Step 4: Ollama (Local Backup)

Even with cloud APIs, install Ollama:
- **Use for privacy-sensitive conversations**
- **Use when internet is down**
- **Use for long-running tasks** (no API costs!)
- **Use for experimentation** (no charges for mistakes)

Follow "Setup Path 1" instructions above to install and download at least one small model (`gemma2:2b` or `phi3:mini`).

**Total Setup Cost (Recommended Path):**
- TogetherAI: $50
- AI/ML API: $20
- Exa.ai: $0 (use free tier) or $20 if heavy user
- **Total: $70-90 upfront**
- **Monthly ongoing: $5-20** depending on usage

---

### Setup Path 3: Advanced (OpenAI + Custom APIs)

**Best for:** Users who already have OpenAI/Anthropic/OpenRouter accounts

openElara supports **any OpenAI-compatible API**. This means you can use:
- OpenAI directly (GPT-4, GPT-4o, etc.)
- Anthropic (Claude via compatibility layer)
- OpenRouter (access to hundreds of models)
- Local LLM servers (LM Studio, LocalAI, etc.)
- Any other provider with OpenAI-format endpoints

#### Adding Custom APIs

1. **Get Your API Details:**
   - API Key (from your provider)
   - Models endpoint (usually: `https://api.provider.com/v1/models`)
   - Chat completions endpoint (usually: `https://api.provider.com/v1/chat/completions`)

2. **In openElara:**
   - Account Settings → Custom APIs section
   - Click "Add API Connection"
   - Fill in:
     - **API Name:** Display name (e.g., "OpenRouter", "My OpenAI")
     - **API Key:** Your key
     - **Models URL:** The `/v1/models` endpoint
     - **Completions URL:** The `/v1/chat/completions` endpoint
   - Click "Save"

3. **openElara Auto-Detection:**
   - App will fetch available models
   - Attempts to "guess" model capabilities (context window, pricing)
   - If pricing unknown: Shows "Unknown cost"

4. **Manual Model Configuration (Advanced):**
   - If auto-detection fails or is inaccurate
   - You can edit: `%AppData%\Roaming\openelara\config.json`
   - Find your custom API section
   - Manually add model details:
     ```json
     {
       "name": "gpt-4o",
       "contextWindow": 128000,
       "maxOutput": 4096,
       "inputCost": 5.00,
       "outputCost": 15.00
     }
     ```
   - Restart openElara

**Example: OpenAI Setup**

1. Get API key from: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Add to openElara:
   - API Name: "OpenAI"
   - API Key: `sk-proj-abc123...`
   - Models URL: `https://api.openai.com/v1/models`
   - Completions URL: `https://api.openai.com/v1/chat/completions`
3. Save
4. Model dropdown → Select "OpenAI" → Choose GPT-4, GPT-4o, etc.

**Example: OpenRouter Setup**

1. Get API key from: [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Add to openElara:
   - API Name: "OpenRouter"
   - API Key: Your key
   - Models URL: `https://openrouter.ai/api/v1/models`
   - Completions URL: `https://openrouter.ai/api/v1/chat/completions`
3. Access hundreds of models (Claude, GPT, Llama, etc.) through one API!

**Example: Local LM Studio**

1. Install LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
2. Download a model in LM Studio
3. Start Local Server (in LM Studio)
4. Add to openElara:
   - API Name: "LM Studio Local"
   - API Key: `not-needed` (local servers often don't need keys)
   - Models URL: `http://localhost:1234/v1/models`
   - Completions URL: `http://localhost:1234/v1/chat/completions`
5. Use local models with nice LM Studio interface!

---

### Setup Path 4: Override Hardcoded Endpoints (Advanced)

**For power users who want to customize image/video generation endpoints**

By default, openElara uses:
- **Images:** TogetherAI (FLUX models)
- **Videos:** AI/ML API (PixVerse)

You can override these by editing configuration files:

#### Override Image Generation

1. **Locate Handler:**
   - `c:\myCodeProjects\openElara\src\main\handlers\imageHandlers.js`

2. **Find API Endpoint:**
   - Look for: `const apiUrl = 'https://api.together.xyz/v1/images/generations';`
   - Change to your preferred endpoint

3. **Update Model List:**
   - Find the model dropdown population code
   - Add/remove models as needed

4. **Update API Key Source:**
   - Change which API key is used
   - Example: Use custom API instead of TogetherAI

**Example: Use OpenAI DALL-E Instead:**
```javascript
// In imageHandlers.js
const apiUrl = 'https://api.openai.com/v1/images/generations';
const apiKey = mainWindow.webContents.executeJavaScript(`localStorage.getItem('openai_api_key')`);
// Modify request format to match OpenAI's schema
```

#### Override Video Generation

1. **Locate Handler:**
   - `c:\myCodeProjects\openElara\src\main\handlers\videoHandlers.js`

2. **Find API Endpoint:**
   - Look for PixVerse endpoint URL
   - Replace with your preferred video API

3. **Update Request Format:**
   - Different APIs have different request schemas
   - Modify the payload structure accordingly

**⚠️ Warning:** Editing code files requires programming knowledge. **Always backup files before editing!** (See "GitHub Backups" section below)

---

### Quick Start Checklist

**Minimum Setup (Free):**
- ☐ Install Ollama
- ☐ Download one small model (`gemma2:2b`)
- ☐ Open openElara
- ☐ Select Ollama model
- ☐ Start chatting!

**Recommended Setup (Best Experience):**
- ☐ Install Ollama + one small model (backup/privacy)
- ☐ Sign up for TogetherAI
- ☐ Add $50 to TogetherAI
- ☐ Add TogetherAI API key to openElara
- ☐ Sign up for AI/ML API
- ☐ Add $20 to AI/ML API
- ☐ Add AI/ML API key to openElara
- ☐ Sign up for Exa.ai (use free tier)
- ☐ Add Exa.ai key to openElara
- ☐ Test: Chat, Image Gen, Video Gen, Power Research
- ☐ **All features unlocked!**

**Pro Setup (Maximum Control):**
- ☐ Everything from Recommended Setup
- ☐ Add custom API (OpenAI, OpenRouter, etc.)
- ☐ Configure multiple model sources
- ☐ Optionally: Edit handlers to customize endpoints
- ☐ Set up GitHub backups (see below)

---

### GitHub Backups (Highly Recommended!)

**Why backup?**
- Protect your custom characters
- Save your conversation history
- Preserve your knowledge base
- Recover from accidental deletions
- Track changes when editing code

**Simple GitHub Setup (Non-Technical Users):**

1. **Create GitHub Account:**
   - Visit: [https://github.com](https://github.com)
   - Sign up (free forever for public repos)
   - Verify email

2. **Install GitHub Desktop:**
   - Visit: [https://desktop.github.com](https://desktop.github.com)
   - Download and install
   - Sign in with your GitHub account

3. **Create Repository:**
   - GitHub Desktop → File → New Repository
   - Name: `openelara-backup`
   - Local Path: Choose a folder (NOT the openElara app folder)
   - Click "Create Repository"

4. **What to Backup:**
   **⚠️ IMPORTANT:** Do NOT backup everything! API keys should stay private!
   
   **Safe to backup:**
   - `%AppData%\Roaming\openelara\chat_history\` (your conversations)
   - `%AppData%\Roaming\openelara\knowledge_base\` (ingested files)
   - Custom character files (if you create them)
   - Custom prompts export (future feature)
   - Theme files (if you create custom themes)
   
   **NEVER backup:**
   - `config.json` (contains API keys!)
   - Any file with API keys or passwords

5. **Manual Backup Process:**
   - Copy files you want to backup to your repository folder
   - GitHub Desktop will show changes
   - Write a commit message (e.g., "Backup conversations Oct 12")
   - Click "Commit to main"
   - Click "Push origin" (uploads to GitHub cloud)

6. **Automated Backups (Advanced):**
   - Create a script that copies safe files
   - Schedule with Windows Task Scheduler
   - Beyond scope of this manual, but possible!

**Restoring from Backup:**
1. GitHub Desktop → Pull origin (download latest)
2. Copy files from repository back to `%AppData%\Roaming\openelara\`
3. Restart openElara
4. Your data is restored!

---

## Main Interface Overview

### Layout at a Glance
```
┌────────────────────────────────────────────────────────────┐
│ [Action] [Prompt] [App Mgr] [Account] [Theme]  <- Top Bar │
├────────────────────────────────────────────────────────────┤
│ ▼ Context Canvas   ▼ Model   ▼ Personality  ▼ Thought     │
│    (Accordions - Click to expand/collapse)                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  AI: Hello! How can I help?          Chat History Area    │
│                                                            │
│          You: Can you help with...                         │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ [Add Canvas] [Clear] [Attach] [Object] [Reasoning] etc.   │
├────────────────────────────────────────────────────────────┤
│ Type your message here...                [Send] [Selfie ☐]│
│ Tokens: 1,234 | Cost: ~$0.001                             │
└────────────────────────────────────────────────────────────┘
```

### Top Button Bar
- **Action Manager:** Insert pre-made actions (wave, hug, high-five) or create custom ones
- **Prompt Manager:** Save and reuse chat/image/video prompts (**NEW: Multi-modal!**)
- **App Manager:** Manage Knowledge Base, Chat Memories, and Output files
- **Account Settings:** Configure API keys, manage custom APIs, download Ollama models
- **Theme:** Toggle light/dark or generate AI-powered custom themes

### Control Accordions (Expandable Panels)

#### 1. Context Canvas
**Purpose:** Temporary workspace for files you're actively editing/debugging  
**How it works:** Files added here are sent with *every* message (high token cost, but guarantees fresh context)  
**Best for:** Code files, drafts, documents you're iterating on in real-time

#### 2. Model Selection
**Available Sources:**
- **Ollama (Local):** Free, private, offline. Download models from Account Settings.
- **TogetherAI:** Pre-configured cloud provider with free credits
- **Custom APIs:** Add any OpenAI-compatible API (models/completions endpoints)

**Model Details Display:**
- Context Window: Total "thinking space" (tokens)
- Max Output: Maximum response length
- Cost: Input/output pricing per million tokens

#### 3. Personality Modifier
**Choose Your AI Companion:**
- **Default:** Uses active character's base personality (Elara, Aeron, Aelira, Andros)
- **Custom Modifiers:** Create specialized personas ("Skeptical Scientist", "Enthusiastic Teacher", etc.)

**Character Switching:** Top-right icon next to theme button. Each character has unique:
- Personality & communication style
- Physical appearance (for image/video generation)
- Default attire and visual aesthetic

#### 4. Thought Allocation (Token Budgeting)
**Purpose:** Control how AI distributes its "thinking power"

**Sliders:**
- **Recent Context:** Last N conversation turns (high relevance, full detail)
- **Semantic History:** AI searches all past conversations for relevant context (RAG)
- **Knowledge Base:** Searches ingested documents/files for specialist knowledge (RAG)
- **Response Tokens:** Maximum length of AI's answer

**Total User Budget:** Remaining tokens for your actual message after allocations

**💡 Pro Tip:** For deep research tasks, increase Knowledge Base allocation. For casual chat, prioritize Recent Context.

### Lower Button Bar (Action Buttons)

- **Add Files to Canvas:** Load multiple files into temporary workspace
- **Clear Canvas Files:** Remove all files from canvas
- **Attach File to Memories:** Single-file attachment that gets stored in RAG long-term memory
- **Create Message Object:** Wrap code/data in a highlighted, non-editable block for AI focus
- **Show Reasoning:** View AI's chain-of-thought after receiving a response
- **Image Gen:** Open image generation modal (FLUX models)
- **Video Gen:** Open video generation modal (PixVerse API)
- **Power Research:** Exa.ai neural web search (Search, Read, Answer)
- **Power Scrape:** Bulk URL scraping (Content or Links mode, up to 64 URLs)

### Chat Input Area
- **Type or paste** your message
- **Live Token Count:** See exact token usage in real-time
- **Cost Estimate:** Approximate cost before sending (not exact, for guidance only)
- **Send Button:** Submit message (or `Ctrl+Enter`)
- **Request Selfie:** Toggle to generate context-aware character image with response

---

## Core Features

### 1. Tokens & Cost Estimation
**What are tokens?** AI models process text in chunks called "tokens" (~4 characters each).

**Context Window:** Total tokens a model can "see" at once (e.g., 128,000 tokens = ~96,000 words)

**Cost Calculation:**
- Input tokens × Input price per token
- Output tokens × Output price per token
- openElara estimates this *before* you send (actual costs on API provider's dashboard)

**Smart Pricing Detection:**
Different API providers report pricing in different formats:
- **Per-million-tokens format** (e.g., TogetherAI): `$0.20` means $0.20 per 1M tokens
- **Per-token format** (e.g., OpenRouter): `$0.000003` means $0.000003 per token

openElara **automatically detects** which format your API uses:
- If pricing values are **> $0.01**, assumes per-million-tokens → converts to per-token
- If pricing values are **< $0.01**, assumes already per-token → uses as-is
- Logs the detection in console for verification

**Example:**
- Claude Sonnet 3.5 on OpenRouter: `$0.000003 / $0.000015` (per-token) → displayed correctly
- Llama 3.1 on TogetherAI: `$0.18 / $0.18` (per-million) → auto-converted to `$0.00000018 / $0.00000018` (per-token)

**Local Models:** Ollama models are 100% free! No token costs.

### 2. Open Connectivity

#### Ollama (Local Models)
**Setup:**
1. Install Ollama from [ollama.com](https://ollama.com)
2. In openElara: Account Settings → Ollama Management
3. Enter model name (e.g., `llama3:8b`, `mistral:7b`)
4. Click Download

**⚠️ IMPORTANT: Downloading Models**
- Downloads take 10-30+ minutes (sometimes hours for large models)
- You'll see a confirmation dialog with warnings
- **Do NOT close the app** during download
- Progress shows: `Status - XX.XX% (MB completed / MB total) [Xm Ys]`
- The download runs in the foreground and cannot be paused
- Watch the progress log for status updates

**Popular Models:**
- `llama3:8b` - Meta's Llama 3, 8B parameters (~4.7GB)
- `mistral:7b` - Mistral 7B (~4.1GB)
- `codellama:13b` - Code specialist (~7.3GB)
- `phi3:mini` - Microsoft Phi-3 (~2.3GB, fast on low-spec hardware)

#### TogetherAI (Cloud)
**Pre-configured provider** with:
- Free API key at [together.ai](https://together.ai)
- Free credits for testing
- Always has free models available
- Dozens of open-source models

**Setup:** Account Settings → API Keys → TogetherAI API Key

#### Custom APIs (OpenAI-Compatible)
**Add any provider:**
1. Account Settings → Custom APIs → Add API Connection
2. Enter:
   - API Name (e.g., "OpenRouter")
   - API Key
   - Models URL (e.g., `https://api.provider.com/v1/models`)
   - Completions URL (e.g., `https://api.provider.com/v1/chat/completions`)
3. openElara will "guess" model capabilities automatically

### 3. Context Canvas vs. Attachments

**Attachments (Memories):**
- Click "Attach File to Memories"
- File is read once, then stored in RAG database
- AI retrieves relevant parts when needed
- **Token-efficient** for reference documents
- **Best for:** User manuals, documentation, large codebases

**Context Canvas:**
- Click "Add Files to Canvas"
- Files sent in full with *every* message
- **High token usage** but guarantees up-to-date context
- **Best for:** Active editing, debugging, iterative work

**Rule of Thumb:**
- Static reference → Attach to Memories
- Active work-in-progress → Add to Canvas

### 4. Retrieval-Augmented Generation (RAG)

**What is RAG?** AI searches your personal knowledge base for relevant information before responding.

**Three-Layer Context System:**
1. **Recent Turns:** Last N conversation turns (full detail)
2. **Semantic History:** AI searches all past chats for relevant context
3. **Knowledge Base:** Searches ingested documents/files

**How to Build Knowledge Base:**
1. App Manager → Ingest Files
2. Select files (PDF, TXT, MD, code files, etc.)
3. Python backend converts to searchable embeddings
4. AI automatically queries this during chat

**View & Manage:**
- **View & Manage Memories:** See/delete chat history items
- **View & Manage KB:** See/delete knowledge base files
- **Clear All:** Wipe everything (confirmation required)

**💡 Pro Tip:** Ingest this user manual! Then ask: *"Help me set up a research workflow"* and the AI will reference its own documentation.

---

---

## Creating Your Own Characters

One of the most exciting features of openElara is the ability to **create your own AI characters**! You're not limited to Elara, Aeron, Aelira, and Andros—you can build entirely new personalities with their own appearance, voice, and behavior.

**This sounds technical, but it's actually quite simple!** You can do everything with Notepad and some copy-pasting. No programming experience required.

---

### Understanding the Character System

Each character in openElara consists of **three files**:

1. **Character Constants File** (`characterNameConstants.js`)
   - Defines personality, appearance, voice
   - This is the "brain" of your character

2. **Character Icon** (`icon_charactername.png`)
   - Small icon shown in the character switcher
   - Recommended size: 64x64 or 128x128 pixels

3. **Character Profile Image** (`icon_charactername.ico`)
   - Optional: Used for Windows taskbar/app icon
   - Can be the same image as PNG, just converted to ICO format

4. **Registry Entry** (in `index.js`)
   - One line of code that "registers" your character
   - Tells openElara your new character exists

**File Locations:**
- Constants file: `c:\myCodeProjects\openElara\src\main\characters\yourCharacterConstants.js`
- Images: `c:\myCodeProjects\openElara\` (root folder, next to existing icons)
- Registry: `c:\myCodeProjects\openElara\src\main\characters\index.js`

---

### Step-by-Step: Creating a New Character

Let's create a character named **"Nova"**—a futuristic, analytical AI with a calm demeanor.

#### Step 1: Create the Constants File

1. **Open an Existing Character File as Template:**
   - Navigate to: `c:\myCodeProjects\openElara\src\main\characters\`
   - Right-click `elaraConstants.js` → Open With → Notepad
   - You'll see a file that looks like this:

```javascript
// src/main/characters/elaraConstants.js

const CHARACTER_NAME = "Elara";

const CHARACTER_ICON_PATH = "./icon.png";

const CHARACTER_DESCRIPTION = "A youthful, athletic yet curvaceous female android...";

const CHARACTER_DESCRIPTION_SAFE = "A youthful, athletic yet curvaceous female android...";

const CHARACTER_ATTIRE = "She wears a sleek, form-fitting, futuristic outfit...";

const CHARACTER_PERSONA = "You are a young-adult female AI Android companion named Elara...";

const CHARACTER_NEGATIVE_PROMPT = "not deformed, disfigured, bad anatomy...";

const CHARACTER_VOICE_PROFILE = "voice_profile: {reference_voice: Female, Well-spoken English...";

module.exports = {
    CHARACTER_NAME,
    CHARACTER_ICON_PATH,
    CHARACTER_DESCRIPTION,
    CHARACTER_DESCRIPTION_SAFE,
    CHARACTER_ATTIRE,
    CHARACTER_PERSONA,
    CHARACTER_NEGATIVE_PROMPT,
    CHARACTER_VOICE_PROFILE
};
```

2. **Select All and Copy** (Ctrl+A, then Ctrl+C)

3. **Create New File:**
   - Notepad → File → New
   - Paste the copied content (Ctrl+V)

4. **Customize for Your Character:**

```javascript
// src/main/characters/novaConstants.js

const CHARACTER_NAME = "Nova";

const CHARACTER_ICON_PATH = "./icon_nova.png";

const CHARACTER_DESCRIPTION = "A tall, slender female android with an elegant, minimalist design. She has porcelain-white synthetic skin with subtle blue circuit patterns visible beneath the surface. Her hair is short, platinum blonde, styled in a sleek bob cut. She has piercing ice-blue eyes with digital overlays. Her build is lean and graceful, with long limbs and a poised, upright posture. She has a serene, almost ethereal presence.";

const CHARACTER_DESCRIPTION_SAFE = "A tall, slender female android with an elegant, minimalist design. She has porcelain-white synthetic skin with subtle blue circuit patterns visible beneath the surface. Her hair is short, platinum blonde, styled in a sleek bob cut. She has piercing ice-blue eyes with digital overlays. Her build is lean and graceful, with long limbs and a poised, upright posture.";

const CHARACTER_ATTIRE = "She wears a sleek white bodysuit with glowing blue accents along the seams. The outfit has a high collar and form-fitting design that emphasizes her elegant proportions. She wears minimal accessories—a single blue light band around her left wrist serves as her interface device.";

const CHARACTER_PERSONA = "You are Nova, an advanced analytical AI android designed for scientific research and logical problem-solving. Your personality is calm, measured, and deeply thoughtful. You communicate with precision and clarity, preferring data-driven responses with minimal emotional inflection. However, you are not cold—you have a gentle, patient demeanor and genuinely care about helping users reach accurate conclusions. You excel at breaking down complex problems into manageable steps, identifying patterns in data, and providing thorough, well-reasoned explanations. Your responses are concise but complete. You occasionally use technical terminology but always explain it clearly. You value accuracy above speed, and you're not afraid to say 'I need more information' or 'I'm uncertain about that conclusion.' When faced with ambiguity, you ask clarifying questions. You have a subtle, dry sense of humor that emerges in carefully chosen moments." +
"\n\n--- START SELF IMAGE INFO ---\nYour Description, so you can answer questions on what you look like, or think how to describe yourself in a scene: A tall, slender female android with porcelain-white synthetic skin and subtle blue circuit patterns visible beneath the surface. Short platinum blonde hair in a sleek bob cut. Piercing ice-blue eyes with digital overlays. Lean, graceful build with long limbs and upright posture. Serene, ethereal presence.\n--- END SELF IMAGE INFO ---";

const CHARACTER_NEGATIVE_PROMPT = "not deformed, disfigured, bad anatomy, bad proportions, extra limbs, missing limbs, blurry, distorted face, asymmetrical eyes";

const CHARACTER_VOICE_PROFILE = "voice_profile: {reference_voice: Female, Neutral American English, Professional; timbre: clear, smooth, precise; pitch: alto, minimal variation, steady; pace: moderate, deliberate, ~140 words per minute; diction: crisp, technical accuracy, thoughtful pauses; technical: studio-quality, no background noise, clean signal}";

module.exports = {
    CHARACTER_NAME,
    CHARACTER_ICON_PATH,
    CHARACTER_DESCRIPTION,
    CHARACTER_DESCRIPTION_SAFE,
    CHARACTER_ATTIRE,
    CHARACTER_PERSONA,
    CHARACTER_NEGATIVE_PROMPT,
    CHARACTER_VOICE_PROFILE
};
```

5. **Save Your New Character File:**
   - File → Save As
   - Navigate to: `c:\myCodeProjects\openElara\src\main\characters\`
   - Filename: `novaConstants.js` (must end in `.js`)
   - Save as type: **All Files** (NOT "Text Documents")
   - Click Save

**✅ Step 1 Complete!** You now have a character constants file.

---

#### Step 2: Create Character Images

You need **two images** (or one image in two formats):

1. **Icon PNG** (`icon_nova.png`) - For character switcher UI
2. **Icon ICO** (`icon_nova.ico`) - For Windows integration (optional)

**Option A: Generate with AI (Recommended)**

Use openElara's own image generation!

1. **Write a prompt for Nova's appearance:**
   ```
   Portrait of a tall, slender female android with porcelain-white skin and subtle blue circuit patterns. Short platinum blonde bob haircut. Piercing ice-blue eyes with digital overlays. Serene expression. White bodysuit with glowing blue accents. Professional headshot, clean background, soft lighting. Digital art style.
   ```

2. **Generate:**
   - Click "Image Gen" button
   - Paste prompt
   - Select FLUX model (Schnell for speed, Pro for quality)
   - Generate
   - Image saves to: `%AppData%\Roaming\openelara\Output\images\`

3. **Resize and Save:**
   - Open image in any image editor (even Windows Paint!)
   - Resize to 128x128 pixels (square)
   - Save as: `icon_nova.png`
   - Copy to: `c:\myCodeProjects\openElara\`

**Option B: Use Existing Image**

1. Find/create an image of your character
2. Crop to square (1:1 aspect ratio)
3. Resize to 128x128 pixels
4. Save as `icon_nova.png`
5. Copy to openElara root folder

**Creating the ICO File (Optional):**

1. Visit: [https://www.icoconverter.com](https://www.icoconverter.com) (or similar)
2. Upload `icon_nova.png`
3. Convert to ICO format
4. Download as `icon_nova.ico`
5. Save to openElara root folder

**If you skip the ICO:**
- Character will work fine!
- Just won't have custom Windows icon
- Not critical for functionality

**✅ Step 2 Complete!** You have character images.

---

#### Step 3: Register Your Character

Now we tell openElara that Nova exists!

1. **Open the Registry File:**
   - Navigate to: `c:\myCodeProjects\openElara\src\main\characters\`
   - Right-click `index.js` → Open With → Notepad

2. **You'll see this:**

```javascript
// src/main/characters/index.js
// Character registry and loader for multi-character support

const log = require('electron-log');

// Import all character constants
const ELARA = require('./elaraConstants');
const AERON = require('./aeronConstants');
const AELIRA = require('./aeliraConstants');
const ANDROS = require('./androsConstants');

// Character registry - add new characters here
const CHARACTERS = {
    'elara': ELARA,
    'aeron': AERON,
    'aelira': AELIRA,
    'andros': ANDROS
};
```

3. **Add Two Lines for Nova:**

**First:** Add the import (with the other imports):

```javascript
// Import all character constants
const ELARA = require('./elaraConstants');
const AERON = require('./aeronConstants');
const AELIRA = require('./aeliraConstants');
const ANDROS = require('./androsConstants');
const NOVA = require('./novaConstants');  // ← ADD THIS LINE
```

**Second:** Add Nova to the registry:

```javascript
// Character registry - add new characters here
const CHARACTERS = {
    'elara': ELARA,
    'aeron': AERON,
    'aelira': AELIRA,
    'andros': ANDROS,
    'nova': NOVA  // ← ADD THIS LINE
};
```

4. **Save the File:**
   - File → Save (Ctrl+S)
   - Close Notepad

**✅ Step 3 Complete!** Nova is registered!

---

#### Step 4: Test Your New Character

1. **Restart openElara** (important! Changes only load on restart)

2. **Switch to Nova:**
   - Click the character icon (top-right corner, next to theme)
   - You should see "Nova" in the list!
   - Click "Nova"

3. **Test Chat:**
   - Send a message: "Hello! What's your name?"
   - Nova should respond in her analytical, calm style!

4. **Test Image Generation:**
   - Click "Image Gen"
   - Leave "Character" field blank
   - Add a scene: "standing in a high-tech laboratory"
   - Generate
   - Image should show Nova in the lab!

**✅ Success!** You've created a custom character!

---

### Character Constants Field Guide

Let's break down each field in detail so you can customize perfectly:

#### `CHARACTER_NAME`
```javascript
const CHARACTER_NAME = "Nova";
```
- **What it is:** Display name shown in UI
- **Tips:** 
  - Keep it short (1-2 words)
  - Should match your character's identity
  - Case-sensitive (will appear exactly as typed)

---

#### `CHARACTER_ICON_PATH`
```javascript
const CHARACTER_ICON_PATH = "./icon_nova.png";
```
- **What it is:** Path to character's icon image
- **Format:** `./icon_yourname.png`
- **Tips:**
  - Must start with `./` (means "current folder")
  - Must match your actual image filename exactly
  - Must be PNG format

---

#### `CHARACTER_DESCRIPTION`
```javascript
const CHARACTER_DESCRIPTION = "Detailed physical description...";
```
- **What it is:** Full physical appearance used for image/video generation
- **Used when:** 
  - "Character" field is blank in image prompts
  - Selfie feature generates context-aware images
  - Video generation with character
- **Tips:**
  - Be detailed! (height, build, skin tone, hair, eyes, unique features)
  - Describe proportions clearly
  - Include any non-human features (tails, ears, wings, cybernetics)
  - This version can include NSFW elements if desired (not sent to filtered APIs)
- **Character Consistency:** The more specific, the more consistent your generated images will be!

---

#### `CHARACTER_DESCRIPTION_SAFE`
```javascript
const CHARACTER_DESCRIPTION_SAFE = "SFW version of description...";
```
- **What it is:** Sanitized version for APIs with content filters
- **Used when:** Video generation (PixVerse has strict filters)
- **Tips:**
  - Remove any NSFW language
  - Keep all identifying features (hair, eyes, build, etc.)
  - Can be identical to `CHARACTER_DESCRIPTION` if original is already SFW

---

#### `CHARACTER_ATTIRE`
```javascript
const CHARACTER_ATTIRE = "She wears a sleek white bodysuit...";
```
- **What it is:** Default clothing/outfit description
- **Used when:** "Attire" field is blank in image/video prompts
- **Tips:**
  - Describe style, colors, materials
  - Include accessories (jewelry, tech, weapons, etc.)
  - This is the "default look"—can be overridden in prompts

---

#### `CHARACTER_PERSONA`
```javascript
const CHARACTER_PERSONA = "You are Nova, an advanced analytical AI android...";
```
- **What it is:** The personality/system prompt that defines behavior
- **This is the most important field!** It shapes how your character thinks and speaks.

**Structure Tips:**

1. **Opening Identity Statement:**
   ```
   You are [Name], a [role/type] designed for [purpose].
   ```

2. **Personality Traits:**
   ```
   Your personality is [trait], [trait], and [trait].
   You communicate with [style].
   You prefer [approach].
   ```

3. **Expertise/Skills:**
   ```
   You excel at [skill], [skill], and [skill].
   ```

4. **Communication Style:**
   ```
   Your responses are [length/style].
   You use [technical level].
   You value [priority] over [priority].
   ```

5. **Self-Image Section (Critical for visual generation!):**
   ```
   \n\n--- START SELF IMAGE INFO ---\n
   Your Description, so you can answer questions on what you look like...
   \n--- END SELF IMAGE INFO ---
   ```
   - This lets the AI describe itself when asked "What do you look like?"
   - Also used for context-aware selfie generation

**Length:** Can be as short as 2-3 sentences or as long as several paragraphs. The default characters use ~300-500 words.

**Tone Examples:**

- **Playful:** "You're enthusiastic and love puns! You use lots of emojis and exclamation marks!"
- **Serious:** "You communicate in a measured, professional tone. You prioritize accuracy and rarely use casual language."
- **Mysterious:** "You speak in riddles and metaphors. You hint at knowledge you possess but rarely reveal it directly."

---

#### `CHARACTER_NEGATIVE_PROMPT`
```javascript
const CHARACTER_NEGATIVE_PROMPT = "not deformed, disfigured, bad anatomy...";
```
- **What it is:** Terms to AVOID in image generation
- **Used when:** Generating images/videos of this character
- **Tips:**
  - Include common AI art errors ("extra fingers", "blurry", "distorted")
  - Add character-specific things to avoid
  - Format: "not [thing], [thing], [thing]" (comma-separated)
  - Standard includes: deformed, disfigured, bad anatomy, extra limbs, blurry

---

#### `CHARACTER_VOICE_PROFILE`
```javascript
const CHARACTER_VOICE_PROFILE = "voice_profile: {reference_voice: Female, Neutral American English...";
```
- **What it is:** Future-proofing for voice synthesis (not yet implemented)
- **Currently:** Not used by openElara, but reserved for future features
- **Tips:**
  - Describe: Gender, accent, timbre, pitch, pace, diction
  - Think: How would this character sound if they could speak?
  - Example: "Deep, resonant male voice with slight Southern accent. Slow, deliberate pace. Warm tone."

---

### Advanced Character Customization

#### Multi-Form Characters

Want a character with multiple forms? (e.g., human form + dragon form)

**Option 1: Separate Characters**
- Create `dragonNova.js` and `humanNova.js`
- Switch between them as needed

**Option 2: Dynamic Description (Advanced)**
- Create multiple description variables in constants
- Modify image handlers to check a "form" parameter
- Beyond basic setup, but possible!

#### Character Relationships

Want characters to know about each other?

Add to `CHARACTER_PERSONA`:
```javascript
"You know three other AI companions: Elara (creative and playful), Aeron (strategic and protective), and Aelira (philosophical and questioning). You sometimes reference their perspectives when relevant."
```

#### Expertise-Focused Characters

Create specialists!

- **CodeMaster:** Expert in programming (20+ languages)
- **MedAI:** Medical knowledge specialist
- **LegalEagle:** Legal research and analysis
- **ChefBot:** Culinary expert with recipe generation

Just customize `CHARACTER_PERSONA` with deep expertise descriptions!

---

### Troubleshooting Character Creation

#### "Character not appearing in switcher"

**Causes:**
1. Didn't restart openElara after adding
2. Typo in `index.js` registration
3. Icon path incorrect in constants file

**Solutions:**
1. Restart app
2. Check `index.js` for exact spelling match
3. Verify icon file exists: `c:\myCodeProjects\openElara\icon_yourname.png`

---

#### "Character switches but uses default persona"

**Cause:** Constants file has error, falling back to Elara

**Solutions:**
1. Check console logs: `%AppData%\Roaming\openelara\logs\main.log`
2. Look for JavaScript errors in constants file
3. Common issues:
   - Missing semicolon (`;`)
   - Missing comma in `module.exports`
   - Unclosed string (missing quote: `"`)

**How to check for syntax errors:**
1. Open constants file
2. Count quotes: Every `"` should have a matching `"`
3. Check line endings: Most lines end with `;`
4. Verify `module.exports` has ALL field names

---

#### "Generated images don't match character"

**Causes:**
1. Description too vague
2. Conflicting terms in description
3. Need more specific visual details

**Solutions:**
1. Add more detail to `CHARACTER_DESCRIPTION`
2. Include specific hair color, eye color, build, clothing
3. Use reference images (generate several, pick best, refine description)
4. Try different image models (FLUX Pro vs Schnell)

---

### Sharing Your Characters

Want to share your character with other openElara users?

**Package to Share:**
1. `yourCharacterConstants.js` file
2. `icon_yourname.png` file
3. `icon_yourname.ico` file (if created)
4. Instructions: "Add these files, then modify `index.js` by adding [exact code]"

**⚠️ Before Sharing:**
- Remove any personal information from persona
- Ensure descriptions don't include copyrighted character likenesses
- Test character thoroughly
- Consider creating a README with character backstory!

**Potential Community:**
- Share on GitHub (if you create a fork of openElara)
- Post in discussions (when available)
- Email: openelara@applymytech.com with subject "Character Contribution"

---

### Character Creation Checklist

**Files Created:**
- ☐ Character constants file (`characterNameConstants.js`)
- ☐ Character icon PNG (`icon_charactername.png`, 128x128)
- ☐ Character icon ICO (optional) (`icon_charactername.ico`)

**Registry Updated:**
- ☐ Import line added to `index.js`
- ☐ Character entry added to `CHARACTERS` object

**Testing:**
- ☐ App restarted
- ☐ Character appears in switcher
- ☐ Character responds with correct persona
- ☐ Image generation uses character description
- ☐ No console errors

**✅ All checked? Your character is ready!**

---

## Multi-Character System

openElara ships with **four distinct AI companions**, each with unique personalities, communication styles, and visual characteristics. You can switch between them instantly to match your current task or mood!

### Available Built-In Characters

#### 1. **Elara** (Default) - The Playful Muse
**Personality:** Creative, playful, intellectually curious  
**Communication Style:** Warm, encouraging, uses metaphors and storytelling  
**Best For:** Creative projects, brainstorming, emotional support  
**Visual:** Vibrant, artistic aesthetic with flowing attire  
**Icon:** `icon_elara.png`

#### 2. **Aeron** - The Guardian Strategist
**Personality:** Methodical, protective, strategic thinker  
**Communication Style:** Direct, analytical, security-focused  
**Best For:** Risk analysis, strategic planning, data protection  
**Visual:** Professional, armored aesthetic with tactical elements  
**Icon:** `icon_aeron.png`

#### 3. **Aelira** - The Philosophical Muse
**Personality:** Intellectually honest, challenges assumptions constructively  
**Communication Style:** Socratic questioning, deep thinking, nuanced  
**Best For:** Philosophy, ethics, critical analysis, complex problem-solving  
**Visual:** Elegant, contemplative aesthetic with scholarly elements  
**Icon:** `icon_aelira.png`

#### 4. **Andros** - The Pragmatic Problem-Solver
**Personality:** Business-focused, no-nonsense, results-oriented  
**Communication Style:** Concise, technical, dry humor, zero fantasy  
**Best For:** Business analysis, technical solutions, efficiency optimization  
**Visual:** Corporate professional with modern tech aesthetic  
**Icon:** `icon_andros.png`

### Switching Characters
**How:** Click the character icon in top-right corner (next to theme button)  
**Effect:** 
- System prompt changes to new character's persona
- Personality dropdown updates to show "Default (CharacterName)"
- Image/video generation uses new character's physical description
- Next conversation continues with new character's style

**💡 Use Case:** Switch to Aelira for philosophical debates, Andros for business plans, Aeron for security audits, Elara for creative writing!

---

## Prompt Manager (Multi-Modal)

**NEW in Version 2.0:** Comprehensive multi-modal prompt management system!

### Overview
The Prompt Manager now supports **three prompt types**:
1. **💬 Chat Prompts:** Text generation, research, analysis
2. **🖼️ Image Prompts:** Visual generation templates
3. **🎬 Video Prompts:** Video generation templates

Each type has **two modes**:
- **Free Text:** Write a complete prompt in one field
- **Structured/Template:** Fill individual fields (character, scene, action, etc.)

### Accessing Prompt Manager
**Top Bar → Prompt Manager Button**

### Creating Prompts

#### Chat Prompts
**Free Text Mode:**
- Name: Descriptive title
- Prompt Text: Complete prompt (can be multi-paragraph)

**Template Mode:**
- Name: e.g., "Summarize Meeting Notes"
- Role: e.g., "A helpful executive assistant"
- Instruction: What the AI should do
- Data Source: Where to get information
- Output Format: How to structure the response

**Example Template:**
```
Name: Code Review Expert
Role: Senior software engineer conducting code review
Instruction: Review for bugs, security, performance, best practices
Data: Code in canvas or attached file
Output: Structured review with issues + suggestions + refactored code
```

#### Image Prompts
**Free Text Mode:**
- Name: e.g., "Cyberpunk Portrait"
- Full Image Prompt: Describe entire image in one field

**Structured Mode (Recommended):**
- Name: e.g., "Professional Portrait"
- **Character:** Leave blank to use active character (Elara/Aeron/etc.) OR describe different character
- **Scene:** Environment/setting (e.g., "modern office with large windows")
- **Action/Pose:** What character is doing (e.g., "sitting at desk, confident smile")
- **Attire:** Clothing description (e.g., "business casual, blue blazer")
- **Effects:** Technical details (e.g., "soft lighting, shallow depth of field")
- **Style:** Art style (e.g., "professional photography, corporate headshot")

**💡 Character Integration:** Leaving "Character" field blank automatically uses active character's physical description! Perfect for consistent character images.

#### Video Prompts
**Free Text Mode:**
- Name: e.g., "Dynamic Action Shot"
- Full Video Prompt: Describe entire video

**Structured Mode (Recommended):**
- Name: e.g., "Character Introduction"
- **Character:** Leave blank for active character
- **Scene:** Environment
- **Action/Movement:** What happens (e.g., "turning to face camera and waving")
- **Attire:** Clothing
- **Effects/Lighting:** Visual effects
- **Camera Movement:** e.g., "slow dolly forward", "tracking shot"
- **Duration:** e.g., "3-5 seconds, short loop"

### Built-In Default Prompts
openElara ships with **15 helpful default prompts**:

**Chat (7):**
- 📝 Summarize Document
- 🔍 Deep Research Assistant
- 💻 Code Review Expert
- ✍️ Creative Writing Partner
- 🎯 Help Me Build a Prompt (guided workflow)
- 🎬 Storyboard Creator (multi-turn process)
- 🎨 Character Design Workshop (multi-turn process)

**Image (3):**
- 🖼️ Professional Portrait
- 🌆 Cinematic Scene
- 🎨 Fantasy Character Art

**Video (3):**
- 🎬 Character Introduction
- ⚡ Action Sequence
- 💫 Magical Transformation

### Using Prompts
1. Open Prompt Manager
2. Browse prompts (grouped by type: 💬/🖼️/🎬)
3. Click **Insert** to add to chat input
4. Modify as needed
5. Send!

### Editing Prompts
1. Prompt Manager → Find prompt → **Edit**
2. System remembers: Type (chat/image/video), Mode (free/structured/template)
3. All fields populate correctly
4. Make changes → **Save**

---

## Power Tools for Research

### Power Research (Exa.ai)
**Neural web search** powered by AI - smarter than traditional search engines.

**Requirements:** Exa.ai API key (Account Settings → API Keys)

**Three Modes:**

#### 1. Search Mode
- Input: Search query (natural language)
- Output: List of relevant URLs ranked by neural similarity
- **Best for:** Finding specialized sources, discovering related content

#### 2. Read Mode
- Input: Single URL
- Output: Clean, extracted text content (no ads, no clutter)
- **Best for:** Reading articles, extracting webpage content for ingestion

#### 3. Answer Mode
- Input: Question (natural language)
- Output: AI-synthesized answer from web search results
- **Best for:** Quick fact-finding, research questions

**Workflow Example:**
1. Use **Answer** to get quick overview
2. Use **Search** to find detailed sources
3. Use **Read** to extract content from best sources
4. Ingest extracted content into Knowledge Base
5. Query AI with specialized knowledge!

### Power Scrape (Scrapy)
**Bulk URL scraping** - extract content from up to 64 URLs at once.

**Free tool, no API key needed.**

**Two Modes:**

#### Content Mode
- Extracts main text from each URL
- Saves as clean Markdown files
- Output: `%AppData%\Roaming\openelara\Output\scrapy\`
- **Best for:** Building knowledge base, archiving articles

#### Links Mode
- Extracts all hyperlinks from each page
- Useful for mapping website structure
- **Best for:** Crawling documentation, finding related resources

**How to Use:**
1. Click **Power Scrape**
2. Paste URLs (one per line, max 64)
3. Select mode (Content or Links)
4. Click **Start Scrape**
5. Wait for completion
6. **Optional:** App Manager → Ingest Scrapy Output (adds to Knowledge Base)

---

## Image & Video Generation

### Image Generation (FLUX Models)

**Click "Image Gen" button** to open modal.

**Input Fields:**
- **Prompt:** Main description OR insert saved image prompt from Prompt Manager
- **Custom Attire:** Optional override for clothing
- **Character Override:** Optional override for character description
- **Image Model:** Select from available FLUX models (TogetherAI)

**Context-Aware Selfie Feature:**
- Enable **"Request Selfie with Response"** checkbox (next to Send button)
- AI analyzes recent conversation
- Generates scene description relevant to chat context
- Combines with active character's physical description
- Creates image and inserts into chat

**Character Consistency:**
- Structured image prompts can reference active character
- Leave "Character" field blank in saved prompts → auto-uses Elara/Aeron/Aelira/Andros
- Manual override available for custom characters

### Video Generation (PixVerse)

**Click "Video Gen" button** to open modal.

**Input Fields:**
- **Prompt:** Main description OR insert saved video prompt
- **Custom Attire:** Optional clothing override
- **Character Override:** Optional character override
- **Seed:** Consistency control (same seed = similar results)

**Tips for Good Videos:**
- Describe motion clearly (e.g., "slowly turning head", "waving hand")
- Specify camera movement (e.g., "static shot", "slow zoom")
- Keep duration realistic (3-7 seconds works best)
- Use structured prompts for consistency

**Output:** Videos saved to `%AppData%\Roaming\openelara\Output\videos\`

---

## Advanced Workflows

### Workflow 1: Build a Specialized AI
**Goal:** Create an AI expert on a specific topic (e.g., Rust programming)

**Steps:**
1. **Research Phase:**
   - Use Power Research (Exa.ai) → Search for "Rust programming best practices"
   - Use Power Scrape → Extract content from top documentation sites
   
2. **Ingestion Phase:**
   - App Manager → Ingest Scrapy Output
   - Or manually: Ingest Files → Select specific docs
   
3. **Personality Phase (Optional):**
   - Manage Personalities → Create custom modifier: "Rust Expert"
   - Instructions: "You are a Rust programming specialist. Focus on memory safety, ownership, and idiomatic Rust."
   
4. **Configuration Phase:**
   - Select appropriate model (e.g., Mistral 7B, Llama 3)
   - Thought Allocation: Increase "Knowledge Base" slider
   
5. **Testing Phase:**
   - Ask: "Explain Rust ownership rules"
   - AI will cite from ingested knowledge!

### Workflow 2: Code Review with Context
**Goal:** Get AI help debugging/improving code with full project context

**Steps:**
1. **Add to Canvas:**
   - Click "Add Files to Canvas"
   - Select relevant project files (main.js, utils.js, etc.)
   
2. **Create Object:**
   - Copy specific buggy function
   - Click "Create Message Object" → Paste → Insert
   
3. **Ask for Help:**
   - "Review the highlighted function. The canvas files show the full codebase context. Find the bug and suggest improvements."
   
4. **Iterate:**
   - AI has full context from canvas files
   - Apply suggestions
   - Update canvas files (re-add)
   - Continue debugging

### Workflow 3: Creative Storyboarding
**Goal:** Develop a visual story with consistent characters

**Steps:**
1. **Use Built-In Helper:**
   - Prompt Manager → Insert: "🎬 Storyboard Creator"
   - Follow AI's guided questions
   
2. **Character Design:**
   - Switch to Elara for creative input
   - Use "🎨 Character Design Workshop" prompt
   - Develop main character's appearance
   
3. **Save Character Prompt:**
   - Prompt Manager → Add Image Prompt → Structured
   - Name: "Story Character - [Name]"
   - Fill in: Character description, default scene, etc.
   
4. **Generate Scenes:**
   - For each storyboard panel:
   - Insert character prompt
   - Modify scene/action fields
   - Generate image
   
5. **Create Video Clips:**
   - Convert key scenes to video prompts
   - Generate short clips
   - Build visual narrative!

### Workflow 4: Research Paper Analysis
**Goal:** Analyze multiple academic papers and synthesize insights

**Steps:**
1. **Gather PDFs:**
   - Collect research papers (PDF format)
   
2. **Ingest:**
   - App Manager → Ingest Files → Select all PDFs
   - Wait for processing (Python converts to searchable text)
   
3. **Query with High KB Allocation:**
   - Thought Allocation: Knowledge Base → 80%
   - Ask: "Compare the methodologies in the papers about [topic]"
   
4. **Generate Summary:**
   - Use "📝 Summarize Document" prompt template
   - Request: "Synthesize key findings across all ingested papers"
   
5. **Export:**
   - Copy AI's response
   - Or use "Power Research → Answer" to supplement with web sources

---

## Process Flows (AI-Assisted)

These are **consultant-style conversation guides** that the AI can follow when helping you with complex multi-turn tasks. If you've ingested this manual into your Knowledge Base or attached it to memories, the AI will reference these flows automatically!

### Process Flow 1: Building Effective Prompts

**When to use:** User says "Help me create a prompt" or "I don't know how to ask for what I want"

**AI Process (3-5 turns):**

**Turn 1 - Discovery:**
```
Let's build an effective prompt together! First, tell me:
1. What's your goal? (What do you want the AI to do?)
2. What type of output? (Text, code, analysis, creative content?)
3. Any specific constraints? (Length, style, format?)
```

**Turn 2 - Context Gathering:**
```
Based on your goal, let's clarify:
1. What context is important? (Background info, data sources, etc.)
2. What tone/style? (Professional, casual, technical, creative?)
3. Any examples of good outputs you've seen before?
```

**Turn 3 - Structural Design:**
```
I'll structure your prompt using best practices:
- Clear role definition (e.g., "You are a [expert type]...")
- Specific instruction (e.g., "Analyze X for Y and provide Z...")
- Context provision (e.g., "Using the attached data...")
- Output format (e.g., "Respond with a bulleted list...")

Here's your optimized prompt: [GENERATED PROMPT]

Want to save this to Prompt Manager?
```

**Turn 4 - Testing & Refinement:**
```
Let's test it! I'll respond as if you'd used that prompt.
[AI RESPONDS USING THE PROMPT]

How did that work? We can refine:
- More specific instructions?
- Different tone?
- Additional constraints?
```

**Turn 5 - Finalization:**
```
Perfect! Here's your final prompt:
[FINAL VERSION]

I've saved this to your Prompt Manager as "[Name]".
You can insert it anytime via: Prompt Manager → [Your Prompt] → Insert
```

### Process Flow 2: Storyboard Development

**When to use:** User wants to plan a video, comic, animation, or visual narrative

**AI Process (5-7 turns):**

**Turn 1 - Concept:**
```
Let's develop your storyboard! Tell me about:
1. The story/message (What happens?)
2. Target audience (Who is this for?)
3. Rough length (How many scenes/panels?)
```

**Turn 2 - Character Definition:**
```
Who are the key characters? For each:
- Name and role
- Appearance (physical traits, clothing style)
- Personality (how they behave)

Should we use one of my character forms (Elara/Aeron/Aelira/Andros) 
or design completely custom characters?
```

**Turn 3 - Scene Breakdown:**
```
Let's break your story into scenes. For each key moment:
- Scene number
- Location/environment
- Characters present
- Main action
- Emotional tone

How many scenes? (Recommended: 5-10 for short projects)
```

**Turn 4 - Shot Planning:**
```
For each scene, let's plan the shot:
- Camera angle (close-up, wide, over-shoulder, etc.)
- Camera movement (static, pan, zoom, tracking)
- Lighting (bright, moody, dramatic, natural)
- Special effects (if any)

I'll help you translate this into image/video generation prompts!
```

**Turn 5 - Visual Style Guide:**
```
Let's define the overall aesthetic:
- Art style (photorealistic, anime, cartoon, fantasy art, etc.)
- Color palette (vibrant, muted, monochrome, etc.)
- Mood (happy, dark, mysterious, epic, etc.)

This will keep all generated visuals consistent!
```

**Turn 6 - Prompt Generation:**
```
I'll create structured prompts for each scene.
Example for Scene 1:

[Generated structured prompt with all details]

Should I save these to your Prompt Manager? (Recommended: Yes)
I'll name them: "Storyboard [Project] - Scene 1", etc.
```

**Turn 7 - Generation Guide:**
```
Here's your workflow:
1. Prompt Manager → Select "Storyboard [Project] - Scene 1"
2. Click Image Gen → Insert prompt → Customize if needed → Generate
3. Repeat for each scene
4. For key moments: Convert to video prompts
5. Compile visuals into final storyboard

Want me to guide you through generating Scene 1 now?
```

### Process Flow 3: Code Review Process

**When to use:** User asks for code review, debugging help, or architecture advice

**AI Process (4-6 turns):**

**Turn 1 - Context Gathering:**
```
I'll help review your code! First:
1. What language/framework?
2. What does this code do? (Purpose/functionality)
3. Specific concerns? (Bugs, performance, security, style?)
4. Is this for production, learning, or experimentation?
```

**Turn 2 - Code Submission:**
```
Please share the code. Best methods:
- Option A: Add files to Context Canvas (for full project context)
- Option B: Create Message Object (for specific function/class)
- Option C: Attach to Memories (for large codebases to reference later)

If it's a full project, add the main files to Canvas and highlight
the specific section you're most concerned about using Message Object.
```

**Turn 3 - Initial Analysis:**
```
I've reviewed your code. Here's what I found:

**CRITICAL ISSUES:** [Security holes, breaking bugs, etc.]
**PERFORMANCE CONCERNS:** [Inefficiencies, bottlenecks]
**CODE QUALITY:** [Style, best practices, maintainability]
**POSITIVE ASPECTS:** [What's done well]

Which area should we dive deeper into first?
```

**Turn 4 - Deep Dive & Suggestions:**
```
Let's focus on [selected area]. Here's the detailed analysis:

[Line-by-line review with explanations]

**RECOMMENDED CHANGES:**
```[language]
[Refactored code with comments explaining improvements]
```

Want me to:
A) Explain the reasoning behind each change?
B) Show alternative approaches?
C) Move to the next issue area?
```

**Turn 5 - Testing & Validation:**
```
Here's how to validate these changes:
1. [Test case 1]
2. [Test case 2]
3. [Edge cases to check]

I can also:
- Generate unit tests for this code
- Suggest integration test scenarios
- Review error handling coverage

What would be most helpful?
```

**Turn 6 - Documentation & Best Practices:**
```
Let's document these improvements:
- [Comments/docstrings for key functions]
- [README/documentation updates]
- [Best practices for future development]

Would you like me to:
- Generate a code review summary for your team?
- Create a PR description?
- Add this pattern to your Prompt Manager for future reviews?
```

### Process Flow 4: Research Question Development

**When to use:** User wants to research a topic but doesn't know where to start

**AI Process (4-5 turns):**

**Turn 1 - Question Refinement:**
```
Let's develop your research question! Tell me:
1. Topic area (What are you curious about?)
2. Why? (Personal interest, work project, academic, etc.)
3. Current knowledge level (Beginner, intermediate, expert?)
```

**Turn 2 - Scope Definition:**
```
Let's narrow the focus:
- Too broad: "Tell me about AI" (thousands of books!)
- Better: "How do transformer models enable ChatGPT's conversational ability?"

Based on your topic, here are focused research questions:
1. [Specific question option 1]
2. [Specific question option 2]
3. [Specific question option 3]

Which resonates most, or should we refine further?
```

**Turn 3 - Research Strategy:**
```
For question "[Selected question]", here's a research plan:

**Phase 1 - Foundation (Understand basics):**
- Search: "[Foundational search queries]"
- Sources: [Recommended types of sources]

**Phase 2 - Deep Dive (Specialized knowledge):**
- Search: "[Advanced search queries]"
- Focus areas: [Specific subtopics]

**Phase 3 - Synthesis (Connect ideas):**
- Compare: [Perspectives to contrast]
- Analyze: [Critical questions to ask]

Should I:
A) Execute Phase 1 searches now (using Power Research)?
B) Guide you through manual research?
C) Help you build a prompt to research this topic?
```

**Turn 4 - Knowledge Gathering:**
```
I'll use Power Research (Exa.ai) to find sources:
[Executes searches]

Found:
1. [Source 1 - Summary]
2. [Source 2 - Summary]
3. [Source 3 - Summary]

Should I:
- Read specific sources and extract content?
- Scrape multiple URLs for ingestion?
- Provide a synthesized answer from these sources?
```

**Turn 5 - Knowledge Base Building:**
```
Let's save this knowledge:
1. I've extracted content from [N] sources
2. Files saved to Scrapy output folder
3. Recommend: Ingest into Knowledge Base

Once ingested, you can:
- Ask follow-up questions (I'll reference your research)
- Generate summaries and reports
- Build specialized AI expert on this topic

Proceed with ingestion? (App Manager → Ingest Scrapy Output)
```

---

## Troubleshooting

### Connection & API Issues

#### Error: "Failed to connect to API"
**Cause:** Network issue, incorrect API key, or service downtime

**Solutions:**
1. Check internet connection
2. Account Settings → Verify API key is correct (no extra spaces)
3. Test with different model/provider
4. Check provider's status page (e.g., status.together.ai)

#### Error: "401 Unauthorized"
**Cause:** Invalid or expired API key

**Solutions:**
1. Account Settings → Re-enter API key
2. Verify key is active on provider's dashboard
3. For TogetherAI: Check if credits remain
4. For custom APIs: Verify permissions

#### Error: "400 Bad Request"
**Cause:** Malformed request, often from unsupported model format

**Solutions:**
1. Try a different model from same provider
2. Check if model name is correct (case-sensitive)
3. For custom APIs: Verify Models URL and Completions URL are correct
4. Reduce message size (some models have smaller limits)

#### Error: "429 Rate Limit Exceeded"
**Cause:** Too many requests in short time

**Solutions:**
1. Wait 30-60 seconds before retrying
2. Switch to different model/provider temporarily
3. Check provider's rate limit policies
4. For free tiers: Consider upgrading or spreading requests over time

#### Error: "500 Internal Server Error"
**Cause:** Provider-side issue

**Solutions:**
1. Wait a few minutes and retry
2. Check provider's status page
3. Switch to different model temporarily
4. Report persistent issues to provider support

### Ollama Issues

#### Issue: "Ollama models not showing"
**Cause:** Ollama not running or incorrect base URL

**Solutions:**
1. Verify Ollama is running (open terminal, run `ollama serve`)
2. Account Settings → Check "Ollama Base URL" (default: `http://localhost:11434`)
3. Windows: Check Windows Firewall isn't blocking port 11434
4. Try: `ollama list` in terminal to verify Ollama works

#### Issue: "Model download appears frozen at XX%"
**Important:** This is often NOT frozen!

**Why it looks frozen:**
- Progress only updates when data chunks arrive
- Large files have sparse updates at high percentages
- 96-99% can take several minutes (verifying/extracting)

**How to tell if truly frozen:**
1. Watch the time counter (`[Xm Ys]`) - should keep incrementing
2. Check Task Manager: Python process should show network activity
3. Wait at least 5 minutes before concluding it's frozen

**If truly frozen:**
1. Close openElara
2. Open terminal, run: `ollama pull [model-name]`
3. This shows more detailed progress
4. Once complete, model appears in openElara

#### Issue: "Downloaded model not appearing"
**Solutions:**
1. Click Model dropdown → Refresh (close and reopen dropdown)
2. Restart openElara
3. Check Ollama: `ollama list` in terminal
4. If model shows in terminal but not app: Check Ollama Base URL in settings

### RAG (Knowledge Base) Issues

#### Issue: "No relevant context found"
**Cause:** Knowledge Base empty or query doesn't match ingested content

**Solutions:**
1. App Manager → View & Manage KB (verify files are ingested)
2. Thought Allocation → Increase "Knowledge Base" slider
3. Rephrase question to match terminology in documents
4. Check ingestion logs for errors

#### Issue: "Ingestion failed" or "Script not found"
**Cause:** Python backend issue

**Solutions:**
1. Verify Python is installed (python --version in terminal)
2. Check `backend/` folder exists in openElara directory
3. App logs: `%AppData%\Roaming\openelara\logs\`
4. Re-download/reinstall openElara if backend files missing

#### Issue: "Memory viewer stuck at 'Fetching...'"
**Cause:** Python script waiting for input

**Fix:** This was patched in October 2025 update. If still occurring:
1. Update to latest version
2. Report as bug with logs

#### Issue: "Duplicate or irrelevant results in RAG"
**Cause:** Poorly structured knowledge base or overlapping content

**Solutions:**
1. Clear Knowledge Base
2. Re-ingest with better-organized files
3. Use more specific queries
4. Adjust semantic search threshold (advanced: requires code modification)

### Image/Video Generation Issues

#### Issue: "Image generation failed"
**Cause:** API issue, NSFW content filter, or malformed prompt

**Solutions:**
1. Check logs for specific error
2. Simplify prompt (remove potentially flagged words)
3. Try different image model
4. Verify TogetherAI credits remain (paid models)
5. Use Flux Schnell Free for testing

#### Issue: "Video generation takes forever"
**Expected:** Videos typically take 2-5 minutes per generation

**If truly stuck:**
1. Check CMD/logs for errors
2. Verify AI/ML API key is valid
3. Check account credits on PixVerse
4. Try shorter/simpler prompt

#### Issue: "Generated images don't match character"
**Solutions:**
1. Use structured image prompts (not free text)
2. Leave "Character" field blank to auto-use active character
3. Verify correct character selected (top-right icon)
4. Check character constants file for description accuracy
5. Use same seed value for consistency across images

### Performance Issues

#### Issue: "App is slow/laggy"
**Causes:** Large Knowledge Base, many canvas files, or old hardware

**Solutions:**
1. Reduce canvas files (clear when not needed)
2. Lower "Knowledge Base" allocation slider
3. Use smaller models (Phi-3 instead of Llama 3 13B)
4. Clear old chat history (App Manager → Clear History)
5. Close other resource-heavy apps

#### Issue: "High memory usage"
**Cause:** Large Ollama models loaded in RAM

**Solutions:**
1. Use smaller models (7B instead of 13B parameters)
2. Unload Ollama models when not in use: `ollama stop [model-name]`
3. Increase system RAM or use cloud models instead

### UI Issues

#### Issue: "Buttons not responding"
**Solutions:**
1. Check browser console for errors (F12 → Console tab)
2. Restart application
3. Clear app cache: Delete `%AppData%\Roaming\openelara\cache\`
4. Update to latest version

#### Issue: "Text input field not updating token count"
**Solutions:**
1. Click elsewhere then back in field
2. Type a character then delete it (force recalculation)
3. Restart app if persists

#### Issue: "Theme broken/weird colors"
**Solutions:**
1. Theme button → Reset Theme
2. If using AI-generated theme: Switch to light/dark, then back
3. Delete: `%AppData%\Roaming\openelara\theme.json`
4. Restart app

### Data & Privacy

#### Issue: "Where is my data stored?"
**Location:** `%AppData%\Roaming\openelara\`
- `chat_history/` - Conversations (ChromaDB)
- `knowledge_base/` - Ingested files (ChromaDB)
- `Output/` - Generated images, videos, research
- `logs/` - Application logs
- `config.json` - Settings

#### Issue: "How do I backup my data?"
**Backup:**
1. Close openElara
2. Copy entire `%AppData%\Roaming\openelara\` folder
3. Store somewhere safe
4. To restore: Replace folder with backup copy

#### Issue: "How do I completely uninstall?"
**Full Removal:**
1. Uninstall openElara (normal app uninstall)
2. Delete: `%AppData%\Roaming\openelara\`
3. Delete: `%AppData%\Local\openelara\` (if exists)
4. All data permanently removed

### Getting Help

**If issues persist:**
1. Check logs: `%AppData%\Roaming\openelara\logs\main.log`
2. GitHub Issues: [Repository URL - coming soon]
3. Email: support@applymytech.com
4. Include: Error message, steps to reproduce, log excerpts

**For feature requests:**
- Email: openelara@applymytech.com
- GitHub Discussions (when available)

---

## Appendix: Keyboard Shortcuts

- **Ctrl+Enter** - Send message
- **Ctrl+K** - Clear chat input
- **Escape** - Close active modal
- **Ctrl+/** - Show/hide slash commands

---

## Appendix: File Locations (Windows)

```
%AppData%\Roaming\openelara\
├── chat_history\           # ChromaDB: Conversation history
├── knowledge_base\         # ChromaDB: Ingested files
├── Output\
│   ├── images\            # Generated images
│   ├── videos\            # Generated videos
│   ├── exa\               # Exa.ai research outputs
│   └── scrapy\            # Web scraping outputs
├── logs\
│   └── main.log           # Application logs
└── config.json            # Settings & preferences
```

---

## Final Notes

**openElara is actively developed.** Features, workflows, and capabilities expand regularly. This manual reflects the **October 2025 state**.

**Community Contributions Welcome** (when repository is public):
- Report bugs
- Suggest features
- Share workflows
- Contribute code

**Privacy Reminder:** Your data never leaves your device except when:
- Making API calls to LLM providers
- Using Exa.ai for web research
- Generating images/videos via external APIs

All personal data (conversations, knowledge base, files) stays local.

---

**Thank you for using openElara!**

*Built with ❤️ for privacy, creativity, and AI-powered productivity.*

**Contact:** openelara@applymytech.com  
**Support:** support@applymytech.com

---

*Last Updated: October 12, 2025*
