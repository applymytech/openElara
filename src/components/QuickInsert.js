import { showStatusMessage, elements } from '../handlers/domHandlers.js';
import { handleActionInsertion, handlePromptInsertion, handleModifierInsertion } from '../handlers/appHandlers.js';

class QuickInsertPalette {
    constructor() {
        this.isOpen = false;
        this.selectedIndex = 0;
        this.items = [];
        this.filteredItems = [];
        this.currentContext = 'chat';
        this.currentCategory = 'all';

        this.init();
    }

    init() {
        this.createPaletteHTML();
        this.setupEventListeners();
    }

    createPaletteHTML() {
        const palette = document.createElement('div');
        palette.id = 'quick-insert-palette';
        palette.className = 'quick-insert-palette hidden';
        palette.innerHTML = `
            <div class="quick-insert-overlay"></div>
            <div class="quick-insert-container">
                <div class="quick-insert-header">
                    <input
                        type="text"
                        id="quick-insert-search"
                        class="quick-insert-search"
                        placeholder="Type to search prompts, actions, or code objects..."
                        autocomplete="off"
                    />
                    <div class="quick-insert-tabs">
                        <button class="quick-insert-tab active" data-category="all">All</button>
                        <button class="quick-insert-tab" data-category="prompts">📝 Prompts</button>
                        <button class="quick-insert-tab" data-category="modifiers">🔧 Modifiers</button>
                        <button class="quick-insert-tab" data-category="actions">🎭 Actions</button>
                        <!-- Objects and Custom tabs intentionally removed per user request -->
                    </div>
                </div>
                <div class="quick-insert-content">
                    <div id="quick-insert-items" class="quick-insert-items"></div>
                    <div class="quick-insert-footer">
                        <div class="quick-insert-hint">
                            ↑↓ Navigate • Enter Insert • Tab Switch • ➕ Create Custom Object • Esc Close
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(palette);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
        });

        const fab = document.getElementById('quick-insert-fab');
        if (fab) {
            fab.addEventListener('click', () => {
                this.toggle();
            });

            const adjustFabPosition = () => {
                const chatForm = document.getElementById('chat-form');
                if (chatForm) {
                    const formHeight = chatForm.offsetHeight;
                    fab.style.bottom = `${formHeight + 20}px`;
                }
            };

            const chatInput = document.querySelector('.chat-input-div');
            if (chatInput) {
                const resizeObserver = new ResizeObserver(adjustFabPosition);
                resizeObserver.observe(chatInput);

                adjustFabPosition();
            }
        }

        const searchInput = document.getElementById('quick-insert-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterItems(e.target.value);
            });

            searchInput.addEventListener('keydown', (e) => {
                this.handleKeyNavigation(e);
            });
        }

        const tabs = document.querySelectorAll('.quick-insert-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                if (tab.classList.contains('create-custom')) {
                    this.showCustomObjectCreator();
                } else {
                    this.switchCategory(tab.dataset.category);
                }
            });
        });

        const overlay = document.querySelector('.quick-insert-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }
    }

    async open(context = 'chat') {
        this.currentContext = context;
        this.isOpen = true;

        const focusedElement = document.activeElement;
        if (focusedElement) {
            const id = focusedElement.id;
            if (id.includes('image')) this.currentContext = 'image';
            else if (id.includes('video')) this.currentContext = 'video';
        }

        if (this.currentContext === 'chat') {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                this._saveCaretWithMarker(chatInput);
            }
        }

        await this.loadItems();

        const palette = document.getElementById('quick-insert-palette');
        palette.classList.remove('hidden');

        const searchInput = document.getElementById('quick-insert-search');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }

        this.filterItems('');
    }

    close() {
        this.isOpen = false;
        const palette = document.getElementById('quick-insert-palette');
        palette.classList.add('hidden');
        this.selectedIndex = 0;
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    async loadItems() {
        this.items = [];

        try {
            const response = await window.electronAPI.getPrompts();
            let prompts = response?.prompts || response || [];

            console.log('[QuickInsert] Raw prompts response:', response);
            console.log('[QuickInsert] Unwrapped prompts:', prompts);
            console.log('[QuickInsert] Prompts is array?', Array.isArray(prompts));

            try {
                const modifiersResponse = await window.electronAPI.getModifiers();
                const modifiers = modifiersResponse || [];
                if (Array.isArray(modifiers)) {
                    modifiers.forEach(modifier => {
                        prompts.push({
                            type: 'modifier',
                            name: modifier.name || 'Unnamed Modifier',
                            text: modifier.text,
                            id: modifier.id || `modifier_${modifier.name}`
                        });
                    });
                }
            } catch (error) {
                console.error('[QuickInsert] Failed to load modifiers:', error);
            }

            if (Array.isArray(prompts)) {
                prompts.forEach(prompt => {
                    if (prompt.type !== 'chat' && prompt.type !== 'template' && prompt.type !== 'modifier') {
                        return;
                    }

                    this.items.push({
                        type: prompt.type === 'modifier' ? 'modifier' : 'prompt',
                        category: prompt.type === 'modifier' ? 'modifiers' : 'prompts',
                        name: prompt.name || 'Unnamed Prompt',
                        description: this.getPromptDescription(prompt),
                        icon: this.getPromptIcon(prompt.type),
                        data: prompt,
                        relevance: this.getRelevance(prompt, this.currentContext)
                    });
                });
                console.log('[QuickInsert] Loaded', prompts.length, 'prompts (filtered to chat/template/modifier only)');
            }
        } catch (error) {
            console.error('[QuickInsert] Failed to load prompts:', error);
        }

        try {
            const actions = await window.electronAPI.getActions();
            const actionList = actions?.actions || actions || [];

            const defaultActions = await window.electronAPI.getDefaultActions();
            const defaultList = defaultActions || [];

            const allActions = [...actionList, ...defaultList];

            console.log('[QuickInsert] Loaded', actionList.length, 'user actions');
            console.log('[QuickInsert] Loaded', defaultList.length, 'default actions');

            if (Array.isArray(allActions)) {
                allActions.forEach(action => {
                    this.items.push({
                        type: 'action',
                        category: 'actions',
                        name: action.name || 'Unnamed Action',
                        description: action.content || 'Custom action',
                        icon: '🎭',
                        data: action,
                        relevance: this.currentContext === 'chat' ? 10 : 0
                    });
                });
            }

            console.log('[QuickInsert] Total actions loaded:', allActions.length);
        } catch (error) {
            console.error('[QuickInsert] Failed to load actions:', error);
        }

        this.items.sort((a, b) => b.relevance - a.relevance);

        console.log('[QuickInsert] ===== LOAD COMPLETE =====');
        console.log('[QuickInsert] Total items loaded:', this.items.length);
        console.log('[QuickInsert] Items breakdown:', {
            prompts: this.items.filter(i => i.type === 'prompt').length,
            actions: this.items.filter(i => i.type === 'action').length,
            code: this.items.filter(i => i.type === 'code').length
        });
    }

    getPromptDescription(prompt) {
        if (prompt.promptType === 'structured') {
            const parts = [];
            if (prompt.scene) parts.push(prompt.scene.substring(0, 40));
            if (prompt.action) parts.push(prompt.action.substring(0, 40));
            return parts.join(' • ') || 'Structured prompt';
        }
        if (prompt.promptType === 'template') {
            return (prompt.instruction || '').substring(0, 60) + (prompt.instruction?.length > 60 ? '...' : '');
        }
        return (prompt.text || '').substring(0, 60) + (prompt.text?.length > 60 ? '...' : '');
    }

    getPromptIcon(type) {
        const icons = {
            chat: '💬',
            image: '🖼️',
            video: '🎬',
            modifier: '🔧'
        };
        return icons[type] || '📝';
    }

    getRelevance(item, context) {
        if (item.type === context) return 10;
        if (item.type === 'chat' && context !== 'chat') return 5;
        return 3;
    }

    filterItems(query) {
        const lowerQuery = query.toLowerCase();

        let items = this.items;
        if (this.currentCategory !== 'all') {
            items = items.filter(item => item.category === this.currentCategory);
        }

        if (query.trim()) {
            items = items.filter(item => {
                const nameMatch = item.name.toLowerCase().includes(lowerQuery);
                const descMatch = item.description.toLowerCase().includes(lowerQuery);
                return nameMatch || descMatch;
            });
        }

        this.filteredItems = items;
        this.selectedIndex = 0;
        this.renderItems();
    }

    renderItems() {
        const container = document.getElementById('quick-insert-items');
        if (!container) return;

        if (this.filteredItems.length === 0) {
            container.innerHTML = `
                <div class="quick-insert-empty">
                    <div class="quick-insert-empty-icon">🔍</div>
                    <div class="quick-insert-empty-text">No items found</div>
                    <div class="quick-insert-empty-hint">Try a different search or category</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredItems.map((item, index) => `
            <div
                class="quick-insert-item ${index === this.selectedIndex ? 'selected' : ''}"
                data-index="${index}"
            >
                <div class="quick-insert-item-icon">${item.icon}</div>
                <div class="quick-insert-item-content">
                    <div class="quick-insert-item-name">${this.escapeHtml(item.name)}</div>
                    <div class="quick-insert-item-description">${this.escapeHtml(item.description)}</div>
                </div>
                <div class="quick-insert-item-type">${item.type}</div>
            </div>
        `).join('');

        container.querySelectorAll('.quick-insert-item').forEach((el, index) => {
            el.addEventListener('click', () => {
                this.selectedIndex = index;
                this.insertSelected();
            });

            el.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateSelection();
            });
        });

        this.scrollToSelected();
    }

    handleKeyNavigation(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);
                this.updateSelection();
                this.scrollToSelected();
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.updateSelection();
                this.scrollToSelected();
                break;

            case 'Enter':
                e.preventDefault();
                this.insertSelected();
                break;

            case 'Escape':
                e.preventDefault();
                this.close();
                break;

            case 'Tab':
                e.preventDefault();
                this.cycleCategory();
                break;
        }
    }

    updateSelection() {
        const items = document.querySelectorAll('.quick-insert-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    scrollToSelected() {
        const selected = document.querySelector('.quick-insert-item.selected');
        if (selected) {
            selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    switchCategory(category) {
        this.currentCategory = category;

        document.querySelectorAll('.quick-insert-tab').forEach(tab => {
            if (tab.dataset.category === category) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        const searchInput = document.getElementById('quick-insert-search');
        this.filterItems(searchInput?.value || '');
    }

    cycleCategory() {
    const categories = ['all', 'prompts', 'modifiers', 'actions'];
        const currentIndex = categories.indexOf(this.currentCategory);
        const nextIndex = (currentIndex + 1) % categories.length;
        this.switchCategory(categories[nextIndex]);
    }

    async insertSelected() {
        if (this.filteredItems.length === 0) return;

        const item = this.filteredItems[this.selectedIndex];

        switch (item.type) {
            case 'prompt':
                await this.insertPrompt(item.data);
                break;
            case 'modifier':
                await this.insertPrompt(item.data);
                break;
            case 'action':
                await this.insertAction(item.data);
                break;
            case 'code':
                await this.insertCode(item.data);
                break;
        }

        this.close();
    }

    async insertPrompt(prompt) {
        if (prompt.type === 'modifier') {
            if (this.currentContext !== 'chat') {
                showStatusMessage('Modifiers can only be used in chat', 'info');
                return;
            }
            handleModifierInsertion(prompt.text, prompt.name, elements);
            showStatusMessage(`Inserted modifier: ${prompt.name}`, 'success');
            return;
        }

        let targetElement = null;
        let text = '';
        let isContentEditable = false;

        if (this.currentContext === 'image') {
            targetElement = document.getElementById('image-prompt');
        } else if (this.currentContext === 'video') {
            targetElement = document.getElementById('advanced-video-prompt');
        } else {
            targetElement = document.getElementById('chat-input');
            isContentEditable = true;
        }

        if (prompt.promptType === 'structured') {
            const parts = [];
            if (prompt.character) parts.push(prompt.character);
            if (prompt.scene) parts.push(prompt.scene);
            if (prompt.action) parts.push(prompt.action);
            if (prompt.attire) parts.push(prompt.attire);
            if (prompt.effects) parts.push(prompt.effects);
            if (prompt.style) parts.push(prompt.style);
            if (prompt.cameraMovement) parts.push(`Camera: ${prompt.cameraMovement}`);
            if (prompt.duration) parts.push(`Duration: ${prompt.duration}`);
            text = parts.join(', ');
        } else if (prompt.promptType === 'template') {
            text = prompt.instruction || prompt.text || '';
        } else {
            text = prompt.text || '';
        }

        if (targetElement) {
            if (isContentEditable) {
                this._saveCaretWithMarker(targetElement);
                handlePromptInsertion(text, prompt.name || 'Prompt', elements);
                this._restoreCaretFromMarker(targetElement);
            } else {
                targetElement.value = text;
            }
            showStatusMessage(`Inserted: ${prompt.name}`, 'success');
        }
    }

    async insertAction(action) {
        if (this.currentContext !== 'chat') {
            showStatusMessage('Actions can only be used in chat', 'info');
            return;
        }

        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            this._restoreCaretFromMarker(chatInput);
        }
        console.log('[QuickInsert] Inserting action:', action);
        try {
            handleActionInsertion(action.content, action.style || 'default', action.name, elements);
            showStatusMessage(`Sent action: ${action.name}`, 'success');
        } catch (error) {
            showStatusMessage('Failed to send action', 'error');
            console.error('[QuickInsert] Action insertion error:', error);
        }
    }

    async insertCode(codeObj) {
        if (this.currentContext !== 'chat') {
            showStatusMessage('Code objects can only be used in chat', 'info');
            return;
        }

        console.log('[QuickInsert] Inserting code object:', codeObj);
        try {
            const objectDiv = document.createElement('div');
            objectDiv.className = 'inserted-object-container code-object-container';
            objectDiv.setAttribute('contenteditable', 'false');

            const preElement = document.createElement('pre');
            const codeElement = document.createElement('code');
            codeElement.className = `language-${codeObj.language || 'javascript'}`;
            codeElement.textContent = codeObj.content || '';
            preElement.appendChild(codeElement);
            objectDiv.appendChild(preElement);

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '&times;';
            removeBtn.className = 'remove-object-btn';
            removeBtn.title = 'Remove object';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                const parent = objectDiv.parentNode;
                if (parent) {
                    const nextSibling = objectDiv.nextSibling;
                    parent.removeChild(objectDiv);
                    if (nextSibling && nextSibling.nodeName.toLowerCase() === 'br') {
                        nextSibling.remove();
                    }
                    elements.chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            };
            objectDiv.appendChild(removeBtn);

            const labelSpan = document.createElement('span');
            labelSpan.className = 'object-label';
            labelSpan.textContent = codeObj.name || 'Code';
            objectDiv.appendChild(labelSpan);

            const chatInput = elements.chatInput;
            const selection = window.getSelection();
            chatInput.focus();

            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(objectDiv);

                const trailingBr = document.createElement('br');
                range.setStartAfter(objectDiv);
                range.insertNode(trailingBr);

                range.setStartAfter(trailingBr);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                chatInput.appendChild(objectDiv);
                chatInput.appendChild(document.createElement('br'));
            }

            chatInput.scrollTop = chatInput.scrollHeight;
            chatInput.dispatchEvent(new Event('input', { bubbles: true }));

            showStatusMessage(`Inserted code object: ${codeObj.name}`, 'success');
        } catch (error) {
            showStatusMessage('Failed to insert code object', 'error');
            console.error('[QuickInsert] Code insertion error:', error);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showCustomObjectCreator() { showStatusMessage('Custom objects disabled', 'info'); }

    async insertCustomObject() { showStatusMessage('Custom objects disabled', 'info'); }

    async insertTextObject(obj) {
        if (this.currentContext !== 'chat') {
            showStatusMessage('Objects can only be used in chat', 'info');
            return;
        }

        console.log('[QuickInsert] Inserting text object:', obj);
        try {
            const objectDiv = document.createElement('div');
            objectDiv.className = 'inserted-object-container code-object-container';
            objectDiv.setAttribute('contenteditable', 'false');

            const preElement = document.createElement('pre');
            const codeElement = document.createElement('code');
            codeElement.textContent = obj.content || '';
            preElement.appendChild(codeElement);
            objectDiv.appendChild(preElement);

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '&times;';
            removeBtn.className = 'remove-object-btn';
            removeBtn.title = 'Remove object';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                const parent = objectDiv.parentNode;
                if (parent) {
                    const nextSibling = objectDiv.nextSibling;
                    parent.removeChild(objectDiv);
                    if (nextSibling && nextSibling.nodeName.toLowerCase() === 'br') {
                        nextSibling.remove();
                    }
                    elements.chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            };
            objectDiv.appendChild(removeBtn);

            const labelSpan = document.createElement('span');
            labelSpan.className = 'object-label';
            labelSpan.textContent = obj.name || 'Text';
            objectDiv.appendChild(labelSpan);

            const chatInput = elements.chatInput;
            const selection = window.getSelection();
            chatInput.focus();

            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(objectDiv);

                const trailingBr = document.createElement('br');
                range.setStartAfter(objectDiv);
                range.insertNode(trailingBr);

                range.setStartAfter(trailingBr);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                chatInput.appendChild(objectDiv);
                chatInput.appendChild(document.createElement('br'));
            }

            showStatusMessage(`Inserted: ${obj.name}`, 'success');
        } catch (error) {
            showStatusMessage('Failed to insert object', 'error');
            console.error('[QuickInsert] Object insertion error:', error);
        }
    }

    _saveCaretWithMarker(container) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        if (!container.contains(range.startContainer)) return;

        const marker = document.createElement('span');
        marker.id = 'qi-caret-marker';
        marker.style.display = 'inline-block';
        marker.style.width = '0px';
        marker.style.height = '0px';
        marker.style.overflow = 'hidden';

        range.insertNode(marker);
        range.setStartAfter(marker);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    _restoreCaretFromMarker(container) {
        const sel = window.getSelection();
        const marker = container.querySelector('#qi-caret-marker');
        if (!marker) return;
        const range = document.createRange();
        range.setStartAfter(marker);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        marker.remove();
    }
}

let quickInsertInstance = null;

export function initQuickInsert() {
    if (!quickInsertInstance) {
        quickInsertInstance = new QuickInsertPalette();
    }
    return quickInsertInstance;
}

export function openQuickInsert(context) {
    if (quickInsertInstance) {
        quickInsertInstance.open(context);
    }
}

export function closeQuickInsert() {
    if (quickInsertInstance) {
        quickInsertInstance.close();
    }
}
