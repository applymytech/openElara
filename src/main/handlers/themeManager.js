const { ipcMain } = require('electron');
const log = require('electron-log');
const Store = require('electron-store');
const { getActiveCharacter } = require('../characters');
const { routeApiCall } = require('./apiHandlers');

const store = new Store();


class ThemeManager {
    constructor() {
        this.config = {
            storageKey: 'theme',
            defaultMode: 'dark',
            classes: {
                themeActive: 'theme-active',
                lightMode: 'light-theme'
            }
        };

        this.currentTheme = {
            mode: 'dark',
            palette: null,
            isLightActive: false
        };

        this.defaultDark = {
            'main-bg-color': '#1e1e1e',
            'secondary-bg-color': '#252526',
            'tertiary-bg-color': '#3c3c3c',
            'button-bg-color': '#444444',
            'button-hover-bg-color': '#555555',
            'border-color': '#3c3c3c',
            'main-text-color': '#d4d4d4',
            'secondary-text-color': '#a0a0a0',
            'accent-color': '#0e639c',
            'accent-color-hover': '#1177bb',
            'message-user-bg': '#0e639c',
            'message-ai-bg': '#2d2d30',
            'accent-contrast-text-color': '#ffffff',
            'code-block-bg': '#282c34',
            'error-color': '#e74c3c',
            'success-color': '#2ecc71',
            'link-color': '#6a9ec5',
            'highlight-color': '#FFD700',
            'spinner-base-color': '#3c3c3c',
            'shadow-color-rgba': 'rgba(0, 0, 0, 0.4)',
            'hug-color': '#ffc107',
            'punch-color': '#dc3545',
            'high-five-color': '#28a745',
            'send-btn-bg-color': '#0e639c',
            'send-btn-hover-bg-color': '#1177bb',
            'sidebar-bg-color': '#252526',
            'sidebar-btn-bg-color': '#444444',
            'sidebar-btn-hover-bg-color': '#555555'
        };

        this.defaultLight = {
            'main-bg-color': '#f5f5f5',
            'secondary-bg-color': '#ffffff',
            'tertiary-bg-color': '#e9ecef',
            'button-bg-color': '#e0e0e0',
            'button-hover-bg-color': '#d0d0d0',
            'border-color': '#cccccc',
            'main-text-color': '#222222',
            'secondary-text-color': '#555555',
            'accent-color': '#007bff',
            'accent-color-hover': '#0056b3',
            'message-user-bg': '#007bff',
            'message-ai-bg': '#e9ecef',
            'accent-contrast-text-color': '#ffffff',
            'code-block-bg': '#f8f9fa',
            'error-color': '#f8d7da',
            'success-color': '#d4edda',
            'link-color': '#0056b3',
            'highlight-color': '#e6b400',
            'spinner-base-color': '#e0e0e0',
            'shadow-color-rgba': 'rgba(0, 0, 0, 0.1)',
            'hug-color': '#ffc107',
            'punch-color': '#dc3545',
            'high-five-color': '#28a745',
            'send-btn-bg-color': '#007bff',
            'send-btn-hover-bg-color': '#0056b3',
            'sidebar-bg-color': '#ffffff',
            'sidebar-btn-bg-color': '#e0e0e0',
            'sidebar-btn-hover-bg-color': '#d0d0d0'
        };
    }

    async initialize() {
        try {
            const savedTheme = store.get(this.config.storageKey);
            if (savedTheme && savedTheme.mode === 'custom' && savedTheme.palette && savedTheme.palette.dark && savedTheme.palette.light) {
                const requiredColors = ['main-bg-color', 'main-text-color', 'accent-color'];
                let isValid = true;
                for (const variant of ['dark', 'light']) {
                    for (const color of requiredColors) {
                        if (!savedTheme.palette[variant][color]) {
                            isValid = false;
                            break;
                        }
                    }
                    if (!isValid) break;
                }

                if (isValid) {
                    this.currentTheme = savedTheme;
                    log.info('[Theme Manager] Loaded saved custom theme');
                    return;
                } else {
                    log.warn('[Theme Manager] Saved custom theme is invalid, resetting to default');
                }
            } else if (savedTheme && savedTheme.mode !== 'custom') {
                this.currentTheme = savedTheme;
                log.info('[Theme Manager] Loaded saved theme:', this.currentTheme.mode);
                return;
            }

            this._applyDefaultTheme();
            log.info('[Theme Manager] Applied default theme');
        } catch (error) {
            log.error('[Theme Manager] Initialization error:', error);
            this._applyDefaultTheme();
        }
    }

    getCurrentTheme() {
        return { ...this.currentTheme };
    }

    async setTheme(theme) {
        try {
            this.currentTheme = theme;
            store.set(this.config.storageKey, theme);
            log.info('[Theme Manager] Theme saved:', theme.mode);
            return this._applyTheme();
        } catch (error) {
            log.error('[Theme Manager] Error setting theme:', error);
            throw error;
        }
    }


    async toggleMode() {
        if (this.currentTheme.mode === 'custom' && (!this.currentTheme.palette || !this.currentTheme.palette.dark || !this.currentTheme.palette.light)) {
            log.warn('[Theme Manager] Custom theme has invalid palette, resetting to default');
            await this.resetToDefault();
            return this._applyTheme();
        }

        const newIsLight = !this.currentTheme.isLightActive;
        this.currentTheme.isLightActive = newIsLight;

        if (this.currentTheme.mode === 'custom' && this.currentTheme.palette) {
            this.currentTheme.isLightActive = newIsLight;
        } else {
            this.currentTheme.mode = newIsLight ? 'light' : 'dark';
        }

        await this.setTheme(this.currentTheme);
        return this._applyTheme();
    }

    async applyCustomTheme(palette) {
        if (!palette || !palette.dark || !palette.light) {
            log.error('[Theme Manager] Invalid palette provided to applyCustomTheme:', palette);
            throw new Error('Palette must have both "dark" and "light" variants');
        }

        const requiredColors = ['main-bg-color', 'main-text-color', 'accent-color', 'send-btn-bg-color', 'sidebar-bg-color'];
        for (const variant of ['dark', 'light']) {
            for (const color of requiredColors) {
                if (!palette[variant][color]) {
                    log.error(`[Theme Manager] Missing required color: ${variant}.${color}`);
                    throw new Error(`Invalid palette: missing ${variant}.${color}`);
                }
            }
        }

        this.currentTheme = {
            mode: 'custom',
            palette: palette,
            isLightActive: this.currentTheme.isLightActive
        };

        await this.setTheme(this.currentTheme);
        return this._applyTheme();
    }

    async resetToDefault() {
        log.info('[Theme Manager] Resetting theme to default');

        this.currentTheme = {
            mode: 'dark',
            palette: null,
            isLightActive: false
        };

        await this.setTheme(this.currentTheme);
        return this._applyTheme();
    }

    _applyTheme() {
        if (this.currentTheme.mode === 'custom' && this.currentTheme.palette && this.currentTheme.palette.dark && this.currentTheme.palette.light) {
            const customDark = { ...this.defaultDark, ...this.currentTheme.palette.dark };
            const customLight = { ...this.defaultLight, ...this.currentTheme.palette.light };
            return {
                type: 'custom',
                palette: {
                    dark: customDark,
                    light: customLight
                },
                isLightActive: this.currentTheme.isLightActive
            };
        } else {
            return {
                type: 'default',
                palette: {
                    dark: this.defaultDark,
                    light: this.defaultLight
                },
                isLightActive: this.currentTheme.isLightActive
            };
        }
    }

    _applyDefaultTheme() {
        return {
            type: 'default',
            mode: this.currentTheme.mode,
            isLightActive: this.currentTheme.isLightActive
        };
    }

    _applyPalette(palette) {
        if (!palette) {
            log.warn('[Theme Manager] No palette provided to applyPalette');
            return null;
        }

        return {
            type: 'custom',
            palette: palette,
            isLightActive: this.currentTheme.isLightActive
        };
    }
}

const themeManager = new ThemeManager();

// IPC Handlers
const setupThemeHandlers = () => {
    log.info('Setting up Theme Manager IPC handlers...');

    ipcMain.handle('get-theme', async () => {
        return themeManager.getCurrentTheme();
    });

    ipcMain.handle('toggle-theme-mode', async () => {
        const themeData = await themeManager.toggleMode();
        return { success: true, themeData };
    });

    ipcMain.handle('reset-theme', async () => {
        const themeData = await themeManager.resetToDefault();
        return { success: true, themeData };
    });

};

themeManager.initialize().catch(error => {
    log.error('[Theme Manager] Failed to initialize:', error);
});

module.exports = { setupThemeHandlers, themeManager };