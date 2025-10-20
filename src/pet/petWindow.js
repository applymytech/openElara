// src/pet/petWindow.js
const { BrowserWindow, screen, ipcMain, app } = require('electron');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');

class PetWindowManager {
    constructor() {
        this.petWindow = null;
        this.manifest = null;
        this.physics = null;
        this.characterName = null;
    }
    
    async createPetWindow(characterName) {
        if (this.petWindow) {
            this.petWindow.focus();
            return;
        }
        
        this.characterName = characterName;
        
        const manifestPath = path.join(
            app.getPath('userData'),
            'pet-assets',
            'characters',
            characterName.toLowerCase(),
            'manifest.json'
        );
        
        if (!fs.existsSync(manifestPath)) {
            log.error(`Manifest not found for character: ${characterName}`);
            throw new Error(`Pet sprites not generated for ${characterName}`);
        }
        
        this.manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        log.info('Loaded pet manifest:', this.manifest.characterName);
        
        const displays = screen.getAllDisplays();
        const primaryDisplay = displays[0];
        
        const spriteSize = this.manifest.spriteSize || { width: 128, height: 128 };
        
        this.petWindow = new BrowserWindow({
            width: spriteSize.width,
            height: spriteSize.height,
            frame: false,             
            transparent: true,         
            alwaysOnTop: true,        
            skipTaskbar: true,        
            resizable: false,
            hasShadow: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            x: primaryDisplay.bounds.width - 200,  
            y: primaryDisplay.bounds.height - 200,
            // Ensure the window background is transparent
            backgroundColor: '#00000000'
        });
        
    this.petWindow.loadFile('src/pet/petRenderer.html');
    // Allow mouse events so user can click anywhere in the pet window to pick up and move the pet
    this.petWindow.setIgnoreMouseEvents(false);
    
    // Focus the window to ensure proper rendering
    this.petWindow.focus();
        
        this.physics = new PetPhysics(this.petWindow, primaryDisplay.bounds, this.manifest);
        
        this.startPhysicsLoop();
        
        this.setupPetIpcHandlers();
        
        this.petWindow.on('closed', () => {
            this.stopPhysicsLoop();
            this.petWindow = null;
            this.physics = null;
        });
        
        log.info(`Pet window created for ${characterName}`);
    }
    
    setupPetIpcHandlers() {
        ipcMain.handle('get-pet-manifest', () => {
            return this.manifest;
        });

        ipcMain.handle('get-user-data-path', () => {
            return app.getPath('userData');
        });
        
        ipcMain.on('pet-drag-start', () => {
            if (this.physics) {
                this.physics.startDragging();
            }
        });
        
        ipcMain.on('pet-drag-move', (event, deltaX, deltaY) => {
            if (this.physics) {
                this.physics.updateDragPosition(deltaX, deltaY);
            }
        });
        
        ipcMain.on('pet-drag-end', () => {
            if (this.physics) {
                this.physics.endDragging();
            }
        });
    }
    
    startPhysicsLoop() {
        this.physicsInterval = setInterval(() => {
            if (this.physics && this.petWindow) {
                this.physics.update();
            }
        }, 16);
    }
    
    stopPhysicsLoop() {
        if (this.physicsInterval) {
            clearInterval(this.physicsInterval);
            this.physicsInterval = null;
        }
    }
    
    showChatBubble(text, duration = 3000) {
        if (this.petWindow) {
            this.petWindow.webContents.send('show-chat-bubble', text, duration);
        }
    }
    
    closePet() {
        if (this.petWindow) {
            this.petWindow.close();
        }
    }
}

class PetPhysics {
    constructor(petWindow, screenBounds, manifest) {
        this.window = petWindow;
        this.screen = screenBounds;
        this.manifest = manifest;
        
        const pos = this.window.getPosition();
        this.position = { x: pos[0], y: pos[1] };
        this.velocity = { x: 0, y: 0 };
        this.gravity = 0.5;
        this.maxFallSpeed = 10;
        this.walkSpeed = 2;
        
        this.state = 'falling';
        this.direction = 's'; 
        this.actionTimer = null;
        
        this.spriteSize = manifest.spriteSize || { width: 128, height: 128 };
    }
    
    update() {
        if (this.state === 'dragging') return;
        
        switch(this.state) {
            case 'falling':
                this.applyGravity();
                this.checkGroundCollision();
                break;
            case 'walking':
                this.updateWalking();
                this.applyGravity();
                this.checkGroundCollision();
                break;
            case 'climbing':
                this.updateClimbing();
                break;
            case 'idle':
                this.applyGravity();
                this.checkGroundCollision();
                break;
        }
        
        this.updateWindowPosition();
    }
    
    applyGravity() {
        this.velocity.y += this.gravity;
        this.velocity.y = Math.min(this.velocity.y, this.maxFallSpeed);
        this.position.y += this.velocity.y;
    }
    
    checkGroundCollision() {
        const taskbarHeight = 40;
        const groundLevel = this.screen.height - taskbarHeight - this.spriteSize.height;
        
        if (this.position.y >= groundLevel) {
            this.position.y = groundLevel;
            this.velocity.y = 0;
            
            if (this.state === 'falling') {
                this.setState('idle');
            }
        } else if (this.position.y < groundLevel - 5 && this.state === 'idle') {
            this.setState('falling');
        }
    }
    
    updateWalking() {
        this.position.x += this.velocity.x;
        
        if (this.position.x <= 0) {
            this.position.x = 0;
            this.setState('idle');
        } else if (this.position.x >= this.screen.width - this.spriteSize.width) {
            this.position.x = this.screen.width - this.spriteSize.width;
            this.setState('idle');
        }
    }
    
    updateClimbing() {
        this.position.y += this.velocity.y;
        
        if (this.position.y <= 0) {
            this.position.y = 0;
            this.setState('falling');
        }
    }
    
    setState(newState) {
        if (this.state === newState) return;
        
        log.info(`Pet state: ${this.state} -> ${newState}`);
        this.state = newState;
        
        if (this.actionTimer) {
            clearTimeout(this.actionTimer);
            this.actionTimer = null;
        }
        
        let animation = 'idle';
        let direction = this.direction;
        
        switch(newState) {
            case 'idle':
                animation = 'idle';
                this.velocity.x = 0;
                this.actionTimer = setTimeout(() => {
                    this.decideNextAction();
                }, 2000 + Math.random() * 3000);
                break;
                
            case 'walking':
                animation = 'walk';
                break;
                
            case 'climbing':
                animation = 'climb';
                direction = 'up';
                break;
                
            case 'falling':
                animation = 'fall';
                direction = 'down';
                break;
        }
        
        this.sendAnimationUpdate(animation, direction);
    }
    
    decideNextAction() {
        const roll = Math.random();
        
        if (roll < 0.6) {
            this.actionTimer = setTimeout(() => {
                this.decideNextAction();
            }, 2000 + Math.random() * 3000);
        } else if (roll < 0.9) {
            this.startWalking(Math.random() < 0.5 ? 'e' : 'w');
        } else {
            this.startClimbing();
        }
    }
    
    startWalking(direction) {
        this.direction = direction;
        this.velocity.x = direction === 'e' ? this.walkSpeed : -this.walkSpeed;
        this.setState('walking');
        
        const walkDuration = 2000 + Math.random() * 3000;
        this.actionTimer = setTimeout(() => {
            this.setState('idle');
        }, walkDuration);
    }
    
    startClimbing() {
        const distToLeft = this.position.x;
        const distToRight = this.screen.width - this.position.x;
        
        if (distToLeft < distToRight) {
            this.position.x = 0;
        } else {
            this.position.x = this.screen.width - this.spriteSize.width;
        }
        
        this.velocity.y = -2;
        this.setState('climbing');
        
        this.actionTimer = setTimeout(() => {
            this.setState('falling');
        }, 3000);
    }
    
    startDragging() {
        this.state = 'dragging';
        this.velocity = { x: 0, y: 0 };
        if (this.actionTimer) {
            clearTimeout(this.actionTimer);
            this.actionTimer = null;
        }
        this.sendAnimationUpdate('idle', this.direction);
    }
    
    updateDragPosition(deltaX, deltaY) {
        this.position.x += deltaX;
        this.position.y += deltaY;
        
        this.position.x = Math.max(0, Math.min(this.position.x, this.screen.width - this.spriteSize.width));
        this.position.y = Math.max(0, Math.min(this.position.y, this.screen.height - this.spriteSize.height));
    }
    
    endDragging() {
        this.setState('falling');
    }
    
    sendAnimationUpdate(animation, direction) {
        if (this.window && this.window.webContents) {
            this.window.webContents.send('update-animation', animation, direction);
        }
    }
    
    updateWindowPosition() {
        if (this.window) {
            this.window.setPosition(
                Math.round(this.position.x),
                Math.round(this.position.y)
            );
        }
    }
}

module.exports = { PetWindowManager };
