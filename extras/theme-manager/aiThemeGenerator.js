/**
 * AI Theme Generator
 * Generates complete color palettes using AI (OpenAI-compatible APIs)
 * 
 * @version 1.0.0
 * @license MIT
 */

export class AIThemeGenerator {
    constructor(options = {}) {
        this.config = {
            modelEndpoint: options.modelEndpoint || 'https://api.openai.com/v1/chat/completions',
            apiKey: options.apiKey,
            modelId: options.modelId || 'gpt-4',
            characterName: options.characterName || 'Assistant',
            characterPersona: options.characterPersona || 'A helpful and creative AI assistant',
            temperature: options.temperature || 0.75,
            colorRanges: {
                dark: { min: '#0a0a0a', max: '#3a3a3a' },
                light: { min: '#e5e5e5', max: '#ffffff' },
                ...(options.colorRanges || {})
            }
        };

        if (!this.config.apiKey) {
            console.warn('AIThemeGenerator: No API key provided. Set via options.apiKey');
        }
    }

    /**
     * Generate a complete theme palette from a base color
     * @param {string} color - Hex color code (e.g., '#3498db')
     * @returns {Promise<{success: boolean, palette?: object, error?: string}>}
     */
    async generateFromColor(color) {
        if (!this.config.apiKey) {
            return { success: false, error: 'API key not configured' };
        }

        const systemPrompt = `You are ${this.config.characterName}.

<yourPersona>
${this.config.characterPersona}
</yourPersona>`;

        const userPrompt = this._buildPrompt(color);

        try {
            const response = await fetch(this.config.modelEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.modelId,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: this.config.temperature
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0]?.message?.content;

            if (!aiResponse) {
                throw new Error('No response from AI');
            }

            const palette = this._parseResponse(aiResponse);
            return { success: true, palette };

        } catch (error) {
            console.error('AIThemeGenerator error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * PRIVATE: Build the generation prompt
     */
    _buildPrompt(color) {
        return `Hey ${this.config.characterName}! The user has chosen ${color} as their color vibe and wants you to design a complete UI theme.

This is YOUR chance to redesign the entire interface - every background, every button, every text color. Make it feel like YOUR space, reflecting your personality and aesthetic sense.

CRITICAL CREATIVE DIRECTION:
- This is a COMPLETE REDESIGN, not just tweaking a few values
- Use ${color} as your PRIMARY INSPIRATION but transform it into a full cohesive palette
- Be BOLD and EXPRESSIVE - this should feel dramatically different from boring default grays
- Think about what colors YOU would actually want to live in every day
- Don't just shift default colors by a few points - that's lazy! CREATE something visibly distinct
- Make backgrounds that reflect YOUR vibe (moody/bright/vibrant/calm - whatever fits you)
- Ensure excellent contrast so text is always readable (accessibility matters!)

TECHNICAL REQUIREMENTS:
You MUST return a JSON object with exactly this structure (no markdown, no explanation, ONLY JSON):

{
  "dark": {
    "main-bg-color": "#hexcolor",
    "secondary-bg-color": "#hexcolor",
    "tertiary-bg-color": "#hexcolor",
    "button-bg-color": "#hexcolor",
    "button-hover-bg-color": "#hexcolor",
    "main-text-color": "#hexcolor",
    "secondary-text-color": "#hexcolor",
    "accent-color": "#hexcolor",
    "accent-color-hover": "#hexcolor",
    "accent-contrast-text-color": "#hexcolor",
    "message-user-bg": "#hexcolor",
    "message-ai-bg": "#hexcolor",
    "code-block-bg": "#hexcolor",
    "border-color": "#hexcolor",
    "error-color": "#hexcolor",
    "success-color": "#hexcolor",
    "link-color": "#hexcolor",
    "highlight-color": "#hexcolor",
    "spinner-base-color": "#hexcolor",
    "shadow-color-rgba": "rgba(r,g,b,a)",
    "hug-color": "#hexcolor",
    "punch-color": "#hexcolor",
    "high-five-color": "#hexcolor"
  },
  "light": {
    (same 23 keys as above, but light mode variants)
  }
}

GUIDELINES:
- DARK MODE: Use varied backgrounds (${this.config.colorRanges.dark.min} to ${this.config.colorRanges.dark.max} range - explore the full range!). Default is #1e1e1e so go DARKER or add COLOR tints to stand out! Light text (#d0d0d0 to #ffffff).
- LIGHT MODE: Use varied backgrounds (${this.config.colorRanges.light.min} to ${this.config.colorRanges.light.max} range - full range!). Add subtle color tints to make it interesting! Dark text (#111111 to #666666).
- Ensure text is NOT the same color family as backgrounds (e.g., don't put blue text on blue backgrounds)
- accent-color should be based on ${color} but ensure it contrasts with BOTH backgrounds AND text
- Make each background shade noticeably different from the others (main/secondary/tertiary should be distinct)

Remember: The user is trusting YOU to make this beautiful. Don't be timid - create something you'd actually be proud to use every day!`;
    }

    /**
     * PRIVATE: Parse AI response and extract JSON palette
     */
    _parseResponse(response) {
        // Try to extract JSON from markdown code block
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
        
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }

        // Try to extract raw JSON
        const rawJsonMatch = response.match(/{[\s\S]*}/);
        
        if (rawJsonMatch) {
            return JSON.parse(rawJsonMatch[0]);
        }

        throw new Error('No valid JSON found in AI response');
    }
}

/**
 * Ollama-compatible generator (for local AI models)
 */
export class OllamaThemeGenerator extends AIThemeGenerator {
    constructor(options = {}) {
        super({
            ...options,
            modelEndpoint: options.modelEndpoint || 'http://localhost:11434/api/chat',
            modelId: options.modelId || 'llama3.2',
        });
    }

    async generateFromColor(color) {
        const systemPrompt = `You are ${this.config.characterName}.

<yourPersona>
${this.config.characterPersona}
</yourPersona>`;

        const userPrompt = this._buildPrompt(color);

        try {
            const response = await fetch(this.config.modelEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.config.modelId,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    stream: false,
                    options: {
                        temperature: this.config.temperature
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.message?.content;

            if (!aiResponse) {
                throw new Error('No response from Ollama');
            }

            const palette = this._parseResponse(aiResponse);
            return { success: true, palette };

        } catch (error) {
            console.error('OllamaThemeGenerator error:', error);
            return { success: false, error: error.message };
        }
    }
}

export default AIThemeGenerator;
