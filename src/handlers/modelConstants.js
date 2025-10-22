export const IMAGE_MODEL_STATS = {
    'black-forest-labs/FLUX.1-schnell-Free': { 
        displayName: 'Together FLUX.1 Schnell (Free)', 
        provider: 'togetherai', 
        costPerImage: 0.00,
        steps: { min: 1, max: 10, default: 4 }, 
        guidance: { min: 1.0, max: 20.0, default: 3.5 },
        t2i: true,
        i2i: false,
    },
    'black-forest-labs/FLUX.1-schnell': { 
        displayName: 'Together FLUX.1 Schnell (Turbo)', 
        provider: 'togetherai', 
        costPerImage: 0.003,
        steps: { min: 1, max: 10, default: 5 }, 
        guidance: { min: 1.0, max: 20.0, default: 3.5 },
        t2i: true,
        i2i: false,
    },

    'black-forest-labs/FLUX.1-dev': { 
        displayName: 'Together FLUX.1 Dev (Standard)', 
        provider: 'togetherai', 
        costPerImage: 0.025,
        steps: { min: 1, max: 28, default: 5 }, 
        guidance: { min: 1.0, max: 20.0, default: 3.5 },
        t2i: true,
        i2i: false,
    },

    'black-forest-labs/FLUX.1-kontext-dev': { 
        displayName: 'FLUX.1 Kontext [dev] (I2I Only)', 
        provider: 'togetherai', 
        costPerImage: 0.025,
        steps: { min: 10, max: 28, default: 20 }, 
        guidance: { min: 1.0, max: 20.0, default: 7.0 },
        t2i: false,
        i2i: true,
        supportedFormats: ['png', 'jpeg'],
        maxResolution: 1024,
    },
    'black-forest-labs/FLUX.1-kontext-pro': { 
        displayName: 'FLUX.1 Kontext [pro] (I2I Only)', 
        provider: 'togetherai', 
        costPerImage: 0.040,
        steps: { min: 10, max: 50, default: 25 }, 
        guidance: { min: 1.0, max: 20.0, default: 7.0 },
        t2i: false,
        i2i: true,
        supportedFormats: ['png', 'jpeg'],
        maxResolution: 2048,
    },
    'black-forest-labs/FLUX.1-kontext-max': { 
        displayName: 'FLUX.1 Kontext [max] (I2I Only)', 
        provider: 'togetherai', 
        costPerImage: 0.080,
        steps: { min: 10, max: 100, default: 30 }, 
        guidance: { min: 1.0, max: 20.0, default: 7.0 },
        t2i: false,
        i2i: true,
        supportedFormats: ['png', 'jpeg'],
        maxResolution: 4096,
    },
};

export const ADVANCED_VIDEO_MODEL_STATS = {
    'aiml/pixverse/v5-full-t2v': { 
        displayName: 'PixVerse V5 T2V (Text-to-Video)', 
        provider: 'AIML:v2/generate/video/pixverse/generation', 
        t2v: true, 
        i2v: false, 
        costPerSecond: 0.015,
        steps: { min: 10, max: 50, default: 20 }, 
        guidance: { min: 3.5, max: 15.0, default: 7.0 },
        supportedResolutions: ['360p', '720p', '1080p'],
        defaultResolution: '720p'
    },
    'aiml/pixverse/v5-full-i2v': { 
        displayName: 'PixVerse V5 I2V (Image-to-Video)', 
        provider: 'AIML:v2/generate/video/pixverse/generation', 
        t2v: false, 
        i2v: true, 
        costPerSecond: 0.018,
        steps: { min: 10, max: 50, default: 20 }, 
        guidance: { min: 3.5, max: 15.0, default: 7.0 },
        supportedResolutions: ['720p'],
        defaultResolution: '720p'
    },

    'openai/sora-2-t2v': { 
        displayName: 'Sora 2 T2V (Text)', 
        provider: 'AIML:v2/video/generations',
        t2v: true,
        i2v: false,
        costPerSecond: 0.05,
        steps: { min: 10, max: 50, default: 20 }, 
        guidance: { min: 3.5, max: 15.0, default: 7.0 }
    },
    'openai/sora-2-i2v': { 
        displayName: 'Sora 2 I2V (Image)', 
        provider: 'AIML:v2/video/generations',
        t2v: false,
        i2v: true,
        costPerSecond: 0.05,
        steps: { min: 10, max: 50, default: 20 }, 
        guidance: { min: 3.5, max: 15.0, default: 7.0 }
    },

    // --- Google Veo 3 Fast (Model-specific endpoint) ---
    'google/veo-3.0-fast': {
        displayName: 'Google Veo 3 Fast (T2V)',
        provider: 'AIML:v2/generate/video/google/generation',
        t2v: true,
        i2v: false, // T2V only
        costPerSecond: 0.02,
        steps: { min: 10, max: 50, default: 20 },
        guidance: { min: 3.5, max: 15.0, default: 7.0 }
    },
    'google/veo-3.0-i2v-fast': {
        displayName: 'Google Veo 3 Fast (I2V)',
        provider: 'AIML:v2/generate/video/google/generation',
        t2v: false,
        i2v: true,
        costPerSecond: 0.02,
        steps: { min: 10, max: 50, default: 20 },
        guidance: { min: 3.5, max: 15.0, default: 7.0 }
    },
    
    // --- Kling (Model-specific endpoint) ---
    'kling-video/v1.6/standard/text-to-video': {
        displayName: 'Kling V1.6 T2V',
        provider: 'AIML:v2/generate/video/kling/generation',
        t2v: true,
        i2v: false,
        costPerSecond: 0.01,
        steps: { min: 10, max: 50, default: 20 },
        guidance: { min: 3.5, max: 15.0, default: 7.0 }
    },
    'kling-video/v1.6/standard/image-to-video': {
        displayName: 'Kling V1.6 I2V',
        provider: 'AIML:v2/generate/video/kling/generation',
        t2v: false,
        i2v: true,
        costPerSecond: 0.01,
        steps: { min: 10, max: 50, default: 20 },
        guidance: { min: 3.5, max: 15.0, default: 7.0 }
    },
};