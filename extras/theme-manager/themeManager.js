/**
 * AI-Driven Theme Manager
 * A standalone, reusable theme management system for web applications
 * 
 * @version 1.0.0
 * @license MIT
 */

export class ThemeManager {
    constructor(options = {}) {
        this.config = {
            storageKey: options.storageKey || 'app-theme',
            defaultMode: options.defaultMode || 'dark',
            autoApply: options.autoApply !== false,
            classes: {
                themeActive: 'theme-active',
                lightMode: 'light-theme',
                ...(options.classes || {})
            },
            onThemeChange: options.onThemeChange || (() => {}),
            onError: options.onError || console.error
        };

        this.currentTheme = {
            mode: this.config.defaultMode,
            palette: null,
            isLightActive: this.config.defaultMode === 'light'
        };

        this.storage = this._initStorage();
    }

    /**
     * Initialize storage adapter (Electron or localStorage)
     */
    _initStorage() {
        // Check if running in Electron
        if (typeof window !== 'undefined' && window.electronAPI?.setTheme) {
            return {
                get: async () => {
                    try {
                        return await window.electronAPI.getTheme();
                    } catch {
                        return null;
                    }
                },
                set: async (theme) => {
                    try {
                        await window.electronAPI.setTheme(theme);
                    } catch (e) {
                        this.config.onError('Storage error:', e);
                    }
                }
            };
        }
        
        // Fallback to localStorage
        return {
            get: async () => {
                try {
                    const stored = localStorage.getItem(this.config.storageKey);
                    return stored ? JSON.parse(stored) : null;
                } catch {
                    return null;
                }
            },
            set: async (theme) => {
                try {
                    localStorage.setItem(this.config.storageKey, JSON.stringify(theme));
                } catch (e) {
                    this.config.onError('Storage error:', e);
                }
            }
        };
    }

    /**
     * Initialize theme manager and apply saved theme
     */
    async initialize() {
        if (!this.config.autoApply) return;

        try {
            const savedTheme = await this.storage.get();
            if (savedTheme) {
                this.currentTheme = savedTheme;
                this._applyTheme();
            } else {
                this._applyDefaultTheme();
            }
        } catch (error) {
            this.config.onError('Initialization error:', error);
            this._applyDefaultTheme();
        }
    }

    /**
     * Toggle between light and dark modes
     */
    async toggleMode() {
        const newIsLight = !this.currentTheme.isLightActive;
        this.currentTheme.isLightActive = newIsLight;

        if (this.currentTheme.mode === 'custom' && this.currentTheme.palette) {
            // Custom theme: apply the appropriate variant
            this.currentTheme.mode = newIsLight ? 'light' : 'dark';
            const paletteVariant = newIsLight 
                ? this.currentTheme.palette.light 
                : this.currentTheme.palette.dark;
            
            document.body.classList.remove(this.config.classes.lightMode);
            document.body.classList.remove(this.config.classes.themeActive);
            this._applyPalette(paletteVariant);
        } else {
            // Default theme: toggle CSS class
            this.currentTheme.mode = newIsLight ? 'light' : 'dark';
            if (!document.body.classList.contains(this.config.classes.themeActive)) {
                document.body.classList.add(this.config.classes.themeActive);
            }
            document.body.classList.toggle(this.config.classes.lightMode, newIsLight);
        }

        await this.storage.set(this.currentTheme);
        this.config.onThemeChange(this.currentTheme);
    }

    /**
     * Set specific mode (light or dark)
     */
    async setMode(mode) {
        if (mode !== 'light' && mode !== 'dark') {
            throw new Error('Mode must be "light" or "dark"');
        }

        if (this.currentTheme.isLightActive !== (mode === 'light')) {
            await this.toggleMode();
        }
    }

    /**
     * Apply a custom theme palette
     */
    async applyCustomTheme(palette) {
        if (!palette || !palette.dark || !palette.light) {
            throw new Error('Palette must have both "dark" and "light" variants');
        }

        this.currentTheme = {
            mode: 'custom',
            palette: palette,
            isLightActive: this.currentTheme.isLightActive
        };

        const currentPalette = this.currentTheme.isLightActive 
            ? palette.light 
            : palette.dark;

        // Remove CSS classes (custom theme uses inline styles)
        document.body.classList.remove(this.config.classes.lightMode);
        document.body.classList.remove(this.config.classes.themeActive);

        this._applyPalette(currentPalette);
        await this.storage.set(this.currentTheme);
        this.config.onThemeChange(this.currentTheme);
    }

    /**
     * Reset to default theme
     */
    async resetToDefault() {
        const root = document.documentElement;

        // Remove all custom CSS variables
        const cssVars = [
            '--main-bg-color', '--secondary-bg-color', '--tertiary-bg-color',
            '--button-bg-color', '--button-hover-bg-color', '--border-color',
            '--main-text-color', '--secondary-text-color', '--accent-color',
            '--accent-color-hover', '--message-user-bg', '--message-ai-bg',
            '--accent-contrast-text-color', '--code-block-bg', '--error-color',
            '--success-color', '--link-color', '--highlight-color',
            '--spinner-base-color', '--shadow-color-rgba', '--hug-color',
            '--punch-color', '--high-five-color'
        ];

        cssVars.forEach(varName => {
            root.style.removeProperty(varName);
        });

        // Restore theme-active class
        document.body.classList.add(this.config.classes.themeActive);
        document.body.classList.toggle(this.config.classes.lightMode, false);

        this.currentTheme = {
            mode: 'dark',
            palette: null,
            isLightActive: false
        };

        await this.storage.set(this.currentTheme);
        this.config.onThemeChange(this.currentTheme);
    }

    /**
     * Get current theme state
     */
    getCurrentTheme() {
        return { ...this.currentTheme };
    }

    /**
     * PRIVATE: Apply theme based on current state
     */
    _applyTheme() {
        if (this.currentTheme.mode === 'custom' && this.currentTheme.palette) {
            const paletteVariant = this.currentTheme.isLightActive
                ? this.currentTheme.palette.light
                : this.currentTheme.palette.dark;

            document.body.classList.remove(this.config.classes.lightMode);
            document.body.classList.remove(this.config.classes.themeActive);
            this._applyPalette(paletteVariant);
        } else {
            this._applyDefaultTheme();
        }
    }

    /**
     * PRIVATE: Apply default theme via CSS classes
     */
    _applyDefaultTheme() {
        document.body.classList.add(this.config.classes.themeActive);
        document.body.classList.toggle(
            this.config.classes.lightMode, 
            this.currentTheme.isLightActive
        );
    }

    /**
     * PRIVATE: Apply custom palette to :root
     */
    _applyPalette(palette) {
        if (!palette) {
            console.warn('No palette provided to applyPalette');
            return;
        }

        const root = document.documentElement;

        // Apply each CSS variable with !important
        for (const [key, value] of Object.entries(palette)) {
            const cssVarName = `--${key}`;
            root.style.setProperty(cssVarName, value, 'important');
        }
    }
}

/**
 * Utility: Get computed CSS variable value
 */
export function getCSSVariable(varName) {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
}

/**
 * Utility: Set CSS variable
 */
export function setCSSVariable(varName, value, important = false) {
    document.documentElement.style.setProperty(
        varName, 
        value, 
        important ? 'important' : ''
    );
}

export default ThemeManager;
