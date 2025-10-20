// deepai-studio.js - DeepAI Studio Handler

const elements = {};

function initializeElements() {
    const elementIds = [
        'tab-tools', 'tab-image-editor', 'tab-background-remover', 'tab-colorizer',
        'tab-super-resolution', 'tab-waifu2x', 'tab-creative-upscale', 'tab-text2img', 'tab-inpainting',
        'tools-content', 'image-editor-content', 'background-remover-content', 'colorizer-content',
        'super-resolution-content', 'waifu2x-content', 'creative-upscale-content', 'text2img-content', 'inpainting-content',
        'editor-prompt', 'editor-image-upload', 'editor-negative-prompt', 'editor-strength', 'editor-steps',
        'bg-remover-image-upload', 'colorizer-image-upload',
        'superres-image-upload', 'waifu2x-image-upload', 'creative-upscale-image-upload',
        'text2img-prompt', 'inpainting-prompt', 'inpainting-image-upload', 'inpainting-mask-upload',
        'generate-editor-btn', 'generate-bg-remover-btn', 'generate-colorizer-btn',
        'generate-superres-btn', 'generate-waifu2x-btn', 'generate-creative-upscale-btn',
        'generate-text2img-btn', 'generate-inpainting-btn',
        'deepai-log', 'deepai-previews-container', 'open-deepai-output-btn',
        'back-link'
    ];
    
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const camelCaseId = id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
            elements[camelCaseId] = element;
        }
    });
    
    // Add tool card elements
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', () => {
            const tool = card.dataset.tool;
            switchToTool(tool);
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    initializeElements();
    setupEventListeners();
    
    // Test API key on load
    await testApiKey();
});

async function testApiKey() {
    try {
        const result = await window.electronAPI.deepaiTestApiKey();
        if (!result.success) {
            const logElement = elements.deepaiLog;
            if (logElement) {
                logElement.textContent = `⚠️ ${result.error}`;
                logElement.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Failed to test DeepAI API key:', error);
    }
}

function setupEventListeners() {
    // Tab navigation
    if (elements.tabTools) {
        elements.tabTools.addEventListener('click', () => switchTab('tools'));
    }
    if (elements.tabImageEditor) {
        elements.tabImageEditor.addEventListener('click', () => switchTab('image-editor'));
    }
    if (elements.tabBackgroundRemover) {
        elements.tabBackgroundRemover.addEventListener('click', () => switchTab('background-remover'));
    }
    if (elements.tabColorizer) {
        elements.tabColorizer.addEventListener('click', () => switchTab('colorizer'));
    }
    if (elements.tabSuperResolution) {
        elements.tabSuperResolution.addEventListener('click', () => switchTab('super-resolution'));
    }
    if (elements.tabWaifu2x) {
        elements.tabWaifu2x.addEventListener('click', () => switchTab('waifu2x'));
    }
    if (elements.tabCreativeUpscale) {
        elements.tabCreativeUpscale.addEventListener('click', () => switchTab('creative-upscale'));
    }
    if (elements.tabText2img) {
        elements.tabText2img.addEventListener('click', () => switchTab('text2img'));
    }
    if (elements.tabInpainting) {
        elements.tabInpainting.addEventListener('click', () => switchTab('inpainting'));
    }

    // Generate buttons
    if (elements.generateEditorBtn) {
        elements.generateEditorBtn.addEventListener('click', executeImageEditor);
    }
    if (elements.generateBgRemoverBtn) {
        elements.generateBgRemoverBtn.addEventListener('click', executeBackgroundRemover);
    }
    if (elements.generateColorizerBtn) {
        elements.generateColorizerBtn.addEventListener('click', executeColorizer);
    }
    if (elements.generateSuperresBtn) {
        elements.generateSuperresBtn.addEventListener('click', executeSuperResolution);
    }
    if (elements.generateWaifu2xBtn) {
        elements.generateWaifu2xBtn.addEventListener('click', executeWaifu2x);
    }
    if (elements.generateCreativeUpscaleBtn) {
        elements.generateCreativeUpscaleBtn.addEventListener('click', executeCreativeUpscale);
    }
    if (elements.generateText2imgBtn) {
        elements.generateText2imgBtn.addEventListener('click', executeText2Img);
    }
    if (elements.generateInpaintingBtn) {
        elements.generateInpaintingBtn.addEventListener('click', executeInpainting);
    }

    // Back link
    if (elements.backLink) {
        elements.backLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.close();
        });
    }

    // Open output folder
    if (elements.openDeepaiOutputBtn) {
        elements.openDeepaiOutputBtn.addEventListener('click', () => {
            window.electronAPI.openImagesOutputFolder();
        });
    }
}

function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });

    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab content
    const contentElement = document.getElementById(`${tabName}-content`);
    if (contentElement) {
        contentElement.classList.remove('hidden');
    }

    // Add active class to selected tab
    const tabElement = document.getElementById(`tab-${tabName}`);
    if (tabElement) {
        tabElement.classList.add('active');
    }
}

function switchToTool(toolName) {
    switch (toolName) {
        case 'image-editor':
            switchTab('image-editor');
            break;
        case 'background-remover':
            switchTab('background-remover');
            break;
        case 'colorizer':
            switchTab('colorizer');
            break;
        case 'super-resolution':
            switchTab('super-resolution');
            break;
        case 'waifu2x':
            switchTab('waifu2x');
            break;
        case 'creative-upscale':
            switchTab('creative-upscale');
            break;
        case 'text2img':
            switchTab('text2img');
            break;
        case 'inpainting':
            switchTab('inpainting');
            break;
    }
}

async function executeImageEditor(event) {
    event.preventDefault();
    const submitBtn = event.target;
    submitBtn.disabled = true;

    const logElement = elements.deepaiLog;
    logElement.textContent = 'Preparing image editing...';
    logElement.classList.remove('hidden');

    try {
        const prompt = elements.editorPrompt.value.trim();
        const imageFile = elements.editorImageUpload.files[0];
        
        if (!imageFile) {
            throw new Error('Please select an image to edit.');
        }
        
        if (!prompt) {
            throw new Error('Please enter an editing prompt.');
        }

        const strength = parseFloat(elements.editorStrength.value) || 0.7;
        const steps = parseInt(elements.editorSteps.value) || 20;
        const negativePrompt = elements.editorNegativePrompt.value.trim();

        logElement.textContent = `Uploading image and processing...`;

        // Convert image to data URL
        const imageDataUrl = await readFileAsDataURL(imageFile);
        
        const payload = {
            prompt: prompt,
            imageDataUrl: imageDataUrl,
            strength: strength,
            steps: steps,
            negativePrompt: negativePrompt
        };

        logElement.textContent = `Editing image with DeepAI...`;

        const result = await window.electronAPI.deepaiImageEditor(payload);
        
        if (result.success && result.filePath) {
            logElement.innerHTML = `<span style="color: var(--success-color)">✅ Image editing complete!</span>`;
            elements.openDeepaiOutputBtn.classList.remove('hidden');

            // Display the result
            const previewsContainer = elements.deepaiPreviewsContainer;
            previewsContainer.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = await window.electronAPI.convertFileSrc(result.filePath);
            img.className = 'generated-image-preview';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '10px';
            previewsContainer.appendChild(img);
        } else {
            throw new Error(result.error || 'Failed to edit image.');
        }
    } catch (error) {
        logElement.innerHTML = `<span style="color: var(--error-color)">❌ Editing Failed: ${error.message}</span>`;
        elements.openDeepaiOutputBtn.classList.add('hidden');
    } finally {
        submitBtn.disabled = false;
    }
}

async function executeBackgroundRemover(event) {
    event.preventDefault();
    const submitBtn = event.target;
    submitBtn.disabled = true;

    const logElement = elements.deepaiLog;
    logElement.textContent = 'Preparing background removal...';
    logElement.classList.remove('hidden');

    try {
        const imageFile = elements.bgRemoverImageUpload.files[0];
        
        if (!imageFile) {
            throw new Error('Please select an image for background removal.');
        }

        logElement.textContent = `Uploading image and processing...`;

        // Convert image to data URL
        const imageDataUrl = await readFileAsDataURL(imageFile);
        
        const payload = {
            imageDataUrl: imageDataUrl
        };

        logElement.textContent = `Removing background with DeepAI...`;

        const result = await window.electronAPI.deepaiBackgroundRemover(payload);
        
        if (result.success && result.filePath) {
            logElement.innerHTML = `<span style="color: var(--success-color)">✅ Background removal complete!</span>`;
            elements.openDeepaiOutputBtn.classList.remove('hidden');

            // Display the result
            const previewsContainer = elements.deepaiPreviewsContainer;
            previewsContainer.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = await window.electronAPI.convertFileSrc(result.filePath);
            img.className = 'generated-image-preview';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '10px';
            previewsContainer.appendChild(img);
        } else {
            throw new Error(result.error || 'Failed to remove background.');
        }
    } catch (error) {
        logElement.innerHTML = `<span style="color: var(--error-color)">❌ Background Removal Failed: ${error.message}</span>`;
        elements.openDeepaiOutputBtn.classList.add('hidden');
    } finally {
        submitBtn.disabled = false;
    }
}

async function executeColorizer(event) {
    event.preventDefault();
    const submitBtn = event.target;
    submitBtn.disabled = true;

    const logElement = elements.deepaiLog;
    logElement.textContent = 'Preparing image colorization...';
    logElement.classList.remove('hidden');

    try {
        const imageFile = elements.colorizerImageUpload.files[0];
        
        if (!imageFile) {
            throw new Error('Please select a black & white image to colorize.');
        }

        logElement.textContent = `Uploading image and processing...`;

        // Convert image to data URL
        const imageDataUrl = await readFileAsDataURL(imageFile);
        
        const payload = {
            imageDataUrl: imageDataUrl
        };

        logElement.textContent = `Colorizing image with DeepAI...`;

        const result = await window.electronAPI.deepaiColorizer(payload);
        
        if (result.success && result.filePath) {
            logElement.innerHTML = `<span style="color: var(--success-color)">✅ Image colorization complete!</span>`;
            elements.openDeepaiOutputBtn.classList.remove('hidden');

            // Display the result
            const previewsContainer = elements.deepaiPreviewsContainer;
            previewsContainer.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = await window.electronAPI.convertFileSrc(result.filePath);
            img.className = 'generated-image-preview';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '10px';
            previewsContainer.appendChild(img);
        } else {
            throw new Error(result.error || 'Failed to colorize image.');
        }
    } catch (error) {
        logElement.innerHTML = `<span style="color: var(--error-color)">❌ Colorization Failed: ${error.message}</span>`;
        elements.openDeepaiOutputBtn.classList.add('hidden');
    } finally {
        submitBtn.disabled = false;
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function executeSuperResolution(event) {
    event.preventDefault();
    const submitBtn = event.target;
    submitBtn.disabled = true;

    const logElement = elements.deepaiLog;
    logElement.textContent = 'Preparing super resolution...';
    logElement.classList.remove('hidden');

    try {
        const imageFile = elements.superresImageUpload.files[0];
        
        if (!imageFile) {
            throw new Error('Please select an image for super resolution.');
        }

        logElement.textContent = `Uploading image and processing...`;

        // Convert image to data URL
        const imageDataUrl = await readFileAsDataURL(imageFile);
        
        const payload = {
            imageDataUrl: imageDataUrl
        };

        logElement.textContent = `Enhancing image with DeepAI Super Resolution...`;

        const result = await window.electronAPI.deepaiSuperResolution(payload);
        
        if (result.success && result.filePath) {
            logElement.innerHTML = `<span style="color: var(--success-color)">✅ Super resolution complete!</span>`;
            elements.openDeepaiOutputBtn.classList.remove('hidden');

            // Display the result
            const previewsContainer = elements.deepaiPreviewsContainer;
            previewsContainer.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = await window.electronAPI.convertFileSrc(result.filePath);
            img.className = 'generated-image-preview';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '10px';
            previewsContainer.appendChild(img);
        } else {
            throw new Error(result.error || 'Failed to enhance image.');
        }
    } catch (error) {
        logElement.innerHTML = `<span style="color: var(--error-color)">❌ Super Resolution Failed: ${error.message}</span>`;
        elements.openDeepaiOutputBtn.classList.add('hidden');
    } finally {
        submitBtn.disabled = false;
    }
}

async function executeWaifu2x(event) {
    event.preventDefault();
    const submitBtn = event.target;
    submitBtn.disabled = true;

    const logElement = elements.deepaiLog;
    logElement.textContent = 'Preparing Waifu2x processing...';
    logElement.classList.remove('hidden');

    try {
        const imageFile = elements.waifu2xImageUpload.files[0];
        
        if (!imageFile) {
            throw new Error('Please select an image for Waifu2x processing.');
        }

        logElement.textContent = `Uploading image and processing...`;

        // Convert image to data URL
        const imageDataUrl = await readFileAsDataURL(imageFile);
        
        const payload = {
            imageDataUrl: imageDataUrl
        };

        logElement.textContent = `Upscaling image with DeepAI Waifu2x...`;

        const result = await window.electronAPI.deepaiWaifu2x(payload);
        
        if (result.success && result.filePath) {
            logElement.innerHTML = `<span style="color: var(--success-color">✅ Waifu2x processing complete!</span>`;
            elements.openDeepaiOutputBtn.classList.remove('hidden');

            // Display the result
            const previewsContainer = elements.deepaiPreviewsContainer;
            previewsContainer.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = await window.electronAPI.convertFileSrc(result.filePath);
            img.className = 'generated-image-preview';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '10px';
            previewsContainer.appendChild(img);
        } else {
            throw new Error(result.error || 'Failed to upscale image.');
        }
    } catch (error) {
        logElement.innerHTML = `<span style="color: var(--error-color)">❌ Waifu2x Failed: ${error.message}</span>`;
        elements.openDeepaiOutputBtn.classList.add('hidden');
    } finally {
        submitBtn.disabled = false;
    }
}

async function executeCreativeUpscale(event) {
    event.preventDefault();
    const submitBtn = event.target;
    submitBtn.disabled = true;

    const logElement = elements.deepaiLog;
    logElement.textContent = 'Preparing creative upscale...';
    logElement.classList.remove('hidden');

    try {
        const imageFile = elements.creativeUpscaleImageUpload.files[0];
        
        if (!imageFile) {
            throw new Error('Please select an image for creative upscale.');
        }

        logElement.textContent = `Uploading image and processing...`;

        // Convert image to data URL
        const imageDataUrl = await readFileAsDataURL(imageFile);
        
        const payload = {
            imageDataUrl: imageDataUrl
        };

        logElement.textContent = `Creatively upscaling image with DeepAI...`;

        const result = await window.electronAPI.deepaiCreativeUpscale(payload);
        
        if (result.success && result.filePath) {
            logElement.innerHTML = `<span style="color: var(--success-color">✅ Creative upscale complete!</span>`;
            elements.openDeepaiOutputBtn.classList.remove('hidden');

            // Display the result
            const previewsContainer = elements.deepaiPreviewsContainer;
            previewsContainer.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = await window.electronAPI.convertFileSrc(result.filePath);
            img.className = 'generated-image-preview';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '10px';
            previewsContainer.appendChild(img);
        } else {
            throw new Error(result.error || 'Failed to upscale image.');
        }
    } catch (error) {
        logElement.innerHTML = `<span style="color: var(--error-color)">❌ Creative Upscale Failed: ${error.message}</span>`;
        elements.openDeepaiOutputBtn.classList.add('hidden');
    } finally {
        submitBtn.disabled = false;
    }
}

async function executeText2Img(event) {
    event.preventDefault();
    const submitBtn = event.target;
    submitBtn.disabled = true;

    const logElement = elements.deepaiLog;
    logElement.textContent = 'Preparing text-to-image generation...';
    logElement.classList.remove('hidden');

    try {
        const prompt = elements.text2imgPrompt.value.trim();
        
        if (!prompt) {
            throw new Error('Please enter a text prompt for image generation.');
        }

        logElement.textContent = `Generating image with DeepAI Text-to-Image...`;

        const payload = {
            prompt: prompt
        };

        const result = await window.electronAPI.deepaiText2img(payload);
        
        if (result.success && result.filePath) {
            logElement.innerHTML = `<span style="color: var(--success-color">✅ Text-to-image generation complete!</span>`;
            elements.openDeepaiOutputBtn.classList.remove('hidden');

            // Display the result
            const previewsContainer = elements.deepaiPreviewsContainer;
            previewsContainer.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = await window.electronAPI.convertFileSrc(result.filePath);
            img.className = 'generated-image-preview';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '10px';
            previewsContainer.appendChild(img);
        } else {
            throw new Error(result.error || 'Failed to generate image.');
        }
    } catch (error) {
        logElement.innerHTML = `<span style="color: var(--error-color)">❌ Text-to-Image Failed: ${error.message}</span>`;
        elements.openDeepaiOutputBtn.classList.add('hidden');
    } finally {
        submitBtn.disabled = false;
    }
}

async function executeInpainting(event) {
    event.preventDefault();
    const submitBtn = event.target;
    submitBtn.disabled = true;

    const logElement = elements.deepaiLog;
    logElement.textContent = 'Preparing inpainting...';
    logElement.classList.remove('hidden');

    try {
        const imageFile = elements.inpaintingImageUpload.files[0];
        const maskFile = elements.inpaintingMaskUpload.files[0];
        const prompt = elements.inpaintingPrompt.value.trim();
        
        if (!imageFile) {
            throw new Error('Please select an image for inpainting.');
        }
        
        if (!maskFile) {
            throw new Error('Please select a mask for inpainting.');
        }
        
        if (!prompt) {
            throw new Error('Please enter a prompt for inpainting.');
        }

        logElement.textContent = `Uploading image, mask, and processing...`;

        // Convert image and mask to data URLs
        const [imageDataUrl, maskDataUrl] = await Promise.all([
            readFileAsDataURL(imageFile),
            readFileAsDataURL(maskFile)
        ]);
        
        const payload = {
            imageDataUrl: imageDataUrl,
            maskDataUrl: maskDataUrl,
            prompt: prompt
        };

        logElement.textContent = `Inpainting with DeepAI...`;

        const result = await window.electronAPI.deepaiInpainting(payload);
        
        if (result.success && result.filePath) {
            logElement.innerHTML = `<span style="color: var(--success-color">✅ Inpainting complete!</span>`;
            elements.openDeepaiOutputBtn.classList.remove('hidden');

            // Display the result
            const previewsContainer = elements.deepaiPreviewsContainer;
            previewsContainer.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = await window.electronAPI.convertFileSrc(result.filePath);
            img.className = 'generated-image-preview';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '10px';
            previewsContainer.appendChild(img);
        } else {
            throw new Error(result.error || 'Failed to inpaint image.');
        }
    } catch (error) {
        logElement.innerHTML = `<span style="color: var(--error-color)">❌ Inpainting Failed: ${error.message}</span>`;
        elements.openDeepaiOutputBtn.classList.add('hidden');
    } finally {
        submitBtn.disabled = false;
    }
}