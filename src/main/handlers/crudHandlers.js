// src/main/handlers/crudHandlers.js
const { ipcMain } = require('electron');
const Store = require('electron-store');
const log = require('electron-log');
const { DEFAULT_ACTIONS, DEFAULT_PROMPTS, DEFAULT_MODIFIERS } = require('../constants'); 

const store = new Store();


const createCrudHandlers = (storeKey, singularName, defaults = []) => {
    const lowerCaseKey = storeKey.toLowerCase();

    if (store.get(lowerCaseKey, []).length === 0 && defaults.length > 0) {
        store.set(lowerCaseKey, defaults);
        log.info(`Initialized store key '${lowerCaseKey}' with ${defaults.length} default items.`);
    }

    ipcMain.handle(`get${storeKey}`, () => store.get(lowerCaseKey, []));

    ipcMain.handle(`get${singularName}`, (event, identifier) => 
        store.get(lowerCaseKey, []).find(p => p.id === identifier || p.name === identifier)
    );

    ipcMain.handle(`save${singularName}`, (event, newItem) => {
        try {
            if (!newItem.name) {
                throw new Error('Item must have a name to be saved.');
            }
            let items = store.get(lowerCaseKey, []);
            if (newItem.id !== undefined) {
                items = items.filter(p => p.id !== newItem.id);
            } else {
                items = items.filter(p => p.name !== newItem.name);
            }
            items.push(newItem);
            store.set(lowerCaseKey, items);
            log.info(`Saved ${singularName}: ${newItem.name}`);
            return { success: true, message: `${singularName} '${newItem.name}' saved.` };
        } catch (e) {
            log.error(`Error saving ${singularName}:`, e);
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle(`remove${singularName}`, (event, name) => {
        try {
            let items = store.get(lowerCaseKey, []);
        if (typeof name === 'string' && name.startsWith(`${lowerCaseKey.slice(0, -1)}_`)) {
            items = items.filter(p => p.id !== name);
        } else {
            items = items.filter(p => p.name !== name);
        }
            store.set(lowerCaseKey, items);
            log.info(`Removed ${singularName}: ${name}`);
            return { success: true, message: `${singularName} '${name}' removed.` };
        } catch (e) {
            log.error(`Error removing ${singularName}:`, e);
            return { success: false, error: e.message };
        }
    });
};

const setupCrudHandlers = () => {
    log.info('Setting up CRUD IPC handlers...');
    createCrudHandlers('Personalities', 'Personality');
    createCrudHandlers('Prompts', 'Prompt', DEFAULT_PROMPTS);
    createCrudHandlers('Actions', 'Action', DEFAULT_ACTIONS);
    createCrudHandlers('Modifiers', 'Modifier', DEFAULT_MODIFIERS);
};

module.exports = { setupCrudHandlers };