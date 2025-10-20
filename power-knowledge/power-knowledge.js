// Power Knowledge - Enhanced UI JavaScript
// Neural web search and research interface for OpenElara

const { ipcRenderer } = require('electron');

// DOM Elements
const backLink = document.getElementById('back-link');

// Tab system
const tabSimple = document.getElementById('tab-simple');
const tabAdvanced = document.getElementById('tab-advanced');
const simplePanel = document.getElementById('simple-panel');
const advancedPanel = document.getElementById('advanced-panel');

// Simple query elements
const commandButtons = document.querySelectorAll('.command-btn');
const queryDetails = document.getElementById('query-details');
const selectedCommandTitle = document.getElementById('selected-command-title');
const selectedCommandName = document.getElementById('selected-command-name');
const queryInput = document.getElementById('query-input');
const executeBtn = document.getElementById('execute-btn');
const clearSimpleBtn = document.getElementById('clear-simple-btn');
const simpleResults = document.getElementById('simple-results');

// Advanced research elements
const researchQuery = document.getElementById('research-query');
const numResults = document.getElementById('num-results');
const startDate = document.getElementById('start-date');
const includeDomains = document.getElementById('include-domains');
const excludeDomains = document.getElementById('exclude-domains');
const researchModel = document.getElementById('research-model');
const researchExecuteBtn = document.getElementById('research-execute-btn');
const clearAdvancedBtn = document.getElementById('clear-advanced-btn');
const researchLog = document.getElementById('research-log');

// State
let currentTask = '';

// Back to main app
backLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.close();
});

// Tab switching
tabSimple.addEventListener('click', () => {
    tabSimple.classList.add('active');
    tabAdvanced.classList.remove('active');
    simplePanel.classList.add('active');
    advancedPanel.classList.remove('active');
});

tabAdvanced.addEventListener('click', () => {
    tabAdvanced.classList.add('active');
    tabSimple.classList.remove('active');
    advancedPanel.classList.add('active');
    simplePanel.classList.remove('active');
});

// Command selection
commandButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        commandButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        currentTask = btn.dataset.task;
        
        queryDetails.classList.add('active');
        selectedCommandTitle.classList.add('active');
        
        const taskNames = {
            search: 'Power Search',
            crawl: 'Power Read',
            similar: 'Power Similar',
            answer: 'Power Answer'
        };
        selectedCommandName.textContent = taskNames[currentTask] || currentTask;
        
        const placeholders = {
            search: 'Enter search query (e.g., "latest AI developments")',
            crawl: 'Enter URL to read and summarize',
            similar: 'Enter URL to find similar content',
            answer: 'Enter question to answer'
        };
        queryInput.placeholder = placeholders[currentTask] || 'Enter query or URL...';
        
        const livecrawlGroup = document.getElementById('livecrawl-group');
        if (currentTask === 'crawl') {
            livecrawlGroup.style.display = 'block';
        } else {
            livecrawlGroup.style.display = 'none';
        }
        
        queryInput.focus();
    });
});

// Execute simple query
executeBtn.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    
    if (!query) {
        addLogEntry('error', 'Please enter a query or URL');
        return;
    }
    
    if (!currentTask) {
        addLogEntry('error', 'Please select a query type first');
        return;
    }
    
    executeBtn.disabled = true;
    executeBtn.textContent = 'Processing...';
    
    simpleResults.innerHTML = '';
    simpleResults.style.display = 'block';
    
    try {
        addLogEntry('info', `Executing ${currentTask} query...`);
        
        const payload = {
            task: currentTask,
            query: query
        };
        
        if (currentTask === 'crawl') {
            const livecrawlSelect = document.getElementById('livecrawl-select');
            payload.livecrawl = livecrawlSelect.value;
        }
        
        const result = await ipcRenderer.invoke('run-web-task', payload);
        
        if (!result || !result.success) {
            throw new Error(result?.error || 'Query failed');
        }
        
        displayResults(result, currentTask);
        addLogEntry('success', 'Query completed successfully');
        
        await ipcRenderer.invoke('send-exa-result-to-chat', {
            task: currentTask,
            query: query,
            result: result
        });
        
    } catch (error) {
        addLogEntry('error', `Error: ${error.message}`);
        simpleResults.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center;">❌ ${error.message}</div>`;
    } finally {
        executeBtn.disabled = false;
        executeBtn.textContent = 'Execute';
    }
});

// Clear simple query
clearSimpleBtn.addEventListener('click', () => {
    queryInput.value = '';
    simpleResults.innerHTML = '';
    simpleResults.style.display = 'none';
    queryDetails.classList.remove('active');
    selectedCommandTitle.classList.remove('active');
    commandButtons.forEach(b => b.classList.remove('selected'));
    currentTask = '';
    
    const livecrawlGroup = document.getElementById('livecrawl-group');
    livecrawlGroup.style.display = 'none';
});

// Execute advanced research
researchExecuteBtn.addEventListener('click', async () => {
    const query = researchQuery.value.trim();
    
    if (!query) {
        addResearchLog('error', 'Please enter a research query');
        return;
    }
    
    researchExecuteBtn.disabled = true;
    researchExecuteBtn.textContent = 'Researching...';
    
    researchLog.classList.add('active');
    researchLog.innerHTML = '';
    
    try {
        addResearchLog('info', '🔍 Starting advanced research...');
        
        const advancedOptions = {
            numResults: parseInt(numResults.value) || 5,
            startDate: startDate.value || null,
            domainIncludes: includeDomains.value.split(',').map(d => d.trim()).filter(d => d),
            domainExcludes: excludeDomains.value.split(',').map(d => d.trim()).filter(d => d),
            model: researchModel.value || 'exa-research'
        };
        
        addResearchLog('info', `🤖 Using model: ${advancedOptions.model}`);
        addResearchLog('info', '📡 Submitting research task to Exa.ai...');
        
        const result = await ipcRenderer.invoke('run-web-task', {
            task: 'research',
            query: query,
            advancedOptions: advancedOptions
        });
        
        if (!result || !result.success) {
            throw new Error(result?.error || 'Research failed');
        }
        
        addResearchLog('success', `✅ Research complete! Generated comprehensive report`);
        
        const resultDiv = document.createElement('div');
        resultDiv.style.cssText = 'margin-top: 15px; padding: 15px; background: #252525; border-radius: 8px;';
        resultDiv.innerHTML = `
            <h4 style="margin-top: 0; color: #a78bfa;">Research Results:</h4>
            <div style="white-space: pre-wrap; color: #e0e0e0; line-height: 1.6;">${result.answer}</div>
            <div style="margin-top: 15px; color: #888; font-size: 0.9em;">
                📝 This research report was generated by Exa.ai's advanced research model, synthesizing information from multiple sources.
            </div>
        `;
        researchLog.appendChild(resultDiv);
        
        addResearchLog('success', `📁 Results saved to Output/exa/ folder`);
        
        await ipcRenderer.invoke('send-exa-result-to-chat', {
            task: 'research',
            query: query,
            result: result
        });
        
    } catch (error) {
        addResearchLog('error', `❌ Error: ${error.message}`);
    } finally {
        researchExecuteBtn.disabled = false;
        researchExecuteBtn.textContent = 'Execute Research';
    }
});

// Clear advanced research
clearAdvancedBtn.addEventListener('click', () => {
    researchQuery.value = '';
    numResults.value = '5';
    startDate.value = '';
    includeDomains.value = '';
    excludeDomains.value = '';
    researchModel.value = 'exa-research';
    researchLog.innerHTML = '';
    researchLog.classList.remove('active');
});

// Display results based on task type
function displayResults(result, task) {
    if (task === 'search' || task === 'similar') {
        displaySearchResults(result.results);
    } else if (task === 'crawl' || task === 'answer') {
        displayTextResult(result.answer, result.sourceUrls);
    }
}

// Display search results
function displaySearchResults(results) {
    if (!results || results.length === 0) {
        simpleResults.innerHTML = '<div style="color: #888; padding: 20px; text-align: center;">No results found</div>';
        return;
    }
    
    const html = results.map((item, index) => {
        const scoreText = item.score ? `<span class="result-score">Score: ${item.score.toFixed(3)}</span>` : '';
        return `
            <div class="result-item">
                <div class="result-title">${index + 1}. ${item.title}</div>
                <a href="${item.url}" target="_blank" class="result-url">${item.url}</a>
                ${scoreText}
            </div>
        `;
    }).join('');
    
    simpleResults.innerHTML = html;
}

// Display text result
function displayTextResult(text, sourceUrls) {
    const sources = sourceUrls && sourceUrls.length > 0 
        ? `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #333;">
            <strong style="color: #a78bfa;">Sources:</strong><br>
            ${sourceUrls.map(url => `<a href="${url}" target="_blank" style="color: #60a5fa; text-decoration: none; display: block; margin-top: 5px;">${url}</a>`).join('')}
           </div>`
        : '';
    
    simpleResults.innerHTML = `
        <div style="padding: 20px;">
            <div style="white-space: pre-wrap; color: #e0e0e0; line-height: 1.6;">${text}</div>
            ${sources}
        </div>
    `;
}

// Add log entry (simple query)
function addLogEntry(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    
    // Create temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#60a5fa'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = `${icon} ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add research log entry
function addResearchLog(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span>${message}`;
    researchLog.appendChild(entry);
    researchLog.scrollTop = researchLog.scrollHeight;
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
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
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
