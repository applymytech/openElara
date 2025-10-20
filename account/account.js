// C:/myCodeProjects/openElara/account.js

document.addEventListener('DOMContentLoaded', () => {
    if (!window.electronAPI) {
        console.error("FATAL: The 'electronAPI' object is not available.");
        return;
    }

    const elements = {
        startAppBtn: document.getElementById('startAppBtn'),
        usernameInput: document.getElementById('usernameInput'),
        saveUsernameBtn: document.getElementById('saveUsernameBtn'),
        usernameDisplay: document.getElementById('usernameDisplay'),
        userNameSpan: document.getElementById('userName'),
        usernameInputSection: document.getElementById('username-input-section'),
        changeUsernameBtn: document.getElementById('changeUsernameBtn'),
        
        // CHARACTER SELECTION
        characterSelect: document.getElementById('character-select'),
        characterStatus: document.getElementById('character-status'),
        
        // GLOBAL LLM & TOOL KEYS TAB
        ollamaBaseUrlInput: document.getElementById('ollama-base-url'),
        togetherApiKeyInput: document.getElementById('together-api-key'),
        exaApiKeyInput: document.getElementById('exa-api-key'),
    aimlApiKeyInput: document.getElementById('aiml-api-key'),
    deepaiApiKeyInput: document.getElementById('deepai-api-key'),
        saveKeysBtn: document.getElementById('save-keys-btn'),
        
        // GENERATIVE MODELS TAB
        imageGenBaseUrlInput: document.getElementById('image-gen-base-url'),
        videoGenBaseUrlInput: document.getElementById('video-gen-base-url'),
        imageGenKeyOverrideInput: document.getElementById('image-gen-key-override'),
        videoGenKeyOverrideInput: document.getElementById('video-gen-key-override'),
        saveImageGenSettingsBtn: document.getElementById('save-image-gen-settings'),
        saveVideoGenSettingsBtn: document.getElementById('save-video-gen-settings'),

        // LOCAL MODELS TAB
        browseOllamaLibraryBtn: document.getElementById('browseOllamaLibraryBtn'),
        ollamaModelNameInput: document.getElementById('ollamaModelNameInput'),
        downloadOllamaModelBtn: document.getElementById('downloadOllamaModelBtn'),
        ollamaProgressContainer: document.getElementById('ollama-progress-container'),
        installedOllamaModelsList: document.getElementById('installed-ollama-models-list'),
        
        // CUSTOM CHAT APIS TAB
        addApiBtn: document.getElementById('addApiBtn'),
        apiNameInput: document.getElementById('apiNameInput'),
        apiKeyInput: document.getElementById('apiKeyInput'),
        apiCompletionsUrlInput: document.getElementById('apiCompletionsUrlInput'),
        apiModelsUrlInput: document.getElementById('apiModelsUrlInput'),
        apiCustomPayloadInput: document.getElementById('apiCustomPayloadInput'),
        customApisList: document.getElementById('custom-apis-list')
    };

    function checkLaunchButtonState() {
        const usernameSet = !!localStorage.getItem('username');
        if (elements.startAppBtn) elements.startAppBtn.disabled = !usernameSet;
    }

    function setupUsername() {
        const savedUsername = localStorage.getItem('username');
        if (savedUsername) {
            if (elements.userNameSpan) elements.userNameSpan.textContent = savedUsername;
            if (elements.usernameDisplay) elements.usernameDisplay.classList.remove('hidden');
            if (elements.usernameInputSection) elements.usernameInputSection.style.display = 'none';
        }
        elements.saveUsernameBtn?.addEventListener('click', () => {
            const newUsername = elements.usernameInput.value.trim();
            if (newUsername) {
                localStorage.setItem('username', newUsername);
                sessionStorage.setItem('userName', newUsername);
                if (elements.userNameSpan) elements.userNameSpan.textContent = newUsername;
                if (elements.usernameDisplay) elements.usernameDisplay.classList.remove('hidden');
                if (elements.usernameInputSection) elements.usernameInputSection.style.display = 'none';
                checkLaunchButtonState();
            }
        });
        elements.changeUsernameBtn?.addEventListener('click', () => {
            if (elements.usernameDisplay) elements.usernameDisplay.classList.add('hidden');
            if (elements.usernameInputSection) elements.usernameInputSection.style.display = 'block';
            if (elements.usernameInput) {
                elements.usernameInput.value = localStorage.getItem('username') || '';
                elements.usernameInput.focus();
            }
        });
    }

    async function setupCharacterSelection() {
        try {
            // Load available characters
            const availableCharacters = await window.electronAPI.getAvailableCharacters();
            const activeCharacter = await window.electronAPI.getActiveCharacterName();

            // Populate dropdown
            if (elements.characterSelect) {
                elements.characterSelect.innerHTML = '';
                availableCharacters.forEach(char => {
                    const option = document.createElement('option');
                    option.value = char.toLowerCase();
                    option.textContent = char;
                    if (char === activeCharacter) {
                        option.selected = true;
                    }
                    elements.characterSelect.appendChild(option);
                });

                // Update status and avatar
                await updateCharacterDisplay(activeCharacter);

                // Handle character change
                elements.characterSelect.addEventListener('change', async (e) => {
                    const newCharacter = e.target.value;
                    if (elements.characterStatus) {
                        elements.characterStatus.textContent = 'Switching character...';
                    }

                    try {
                        await window.electronAPI.setActiveCharacter(newCharacter);
                        const updatedCharacter = await window.electronAPI.getActiveCharacterName();
                        
                        if (elements.characterStatus) {
                            elements.characterStatus.textContent = `Successfully switched to: ${updatedCharacter}`;
                            setTimeout(() => {
                                elements.characterStatus.textContent = `Currently active: ${updatedCharacter}`;
                            }, 3000);
                        }
                        
                        await updateCharacterDisplay(updatedCharacter);
                    } catch (error) {
                        console.error('Failed to switch character:', error);
                        if (elements.characterStatus) {
                            elements.characterStatus.textContent = 'Error switching character. Please try again.';
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Failed to setup character selection:', error);
            if (elements.characterStatus) {
                elements.characterStatus.textContent = 'Failed to load characters';
            }
        }
    }

    async function updateCharacterDisplay(characterName) {
        try {
            const characterData = await window.electronAPI.getCharacterConstants(characterName);
            
            // Update avatar
            const avatarImg = document.getElementById('character-avatar');
            if (avatarImg && characterData.iconPath) {
                avatarImg.src = '../' + characterData.iconPath;
                avatarImg.style.display = 'block';
            }
            
            // Update display name
            const displayNameEl = document.getElementById('character-display-name');
            if (displayNameEl) {
                displayNameEl.textContent = characterData.name || characterName;
            }
            
            // Update description
            const descriptionEl = document.getElementById('character-description');
            if (descriptionEl && characterData.description) {
                // Truncate description for display
                const shortDesc = characterData.description.length > 100 
                    ? characterData.description.substring(0, 100) + '...'
                    : characterData.description;
                descriptionEl.textContent = shortDesc;
            }
            
            // Update status
            if (elements.characterStatus) {
                elements.characterStatus.textContent = `Currently active: ${characterName}`;
            }
        } catch (error) {
            console.error('Failed to update character display:', error);
            // Fallback display
            const avatarImg = document.getElementById('character-avatar');
            if (avatarImg) avatarImg.style.display = 'none';
            
            const displayNameEl = document.getElementById('character-display-name');
            if (displayNameEl) displayNameEl.textContent = characterName || 'Unknown';
            
            const descriptionEl = document.getElementById('character-description');
            if (descriptionEl) descriptionEl.textContent = 'Character information unavailable';
        }
    }

    async function setupGlobalToolKeys() {
        const loadApiKeys = async () => {
            const keys = await window.electronAPI.getApiKeys();
            if (elements.ollamaBaseUrlInput) elements.ollamaBaseUrlInput.value = keys.ollamaBaseUrl || '';
            if (elements.togetherApiKeyInput) elements.togetherApiKeyInput.value = keys.togetherApiKey || '';
            if (elements.exaApiKeyInput) elements.exaApiKeyInput.value = keys.exaApiKey || '';
            if (elements.aimlApiKeyInput) elements.aimlApiKeyInput.value = keys.aimlApiKey || '';
            if (elements.deepaiApiKeyInput) elements.deepaiApiKeyInput.value = keys.deepaiApiKey || '';
        };

        const saveApiKeys = async () => {
            const keysToSave = {
                ollamaBaseUrl: elements.ollamaBaseUrlInput.value.trim(),
                togetherApiKey: elements.togetherApiKeyInput.value.trim(),
                exaApiKey: elements.exaApiKeyInput.value.trim(),
                aimlApiKey: elements.aimlApiKeyInput.value.trim(),
                deepaiApiKey: elements.deepaiApiKeyInput.value.trim(),
            };
            const result = await window.electronAPI.saveApiKeys(keysToSave);
            if (result.success) {
                alert('Global LLM & Tool Keys saved successfully!');
            } else {
                alert(`Error saving keys: ${result.error}`);
            }
        };

        elements.saveKeysBtn?.addEventListener('click', saveApiKeys);
        await loadApiKeys();
    }
    
    async function setupGenerativeApiKeys() {
        const loadGenerativeKeys = async () => {
            const keys = await window.electronAPI.getApiKeys();
            // We now ONLY load the Key Overrides
            if (elements.imageGenKeyOverrideInput) elements.imageGenKeyOverrideInput.value = keys.imageGenKeyOverride || '';
            if (elements.videoGenKeyOverrideInput) elements.videoGenKeyOverrideInput.value = keys.videoGenKeyOverride || '';
            
            // Re-inject hardcoded defaults into the UI fields that were removed from the key save logic
            if (document.getElementById('image-gen-base-url')) {
                 document.getElementById('image-gen-base-url').value = 'https://api.together.xyz/v1/images/generations';
            }
            if (document.getElementById('video-gen-base-url')) {
                 document.getElementById('video-gen-base-url').value = 'https://api.aimlapi.com/v2/video/generations';
            }
        };

            const saveImageSettings = async () => {
            const settingsToSave = {
                imageGenBaseUrl: elements.imageGenBaseUrlInput.value.trim(),
                imageGenKeyOverride: elements.imageGenKeyOverrideInput.value.trim(),
            };
            const result = await window.electronAPI.saveApiKeys(settingsToSave);
            if (result.success) {
                alert('Image Generation Settings saved successfully!');
            } else {
                alert(`Error saving settings: ${result.error}`);
            }
        };

            const saveVideoSettings = async () => {
            const settingsToSave = {
                videoGenBaseUrl: elements.videoGenBaseUrlInput.value.trim(),
                videoGenKeyOverride: elements.videoGenKeyOverrideInput.value.trim(),
            };
            const result = await window.electronAPI.saveApiKeys(settingsToSave);
            if (result.success) {
                alert('Video Generation Settings saved successfully!');
            } else {
                alert(`Error saving settings: ${result.error}`);
            }
        };

        elements.saveImageGenSettingsBtn?.addEventListener('click', saveImageSettings);
        elements.saveVideoGenSettingsBtn?.addEventListener('click', saveVideoSettings);
        await loadGenerativeKeys();
    }


    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                button.classList.add('active');
                const tabId = button.dataset.tab;
                const activePanel = document.getElementById(`tab-${tabId}`);
                if (activePanel) {
                    activePanel.classList.add('active');
                }
            });
        });
    }
    
    async function setupLocalLlmManagement() {
        async function renderInstalledModels() {
            elements.installedOllamaModelsList.innerHTML = '<p>Loading...</p>';
            try {
                // Assuming ollamaListModels is now checking Ollama status correctly
                const models = await window.electronAPI.ollamaListModels();
                elements.installedOllamaModelsList.innerHTML = '';
                if (!models || models.length === 0) {
                    elements.installedOllamaModelsList.innerHTML = '<p>No local models installed. (Is Ollama running?)</p>';
                    return;
                }
                models.forEach(model => {
                    const item = document.createElement('div');
                    item.className = 'api-list-item';
                    item.innerHTML = `<span><strong>${model.name}</strong> <small>(${Math.round(model.size / 1e9)} GB)</small></span>`;
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = 'Delete';
                    removeBtn.className = 'btn-secondary';
                    removeBtn.onclick = async () => {
                        if (confirm(`Are you sure you want to delete "${model.name}"?`)) {
                            removeBtn.textContent = 'Deleting...'; removeBtn.disabled = true;
                            await window.electronAPI.ollamaDeleteModel({ modelName: model.name });
                            renderInstalledModels();
                        }
                    };
                    item.appendChild(removeBtn);
                    elements.installedOllamaModelsList.appendChild(item);
                });
            } catch (error) {
                elements.installedOllamaModelsList.innerHTML = `<p style="color: var(--error-color);">Error: Could not connect to Ollama. Is it running?</p>`;
            }
        }
        elements.browseOllamaLibraryBtn.addEventListener('click', () => window.electronAPI.openExternalLink('https://ollama.com/library'));
        elements.downloadOllamaModelBtn.addEventListener('click', async () => {
            const modelName = elements.ollamaModelNameInput.value.trim();
            if (!modelName) { 
                alert('Please enter a model tag (e.g., llama3:8b).'); 
                return; 
            }
            
            // Show confirmation dialog with clear warning
            const confirmDownload = confirm(
                `⚠️ IMPORTANT: Model Download\n\n` +
                `You are about to download: ${modelName}\n\n` +
                `⏳ This will take a LONG TIME (potentially 10-30+ minutes depending on model size and connection speed).\n\n` +
                `📌 PLEASE:\n` +
                `• Leave this window open\n` +
                `• Do not close the application\n` +
                `• Be patient - the download runs in the foreground\n` +
                `• Watch the progress log below for status updates\n\n` +
                `The download cannot be paused or canceled once started.\n\n` +
                `Continue with download?`
            );
            
            if (!confirmDownload) {
                return; // User canceled
            }
            
            elements.downloadOllamaModelBtn.disabled = true;
            elements.downloadOllamaModelBtn.textContent = 'Downloading...';
            elements.ollamaProgressContainer.classList.remove('hidden');
            elements.ollamaProgressContainer.innerHTML = `<strong>⏳ Starting download: ${modelName}</strong><br>Please be patient, this may take 10-30+ minutes...<br><br>`;
            
            // Track download start time
            const downloadStartTime = Date.now();
            
            await window.electronAPI.ollamaPullModel({ modelName });
        });
        
        window.electronAPI.onOllamaPullProgress((progress) => {
            if (progress.error) {
                const elapsedSeconds = Math.floor((Date.now() - downloadStartTime) / 1000);
                elements.ollamaProgressContainer.innerHTML += `<br><span style="color: var(--error-color);">❌ ERROR after ${elapsedSeconds}s: ${progress.error}</span>`;
                elements.downloadOllamaModelBtn.disabled = false;
                elements.downloadOllamaModelBtn.textContent = 'Download';
                return;
            }
            
            // Calculate elapsed time
            const elapsedSeconds = Math.floor((Date.now() - downloadStartTime) / 1000);
            const minutes = Math.floor(elapsedSeconds / 60);
            const seconds = elapsedSeconds % 60;
            const timeStr = `${minutes}m ${seconds}s`;
            
            let statusText = progress.status || 'Processing...';
            
            // Enhanced progress display with more precision
            if (progress.total && progress.completed) {
                const percentComplete = (progress.completed / progress.total) * 100;
                const percentStr = percentComplete.toFixed(2); // 2 decimal places for better feedback
                const mbCompleted = (progress.completed / 1024 / 1024).toFixed(1);
                const mbTotal = (progress.total / 1024 / 1024).toFixed(1);
                statusText += ` - ${percentStr}% (${mbCompleted}MB / ${mbTotal}MB) [${timeStr}]`;
            } else {
                statusText += ` [${timeStr}]`;
            }
            
            elements.ollamaProgressContainer.innerHTML += `<br>${statusText}`;
            elements.ollamaProgressContainer.scrollTop = elements.ollamaProgressContainer.scrollHeight;
            
            if (progress.done) {
                elements.ollamaProgressContainer.innerHTML += `<br><br><span style="color: var(--success-color);">✅ Download complete! Total time: ${timeStr}</span>`;
                elements.downloadOllamaModelBtn.disabled = false;
                elements.downloadOllamaModelBtn.textContent = 'Download';
                elements.ollamaModelNameInput.value = '';
                renderInstalledModels();
            }
        });
        
        // Initialize downloadStartTime variable in outer scope
        let downloadStartTime = null;
        await renderInstalledModels();
    }

    async function setupCustomApis() {
        let customApis = await window.electronAPI.getCustomApis() || [];
        function renderApis() {
            elements.customApisList.innerHTML = '';
            if (customApis.length === 0) {
                elements.customApisList.innerHTML = '<p>No custom APIs added yet.</p>';
                return;
            }
            customApis.forEach((api, index) => {
                const item = document.createElement('div');
                item.className = 'api-list-item';
                item.innerHTML = `<span><strong>${api.name}</strong>${api.customPayload ? ' <small style="color: var(--accent-color);">✓ Custom Payload</small>' : ''}</span>`;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.className = 'btn-secondary';
                removeBtn.onclick = () => {
                    customApis.splice(index, 1);
                    window.electronAPI.saveCustomApis(customApis);
                    renderApis();
                    // Refresh model selector in main app if it's running
                    window.electronAPI.refreshModelSelector().catch(() => {
                        // Ignore errors if main window isn't running
                    });
                };
                item.appendChild(removeBtn);
                elements.customApisList.appendChild(item);
            });
        }
        elements.addApiBtn.addEventListener('click', () => {
            const name = elements.apiNameInput.value.trim();
            const apiKey = elements.apiKeyInput.value.trim();
            const completionsUrl = elements.apiCompletionsUrlInput.value.trim();
            const modelsUrl = elements.apiModelsUrlInput.value.trim();
            const customPayloadText = elements.apiCustomPayloadInput.value.trim();
            
            if (!name || !apiKey || !completionsUrl || !modelsUrl) {
                alert('Provider Name, API Key, Completions URL, and Models URL are required.'); 
                return;
            }
            
            let customPayload = null;
            if (customPayloadText) {
                try {
                    customPayload = JSON.parse(customPayloadText);
                } catch (e) {
                    alert('Invalid JSON in Custom Payload field. Please check syntax.');
                    return;
                }
            }
            
            customApis.push({ name, apiKey, completionsUrl, modelsUrl, customPayload });
            window.electronAPI.saveCustomApis(customApis);
            renderApis();
            elements.apiNameInput.value = '';
            elements.apiKeyInput.value = '';
            elements.apiCompletionsUrlInput.value = '';
            elements.apiModelsUrlInput.value = '';
            elements.apiCustomPayloadInput.value = '';
            // Refresh model selector in main app if it's running
            window.electronAPI.refreshModelSelector().catch(() => {
                // Ignore errors if main window isn't running
            });
        });
        renderApis();
    }

    // === CUSTOM GENERATIVE MODELS MANAGEMENT ===
    async function setupCustomGenerativeModels() {
        // Image Models Section
        const imageCheckbox = document.getElementById('image-add-custom-models-checkbox');
        const imageSection = document.getElementById('custom-image-models-section');
        const imageModelsList = document.getElementById('custom-image-models-list');
        const addImageModelBtn = document.getElementById('add-custom-image-model-btn');
        
        // Video Models Section
        const videoCheckbox = document.getElementById('video-add-custom-models-checkbox');
        const videoSection = document.getElementById('custom-video-models-section');
        const videoModelsList = document.getElementById('custom-video-models-list');
        const addVideoModelBtn = document.getElementById('add-custom-video-model-btn');
        
        // Selfie Route Selectors
        const selfieImageRoute = document.getElementById('selfie-image-route');
        const selfieImageCustomUrl = document.getElementById('selfie-image-custom-url');
        const selfieVideoRoute = document.getElementById('selfie-video-route');
        const selfieVideoCustomUrl = document.getElementById('selfie-video-custom-url');
        
        // Load custom models from storage
        let customImageModels = JSON.parse(localStorage.getItem('customImageModels') || '[]');
        let customVideoModels = JSON.parse(localStorage.getItem('customVideoModels') || '[]');
        
        // Toggle custom sections
        imageCheckbox?.addEventListener('change', (e) => {
            imageSection.style.display = e.target.checked ? 'block' : 'none';
        });
        
        videoCheckbox?.addEventListener('change', (e) => {
            videoSection.style.display = e.target.checked ? 'block' : 'none';
        });
        
        // Toggle selfie custom URL inputs
        selfieImageRoute?.addEventListener('change', (e) => {
            selfieImageCustomUrl.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });
        
        selfieVideoRoute?.addEventListener('change', (e) => {
            selfieVideoCustomUrl.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });
        
        // Render Image Models List
        function renderImageModels() {
            if (!imageModelsList) return;
            imageModelsList.innerHTML = '';
            if (customImageModels.length === 0) {
                imageModelsList.innerHTML = '<p style="color: var(--secondary-text-color); font-style: italic;">No custom image models added yet.</p>';
                return;
            }
            customImageModels.forEach((model, index) => {
                const item = document.createElement('div');
                item.className = 'api-list-item';
                item.style.borderBottom = '1px solid var(--border-color)';
                item.style.padding = '10px';
                item.innerHTML = `
                    <div>
                        <strong>${model.name}</strong>
                        <br><small style="color: var(--secondary-text-color);">ID: ${model.id}</small>
                        ${model.endpoint ? `<br><small style="color: var(--secondary-text-color);">Endpoint: ${model.endpoint}</small>` : ''}
                        ${model.customPayload ? `<br><small style="color: var(--accent-color);">✓ Custom Payload</small>` : ''}
                    </div>
                `;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.className = 'btn-secondary';
                removeBtn.style.marginLeft = '10px';
                removeBtn.onclick = () => {
                    if (confirm(`Remove custom model "${model.name}"?`)) {
                        customImageModels.splice(index, 1);
                        localStorage.setItem('customImageModels', JSON.stringify(customImageModels));
                        renderImageModels();
                    }
                };
                item.appendChild(removeBtn);
                imageModelsList.appendChild(item);
            });
        }
        
        // Render Video Models List
        function renderVideoModels() {
            if (!videoModelsList) return;
            videoModelsList.innerHTML = '';
            if (customVideoModels.length === 0) {
                videoModelsList.innerHTML = '<p style="color: var(--secondary-text-color); font-style: italic;">No custom video models added yet.</p>';
                return;
            }
            customVideoModels.forEach((model, index) => {
                const item = document.createElement('div');
                item.className = 'api-list-item';
                item.style.borderBottom = '1px solid var(--border-color)';
                item.style.padding = '10px';
                item.innerHTML = `
                    <div>
                        <strong>${model.name}</strong>
                        <br><small style="color: var(--secondary-text-color);">ID: ${model.id}</small>
                        <br><small style="color: var(--secondary-text-color);">Endpoint: ${model.endpoint}</small>
                        ${model.customPayload ? `<br><small style="color: var(--accent-color);">✓ Custom Payload</small>` : ''}
                        ${model.supportsT2V ? `<br><small style="color: var(--accent-color);">✓ T2V</small>` : ''}
                        ${model.supportsI2V ? `<br><small style="color: var(--accent-color);">✓ I2V</small>` : ''}
                    </div>
                `;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.className = 'btn-secondary';
                removeBtn.style.marginLeft = '10px';
                removeBtn.onclick = () => {
                    if (confirm(`Remove custom model "${model.name}"?`)) {
                        customVideoModels.splice(index, 1);
                        localStorage.setItem('customVideoModels', JSON.stringify(customVideoModels));
                        renderVideoModels();
                    }
                };
                item.appendChild(removeBtn);
                videoModelsList.appendChild(item);
            });
        }
        
        // Add Image Model
        addImageModelBtn?.addEventListener('click', () => {
            const id = document.getElementById('custom-image-model-id').value.trim();
            const name = document.getElementById('custom-image-model-name').value.trim();
            const endpoint = document.getElementById('custom-image-model-endpoint').value.trim();
            const payloadText = document.getElementById('custom-image-model-payload').value.trim();
            
            if (!id || !name) {
                alert('Model ID and Display Name are required.');
                return;
            }
            
            let customPayload = null;
            if (payloadText) {
                try {
                    customPayload = JSON.parse(payloadText);
                } catch (e) {
                    alert('Invalid JSON in Custom Payload field. Please check syntax.');
                    return;
                }
            }
            
            customImageModels.push({
                id,
                name,
                endpoint: endpoint || null,
                customPayload
            });
            
            localStorage.setItem('customImageModels', JSON.stringify(customImageModels));
            
            // Clear inputs
            document.getElementById('custom-image-model-id').value = '';
            document.getElementById('custom-image-model-name').value = '';
            document.getElementById('custom-image-model-endpoint').value = '';
            document.getElementById('custom-image-model-payload').value = '';
            
            renderImageModels();
            alert(`Custom image model "${name}" added successfully!`);
        });
        
        // Add Video Model
        addVideoModelBtn?.addEventListener('click', () => {
            const id = document.getElementById('custom-video-model-id').value.trim();
            const name = document.getElementById('custom-video-model-name').value.trim();
            const endpoint = document.getElementById('custom-video-model-endpoint').value.trim();
            const payloadText = document.getElementById('custom-video-model-payload').value.trim();
            const supportsT2V = document.getElementById('custom-video-model-t2v').checked;
            const supportsI2V = document.getElementById('custom-video-model-i2v').checked;
            
            if (!id || !name || !endpoint) {
                alert('Model ID, Display Name, and Endpoint URL are required.');
                return;
            }
            
            if (!supportsT2V && !supportsI2V) {
                alert('Please select at least one mode (T2V or I2V).');
                return;
            }
            
            let customPayload = null;
            if (payloadText) {
                try {
                    customPayload = JSON.parse(payloadText);
                } catch (e) {
                    alert('Invalid JSON in Custom Payload field. Please check syntax.');
                    return;
                }
            }
            
            customVideoModels.push({
                id,
                name,
                endpoint,
                customPayload,
                supportsT2V,
                supportsI2V
            });
            
            localStorage.setItem('customVideoModels', JSON.stringify(customVideoModels));
            
            // Clear inputs
            document.getElementById('custom-video-model-id').value = '';
            document.getElementById('custom-video-model-name').value = '';
            document.getElementById('custom-video-model-endpoint').value = '';
            document.getElementById('custom-video-model-payload').value = '';
            document.getElementById('custom-video-model-t2v').checked = false;
            document.getElementById('custom-video-model-i2v').checked = false;
            
            renderVideoModels();
            alert(`Custom video model "${name}" added successfully!`);
        });
        
        // Initial render
        renderImageModels();
        renderVideoModels();
        
        // Load selfie routes
        const savedImageRoute = localStorage.getItem('selfieImageRoute') || 'default';
        const savedImageUrl = localStorage.getItem('selfieImageCustomUrl') || '';
        const savedVideoRoute = localStorage.getItem('selfieVideoRoute') || 'default';
        const savedVideoUrl = localStorage.getItem('selfieVideoCustomUrl') || '';
        
        if (selfieImageRoute) {
            selfieImageRoute.value = savedImageRoute;
            if (savedImageRoute === 'custom') {
                selfieImageCustomUrl.style.display = 'block';
                selfieImageCustomUrl.value = savedImageUrl;
            }
        }
        
        if (selfieVideoRoute) {
            selfieVideoRoute.value = savedVideoRoute;
            if (savedVideoRoute === 'custom') {
                selfieVideoCustomUrl.style.display = 'block';
                selfieVideoCustomUrl.value = savedVideoUrl;
            }
        }
    }

    elements.startAppBtn?.addEventListener('click', async () => {
        sessionStorage.setItem('userName', localStorage.getItem('username'));
        
        // Save selfie routes before launching
        const selfieImageRoute = document.getElementById('selfie-image-route');
        const selfieImageCustomUrl = document.getElementById('selfie-image-custom-url');
        const selfieVideoRoute = document.getElementById('selfie-video-route');
        const selfieVideoCustomUrl = document.getElementById('selfie-video-custom-url');
        
        if (selfieImageRoute) {
            localStorage.setItem('selfieImageRoute', selfieImageRoute.value);
            if (selfieImageRoute.value === 'custom') {
                localStorage.setItem('selfieImageCustomUrl', selfieImageCustomUrl.value.trim());
            }
        }
        
        if (selfieVideoRoute) {
            localStorage.setItem('selfieVideoRoute', selfieVideoRoute.value);
            if (selfieVideoRoute.value === 'custom') {
                localStorage.setItem('selfieVideoCustomUrl', selfieVideoCustomUrl.value.trim());
            }
        }
        
        await window.electronAPI.startMainApp();
    });

    // === DESKTOP PET FUNCTIONALITY ===
    async function setupDesktopPet() {
        const petCharacterSelect = document.getElementById('pet-character-select');
        const petStatusText = document.getElementById('pet-status-text');
        const generateSpritesBtn = document.getElementById('generate-pet-sprites-btn');
        const launchPetBtn = document.getElementById('launch-pet-btn');
        const closePetBtn = document.getElementById('close-pet-btn');
        const sayHelloBtn = document.getElementById('pet-say-hello-btn');
        
        // Load available characters for pet
        try {
            const availableCharacters = await window.electronAPI.getAvailableCharacters();
            const activeCharacter = await window.electronAPI.getActiveCharacterName();
            
            if (petCharacterSelect) {
                petCharacterSelect.innerHTML = '';
                availableCharacters.forEach(char => {
                    const option = document.createElement('option');
                    option.value = char.toLowerCase();
                    option.textContent = char;
                    if (char === activeCharacter) {
                        option.selected = true;
                    }
                    petCharacterSelect.appendChild(option);
                });
                
                // Enable generate button when character is selected
                petCharacterSelect.addEventListener('change', () => {
                    if (petCharacterSelect.value) {
                        generateSpritesBtn.disabled = false;
                    }
                });
                
                // Enable if character is pre-selected
                if (petCharacterSelect.value) {
                    generateSpritesBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Error loading characters for pet:', error);
        }
        
        // Check pet status
        async function updatePetStatus() {
            try {
                const status = await window.electronAPI.petIsActive();
                if (status.active) {
                    petStatusText.textContent = 'Pet is running on your desktop!';
                    launchPetBtn.disabled = true;
                    closePetBtn.disabled = false;
                    sayHelloBtn.disabled = false;
                } else {
                    petStatusText.textContent = 'No pet active';
                    launchPetBtn.disabled = false;
                    closePetBtn.disabled = true;
                    sayHelloBtn.disabled = true;
                }
            } catch (error) {
                console.error('Error checking pet status:', error);
            }
        }
        
        // Generate sprites (placeholder for now - will implement in next phase)
        generateSpritesBtn?.addEventListener('click', async () => {
            const characterName = petCharacterSelect?.value;
            if (!characterName) {
                alert('Please select a character first');
                return;
            }
            
            // Get character data for generation
            const characterData = await window.electronAPI.getCharacterConstants(characterName);
            
            if (!confirm(`Generate sprite pack for ${characterName}?\n\nThis will create:\n- 1 base sprite\n- 8 directional views\n- 14 animation frames\n\nEstimated cost: $0.58\nEstimated time: 5-10 minutes\n\nContinue?`)) {
                return;
            }
            
            generateSpritesBtn.disabled = true;
            generateSpritesBtn.textContent = '🎨 Generating...';
            petStatusText.textContent = 'Generating sprites...';
            
            try {
                // Step 1: Generate base sprite
                petStatusText.textContent = 'Step 1/4: Generating base sprite...';
                const baseResult = await window.electronAPI.shimejiGenerateBase({ characterName });
                
                if (!baseResult.success) {
                    throw new Error(`Base generation failed: ${baseResult.error}`);
                }
                
                alert(`Base sprite generated!\n\nPreview: ${baseResult.filePath}\n\nClick OK to continue with directional sprites.`);
                
                // Step 2: Generate directional sprites
                petStatusText.textContent = 'Step 2/4: Generating 8 directional views (this takes ~1 min)...';
                const dirResult = await window.electronAPI.shimejiGenerateDirections({ characterName, baseImagePath: baseResult.filePath });
                
                if (!dirResult.success) {
                    throw new Error(`Direction generation failed: ${dirResult.error || 'Unknown error'}`);
                }
                
                alert(`Directional sprites generated!\n\n${dirResult.totalGenerated}/8 directions created successfully.\n\nClick OK to continue with animations.`);
                
                // Step 3: Generate animation frames
                petStatusText.textContent = 'Step 3/4: Generating animation frames (this takes ~2 min)...';
                const animResult = await window.electronAPI.shimejiGenerateAnimations({ characterName, directionalSprites: dirResult.results });
                
                if (!animResult.success) {
                    throw new Error(`Animation generation failed: ${animResult.error || 'Unknown error'}`);
                }
                
                alert(`Animation frames generated!\n\n${animResult.totalGenerated} frames created successfully.\n\nClick OK to finalize.`);
                
                // Step 4: Generate manifest
                petStatusText.textContent = 'Step 4/4: Creating manifest...';
                const manifestResult = await window.electronAPI.shimejiGenerateManifest({
                    characterName: characterName
                });
                
                if (!manifestResult.success) {
                    throw new Error('Manifest generation failed');
                }
                
                // After manifest is created, perform background removal in a single batch pass
                petStatusText.textContent = 'Step 5/5: Removing backgrounds from generated images...';
                try {
                    const transparencyResult = await window.electronAPI.shimejiProcessTransparency({ characterName });
                    if (!transparencyResult || !transparencyResult.success) {
                        // Background removal failed for some or all files; surface a friendly warning but allow launch
                        petStatusText.textContent = '⚠️ Background removal completed with issues. You can launch the pet, but some images may still have backgrounds.';
                    } else {
                        petStatusText.textContent = '✅ Background removal complete.';
                    }
                } catch (transErr) {
                    console.error('Background removal error:', transErr);
                    petStatusText.textContent = '⚠️ Background removal failed. You can still launch the pet, but try again later.';
                }

                petStatusText.textContent = '✅ Sprite pack complete! Ready to launch pet.';
                launchPetBtn.disabled = false;

                alert(`🎉 Sprite pack complete!\n\n${characterName} is ready to launch!\n\nTotal frames: ${animResult.totalGenerated}\nManifest: ${manifestResult.manifestPath}\n\nClick "Launch Pet" to see ${characterName} on your desktop!`);
                
            } catch (error) {
                console.error('Sprite generation error:', error);
                alert(`Generation failed: ${error.message}\n\nYou can try again or check console for details.`);
                petStatusText.textContent = 'Generation failed';
            } finally {
                generateSpritesBtn.disabled = false;
                generateSpritesBtn.textContent = '🎨 Generate Sprites ($0.58)';
            }
        });
        
        // Launch pet
        launchPetBtn?.addEventListener('click', async () => {
            const characterName = petCharacterSelect?.value;
            if (!characterName) {
                alert('Please select a character first');
                return;
            }
            
            petStatusText.textContent = 'Launching pet...';
            launchPetBtn.disabled = true;
            
            try {
                const result = await window.electronAPI.launchPet(characterName);
                
                if (result.success) {
                    alert(`${characterName} is now roaming your desktop!\n\nTry dragging your pet around or click "Say Hello" to make them talk.`);
                    await updatePetStatus();
                } else {
                    alert(`Failed to launch pet: ${result.error}\n\nMake sure you've generated sprites for this character first!`);
                    petStatusText.textContent = 'Launch failed';
                    launchPetBtn.disabled = false;
                }
            } catch (error) {
                console.error('Error launching pet:', error);
                alert(`Error: ${error.message}`);
                petStatusText.textContent = 'Launch failed';
                launchPetBtn.disabled = false;
            }
        });
        
        // Close pet
        closePetBtn?.addEventListener('click', async () => {
            try {
                await window.electronAPI.closePet();
                await updatePetStatus();
            } catch (error) {
                console.error('Error closing pet:', error);
            }
        });
        
        // Say hello
        sayHelloBtn?.addEventListener('click', async () => {
            const characterName = petCharacterSelect?.value;
            const messages = [
                `Hello! I'm ${characterName}!`,
                `Hi there! 👋`,
                `Having fun on your desktop!`,
                `Need anything? Just ask!`,
                `I love exploring! 🐾`
            ];
            
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            try {
                await window.electronAPI.petSay(randomMessage, 3000);
            } catch (error) {
                console.error('Error making pet talk:', error);
            }
        });
        
        // Update status on load
        await updatePetStatus();

        async function renderSavedPets() {
            const listEl = document.getElementById('saved-pets-list');
            if (!listEl) return;
            listEl.innerHTML = '<p>Loading...</p>';
            try {
                const res = await window.electronAPI.shimejiListPets();
                if (!res.success) {
                    listEl.innerHTML = `<p style="color: var(--error-color);">Error: ${res.error}</p>`;
                    return;
                }
                const chars = res.characters || [];
                if (chars.length === 0) {
                    listEl.innerHTML = '<p style="color: var(--secondary-text-color);">No saved pets found.</p>';
                    return;
                }
                listEl.innerHTML = '';
                chars.forEach(name => {
                    const item = document.createElement('div');
                    item.className = 'api-list-item';
                    item.style.display = 'flex';
                    item.style.justifyContent = 'space-between';
                    item.style.alignItems = 'center';
                    item.innerHTML = `<span style="font-weight:600">${name}</span>`;
                    const btns = document.createElement('div');
                    const del = document.createElement('button');
                    del.className = 'btn-secondary';
                    del.textContent = 'Delete';
                    del.onclick = async () => {
                        if (!confirm(`Delete saved pet "${name}"? This cannot be undone.`)) return;
                        del.disabled = true; del.textContent = 'Deleting...';
                        const r = await window.electronAPI.shimejiDeletePet({ characterName: name });
                        if (r.success) {
                            renderSavedPets();
                        } else {
                            alert(`Failed to delete: ${r.error}`);
                            del.disabled = false; del.textContent = 'Delete';
                        }
                    };
                    btns.appendChild(del);
                    item.appendChild(btns);
                    listEl.appendChild(item);
                });
            } catch (e) {
                listEl.innerHTML = `<p style="color: var(--error-color);">Error: ${e.message}</p>`;
            }
        }

        renderSavedPets();
    }

    async function initialize() {
        setupTabs();
        setupUsername();
        await setupCharacterSelection();
        await setupGlobalToolKeys();
        await setupGenerativeApiKeys();
        await setupLocalLlmManagement();
        await setupCustomApis();
        await setupCustomGenerativeModels(); // NEW
        await setupDesktopPet(); // PET FUNCTIONALITY
        checkLaunchButtonState();
    }

    initialize();
});