// src/main/handlers/petHandlers.js
const { ipcMain, app } = require('electron');
const log = require('electron-log');
const path = require('path');
const fs = require('fs').promises;
const { PetWindowManager } = require('../../pet/petWindow');

let petManager = null;

function registerPetHandlers() {
    log.info('Registering pet IPC handlers...');

    ipcMain.handle('launch-pet', async (event, characterName) => {
        try {
            log.info(`Launching pet for character: ${characterName}`);
            
            if (!petManager) {
                petManager = new PetWindowManager();
            }
            
            await petManager.createPetWindow(characterName);
            
            return { success: true };
        } catch (error) {
            log.error('Error launching pet:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('close-pet', async () => {
        try {
            if (petManager) {
                petManager.closePet();
                petManager = null;
            }
            return { success: true };
        } catch (error) {
            log.error('Error closing pet:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('pet-say', async (event, text, duration) => {
        try {
            if (petManager) {
                petManager.showChatBubble(text, duration);
                return { success: true };
            } else {
                return { success: false, error: 'No pet window active' };
            }
        } catch (error) {
            log.error('Error showing pet chat bubble:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('pet-is-active', async () => {
        return { active: petManager !== null };
    });
    
    log.info('Pet IPC handlers registered successfully');
}

module.exports = { registerPetHandlers };
