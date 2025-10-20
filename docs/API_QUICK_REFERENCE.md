# Quick Reference: Backend-Frontend API Map

**Status**: ✅ **ALL ALIGNED** (as of pre-testing validation)

---

## 🎯 Most Commonly Used APIs

### Prompts & Actions
```javascript
// ✅ CORRECT USAGE
const response = await window.electronAPI.getPrompts();
const prompts = response?.prompts || response || [];

const actions = await window.electronAPI.getActions();
const actionList = actions?.actions || actions || [];

await window.electronAPI.savePrompt({ name, type, text, ... });
await window.electronAPI.removePrompt(name);

await window.electronAPI.saveAction({ name, content, style });
await window.electronAPI.removeAction(name);
```

### Image Generation
```javascript
// ✅ CORRECT USAGE
const result = await window.electronAPI.generateSelfie({
    prompt: "...",
    negativePrompt: "...",
    aspectRatio: "1:1",
    steps: 30,
    seed: 12345
});

const result = await window.electronAPI.generateOpenImage({
    prompt: "...",
    model: "flux-1.1-pro",
    // ... other options
});
```

### Video Generation
```javascript
// ✅ CORRECT USAGE
const result = await window.electronAPI.generateVideo({
    prompt: "...",
    duration: 5,
    aspectRatio: "16:9"
});

const result = await window.electronAPI.generateAdvancedVideo({
    mode: 'text-to-video', // or 'image-to-video'
    prompt: "...",
    provider: "pixverse",
    // ... other options
});
```

### Character Management
```javascript
// ✅ CORRECT USAGE
const characterData = await window.electronAPI.getCharacterConstants();
// Returns: { name, description, attire, iconPath }

const characters = await window.electronAPI.getAvailableCharacters();
const activeName = await window.electronAPI.getActiveCharacterName();
const activeIcon = await window.electronAPI.getActiveCharacterIcon();

await window.electronAPI.setActiveCharacter('elara');
```

### File System
```javascript
// ✅ CORRECT USAGE
const result = await window.electronAPI.openFile({
    filters: [{ name: 'Images', extensions: ['png', 'jpg'] }]
});

const files = await window.electronAPI.getFilesFromFolder(folderPath);

const src = await window.electronAPI.convertFileSrc(filePath);
// Converts C:\path\file.png → file:///C:/path/file.png

await window.electronAPI.saveFile({
    defaultPath: 'output.txt',
    content: 'file content'
});
```

---

## ❌ DEPRECATED (Do NOT Use)

### These APIs Do NOT Exist
```javascript
// ❌ WRONG - Will throw error
window.electronAPI.getAllPrompts()  // Use getPrompts() instead
window.electronAPI.getAllActions()  // Use getActions() instead
```

---

## 🔄 Response Format Patterns

### Pattern 1: Direct Array
```javascript
// Used by: getActions, getPersonalities
const items = await window.electronAPI.getActions();
// Returns: [{ name, content, style }, ...]
```

### Pattern 2: Wrapped Object
```javascript
// Used by: getPrompts (popup window handler)
const response = await window.electronAPI.getPrompts();
// Returns: { success: true, prompts: [...] }

// Always unwrap safely:
const prompts = response?.prompts || response || [];
```

### Pattern 3: Status Object
```javascript
// Used by: savePrompt, saveAction, removePrompt, removeAction
const result = await window.electronAPI.savePrompt(data);
// Returns: { success: true, message: "..." }

if (result.success) {
    console.log(result.message);
}
```

### Pattern 4: Data Object
```javascript
// Used by: generateSelfie, generateVideo, etc.
const result = await window.electronAPI.generateSelfie(payload);
// Returns: { success: true, filePath: "...", metadata: {...} }
```

---

## 🚀 Quick Test Commands (Browser Console)

### Test Prompts API
```javascript
// Check if prompts exist
const response = await window.electronAPI.getPrompts();
console.log('Prompts:', response);

// Test unwrapping
const prompts = response?.prompts || response || [];
console.log('Unwrapped:', prompts);
```

### Test Actions API
```javascript
// Get all actions
const actions = await window.electronAPI.getActions();
console.log('Actions:', actions);

// Get default actions
const defaults = await window.electronAPI.getDefaultActions();
console.log('Default actions:', defaults);
```

### Test Character API
```javascript
// Get active character
const char = await window.electronAPI.getCharacterConstants();
console.log('Character:', char);

// Get all available
const all = await window.electronAPI.getAvailableCharacters();
console.log('Available:', all);
```

### Test Quick Insert
```javascript
// Manually trigger
window.quickInsertPalette?.toggle();

// Check instance
console.log(window.quickInsertPalette);
```

---

## 📝 Common Patterns

### Safe Array Access
```javascript
// Always assume response might be wrapped or direct
const response = await window.electronAPI.getPrompts();
const prompts = response?.prompts || response || [];

// Then safely iterate
prompts.forEach(prompt => {
    console.log(prompt.name);
});
```

### Error Handling
```javascript
try {
    const result = await window.electronAPI.savePrompt(data);
    if (result.success) {
        showStatusMessage(result.message, 'success');
    } else {
        showStatusMessage(result.error || 'Failed to save', 'error');
    }
} catch (error) {
    console.error('API Error:', error);
    showStatusMessage('Unexpected error', 'error');
}
```

### File Path Conversion
```javascript
// Always convert file paths before using in src attributes
const filePath = "C:\\Users\\...\\image.png";
const webSrc = await window.electronAPI.convertFileSrc(filePath);
// Result: "file:///C:/Users/.../image.png"

img.src = webSrc; // ✅ CORRECT
img.src = filePath; // ❌ WRONG - Won't load
```

---

## 🎯 Testing Checklist

### Before Testing Any Feature
1. ✅ Check this reference for correct API name
2. ✅ Use correct response unwrapping pattern
3. ✅ Add try/catch error handling
4. ✅ Log response to console for debugging
5. ✅ Verify file paths are converted

### If API Call Fails
1. ✅ Check browser console for exact error
2. ✅ Verify API name matches this reference
3. ✅ Check if response unwrapping is needed
4. ✅ Verify payload structure matches backend expectations
5. ✅ Check `docs/BACKEND_FRONTEND_CROSSCHECK.md` for details

---

## 📚 Full Documentation

**Comprehensive Validation**: `docs/BACKEND_FRONTEND_CROSSCHECK.md`  
**Fix Summary**: `docs/CROSSCHECK_VALIDATION_SUMMARY.md`  
**Testing Guide**: `docs/GOOD_MORNING_README.md`  
**Pre-Launch Checklist**: `docs/PRE_LAUNCH_POLISH_CHECKLIST.md`

---

**Last Validated**: Pre-Testing (October 2025)  
**Status**: ✅ 100% Aligned (70+ endpoints)  
**Remaining Issues**: 0
