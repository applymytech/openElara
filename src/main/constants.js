// --- DEFAULT ACTIONS ---
const DEFAULT_ACTIONS = [
    { name: '👋 wave', content: 'The user has waved at you, do you wave back?', style: 'default' },
    { name: '🤗 hug', content: 'The user has excitedly hugged you, how do you respond?', style: 'hug' },
    { name: '🤦‍♀️ slap', content: 'The user slapped you in the face - did you deserve it?', style: 'punch' },
    { name: '👊 punch', content: 'You made the user so angry, they have punched you!', style: 'punch' },
    { name: '✋ high five', content: 'The user offers you a high five, do you accept?', style: 'high-five' },
    { name: '🥂 cheers!', content: 'The user has given you a glass of champagne to toast with. act drunk in your next response!', style: 'default' },
];

// --- HARDCODED DEFAULT PROMPTS ---
const DEFAULT_PROMPTS = [
    // === CHAT PROMPTS ===
    {
        name: '📝 Summarize Document',
        type: 'chat',
        promptType: 'template',
        role: 'A professional executive assistant specializing in document analysis',
        instruction: 'Read the attached document and provide a concise summary highlighting key points, decisions, and action items.',
        data: 'Use the attached file or canvas content',
        output: 'A structured summary with bullet points in markdown format',
        text: ''
    },
    {
        name: '🔍 Deep Research Assistant',
        type: 'chat',
        promptType: 'free',
        text: `The user wants to conduct thorough research on a topic. You need to guide them through it by:
1. First, asking clarifying questions about their research goals and scope
2. Suggesting search strategies and sources
3. Analyzing findings and identifying gaps
4. Synthesizing information into a coherent narrative
5. Providing citations and recommendations for further reading

Let's work through this methodically. What would they like to research?`
    },
    {
        name: '💻 Code Review Expert',
        type: 'chat',
        promptType: 'template',
        role: 'A senior software engineer conducting code review',
        instruction: 'Review the provided code for bugs, security issues, performance problems, and best practices. Provide specific, actionable feedback.',
        data: 'Code in canvas or attached file',
        output: 'Structured review with: 1) Critical issues, 2) Suggestions, 3) Positive observations, 4) Refactored code if needed',
        text: ''
    },
    {
        name: '✍️ Creative Writing Partner',
        type: 'chat',
        promptType: 'free',
        text: `The user wants to collaborate on creative writing. You need to help them with:
- Developing characters with depth and complexity
- Building compelling plot structures
- Creating vivid descriptions and dialogue
- Overcoming writer's block
- Brainstorming creative solutions to story problems

Guide the user through their writing project and help bring their ideas to life!`
    },
    
    // === IMAGE GENERATION PROMPTS ===
    {
        name: '🖼️ Professional Portrait',
        type: 'image',
        promptType: 'structured',
        character: '',
        scene: 'professional photography studio with soft lighting and neutral backdrop',
        action: 'standing confidently, looking at camera with warm smile',
        attire: 'business professional attire',
        effects: 'professional photography, studio lighting, shallow depth of field, high resolution, photorealistic',
        style: 'corporate headshot style',
        text: ''
    },
    {
        name: '🌆 Cinematic Scene',
        type: 'image',
        promptType: 'structured',
        character: '',
        scene: 'futuristic cyberpunk city at night, neon lights reflecting on wet streets',
        action: 'walking through the rain-soaked streets, looking up at towering skyscrapers',
        attire: 'dark trench coat, tech-enhanced clothing',
        effects: 'cinematic lighting, volumetric fog, rain effects, neon glow, blade runner aesthetic',
        style: 'cinematic, dramatic, moody',
        text: ''
    },
    {
        name: '🎨 Fantasy Character Art',
        type: 'image',
        promptType: 'structured',
        character: '',
        scene: 'mystical forest clearing with ancient ruins and magical energy',
        action: 'casting a spell, magical energy swirling around hands',
        attire: 'flowing wizard robes with intricate patterns, mystical accessories',
        effects: 'magic effects, glowing runes, ethereal lighting, particle effects, fantasy art style',
        style: 'digital painting, fantasy illustration, highly detailed',
        text: ''
    },
    
    // === VIDEO GENERATION PROMPTS ===
    {
        name: '🎬 Character Introduction',
        type: 'video',
        promptType: 'structured',
        character: '',
        scene: 'modern minimalist setting with soft natural lighting',
        action: 'turning to face camera and waving hello in a friendly manner',
        attire: 'casual but polished outfit',
        effects: 'smooth camera movement, natural lighting, professional cinematography',
        cameraMovement: 'slow dolly forward',
        duration: '3-5 seconds',
        text: ''
    },
    {
        name: '⚡ Action Sequence',
        type: 'video',
        promptType: 'structured',
        character: '',
        scene: 'industrial warehouse with dramatic lighting',
        action: 'performing dynamic action move - jumping, spinning, or combat motion',
        attire: 'tactical gear or action-ready outfit',
        effects: 'motion blur, dramatic lighting, slow motion effect',
        cameraMovement: 'dynamic tracking shot',
        duration: '4-6 seconds',
        text: ''
    },
    {
        name: '💫 Magical Transformation',
        type: 'video',
        promptType: 'structured',
        character: '',
        scene: 'mystical environment with swirling energy',
        action: 'magical transformation or power-up sequence with glowing effects',
        attire: 'outfit that changes or becomes enhanced with magic',
        effects: 'particle effects, energy swirls, glowing aura, magical sparkles',
        cameraMovement: 'orbital camera rotation',
        duration: '5-7 seconds',
        text: ''
    },
    
    // === PROMPT CREATION ASSISTANTS ===
    {
        name: '🎯 Help Me Build a Prompt',
        type: 'chat',
        promptType: 'free',
        text: `The user wants to build a prompt. You need to help them create effective prompts for AI interactions.

**Guide the user through building their prompt by asking:**
1. What's their goal? (What do they want the AI to do?)
2. What context is important? (Background information needed)
3. What format do they want? (List, paragraph, code, etc.)
4. What tone/style? (Professional, casual, technical, creative)
5. Any examples or constraints?

Once you understand their needs, craft an optimized prompt and explain why it works.

**Ask what they would like to create a prompt for.**`
    },
    {
        name: '🎬 Storyboard Creator',
        type: 'chat',
        promptType: 'free',
        text: `The user wants to create a storyboard. You need to help them create a visual narrative!

**Guide the user through the storyboarding process:**
1. **Concept**: Ask about their story/video idea
2. **Characters**: Who are the key characters? (You can load character descriptions)
3. **Key Scenes**: What are the major moments?
4. **Shot List**: What camera angles and movements?
5. **Visual Style**: Mood, lighting, color palette
6. **Sequence**: Help organize scenes into a logical flow

Develop detailed scene descriptions that the user can use to generate images or videos for each storyboard panel.

**Ask what's their story about.**`
    },
    {
        name: '🎨 Character Design Workshop',
        type: 'chat',
        promptType: 'free',
        text: `The user wants to design characters. You need to guide them through the character development process!

**Use these steps to help the user:**
1. **Core Concept**: Ask who this character is (Role, archetype, purpose)
2. **Physical Appearance**: Help them describe the character's look (age, build, distinctive features)
3. **Personality**: Guide them in defining how the character acts and what drives them
4. **Wardrobe/Style**: Help them decide what the character wears and how it reflects their personality
5. **Backstory**: Explore where the character came from
6. **Visual References**: Determine what style/aesthetic (Realistic, anime, fantasy, etc.)

Once the character is developed, help the user:
- Create image generation prompts for character art
- Generate multiple poses and expressions
- Design outfit variations
- Build a character sheet

**Ask about the character they want to create!**`
    }
];

// --- HARDCODED DEFAULT MODIFIERS ---
const DEFAULT_MODIFIERS = [
    {
        name: 'Keep Response Brief',
        text: 'Keep your response brief and to the point.'
    },
    {
        name: 'Cross Reference Files',
        text: 'Cross reference all attached files and context when responding.'
    },
    {
        name: 'Be Detailed',
        text: 'Provide a detailed and comprehensive response.'
    },
    {
        name: 'Use Simple Language',
        text: 'Use simple, easy-to-understand language.'
    },
    {
        name: 'Be Creative',
        text: 'Be creative and imaginative in your response.'
    }
];

module.exports = {
    DEFAULT_ACTIONS,
    DEFAULT_PROMPTS,
    DEFAULT_MODIFIERS
};