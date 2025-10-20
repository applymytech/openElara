# Integration Examples

## Vanilla JavaScript

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="themeStyles.css">
</head>
<body class="theme-active">
    <button id="theme-toggle">Toggle Theme</button>
    <button id="generate-theme">Generate Theme</button>
    <input type="color" id="color-picker" value="#3498db">

    <script type="module">
        import { ThemeManager } from './themeManager.js';
        import { AIThemeGenerator } from './aiThemeGenerator.js';

        const themeManager = new ThemeManager();
        await themeManager.initialize();

        document.getElementById('theme-toggle').onclick = () => {
            themeManager.toggleMode();
        };

        // Optional: AI generation
        const aiGen = new AIThemeGenerator({ apiKey: 'YOUR_KEY' });
        document.getElementById('generate-theme').onclick = async () => {
            const color = document.getElementById('color-picker').value;
            const result = await aiGen.generateFromColor(color);
            if (result.success) {
                themeManager.applyCustomTheme(result.palette);
            }
        };
    </script>
</body>
</html>
```

## React

```jsx
// ThemeProvider.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeManager } from './themeManager.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [themeManager] = useState(() => new ThemeManager());
    const [currentTheme, setCurrentTheme] = useState(null);

    useEffect(() => {
        themeManager.config.onThemeChange = setCurrentTheme;
        themeManager.initialize().then(() => {
            setCurrentTheme(themeManager.getCurrentTheme());
        });
    }, [themeManager]);

    return (
        <ThemeContext.Provider value={{ themeManager, currentTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

// Usage in component
function App() {
    const { themeManager, currentTheme } = useTheme();

    return (
        <div>
            <button onClick={() => themeManager.toggleMode()}>
                {currentTheme?.isLightActive ? '🌙' : '☀️'} Toggle Theme
            </button>
            <button onClick={() => themeManager.resetToDefault()}>
                🔄 Reset
            </button>
        </div>
    );
}
```

## Vue 3 Composition API

```vue
<!-- ThemeProvider.vue -->
<script setup>
import { provide, onMounted, ref } from 'vue';
import { ThemeManager } from './themeManager.js';

const themeManager = new ThemeManager();
const currentTheme = ref(null);

onMounted(async () => {
    await themeManager.initialize();
    currentTheme.value = themeManager.getCurrentTheme();
    
    themeManager.config.onThemeChange = (theme) => {
        currentTheme.value = theme;
    };
});

provide('themeManager', themeManager);
provide('currentTheme', currentTheme);
</script>

<template>
    <slot />
</template>

<!-- Usage in component -->
<script setup>
import { inject } from 'vue';

const themeManager = inject('themeManager');
const currentTheme = inject('currentTheme');
</script>

<template>
    <button @click="themeManager.toggleMode()">
        {{ currentTheme.isLightActive ? '🌙' : '☀️' }} Toggle Theme
    </button>
</template>
```

## Svelte

```svelte
<!-- themeStore.js -->
import { writable } from 'svelte/store';
import { ThemeManager } from './themeManager.js';

const themeManager = new ThemeManager();
export const currentTheme = writable(null);

themeManager.config.onThemeChange = (theme) => {
    currentTheme.set(theme);
};

export async function initializeTheme() {
    await themeManager.initialize();
    currentTheme.set(themeManager.getCurrentTheme());
}

export { themeManager };

<!-- App.svelte -->
<script>
    import { onMount } from 'svelte';
    import { themeManager, currentTheme, initializeTheme } from './themeStore.js';

    onMount(initializeTheme);
</script>

<button on:click={() => themeManager.toggleMode()}>
    {$currentTheme?.isLightActive ? '🌙' : '☀️'} Toggle Theme
</button>
```

## Electron Integration

```javascript
// main.js (Electron main process)
const { ipcMain } = require('electron');
const Store = require('electron-store');

const store = new Store();

ipcMain.handle('get-theme', () => {
    return store.get('theme', null);
});

ipcMain.handle('set-theme', (event, theme) => {
    store.set('theme', theme);
});

// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getTheme: () => ipcRenderer.invoke('get-theme'),
    setTheme: (theme) => ipcRenderer.invoke('set-theme', theme)
});

// renderer.js
import { ThemeManager } from './themeManager.js';

const themeManager = new ThemeManager({
    storageKey: 'myapp-theme'
});

await themeManager.initialize();
```

## Next.js (App Router)

```jsx
// app/providers.jsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeManager } from '@/lib/themeManager';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [themeManager] = useState(() => new ThemeManager());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        themeManager.initialize().then(() => setMounted(true));
    }, [themeManager]);

    if (!mounted) return null;

    return (
        <ThemeContext.Provider value={themeManager}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

// app/layout.jsx
import { ThemeProvider } from './providers';
import './themeStyles.css';

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="theme-active">
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
```

## With Ollama (Local AI)

```javascript
import { ThemeManager } from './themeManager.js';
import { OllamaThemeGenerator } from './aiThemeGenerator.js';

const themeManager = new ThemeManager();
await themeManager.initialize();

// Use local Ollama instead of cloud AI
const ollamaGen = new OllamaThemeGenerator({
    modelEndpoint: 'http://localhost:11434/api/chat',
    modelId: 'llama3.2', // or any model you have installed
    characterName: 'Ollama',
    characterPersona: 'A helpful local AI assistant'
});

// Generate theme
const result = await ollamaGen.generateFromColor('#ff6b6b');
if (result.success) {
    await themeManager.applyCustomTheme(result.palette);
}
```

## Custom Storage Backend

```javascript
import { ThemeManager } from './themeManager.js';

class CustomThemeManager extends ThemeManager {
    _initStorage() {
        return {
            get: async () => {
                // Your custom storage logic (e.g., IndexedDB, API call)
                const response = await fetch('/api/user/theme');
                return response.json();
            },
            set: async (theme) => {
                // Save to your backend
                await fetch('/api/user/theme', {
                    method: 'POST',
                    body: JSON.stringify(theme)
                });
            }
        };
    }
}

const themeManager = new CustomThemeManager();
await themeManager.initialize();
```

## Advanced: Theme Presets

```javascript
import { ThemeManager } from './themeManager.js';

const themeManager = new ThemeManager();
await themeManager.initialize();

// Define preset themes
const PRESETS = {
    ocean: {
        dark: {
            'main-bg-color': '#001f3f',
            'secondary-bg-color': '#003d5c',
            'accent-color': '#39CCCC',
            // ... all 23 variables
        },
        light: {
            'main-bg-color': '#e6f7ff',
            'secondary-bg-color': '#bae7ff',
            'accent-color': '#0095b6',
            // ... all 23 variables
        }
    },
    forest: {
        // ... green theme
    },
    sunset: {
        // ... orange/pink theme
    }
};

// Apply preset
function applyPreset(presetName) {
    const preset = PRESETS[presetName];
    if (preset) {
        themeManager.applyCustomTheme(preset);
    }
}

applyPreset('ocean');
```
