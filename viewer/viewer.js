// viewer.js
document.addEventListener('DOMContentLoaded', () => {
    const contentDisplay = document.getElementById('content-display');
    const viewerTitle = document.getElementById('viewer-title');
    const viewerStatus = document.getElementById('viewer-status');
    const ragListContainer = document.getElementById('rag-list-container');
    const backToListBtn = document.getElementById('back-to-list-btn');
    const closeViewerBtn = document.getElementById('close-viewer-btn');
    
    // Pagination elements
    const paginationControls = document.getElementById('pagination-controls-top');
    const pageSizeSelector = document.getElementById('page-size-selector');
    const pageInfo = document.getElementById('page-info');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const viewModeControls = document.getElementById('view-mode-controls');
    const viewModeSelector = document.getElementById('view-mode-selector');

    let currentCollection = null;
    let isListMode = false;
    let currentTheme = null;
    let currentPage = 0;
    let pageSize = 25;
    let totalItems = 0;
    let viewMode = 'chunks';

    viewerStatus.textContent = 'Awaiting content from main app...';
    contentDisplay.style.display = 'none';
    ragListContainer.style.display = 'none';
    
    // --- UTILITY FUNCTIONS ---

    function applyTheme(theme) {
        if (!theme) return;
        
        if (theme.mode === 'custom' && theme.palette) {
            document.body.classList.remove('light-theme');
            document.body.classList.remove('theme-active');
            
            const palette = theme.isLightActive ? theme.palette.light : theme.palette.dark;
            Object.entries(palette).forEach(([key, value]) => {
                document.documentElement.style.setProperty(`--${key}`, value, 'important');
            });
        } else {

            if (!document.body.classList.contains('theme-active')) {
                document.body.classList.add('theme-active');
            }
            document.body.classList.toggle('light-theme', theme.isLightActive);
        }
    }
    
    function showSingleContent(title, content) {
        viewerTitle.textContent = title;
        viewerStatus.textContent = `Viewing Content: ${title}`;
        ragListContainer.style.display = 'none';
        paginationControls.classList.add('hidden');
        contentDisplay.style.display = 'block';
        contentDisplay.classList.add('single-content');
        backToListBtn.classList.remove('hidden');

        if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
            const rawHtml = marked.parse(content || '');
            contentDisplay.innerHTML = DOMPurify.sanitize(rawHtml);
        } else {
            contentDisplay.textContent = content;
        }
    }
    
    function updatePaginationControls() {
        const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / pageSize);
        const currentPageNum = currentPage + 1;
        
        if (totalItems === 0) {
            pageInfo.textContent = 'No items';
        } else if (pageSize === 0) {
            pageInfo.textContent = `Showing all ${totalItems} items`;
        } else {
            const startItem = currentPage * pageSize + 1;
            const endItem = Math.min((currentPage + 1) * pageSize, totalItems);
            pageInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} (Page ${currentPageNum} of ${totalPages})`;
        }
        
        prevPageBtn.disabled = currentPage === 0;
        nextPageBtn.disabled = pageSize === 0 || currentPage >= totalPages - 1;
    }

    async function handleItemDeletion(id, collection, sourceName) {
        if (!confirm(`Are you sure you want to permanently delete: ${sourceName || id.substring(0, 10) + '...'}?`)) {
            return;
        }
        viewerStatus.textContent = `Deleting ${collection} item...`;
        
        try {
            let result;
            if (collection === 'knowledge_base') {
                result = await window.electronAPI.removeSource(sourceName); 
            } else {
                result = await window.electronAPI.removeMemory({ collection, id });
            }

            if (result.success) {
                viewerStatus.textContent = `Deletion successful. Refreshing list...`;
                loadRAGList(currentCollection, currentTheme);
            } else {
                viewerStatus.textContent = `Deletion failed: ${result.error}`;
            }
        } catch (error) {
            viewerStatus.textContent = `Critical error during deletion: ${error.message}`;
        }
    }
    
    // --- LIST VIEW HANDLERS ---

    async function loadRAGList(collection, theme) {
        if (!collection) return;

        isListMode = true;
        currentCollection = collection;
        currentTheme = theme;
        applyTheme(theme);

        viewerTitle.textContent = collection === 'chat_history' ? 'Chat Memories' : 'Knowledge Files';
        viewerStatus.textContent = 'Fetching RAG database items...';
        contentDisplay.style.display = 'none';
        ragListContainer.style.display = 'block';
        ragListContainer.innerHTML = '<p>Loading...</p>';
        backToListBtn.classList.add('hidden');
        paginationControls.classList.remove('hidden');
        
        if (collection === 'knowledge_base') {
            viewModeControls.classList.remove('hidden');
        } else {
            viewModeControls.classList.add('hidden');
        }
        
        try {
            const offset = currentPage * pageSize;
            const limit = pageSize === 0 ? null : pageSize;
            
            const result = await window.electronAPI.getMemories({
                collection,
                limit,
                offset
            });
            
            totalItems = result.total_count || 0;
            updatePaginationControls();
            
            const list = document.createElement('ul');
            list.className = 'rag-list';

            if (result.previews && result.previews.length > 0) {
                
                if (collection === 'knowledge_base') {
                    if (viewMode === 'grouped') {
                        const sourceMap = {};
                        
                        result.previews.forEach((preview, i) => {
                            const id = result.ids[i];
                            const meta = result.metadatas[i] || {};
                            const source = meta.source || 'Unknown Source';
                            
                            if (!sourceMap[source]) {
                                sourceMap[source] = {
                                    chunks: [],
                                    ids: [],
                                    previews: []
                                };
                            }
                            
                            sourceMap[source].chunks.push({ id, preview, meta });
                            sourceMap[source].ids.push(id);
                            sourceMap[source].previews.push(preview);
                        });
                        
                        Object.entries(sourceMap).forEach(([sourceName, data]) => {
                            const item = document.createElement('li');
                            item.className = 'rag-list-item';
                            
                            const chunkCount = data.chunks.length;
                            const firstPreview = data.previews[0].substring(0, 100);
                            
                            item.innerHTML = `
                                <div class="rag-list-item-content">
                                    <strong>${sourceName}</strong>
                                    <div class="rag-item-meta">${chunkCount} chunk${chunkCount > 1 ? 's' : ''} | Preview: ${firstPreview}...</div>
                                </div>
                                <div class="item-actions">
                                    <button class="view-grouped-btn btn-secondary" data-source="${sourceName}">View Full File</button>
                                    <button class="remove-source-btn btn-danger" data-source="${sourceName}">Remove File</button>
                                </div>
                            `;
                            list.appendChild(item);
                        });
                        
                    } else {
                        result.previews.forEach((preview, i) => {
                            const id = result.ids[i];
                            const meta = result.metadatas[i] || {};
                            const source = meta.source || 'Unknown Source';
                            const displayIndex = offset + i + 1;
                            
                            const item = document.createElement('li');
                            item.className = 'rag-list-item';
                            item.innerHTML = `
                                <div class="rag-list-item-content">
                                    <strong>${source}</strong>
                                    <div class="rag-item-meta">Chunk ${displayIndex}: ${preview.substring(0, 150)}...</div>
                                </div>
                                <div class="item-actions">
                                    <button class="view-item-btn btn-secondary" data-id="${id}" data-collection="${collection}">View Chunk</button>
                                    <button class="remove-source-btn btn-danger" data-id="${id}" data-source="${source}">Remove Source</button>
                                </div>
                            `;
                            list.appendChild(item);
                        });
                    }

                } else {
                    result.previews.forEach((preview, i) => {
                        const id = result.ids[i];
                        const item = document.createElement('li');
                        item.className = 'rag-list-item';
                        const displayIndex = offset + i + 1;
                        item.innerHTML = `
                            <div class="rag-list-item-content">
                                <strong>Turn ${displayIndex}</strong>
                                <div class="rag-item-meta">${preview}</div>
                            </div>
                            <div class="item-actions">
                                <button class="view-item-btn btn-secondary" data-id="${id}" data-collection="${collection}">View Full Turn</button>
                                <button class="remove-item-btn btn-danger" data-id="${id}">Remove</button>
                            </div>
                        `;
                        list.appendChild(item);
                    });
                }
                
                ragListContainer.innerHTML = '';
                ragListContainer.appendChild(list);
                
                if (collection === 'knowledge_base' && viewMode === 'grouped') {
                    viewerStatus.textContent = `Loaded ${list.children.length} file${list.children.length !== 1 ? 's' : ''} (${totalItems} total chunks).`;
                } else {
                    viewerStatus.textContent = `Loaded ${list.children.length} of ${totalItems} total items.`;
                }
                
            } else {
                ragListContainer.innerHTML = `<p>The ${collection === 'chat_history' ? 'Chat Memories' : 'Knowledge Base'} is empty.</p>`;
                viewerStatus.textContent = `0 items loaded.`;
            }
        } catch (error) {
            viewerStatus.textContent = `Error fetching list: ${error.message}`;
            ragListContainer.innerHTML = `<p style="color: var(--error-color);">Failed to load items: ${error.message}</p>`;
        }
    }
    
    // --- EVENT LISTENERS ---

    ragListContainer.addEventListener('click', async (event) => {
        const target = event.target;
        const id = target.dataset.id;
        const collection = target.dataset.collection;
        const source = target.dataset.source;

        if (target.classList.contains('view-item-btn')) {
            viewerStatus.textContent = 'Fetching single item content...';
            const contentResult = await window.electronAPI.getMemoryContentById({ id, collection });
            if (contentResult.success) {
                showSingleContent(`${collection === 'chat_history' ? 'Memory' : 'Knowledge'} Item: ${id.substring(0, 10)}...`, contentResult.content);
            } else {
                viewerStatus.textContent = `Error fetching content: ${contentResult.error}`;
            }

        } else if (target.classList.contains('view-grouped-btn')) {
            viewerStatus.textContent = 'Fetching full file content...';
            try {
                const result = await window.electronAPI.getMemories({
                    collection: 'knowledge_base',
                    limit: null,
                    offset: 0
                });
                
                const sourceChunks = [];
                result.ids.forEach((chunkId, i) => {
                    const meta = result.metadatas[i] || {};
                    if (meta.source === source) {
                        sourceChunks.push({
                            id: chunkId,
                            content: result.previews[i],
                            meta: meta
                        });
                    }
                });
                
                const fullContents = [];
                for (const chunk of sourceChunks) {
                    const contentResult = await window.electronAPI.getMemoryContentById({ 
                        id: chunk.id, 
                        collection: 'knowledge_base' 
                    });
                    if (contentResult.success) {
                        fullContents.push(contentResult.content);
                    }
                }
                
                const combinedContent = fullContents.join('\n\n---\n\n');
                showSingleContent(`Full File: ${source}`, combinedContent);
                
            } catch (error) {
                viewerStatus.textContent = `Error fetching grouped content: ${error.message}`;
            }

        } else if (target.classList.contains('remove-item-btn')) {
            handleItemDeletion(id, 'chat_history', null);

        } else if (target.classList.contains('remove-source-btn')) {
            handleItemDeletion(id, 'knowledge_base', source);
        }
    });
    
    backToListBtn.addEventListener('click', () => {
        loadRAGList(currentCollection, currentTheme);
    });
    
    pageSizeSelector.addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value, 10);
        currentPage = 0;
        if (isListMode && currentCollection) {
            loadRAGList(currentCollection, currentTheme);
        }
    });
    
    viewModeSelector.addEventListener('change', (e) => {
        viewMode = e.target.value; 
        currentPage = 0; 
        if (isListMode && currentCollection) {
            loadRAGList(currentCollection, currentTheme);
        }
    });
    
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadRAGList(currentCollection, currentTheme);
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / pageSize);
        if (currentPage < totalPages - 1) {
            currentPage++;
            loadRAGList(currentCollection, currentTheme);
        }
    });
    
    closeViewerBtn.addEventListener('click', () => {
        window.close();
    });

    window.electronAPI.onViewContent(async (payload) => {
        currentTheme = payload.theme;
        applyTheme(currentTheme);

        if (payload.type === 'memories-list' || payload.type === 'knowledge-list') {
            currentPage = 0;
            pageSize = parseInt(pageSizeSelector.value, 10);
            loadRAGList(payload.collection, payload.theme);
        } else {
            viewerTitle.textContent = payload.type === 'history' ? 'Session History' : `Content: ${payload.id}`;
            ragListContainer.style.display = 'none';
            paginationControls.classList.add('hidden');
            backToListBtn.classList.add('hidden');
            if (payload.id && payload.collection) {
                 const contentResult = await window.electronAPI.getMemoryContentById({ id: payload.id, collection: payload.collection });
                 if (contentResult.success) {
                    showSingleContent(`Viewer: ${payload.id.substring(0, 10)}...`, contentResult.content);
                 } else {
                    viewerStatus.textContent = `Error loading content: ${contentResult.error}`;
                    contentDisplay.textContent = 'Failed to retrieve requested content.';
                 }
            } else {
                 viewerStatus.textContent = `Viewer active: ${payload.type}`;
                 contentDisplay.textContent = 'Content is being loaded or is ready.';
            }
        }
    });

    setTimeout(() => {
        if (viewerStatus.textContent.includes('Awaiting')) {
            viewerStatus.textContent = 'Ready, waiting for content request from the main application window.';
        }
    }, 1000);
});