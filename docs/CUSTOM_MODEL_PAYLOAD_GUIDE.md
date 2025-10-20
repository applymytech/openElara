# Custom Model Payload Support

## ✅ **Already Implemented!**

Your system **already supports** adding custom JSON payload parameters for any model. This is handled automatically in the image generation pipeline.

---

## 🔧 **How It Works**

### **Code Location:**
`src/main/handlers/imageHandlers.js` lines 73-76

```javascript
// <<< CUSTOM PAYLOAD SUPPORT: Merge brand-specific parameters >>>
if (customModel && customModel.customPayload) {
    log.info('Merging custom payload for model:', customModel.id);
    log.info('Custom payload:', JSON.stringify(customModel.customPayload, null, 2));
    Object.assign(apiPayload, customModel.customPayload);
}
```

### **What This Does:**
1. Builds the base API payload (prompt, steps, width, height, etc.)
2. Adds FLUX-specific parameters (disable_safety_checker) if applicable
3. **Merges any custom payload parameters** from the model configuration
4. Custom parameters can override defaults or add new fields

---

## 📝 **How to Add Custom Models with Custom Payloads**

### **Via Account Settings UI:**

1. Open **Account Settings** (gear icon)
2. Scroll to **"Custom Image Models"** section
3. Click **"Add Custom Image Model"**
4. Fill in:
   - **Model ID:** (e.g., `stabilityai/sdxl-turbo`)
   - **Display Name:** (e.g., `SDXL Turbo`)
   - **Custom Endpoint:** (optional, if not using Together.AI)
   - **Custom JSON Payload:** (this is where you add custom parameters!)

### **Custom Payload Examples:**

#### Example 1: Model with different NSFW parameter name
```json
{
  "nsfw_checker": false,
  "safety_mode": "off"
}
```

#### Example 2: Model with style presets
```json
{
  "style_preset": "photographic",
  "cfg_scale": 7.5,
  "clip_guidance_preset": "FAST_BLUE"
}
```

#### Example 3: Model with sampling parameters
```json
{
  "sampler": "k_euler_ancestral",
  "scheduler": "karras",
  "seed": -1
}
```

#### Example 4: Override default parameters
```json
{
  "steps": 20,
  "guidance_scale": 8.0,
  "negative_prompt": "blurry, low quality"
}
```

---

## 🎯 **Current NSFW Filter Logic**

### **FLUX Models (Together.AI):**
```javascript
const modelId = imageGenSettings.modelConfig.modelId.toLowerCase();
if (modelId.includes('flux') && imageGenSettings.disable_safety_checker) {
    apiPayload.disable_safety_checker = true;
}
```

### **Custom Models:**
If you add a model that uses a different NSFW parameter, add it to the custom payload:

**Account Settings → Custom Image Models → Custom JSON Payload:**
```json
{
  "nsfw_filter": false
}
```
OR
```json
{
  "content_filter": "disabled"
}
```
OR
```json
{
  "safe_mode": false
}
```

The system will automatically merge these into the API request!

---

## 🔄 **Execution Order**

The final API payload is built in this order:

1. **Base parameters** (always included):
   - `prompt`
   - `model`
   - `steps`
   - `width`
   - `height`
   - `guidance_scale`
   - `n` (number of images)
   - `response_format`

2. **Optional parameters** (if provided):
   - `negative_prompt`
   - `image_url` (for I2I mode)

3. **FLUX-specific** (if FLUX model and NSFW toggle enabled):
   - `disable_safety_checker: true`

4. **Custom payload** (merges/overrides):
   - Any parameters from `customPayload` field
   - Can override previous values
   - Can add new parameters

### **Example Final Payload:**

**User adds custom model with:**
```json
{
  "sampler": "k_dpmpp_2m",
  "steps": 30
}
```

**Final API request:**
```json
{
  "prompt": "a beautiful landscape",
  "model": "custom-model-id",
  "steps": 30,                    // ← Overridden by custom payload
  "width": 1024,
  "height": 1024,
  "guidance_scale": 7.5,
  "n": 1,
  "response_format": "b64_json",
  "sampler": "k_dpmpp_2m"         // ← Added by custom payload
}
```

---

## 💡 **Benefits**

✅ **Flexible:** Supports any API that follows OpenAI-style format
✅ **Override-friendly:** Custom payload can override default values
✅ **Provider-agnostic:** Works with Together.AI, Replicate, Stability AI, etc.
✅ **No code changes needed:** Just add models via UI
✅ **Per-model configuration:** Each custom model has its own payload

---

## 🧪 **Testing Custom Models**

1. Add custom model via Account Settings
2. Include custom JSON payload with your parameters
3. Save the model
4. Select it in Advanced Image Generation modal
5. Check logs for "Merging custom payload for model:" message
6. Verify custom parameters are in API request

---

## 📚 **Storage**

Custom models are stored in **localStorage** under key `customImageModels`:

```javascript
[
  {
    "id": "stabilityai/sdxl-turbo",
    "name": "SDXL Turbo",
    "endpoint": "https://api.stability.ai/v1/generation",
    "customPayload": {
      "cfg_scale": 7.5,
      "sampler": "k_euler"
    }
  }
]
```

---

## ✅ **Summary**

**Your system already fully supports custom JSON payloads for any model!**

- ✅ FLUX models use `disable_safety_checker` automatically when NSFW toggle is enabled
- ✅ Custom models can add ANY parameters via the `customPayload` field
- ✅ Different NSFW parameter names? Just add them to custom payload!
- ✅ No code changes needed - everything is handled automatically

**Example for a hypothetical model with different NSFW syntax:**
```json
{
  "nsfw_mode": "enabled",
  "content_filter": false,
  "safety_level": 0
}
```

All you need to do is add it in the Account Settings UI!

---

**Last Updated:** October 14, 2025  
**Status:** ✅ Fully implemented and working
