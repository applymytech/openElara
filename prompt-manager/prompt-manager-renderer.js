let prompts = [];
let currentFilter = 'all';
let editingPromptId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const parentWindowType = urlParams.get('parent');
    
    await loadPrompts();
    setupEventListeners();
    renderPrompts();
    
    if (parentWindowType) {
        const notification = document.createElement('div');
        notification.textContent = `Select a prompt to insert into ${parentWindowType === 'advanced-image-gen' ? 'Image Generation' : 'Video Generation'}`;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--accent-color);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            font-size: 14px;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
});

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
    
    document.getElementById('prompt-type').addEventListener('change', (e) => {
        const type = e.target.value;
        if (type === 'image') {
            document.getElementById('free-text-prompt').style.display = 'none';
            document.getElementById('structured-prompt-fields').style.display = 'block';
        } else {
            document.getElementById('free-text-prompt').style.display = 'block';
            document.getElementById('structured-prompt-fields').style.display = 'none';
        }
    });
    
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'edit-modal') {
            closeModal();
        }
    });
}

async function loadPrompts() {
    try {
        const result = await window.electronAPI.getPopupPrompts();
        let promptsList = result.success ? result.prompts || [] : [];
        
        const modifiersResult = await window.electronAPI.getModifiers();
        let modifiers = modifiersResult || [];
        const availableCharacters = await window.electronAPI.getAvailableCharacters();
        const characterPrompts = [];
        for (const characterName of availableCharacters) {
            try {
                const characterData = await window.electronAPI.getCharacterConstants(characterName);
                characterPrompts.push({
                    id: `character_${characterName.toLowerCase()}_description_safe`,
                    name: `${characterData.name} - Safe Description`,
                    type: 'image',
                    isTemplate: true,
                    content: {
                        promptType: 'structured',
                        character: characterData.description_safe || characterData.description || '',
                        attire: characterData.attire || ''
                    }
                });
                    characterPrompts.push({
                    id: `character_${characterName.toLowerCase()}_description_full`,
                    name: `${characterData.name} - Full Description`,
                    type: 'image',
                    isTemplate: true,
                    content: {
                        promptType: 'structured',
                        character: characterData.description || '',
                        attire: characterData.attire || ''
                    }
                });
                
                if (characterData.voice_profile) {
                    characterPrompts.push({
                        id: `character_${characterName.toLowerCase()}_voice`,
                        name: `${characterData.name} - Voice Profile`,
                        type: 'chat',
                        isTemplate: true,
                        content: { text: characterData.voice_profile }
                    });
                }
            } catch (error) {
                console.warn(`Failed to load character data for ${characterName}:`, error);
            }
        }
        
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
            ...characterPrompts,
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

function renderPrompts() {
    const grid = document.getElementById('prompts-grid');
    const emptyState = document.getElementById('empty-state');
    
    const urlParams = new URLSearchParams(window.location.search);
    const parentWindowType = urlParams.get('parent');
    const isFromAdvancedImageGen = parentWindowType === 'advanced-image-gen';
    const isFromAdvancedVideoGen = parentWindowType === 'advanced-video-gen';
    const isFromDeepAIStudio = parentWindowType === 'deepai-studio';
    
    let filteredPrompts = prompts;
    
    if (isFromAdvancedImageGen) {
        filteredPrompts = filteredPrompts.filter(p => p.type === 'image' || p.type === 'modifier');
    } else if (isFromAdvancedVideoGen) {
        filteredPrompts = filteredPrompts.filter(p => p.type === 'video' || p.type === 'modifier');
    } else if (isFromDeepAIStudio) {
        filteredPrompts = filteredPrompts.filter(p => p.type === 'image' || p.type === 'modifier');
    }
    
    if (currentFilter !== 'all') {
        filteredPrompts = filteredPrompts.filter(p => p.type === currentFilter);
    }
    
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
        if (prompt.content.promptType === 'structured') {
            const parts = [];
            if (prompt.content.character) parts.push(prompt.content.character);
            if (prompt.content.scene) parts.push(prompt.content.scene);
            if (prompt.content.action) parts.push(prompt.content.action);
            if (prompt.content.attire) parts.push(prompt.content.attire);
            if (prompt.content.effects) parts.push(prompt.content.effects);
            if (prompt.content.style) parts.push(prompt.content.style);
            previewText = parts.join(', ') || 'Structured prompt';
        } else {
            const parts = [];
            if (prompt.content.scene) parts.push(`Scene: ${prompt.content.scene}`);
            if (prompt.content.action) parts.push(`Action: ${prompt.content.action}`);
            if (prompt.content.role) parts.push(`Role: ${prompt.content.role}`);
            previewText = parts.join(' | ') || 'Structured prompt';
        }
    }
    
    if (prompt.id && prompt.id.startsWith('character_') && prompt.isTemplate) {
        if (prompt.id.includes('_description_')) {
            previewText = 'Character description template for image generation';
        } else if (prompt.id.includes('_voice_')) {
            previewText = 'Voice profile template for chat';
        }
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

function openAddModal() {
    editingPromptId = null;
    document.getElementById('modal-title').textContent = 'Add New Prompt';
    document.getElementById('prompt-name').value = '';
    document.getElementById('prompt-type').value = 'chat';
    document.getElementById('prompt-text').value = '';
    
    document.getElementById('structured-prompt-fields').style.display = 'none';
    document.getElementById('free-text-prompt').style.display = 'block';
    
    document.getElementById('edit-modal').classList.add('active');
}

function openEditModal(promptId) {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;
    
    editingPromptId = promptId;
    document.getElementById('modal-title').textContent = 'Edit Prompt';
    document.getElementById('prompt-name').value = prompt.name;
    document.getElementById('prompt-type').value = prompt.type;
    
    if (prompt.type === 'image' && prompt.content && typeof prompt.content === 'object' && prompt.content.promptType === 'structured') {

        document.getElementById('free-text-prompt').style.display = 'none';
        document.getElementById('structured-prompt-fields').style.display = 'block';
        
        document.getElementById('structured-character').value = prompt.content.character || '';
        document.getElementById('structured-scene').value = prompt.content.scene || '';
        document.getElementById('structured-action').value = prompt.content.action || '';
        document.getElementById('structured-attire').value = prompt.content.attire || '';
        document.getElementById('structured-effects').value = prompt.content.effects || '';
        document.getElementById('structured-style').value = prompt.content.style || '';
    } else {
        document.getElementById('free-text-prompt').style.display = 'block';
        document.getElementById('structured-prompt-fields').style.display = 'none';
        
        let contentText = '';
        if (typeof prompt.content === 'string') {
            contentText = prompt.content;
        } else if (prompt.content && prompt.content.text) {
            contentText = prompt.content.text;
        }
        
        document.getElementById('prompt-text').value = contentText;
    }
    
    document.getElementById('edit-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('edit-modal').classList.remove('active');
    editingPromptId = null;
}

async function savePrompt() {
    const name = document.getElementById('prompt-name').value.trim();
    const type = document.getElementById('prompt-type').value;
    
    if (!name) {
        alert('Please enter a prompt name');
        return;
    }
    
    let promptData;
    
    if (type === 'image' && document.getElementById('structured-prompt-fields').style.display !== 'none') {
        const character = document.getElementById('structured-character').value.trim();
        const scene = document.getElementById('structured-scene').value.trim();
        const action = document.getElementById('structured-action').value.trim();
        const attire = document.getElementById('structured-attire').value.trim();
        const effects = document.getElementById('structured-effects').value.trim();
        const style = document.getElementById('structured-style').value.trim();
        
        if (!character && !scene && !action && !attire && !effects && !style) {
            alert('Please fill in at least one field for the structured prompt');
            return;
        }
        
        promptData = {
            id: editingPromptId || `prompt_${Date.now()}`,
            name: name,
            type: type,
            isTemplate: false,
            content: {
                promptType: 'structured',
                character: character,
                scene: scene,
                action: action,
                attire: attire,
                effects: effects,
                style: style
            }
        };
    } else {
        const text = document.getElementById('prompt-text').value.trim();
        
        if (!text && type !== 'modifier') {
            alert('Please enter prompt content');
            return;
        }
        
        promptData = {
            id: editingPromptId || `prompt_${Date.now()}`,
            name: name,
            type: type,
            isTemplate: false,
            content: { text: text }
        };
    }
    
    try {
        let result;
        if (type === 'modifier') {
            result = await window.electronAPI.saveModifier({ 
                name: name, 
                text: promptData.content.text || '', 
                id: editingPromptId 
            });
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

async function usePrompt(promptId) {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;
    
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const parentWindowType = urlParams.get('parent');
        const isFromAdvancedImageGen = parentWindowType === 'advanced-image-gen';
        const isFromAdvancedVideoGen = parentWindowType === 'advanced-video-gen';
        
        if (isFromAdvancedImageGen || isFromAdvancedVideoGen) {
            const targetElementId = isFromAdvancedImageGen ? 'image-prompt' : 'video-prompt';
            await window.electronAPI.usePopupPrompt(promptId);
            
            showToast(`Prompt "${prompt.name}" sent to ${isFromAdvancedImageGen ? 'Image' : 'Video'} Generation`);
            
            setTimeout(() => {
                window.close();
            }, 1000);
        } else {
            const isAdvancedImageGen = window.location.pathname.includes('advanced-image-gen');
            const isAdvancedVideoGen = window.location.pathname.includes('advanced-video-gen');
            
            if (isAdvancedImageGen || isAdvancedVideoGen) {                const targetElementId = isAdvancedImageGen ? 'image-prompt' : 'video-prompt';
                const promptTextarea = document.getElementById(targetElementId);
                
                if (promptTextarea) {
                    if (prompt.content && prompt.content.promptType === 'structured') {
                        
                        const parts = [];
                        if (prompt.content.character && prompt.content.character.trim()) parts.push(prompt.content.character);
                        if (prompt.content.scene && prompt.content.scene.trim()) parts.push(prompt.content.scene);
                        if (prompt.content.action && prompt.content.action.trim()) parts.push(prompt.content.action);
                        if (prompt.content.attire && prompt.content.attire.trim()) parts.push(prompt.content.attire);
                        if (prompt.content.effects && prompt.content.effects.trim()) parts.push(prompt.content.effects);
                        if (prompt.content.style && prompt.content.style.trim()) parts.push(prompt.content.style);
                        promptTextarea.value = parts.join(', ');
                    } else {
                        let contentText = '';
                        if (typeof prompt.content === 'string') {
                            contentText = prompt.content;
                        } else if (prompt.content && prompt.content.text) {
                            contentText = prompt.content.text;
                        }
                        promptTextarea.value = contentText;
                    }
                    
                    promptTextarea.focus();
                    promptTextarea.setSelectionRange(promptTextarea.value.length, promptTextarea.value.length);
                    
                    showToast(`Prompt "${prompt.name}" inserted`);
                } else {
                    throw new Error('Target prompt textarea not found');
                }
            } else {
                await window.electronAPI.usePopupPrompt(promptId);
                showToast(`Prompt "${prompt.name}" loaded in main window`);
            }
        }
    } catch (error) {
        console.error('Error using prompt:', error);
        alert(`Error loading prompt: ${error.message}`);
    }
}

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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
