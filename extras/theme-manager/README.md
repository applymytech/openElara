# AI-Driven Theme Manager 🎨

A drag-and-drop theme management system that uses AI to generate complete, accessible color palettes based on user preferences. Supports light/dark modes, custom themes, and persistent storage.

## Features

✅ **AI-Powered Generation**: Characters/AI generate complete 23-variable color palettes  
✅ **Dual Mode Support**: Automatic light/dark variants for every theme  
✅ **CSS Variables**: Uses modern CSS custom properties with `!important` override  
✅ **Persistent Storage**: Themes saved to Electron store (or localStorage fallback)  
✅ **Character-Driven**: Optional personality-based theme generation  
✅ **Accessibility First**: Built-in contrast requirements and readability guidelines  
✅ **Zero Dependencies**: Pure JavaScript, works with any framework  

## Quick Start

### 1. Copy Files

```
theme-manager/
├── themeManager.js      # Core theme logic
├── themeStyles.css      # Base CSS variables
├── themeUI.html         # Optional UI controls
└── aiThemeGenerator.js  # AI integration (optional)
```

### 2. Include in Your Project

```html
<!-- Add to <head> -->
<link rel="stylesheet" href="path/to/themeStyles.css">
<script type="module" src="path/to/themeManager.js"></script>
```

### 3. Initialize

```javascript
import { ThemeManager } from './themeManager.js';

const themeManager = new ThemeManager({
  storageKey: 'myapp-theme',
  defaultMode: 'dark',
  autoApply: true
});

// Apply saved theme or default
await themeManager.initialize();
```

## Usage

### Basic Theme Toggle

```javascript
// Toggle between light and dark
themeManager.toggleMode();

// Set specific mode
themeManager.setMode('light');
```

### Custom Themes

```javascript
// Apply a custom palette
const customPalette = {
  dark: {
    'main-bg-color': '#1a1a2e',
    'secondary-bg-color': '#16213e',
    'main-text-color': '#e0e0e0',
    // ... 20 more variables
  },
  light: {
    'main-bg-color': '#f5f5f5',
    // ... light variants
  }
};

themeManager.applyCustomTheme(customPalette);
```

### AI-Generated Themes (with AI integration)

```javascript
import { AIThemeGenerator } from './aiThemeGenerator.js';

const aiGenerator = new AIThemeGenerator({
  modelEndpoint: 'https://your-ai-api.com/v1/chat/completions',
  apiKey: 'your-api-key',
  characterName: 'Assistant', // Optional
  characterPersona: 'Helpful and creative' // Optional
});

// Generate theme from color
const theme = await aiGenerator.generateFromColor('#3498db');
themeManager.applyCustomTheme(theme.palette);
```

### Reset to Default

```javascript
themeManager.resetToDefault();
```

## CSS Variables Reference

The theme manager controls 23 CSS variables:

### Backgrounds
- `--main-bg-color` - Primary background
- `--secondary-bg-color` - Sidebar/panels
- `--tertiary-bg-color` - Cards/modals
- `--button-bg-color` - Button backgrounds
- `--button-hover-bg-color` - Button hover state

### Text
- `--main-text-color` - Primary text
- `--secondary-text-color` - Muted text
- `--accent-contrast-text-color` - Text on accent backgrounds

### Accents & Actions
- `--accent-color` - Primary accent
- `--accent-color-hover` - Accent hover state
- `--link-color` - Hyperlinks
- `--highlight-color` - Highlights
- `--error-color` - Error states
- `--success-color` - Success states

### Messages (Optional)
- `--message-user-bg` - User message bubbles
- `--message-ai-bg` - AI/assistant message bubbles
- `--code-block-bg` - Code block backgrounds

### Utility
- `--border-color` - Borders
- `--spinner-base-color` - Loading spinners
- `--shadow-color-rgba` - Drop shadows

### Reaction Colors (Optional)
- `--hug-color` - Positive actions
- `--punch-color` - Alert/negative actions
- `--high-five-color` - Celebration actions

## Configuration Options

```javascript
new ThemeManager({
  // Storage key for localStorage/electron-store
  storageKey: 'app-theme',
  
  // Default theme mode ('light' | 'dark')
  defaultMode: 'dark',
  
  // Auto-apply saved theme on init
  autoApply: true,
  
  // CSS class names
  classes: {
    themeActive: 'theme-active',
    lightMode: 'light-theme'
  },
  
  // Callbacks
  onThemeChange: (theme) => console.log('Theme changed:', theme),
  onError: (error) => console.error('Theme error:', error)
});
```

## AI Generator Configuration

```javascript
new AIThemeGenerator({
  // AI API endpoint (OpenAI-compatible)
  modelEndpoint: 'https://api.openai.com/v1/chat/completions',
  
  // API key
  apiKey: 'sk-...',
  
  // Model name
  modelId: 'gpt-4',
  
  // Character name (optional - makes prompts conversational)
  characterName: 'Elara',
  
  // Character persona (optional - for personality-based themes)
  characterPersona: 'A vibrant, creative AI companion...',
  
  // Temperature (0.0-1.0, higher = more creative)
  temperature: 0.75,
  
  // Custom color ranges
  colorRanges: {
    dark: { min: '#0a0a0a', max: '#3a3a3a' },
    light: { min: '#e5e5e5', max: '#ffffff' }
  }
});
```

## Architecture

### CSS Cascade Strategy

1. **Base defaults** defined in `:root` selector (specificity: 0,0,1)
2. **Light mode overrides** in `body.theme-active.light-theme` (specificity: 0,1,2)
3. **Custom themes** use inline styles with `!important` (highest priority)

This ensures custom themes always override defaults without specificity wars.

### Storage Strategy

- **Electron**: Uses `electron-store` for persistent storage
- **Web**: Falls back to `localStorage`
- **Structure**: Stores `{ mode, palette, isLightActive }`

### Class Management

- `theme-active`: Applied for default themes (enables CSS cascade)
- `light-theme`: Applied for light mode in default themes
- Both removed when custom theme is active (inline styles take over)

## Integration Examples

### Vanilla JavaScript

```javascript
document.getElementById('theme-toggle').addEventListener('click', () => {
  themeManager.toggleMode();
});

document.getElementById('generate-theme').addEventListener('click', async () => {
  const color = document.getElementById('color-picker').value;
  const theme = await aiGenerator.generateFromColor(color);
  themeManager.applyCustomTheme(theme.palette);
});
```

### React

```jsx
import { useEffect, useState } from 'react';
import { ThemeManager } from './themeManager.js';

function App() {
  const [themeManager] = useState(() => new ThemeManager());
  
  useEffect(() => {
    themeManager.initialize();
  }, []);
  
  return (
    <button onClick={() => themeManager.toggleMode()}>
      Toggle Theme
    </button>
  );
}
```

### Vue

```vue
<script setup>
import { onMounted } from 'vue';
import { ThemeManager } from './themeManager.js';

const themeManager = new ThemeManager();

onMounted(() => {
  themeManager.initialize();
});
</script>

<template>
  <button @click="themeManager.toggleMode()">Toggle Theme</button>
</template>
```

## Browser Support

- Modern browsers (ES6+ required)
- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

For older browsers, transpile with Babel.

## License

MIT - Use freely in commercial and personal projects!

## Credits

Built for openElara by applymytech. Extracted and generalized for community use.
