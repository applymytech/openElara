const { ipcRenderer } = require('electron');

// DOM Elements
const urlInput = document.getElementById('scrapy-url-input');
const urlCounter = document.getElementById('url-counter');
const startBtn = document.getElementById('start-scrape-btn');
const clearBtn = document.getElementById('clear-btn');
const modeContent = document.getElementById('mode-content');
const modeLinks = document.getElementById('mode-links');
const modeDescription = document.getElementById('mode-description');

const progressSection = document.getElementById('progress-section');
const completedCount = document.getElementById('completed-count');
const totalCount = document.getElementById('total-count');
const progressBar = document.getElementById('progress-bar');
const logContainer = document.getElementById('log-container');

const resultsSection = document.getElementById('results-section');
const successCount = document.getElementById('success-count');
const failedCount = document.getElementById('failed-count');
const totalSize = document.getElementById('total-size');
const fileList = document.getElementById('file-list');
const openFolderBtn = document.getElementById('open-folder-btn');

// State
let isScrapingActive = false;
let scrapedFiles = [];
let stats = {
    total: 0,
    completed: 0,
    successful: 0,
    failed: 0,
    totalBytes: 0
};

// Update URL counter
function updateUrlCounter() {
    const urls = urlInput.value.trim().split('\n').filter(url => url.trim());
    const count = urls.length;
    urlCounter.textContent = `${count} / 64`;
    
    urlCounter.classList.remove('warning', 'max');
    if (count >= 64) {
        urlCounter.classList.add('max');
    } else if (count >= 50) {
        urlCounter.classList.add('warning');
    }
    
    if (count > 64) {
        const limitedUrls = urls.slice(0, 64);
        urlInput.value = limitedUrls.join('\n');
    }
    
    startBtn.disabled = count === 0 || isScrapingActive;
}

// Update mode description
function updateModeDescription() {
    if (modeContent.checked) {
        modeDescription.innerHTML = `
            <strong>Content Mode:</strong> Extracts the main text content from each page with intelligent formatting. 
            Preserves headings, lists, and structure in clean Markdown format.
        `;
    } else {
        modeDescription.innerHTML = `
            <strong>Links Mode:</strong> Discovers and extracts all hyperlinks from each page. 
            Useful for site mapping and finding related resources.
        `;
    }
}

// Add log entry
function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span>${message}`;
    
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Update progress
function updateProgress() {
    const percentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    progressBar.style.width = `${percentage}%`;
    completedCount.textContent = stats.completed;
    totalCount.textContent = stats.total;
}

// Format bytes to readable size
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Show results
function showResults() {
    successCount.textContent = stats.successful;
    failedCount.textContent = stats.failed;
    totalSize.textContent = formatBytes(stats.totalBytes);
    
    fileList.innerHTML = '';
    scrapedFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-icon">📄</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatBytes(file.size)}</span>
        `;
        fileList.appendChild(fileItem);
    });
    
    resultsSection.classList.add('active');
}

// Start scraping
async function startScraping() {
    const urls = urlInput.value.trim().split('\n').filter(url => url.trim());
    if (urls.length === 0) {
        addLog('❌ No URLs provided', 'error');
        return;
    }
    
    isScrapingActive = true;
    scrapedFiles = [];
    stats = {
        total: urls.length,
        completed: 0,
        successful: 0,
        failed: 0,
        totalBytes: 0
    };
    
    startBtn.disabled = true;
    progressSection.classList.add('active');
    resultsSection.classList.remove('active');
    logContainer.innerHTML = '';
    updateProgress();
    
    const mode = modeContent.checked ? 'content' : 'links';
    addLog(`🚀 Starting ${mode} scrape for ${urls.length} URL(s)...`, 'info');
    
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i].trim();
        addLog(`📡 Processing: ${url}`, 'info');
        
        try {
            const result = await ipcRenderer.invoke('scrapy-scrape', {
                url: url,
                mode: mode
            });
            
            if (result.success) {
                stats.successful++;
                stats.totalBytes += result.fileSize || 0;
                scrapedFiles.push({
                    name: result.fileName || `scraped_${i + 1}.md`,
                    size: result.fileSize || 0
                });
                addLog(`✅ Success: ${result.fileName}`, 'success');
            } else {
                stats.failed++;
                addLog(`❌ Failed: ${result.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            stats.failed++;
            addLog(`❌ Error: ${error.message}`, 'error');
        }
        
        stats.completed++;
        updateProgress();
    }
    
    isScrapingActive = false;
    startBtn.disabled = false;
    addLog(`🎉 Scraping complete! ${stats.successful} succeeded, ${stats.failed} failed`, 
           stats.failed > 0 ? 'error' : 'success');
    
    showResults();
}

// Clear form
function clearForm() {
    urlInput.value = '';
    updateUrlCounter();
    progressSection.classList.remove('active');
    resultsSection.classList.remove('active');
    logContainer.innerHTML = '';
}

// Open output folder
async function openOutputFolder() {
    try {
        await ipcRenderer.invoke('open-scrapy-output-folder');
    } catch (error) {
        addLog(`❌ Could not open folder: ${error.message}`, 'error');
    }
}

// Event Listeners
urlInput.addEventListener('input', updateUrlCounter);
modeContent.addEventListener('change', updateModeDescription);
modeLinks.addEventListener('change', updateModeDescription);
startBtn.addEventListener('click', startScraping);
clearBtn.addEventListener('click', clearForm);
openFolderBtn.addEventListener('click', openOutputFolder);

// Handle Enter key in textarea (Ctrl+Enter to submit)
urlInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter' && !startBtn.disabled) {
        startScraping();
    }
});

// Initialize
updateUrlCounter();
updateModeDescription();

// Listen for scraping events from main process
ipcRenderer.on('scrapy-progress', (event, data) => {
    if (data.type === 'log') {
        addLog(data.message, data.level || 'info');
    }
});
