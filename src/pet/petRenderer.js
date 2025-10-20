// src/pet/petRenderer.js
const { ipcRenderer } = require('electron');
const path = require('path');

// Ensure transparent background
document.addEventListener('DOMContentLoaded', function() {
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';
});

class ShimejiPet {
    constructor() {
        this.sprite = document.getElementById('pet-sprite');
        this.container = document.getElementById('pet-container');
        this.currentFrame = 0;
        this.animationTimer = null;
        this.manifest = null;
        this.spriteCache = {};
        this.currentAnimation = 'idle';
        this.currentDirection = 's';
        this.isDragging = false;
        
        this.init();
    }
    
    async init() {
        this.manifest = await ipcRenderer.invoke('get-pet-manifest');
        
        if (!this.manifest) {
            console.error('No manifest loaded - cannot initialize pet');
            return;
        }
        
        console.log('Loaded manifest:', this.manifest);
        
        await this.preloadSprites();
        
        this.setAnimation('idle', 's');
        
        this.setupDragHandlers();
        
        ipcRenderer.on('update-animation', (event, animation, direction) => {
            this.setAnimation(animation, direction);
        });
        
        ipcRenderer.on('show-chat-bubble', (event, text, duration) => {
            this.showChatBubble(text, duration);
        });
        
        console.log('Pet initialized successfully');
    }
    
    async preloadSprites() {
        console.log('Preloading sprites...');
        const animations = this.manifest.animations;
        
        for (const [animName, animData] of Object.entries(animations)) {
            for (const [dir, directionData] of Object.entries(animData.directions)) {
                const frames = directionData.frames || [];
                
                for (const framePath of frames) {
                    await this.loadSprite(framePath);
                }
            }
        }
        
        console.log('All sprites preloaded');
    }
    
    async loadSprite(relativePath) {
        if (this.spriteCache[relativePath]) return;
        
        const userDataPath = await ipcRenderer.invoke('get-user-data-path');
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            const fullPath = path.join(
                userDataPath,
                'pet-assets',
                'characters',
                this.manifest.characterName.toLowerCase(),
                relativePath
            );
            
            const fileUrl = `file:///${fullPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;
            
            img.onload = () => {
                this.spriteCache[relativePath] = fileUrl;
                console.log(`✓ Loaded sprite: ${relativePath}`);
                resolve();
            };
            
            img.onerror = (error) => {
                console.error('Failed to load sprite:', fullPath);
                console.error('File URL attempted:', fileUrl);
                console.error('Error:', error);
                resolve();
            };
            
            img.src = fileUrl;
        });
    }
    
    setAnimation(animation, direction) {
        if (!this.manifest.animations[animation]) {
            console.warn(`Animation "${animation}" not found`);
            return;
        }
        
        const animData = this.manifest.animations[animation];
        let directionData = animData.directions[direction];
        
        if (!directionData) {
            const availableDirections = Object.keys(animData.directions);
            if (availableDirections.length > 0) {
                direction = availableDirections[0];
                directionData = animData.directions[direction];
                console.log(`Direction fallback: using '${direction}' for animation '${animation}'`);
            } else {
                console.error(`No directions available for animation '${animation}'`);
                return;
            }
        }
        
        this.currentAnimation = animation;
        this.currentDirection = direction;
        this.currentFrame = 0;
        
        if (this.animationTimer) {
            clearInterval(this.animationTimer);
        }
        
        const frames = directionData.frames || [];
        const fps = directionData.fps || 8;
        
        if (frames.length === 0) {
            console.error(`No frames found for ${animation}/${direction}`);
            return;
        }
        
        if (frames.length === 1) {
            const cachedUrl = this.spriteCache[frames[0]];
            if (cachedUrl) {
                this.sprite.src = cachedUrl;
            } else {
                console.error(`Sprite not in cache: ${frames[0]}`);
            }
        } else {
            const frameDelay = 1000 / fps;
            
            this.animationTimer = setInterval(() => {
                const framePath = frames[this.currentFrame];
                const cachedUrl = this.spriteCache[framePath];
                
                if (cachedUrl) {
                    this.sprite.src = cachedUrl;
                } else {
                    console.error(`Frame not in cache: ${framePath}`);
                }
                
                this.currentFrame = (this.currentFrame + 1) % frames.length;
            }, frameDelay);
            
            const firstFrameUrl = this.spriteCache[frames[0]];
            if (firstFrameUrl) {
                this.sprite.src = firstFrameUrl;
            } else {
                console.error(`First frame not in cache: ${frames[0]}`);
            }
        }
    }
    
    setupDragHandlers() {
        let startX, startY;
        
        // Only respond to events on the sprite itself, not the container
        this.sprite.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.container.classList.add('dragging');
            // visual feedback for pickup
            this.container.classList.add('picked');
            
            startX = e.clientX;
            startY = e.clientY;
            
            ipcRenderer.send('pet-drag-start');
            
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling to container
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            startX = e.clientX;
            startY = e.clientY;
            
            ipcRenderer.send('pet-drag-move', deltaX, deltaY);
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.container.classList.remove('dragging');
                // remove visual feedback
                this.container.classList.remove('picked');
                ipcRenderer.send('pet-drag-end');
            }
        });
    }
    
    showChatBubble(text, duration = 3000) {
        const existingBubble = document.querySelector('.chat-bubble');
        if (existingBubble) {
            existingBubble.remove();
        }
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble fade-in';
        bubble.textContent = text;
        
        this.container.appendChild(bubble);
        
        setTimeout(() => {
            bubble.classList.remove('fade-in');
            bubble.classList.add('fade-out');
            setTimeout(() => bubble.remove(), 300);
        }, duration);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.pet = new ShimejiPet();
});
