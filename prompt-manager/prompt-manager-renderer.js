// prompt-manager-renderer.js
// Renderer script for the Prompt Manager popup window

let prompts = [];
let currentFilter = 'all';
let editingPromptId = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    await loadPrompts();
    setupEventListeners();
    renderPrompts();
});

// Setup event listeners
function setupEventListeners() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderPrompts();
        });
    });
    
    document.getElementById('add-prompt-btn').addEventListener('click', () => {
        openAddModal();
    });
    
    document.getElementById('modal-cancel-btn').addEventListener('click', () => {
        closeModal();
    });
    
    document.getElementById('modal-save-btn').addEventListener('click', () => {
        savePrompt();
    });
    
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'edit-modal') {
            closeModal();
        }
    });
}

// Load prompts from main process
async function loadPrompts() {
    try {
        const result = await window.electronAPI.getPopupPrompts();
        let promptsList = result.success ? result.prompts || [] : [];
        
        const modifiersResult = await window.electronAPI.getModifiers();
        let modifiers = modifiersResult || [];
        
        if (promptsList.length === 0) {
            const defaultPrompts = [
                {
                    id: 'default_chat_helpful',
                    name: 'Helpful Assistant',
                    type: 'chat',
                    isTemplate: false,
                    content: { text: 'You are a helpful and knowledgeable assistant. Provide clear, accurate, and useful responses to user queries.' }
                },
                {
                    id: 'default_chat_creative',
                    name: 'Creative Writer',
                    type: 'chat',
                    isTemplate: false,
                    content: { text: 'You are a creative writer with a vivid imagination. Help users develop stories, poems, and creative content.' }
                },
                {
                    id: 'default_image_portrait',
                    name: 'Professional Portrait',
                    type: 'image',
                    isTemplate: false,
                    content: { text: 'A professional headshot portrait of a person in business attire, clean background, natural lighting, high quality photography.' }
                }
            ];
            for (const prompt of defaultPrompts) {
                await window.electronAPI.savePopupPrompt(prompt);
            }
            const updatedResult = await window.electronAPI.getPopupPrompts();
            promptsList = updatedResult.success ? updatedResult.prompts || [] : [];
        }

        if (modifiers.length === 0) {
            const defaultModifiers = [
                {
                    name: 'Keep Responses Brief',
                    text: 'Keep your responses concise and to the point. Avoid unnecessary elaboration.'
                },
                {
                    name: 'Be More Creative',
                    text: 'Be more imaginative and creative in your responses. Think outside the box and provide innovative ideas.'
                },
                {
                    name: 'Explain Like I\'m 5',
                    text: 'Explain concepts in simple terms, as if explaining to a 5-year-old. Use easy language and avoid jargon.'
                }
            ];
            for (const modifier of defaultModifiers) {
                await window.electronAPI.saveModifier(modifier);
            }
            const updatedModifiersResult = await window.electronAPI.getModifiers();
            modifiers = updatedModifiersResult || [];
        }
        
        prompts = [
            ...promptsList,
            ...modifiers.map(m => ({
                ...m,
                type: 'modifier',
                id: m.id || `modifier_${m.name}`,
                content: { text: m.text }
            }))
        ];
    } catch (error) {
        console.error('Error loading prompts and modifiers:', error);
        prompts = [];
    }
}

// Render prompts grid
function renderPrompts() {
    const grid = document.getElementById('prompts-grid');
    const emptyState = document.getElementById('empty-state');
    
    const filteredPrompts = currentFilter === 'all' 
        ? prompts 
        : prompts.filter(p => p.type === currentFilter);
    
    if (filteredPrompts.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    } else {
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
    }
    
    grid.innerHTML = filteredPrompts.map(prompt => createPromptCard(prompt)).join('');
    
    attachCardListeners();
}

// Create prompt card HTML
function createPromptCard(prompt) {
    const typeIcons = {
        chat: '💬',
        image: '🖼️',
        video: '🎬',
        modifier: '🔧'
    };
    
    const typeLabels = {
        chat: 'Chat',
        image: 'Image',
        video: 'Video',
        modifier: 'Modifier'
    };
    
    let previewText = '';
    if (typeof prompt.content === 'string') {
        previewText = prompt.content;
    } else if (prompt.content && prompt.content.text) {
        previewText = prompt.content.text;
    } else if (prompt.content) {
        const parts = [];
        if (prompt.content.scene) parts.push(`Scene: ${prompt.content.scene}`);
        if (prompt.content.action) parts.push(`Action: ${prompt.content.action}`);
        if (prompt.content.role) parts.push(`Role: ${prompt.content.role}`);
        previewText = parts.join(' | ') || 'Structured prompt';
    }
    
    return `
        <div class="prompt-card" data-prompt-id="${prompt.id}">
            <div class="prompt-card-header">
                <span class="prompt-card-type">${typeIcons[prompt.type] || '📝'}</span>
                <span class="prompt-card-title">${escapeHtml(prompt.name)}</span>
                <div class="prompt-card-actions">
                    <button class="prompt-card-btn btn-edit" data-prompt-id="${prompt.id}" title="Edit">✏️</button>
                    <button class="prompt-card-btn btn-delete" data-prompt-id="${prompt.id}" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="prompt-card-body">
                ${escapeHtml(previewText).substring(0, 120)}${previewText.length > 120 ? '...' : ''}
            </div>
            <div class="prompt-card-meta">
                <span>${typeLabels[prompt.type] || 'Unknown'}</span>
                <span>${prompt.isTemplate ? 'Template' : 'Free Text'}</span>
            </div>
        </div>
    `;
}

// Attach event listeners to card buttons
function attachCardListeners() {
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const promptId = e.target.dataset.promptId;
            openEditModal(promptId);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const promptId = e.target.dataset.promptId;
            if (confirm('Are you sure you want to delete this prompt?')) {
                await deletePrompt(promptId);
            }
        });
    });
    
    document.querySelectorAll('.prompt-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('prompt-card-btn')) {
                const promptId = card.dataset.promptId;
                usePrompt(promptId);
            }
        });
    });
}

// Open add modal
function openAddModal() {
    editingPromptId = null;
    document.getElementById('modal-title').textContent = 'Add New Prompt';
    document.getElementById('prompt-name').value = '';
    document.getElementById('prompt-type').value = 'chat';
    document.getElementById('prompt-text').value = '';
    document.getElementById('edit-modal').classList.add('active');
}

// Open edit modal
function openEditModal(promptId) {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;
    
    editingPromptId = promptId;
    document.getElementById('modal-title').textContent = 'Edit Prompt';
    document.getElementById('prompt-name').value = prompt.name;
    document.getElementById('prompt-type').value = prompt.type;
    
    let contentText = '';
    if (typeof prompt.content === 'string') {
        contentText = prompt.content;
    } else if (prompt.content && prompt.content.text) {
        contentText = prompt.content.text;
    }
    
    document.getElementById('prompt-text').value = contentText;
    document.getElementById('edit-modal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('edit-modal').classList.remove('active');
    editingPromptId = null;
}

// Save prompt
async function savePrompt() {
    const name = document.getElementById('prompt-name').value.trim();
    const type = document.getElementById('prompt-type').value;
    const text = document.getElementById('prompt-text').value.trim();
    
    if (!name) {
        alert('Please enter a prompt name');
        return;
    }
    
    if (!text) {
        alert('Please enter prompt content');
        return;
    }
    
    const promptData = {
        id: editingPromptId || `prompt_${Date.now()}`,
        name: name,
        type: type,
        isTemplate: false,
        content: { text: text }
    };
    
    try {
        let result;
        if (type === 'modifier') {
            result = await window.electronAPI.saveModifier({ name, text, id: editingPromptId });
        } else {
            result = await window.electronAPI.savePopupPrompt(promptData);
        }
        if (result.success) {
            await loadPrompts();
            renderPrompts();
            closeModal();
        } else {
            alert(`Failed to save prompt: ${result.error}`);
        }
    } catch (error) {
        console.error('Error saving prompt:', error);
        alert(`Error saving prompt: ${error.message}`);
    }
}

// Delete prompt
async function deletePrompt(promptId) {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;
    
    try {
        let result;
        if (prompt.type === 'modifier') {
            result = await window.electronAPI.removeModifier(promptId);
        } else {
            result = await window.electronAPI.deletePopupPrompt(promptId);
        }
        if (result.success) {
            await loadPrompts();
            renderPrompts();
        } else {
            alert(`Failed to delete prompt: ${result.error}`);
        }
    } catch (error) {
        console.error('Error deleting prompt:', error);
        alert(`Error deleting prompt: ${error.message}`);
    }
}

// Use prompt (send to main window)
async function usePrompt(promptId) {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;
    
    try {
    await window.electronAPI.usePopupPrompt(promptId);
        showToast(`Prompt "${prompt.name}" loaded in main window`);
    } catch (error) {
        console.error('Error using prompt:', error);
        alert(`Error loading prompt: ${error.message}`);
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: var(--accent-color);
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
