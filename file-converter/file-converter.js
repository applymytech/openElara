// file-converter.js
const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

let selectedFiles = {
    imageBatch: []
};

// ==================== TAB SWITCHING ====================

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');

            clearAllResults();
        });
    });
}

// ==================== IMAGE CONVERTER ====================

function initImageConverter() {
    const batchModeCheckbox = document.getElementById('image-batch-mode');
    const singleInput = document.getElementById('image-single-input');
    const batchInput = document.getElementById('image-batch-input');
    const qualitySlider = document.getElementById('image-quality-slider');
    const qualityValue = document.getElementById('image-quality-value');

    batchModeCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            singleInput.style.display = 'none';
            batchInput.style.display = 'block';
        } else {
            singleInput.style.display = 'block';
            batchInput.style.display = 'none';
        }
    });

    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
    });

    document.getElementById('image-browse-btn').addEventListener('click', async () => {
        const result = await ipcRenderer.invoke('select-file-for-conversion', {
            filters: [
                { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff', 'tif', 'webp', 'ico', 'pdf'] }
            ]
        });

        if (result.success && !result.canceled) {
            document.getElementById('image-input-path').value = result.filePath;
            suggestOutputPath('image', result.filePath);
        }
    });

    document.getElementById('image-save-btn').addEventListener('click', async () => {
        const format = document.getElementById('image-output-format').value;
        const result = await ipcRenderer.invoke('select-save-location', {
            filters: [{ name: 'Image', extensions: [format] }]
        });

        if (result.success && !result.canceled) {
            document.getElementById('image-output-path').value = result.filePath;
        }
    });

    document.getElementById('image-output-format').addEventListener('change', () => {
        const inputPath = document.getElementById('image-input-path').value;
        if (inputPath) {
            suggestOutputPath('image', inputPath);
        }
    });

    document.getElementById('image-batch-browse-btn').addEventListener('click', async () => {
        const result = await ipcRenderer.invoke('select-files-for-conversion', {
            filters: [
                { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff', 'tif', 'webp', 'ico', 'pdf'] }
            ]
        });

        if (result.success && !result.canceled) {
            selectedFiles.imageBatch = result.filePaths;
            updateBatchList();
        }
    });

    document.getElementById('image-batch-dir-btn').addEventListener('click', async () => {
        document.getElementById('image-batch-output-dir').value = 'C:\\Users\\andre\\AppData\\Roaming\\openelara\\Output\\conversions';
    });

    document.getElementById('convert-image-btn').addEventListener('click', async () => {
        const isBatchMode = batchModeCheckbox.checked;

        if (isBatchMode) {
            await convertImageBatch();
        } else {
            await convertImageSingle();
        }
    });
}

function updateBatchList() {
    const listElement = document.getElementById('image-batch-list');
    
    if (selectedFiles.imageBatch.length === 0) {
        listElement.style.display = 'none';
        return;
    }

    listElement.style.display = 'block';
    listElement.innerHTML = selectedFiles.imageBatch.map((filePath, index) => `
        <div class="file-list-item">
            <span>${path.basename(filePath)}</span>
            <button class="remove-file" data-index="${index}">Remove</button>
        </div>
    `).join('');

    listElement.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            selectedFiles.imageBatch.splice(index, 1);
            updateBatchList();
        });
    });
}

async function convertImageSingle() {
    const inputPath = document.getElementById('image-input-path').value;
    const outputPath = document.getElementById('image-output-path').value;
    const outputFormat = document.getElementById('image-output-format').value;
    const quality = parseInt(document.getElementById('image-quality-slider').value);

    if (!inputPath || !outputPath) {
        showResult('image', 'error', 'Please select input and output files.');
        return;
    }

    showProgress('image', true);
    clearResult('image');

    try {
        const result = await ipcRenderer.invoke('convert-image', {
            mode: 'single',
            input: inputPath,
            output_format: outputFormat,
            output_path: outputPath,
            quality: quality
        });

        showProgress('image', false);

        if (result.success) {
            showResult('image', 'success', `✅ Image converted successfully!\n\nSaved to: ${result.output_path}`);
        } else {
            showResult('image', 'error', `❌ Conversion failed:\n${result.error}`);
        }
    } catch (error) {
        showProgress('image', false);
        showResult('image', 'error', `❌ Error: ${error.message}`);
    }
}

async function convertImageBatch() {
    const outputDir = document.getElementById('image-batch-output-dir').value;
    const outputFormat = document.getElementById('image-output-format').value;
    const quality = parseInt(document.getElementById('image-quality-slider').value);

    if (selectedFiles.imageBatch.length === 0) {
        showResult('image', 'error', 'Please select images to convert.');
        return;
    }

    if (!outputDir) {
        showResult('image', 'error', 'Please select an output directory.');
        return;
    }

    showProgress('image', true);
    clearResult('image');

    try {
        const result = await ipcRenderer.invoke('convert-image', {
            mode: 'batch',
            input: selectedFiles.imageBatch,
            output_format: outputFormat,
            output_dir: outputDir,
            quality: quality
        });

        showProgress('image', false);

        if (result.success) {
            const convertedCount = result.converted?.length || 0;
            showResult('image', 'success', `✅ ${convertedCount} images converted successfully!\n\nSaved to: ${outputDir}`);
        } else {
            showResult('image', 'error', `❌ Conversion failed:\n${result.error || result.message || 'Unknown error'}`);
        }
    } catch (error) {
        showProgress('image', false);
        showResult('image', 'error', `❌ Error: ${error.message}`);
    }
}

// ==================== PDF CONVERTER ====================

function initPdfConverter() {
    document.getElementById('pdf-browse-btn').addEventListener('click', async () => {
        const result = await ipcRenderer.invoke('select-file-for-conversion', {
            filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
        });

        if (result.success && !result.canceled) {
            document.getElementById('pdf-input-path').value = result.filePath;
            suggestOutputPath('pdf', result.filePath);
        }
    });

    document.getElementById('pdf-save-btn').addEventListener('click', async () => {
        const format = document.getElementById('pdf-output-format').value;
        const extension = format === 'markdown' ? 'md' : 'docx';
        
        const result = await ipcRenderer.invoke('select-save-location', {
            filters: [{ name: format === 'markdown' ? 'Markdown' : 'Word Document', extensions: [extension] }]
        });

        if (result.success && !result.canceled) {
            document.getElementById('pdf-output-path').value = result.filePath;
        }
    });

    document.getElementById('pdf-output-format').addEventListener('change', () => {
        const inputPath = document.getElementById('pdf-input-path').value;
        if (inputPath) {
            suggestOutputPath('pdf', inputPath);
        }
    });

    document.getElementById('convert-pdf-btn').addEventListener('click', async () => {
        await convertPdf();
    });
}

async function convertPdf() {
    const inputPath = document.getElementById('pdf-input-path').value;
    const outputFormat = document.getElementById('pdf-output-format').value;
    let outputPath = document.getElementById('pdf-output-path').value;
    const useOcr = document.getElementById('pdf-use-ocr').checked;
    const cleanFormat = document.getElementById('pdf-clean-format').checked;

    if (!inputPath) {
        showResult('pdf', 'error', 'Please select a PDF file.');
        return;
    }

    if (!outputPath) {
        showResult('pdf', 'error', 'Please select an output location.');
        return;
    }

    showProgress('pdf', true);
    clearResult('pdf');

    try {
        let result;

        if (outputFormat === 'markdown') {
            result = await ipcRenderer.invoke('convert-pdf-to-markdown', {
                input: inputPath,
                output: outputPath,
                use_ocr: useOcr,
                clean_format: cleanFormat
            });
        } else {
            const tempMdPath = outputPath.replace(/\.docx$/i, '.md');
            
            const mdResult = await ipcRenderer.invoke('convert-pdf-to-markdown', {
                input: inputPath,
                output: tempMdPath,
                use_ocr: useOcr,
                clean_format: cleanFormat
            });

            if (!mdResult.success) {
                showProgress('pdf', false);
                showResult('pdf', 'error', `❌ PDF to Markdown failed:\n${mdResult.error}`);
                return;
            }

            result = await ipcRenderer.invoke('convert-markdown-to-docx', {
                input: tempMdPath,
                output: outputPath
            });

            try {
                fs.unlinkSync(tempMdPath);
            } catch (e) {
                console.warn('Could not delete temporary file:', e);
            }
        }

        showProgress('pdf', false);

        if (result.success) {
            showResult('pdf', 'success', `✅ PDF converted successfully!\n\nSaved to: ${result.output_path || outputPath}`);
        } else {
            showResult('pdf', 'error', `❌ Conversion failed:\n${result.error}`);
        }
    } catch (error) {
        showProgress('pdf', false);
        showResult('pdf', 'error', `❌ Error: ${error.message}`);
    }
}

// ==================== TABLE EXTRACTOR ====================

function initTableExtractor() {
    document.getElementById('table-browse-btn').addEventListener('click', async () => {
        const result = await ipcRenderer.invoke('select-file-for-conversion', {
            filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
        });

        if (result.success && !result.canceled) {
            document.getElementById('table-input-path').value = result.filePath;
            document.getElementById('table-output-dir').value = 'C:\\Users\\andre\\AppData\\Roaming\\openelara\\Output\\conversions';
        }
    });

    document.getElementById('table-dir-btn').addEventListener('click', async () => {
        document.getElementById('table-output-dir').value = 'C:\\Users\\andre\\AppData\\Roaming\\openelara\\Output\\conversions';
    });

    document.getElementById('extract-tables-btn').addEventListener('click', async () => {
        await extractTables();
    });
}

async function extractTables() {
    const inputPath = document.getElementById('table-input-path').value;
    const outputFormat = document.getElementById('table-output-format').value;
    const outputDir = document.getElementById('table-output-dir').value;

    if (!inputPath) {
        showResult('table', 'error', 'Please select a PDF file.');
        return;
    }

    if (!outputDir) {
        showResult('table', 'error', 'Please select an output directory.');
        return;
    }

    showProgress('table', true);
    clearResult('table');

    try {
        const result = await ipcRenderer.invoke('extract-pdf-tables', {
            input: inputPath,
            output_format: outputFormat,
            output_dir: outputDir
        });

        showProgress('table', false);

        if (result.success) {
            const tableInfo = result.tables.map(t => 
                `• ${t.filename} (${t.rows} rows × ${t.columns} cols)`
            ).join('\n');
            
            showResult('table', 'success', 
                `✅ Extracted ${result.table_count} table(s)!\n\n${tableInfo}\n\nSaved to: ${outputDir}`
            );
        } else {
            showResult('table', 'error', `❌ Extraction failed:\n${result.error}`);
        }
    } catch (error) {
        showProgress('table', false);
        showResult('table', 'error', `❌ Error: ${error.message}`);
    }
}

// ==================== TEXT CONVERTER ====================

function initTextConverter() {
    document.getElementById('text-browse-btn').addEventListener('click', async () => {
        const result = await ipcRenderer.invoke('select-file-for-conversion', {
            filters: [
                { name: 'Text Files', extensions: ['txt', 'md', 'markdown', 'html', 'htm', 'rtf', 'docx', 'doc'] }
            ]
        });

        if (result.success && !result.canceled) {
            document.getElementById('text-input-path').value = result.filePath;
            suggestOutputPath('text', result.filePath);
        }
    });

    document.getElementById('text-save-btn').addEventListener('click', async () => {
        const format = document.getElementById('text-output-format').value;
        
        const result = await ipcRenderer.invoke('select-save-location', {
            filters: [{ name: 'Text File', extensions: [format] }]
        });

        if (result.success && !result.canceled) {
            document.getElementById('text-output-path').value = result.filePath;
        }
    });

    document.getElementById('text-output-format').addEventListener('change', () => {
        const inputPath = document.getElementById('text-input-path').value;
        if (inputPath) {
            suggestOutputPath('text', inputPath);
        }
    });

    document.getElementById('convert-text-btn').addEventListener('click', async () => {
        await convertText();
    });
}

async function convertText() {
    const inputPath = document.getElementById('text-input-path').value;
    const outputFormat = document.getElementById('text-output-format').value;
    let outputPath = document.getElementById('text-output-path').value;

    if (!inputPath) {
        showResult('text', 'error', 'Please select an input file.');
        return;
    }

    if (!outputPath) {
        showResult('text', 'error', 'Please select an output location.');
        return;
    }

    showProgress('text', true);
    clearResult('text');

    try {
        const result = await ipcRenderer.invoke('convert-text-file', {
            input: inputPath,
            output: outputPath,
            output_format: outputFormat
        });

        showProgress('text', false);

        if (result.success) {
            showResult('text', 'success', `✅ Text file converted successfully!\n\nSaved to: ${result.output_path}`);
        } else {
            showResult('text', 'error', `❌ Conversion failed:\n${result.error}`);
        }
    } catch (error) {
        showProgress('text', false);
        showResult('text', 'error', `❌ Error: ${error.message}`);
    }
}

// ==================== UTILITY FUNCTIONS ====================

function suggestOutputPath(type, inputPath) {
    const dir = 'C:\\Users\\andre\\AppData\\Roaming\\openelara\\Output\\conversions';
    const basename = path.basename(inputPath, path.extname(inputPath));
    
    let extension;
    switch (type) {
        case 'image':
            extension = document.getElementById('image-output-format').value;
            document.getElementById('image-output-path').value = path.join(dir, `${basename}.${extension}`);
            break;
        case 'pdf':
            const pdfFormat = document.getElementById('pdf-output-format').value;
            extension = pdfFormat === 'markdown' ? 'md' : 'docx';
            document.getElementById('pdf-output-path').value = path.join(dir, `${basename}.${extension}`);
            break;
        case 'text':
            extension = document.getElementById('text-output-format').value;
            document.getElementById('text-output-path').value = path.join(dir, `${basename}.${extension}`);
            break;
    }
}

function showProgress(type, show) {
    const progressElement = document.getElementById(`${type}-progress`);
    if (show) {
        progressElement.classList.add('active');
    } else {
        progressElement.classList.remove('active');
    }
}

function showResult(type, status, message) {
    const resultElement = document.getElementById(`${type}-result`);
    resultElement.className = `result-message ${status}`;
    resultElement.textContent = message;
    resultElement.style.display = 'block';
}

function clearResult(type) {
    const resultElement = document.getElementById(`${type}-result`);
    resultElement.style.display = 'none';
}

function clearAllResults() {
    ['image', 'pdf', 'table', 'text'].forEach(type => {
        clearResult(type);
        showProgress(type, false);
    });
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initImageConverter();
    initPdfConverter();
    initTableExtractor();
    initTextConverter();
});
