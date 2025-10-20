const { ipcMain, dialog, app } = require('electron');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const { runPythonScript } = require('../utils');


async function handleImageConversion(payload) {
    log.info('Starting image conversion...');
    
    const { mode, input, output_format, output_path, output_dir, quality } = payload;
    
    try {
        const result = await runPythonScript({
            scriptName: 'image_converter.py',
            args: [],
            inputData: JSON.stringify({
                mode: mode || 'single',
                input: input,
                output_format: output_format,
                output_path: output_path,
                output_dir: output_dir,
                quality: quality || 95
            })
        });
        
        return result;
    } catch (error) {
        log.error('Image conversion error:', error.message);
        return { success: false, error: error.message };
    }
}

async function handlePdfToMarkdown(payload) {
    log.info('Starting PDF to Markdown conversion...');
    
    const { input, output, use_ocr, clean_format } = payload;
    
    try {
        const result = await runPythonScript({
            scriptName: 'pdf_to_markdown.py',
            args: [],
            inputData: JSON.stringify({
                input: input,
                output: output,
                use_ocr: use_ocr || false,
                clean_format: clean_format !== false
            })
        });
        
        return result;
    } catch (error) {
        log.error('PDF to Markdown conversion error:', error.message);
        return { success: false, error: error.message };
    }
}

async function handlePdfTableExtraction(payload) {
    log.info('Starting PDF table extraction...');
    
    const { input, output_format, output_dir } = payload;
    
    try {
        const result = await runPythonScript({
            scriptName: 'pdf_table_extractor.py',
            args: [],
            inputData: JSON.stringify({
                input: input,
                output_format: output_format || 'csv',
                output_dir: output_dir
            })
        });
        
        return result;
    } catch (error) {
        log.error('PDF table extraction error:', error.message);
        return { success: false, error: error.message };
    }
}

async function handleMarkdownToDocx(payload) {
    log.info('Starting Markdown to DOCX conversion...');
    
    const { input, output } = payload;
    
    try {
        const result = await runPythonScript({
            scriptName: 'markdown_to_docx.py',
            args: [],
            inputData: JSON.stringify({
                input: input,
                output: output
            })
        });
        
        return result;
    } catch (error) {
        log.error('Markdown to DOCX conversion error:', error.message);
        return { success: false, error: error.message };
    }
}

async function handleTextConversion(payload) {
    log.info('Starting text file conversion...');
    
    const { input, output, output_format } = payload;
    
    try {
        const result = await runPythonScript({
            scriptName: 'text_converter.py',
            args: [],
            inputData: JSON.stringify({
                input: input,
                output: output,
                output_format: output_format
            })
        });
        
        return result;
    } catch (error) {
        log.error('Text conversion error:', error.message);
        return { success: false, error: error.message };
    }
}

const setupFileConversionHandlers = () => {
    log.info('Setting up File Conversion IPC handlers...');
    
    ipcMain.handle('convert-image', async (event, payload) => {
        return await handleImageConversion(payload);
    });
    
    ipcMain.handle('convert-pdf-to-markdown', async (event, payload) => {
        return await handlePdfToMarkdown(payload);
    });
    
    ipcMain.handle('extract-pdf-tables', async (event, payload) => {
        return await handlePdfTableExtraction(payload);
    });
    
    ipcMain.handle('convert-markdown-to-docx', async (event, payload) => {
        return await handleMarkdownToDocx(payload);
    });
    
    ipcMain.handle('convert-text-file', async (event, payload) => {
        return await handleTextConversion(payload);
    });
    
    ipcMain.handle('select-file-for-conversion', async (event, options) => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: options.filters || [{ name: 'All Files', extensions: ['*'] }]
        });
        
        if (result.canceled) {
            return { success: false, canceled: true };
        }
        
        return { success: true, filePath: result.filePaths[0] };
    });
    
    ipcMain.handle('select-files-for-conversion', async (event, options) => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: options.filters || [{ name: 'All Files', extensions: ['*'] }]
        });
        
        if (result.canceled) {
            return { success: false, canceled: true };
        }
        
        return { success: true, filePaths: result.filePaths };
    });
    
    ipcMain.handle('select-save-location', async (event, options) => {
        const result = await dialog.showSaveDialog({
            defaultPath: options.defaultPath,
            filters: options.filters || [{ name: 'All Files', extensions: ['*'] }]
        });
        
        if (result.canceled) {
            return { success: false, canceled: true };
        }
        
        return { success: true, filePath: result.filePath };
    });
};

module.exports = {
    setupFileConversionHandlers,
    handleImageConversion,
    handlePdfToMarkdown,
    handlePdfTableExtraction,
    handleMarkdownToDocx,
    handleTextConversion
};
