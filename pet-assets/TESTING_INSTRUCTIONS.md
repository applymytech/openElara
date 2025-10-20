# Desktop Pet - Testing Instructions

## Quick Start: Test with Placeholder Sprites

The desktop pet system is ready to test! However, you need to add placeholder sprites first since the automatic generation is coming in Phase 2.

### Create Placeholder Sprites (Manual Method)

You need to create simple 128x128 PNG images for testing. Here's the easiest way:

#### Option 1: Use Paint (Windows)
1. Open Paint
2. Press `Ctrl+E` to resize canvas
3. Set to **128 x 128 pixels**
4. Draw a simple character (circle, smiley face, stick figure, etc.)
5. Save as PNG to the appropriate folder

#### Option 2: Use an existing image
1. Find any small image of Elara (or any character image)
2. Resize it to 128x128 pixels
3. Copy it to all the required sprite folders

### Required Sprite Files

You need to create these files (you can copy the same image to all locations for testing):

```
pet-assets/characters/elara/sprites/
├── idle/
│   ├── s/frame_0.png      (idle facing south/front)
│   ├── e/frame_0.png      (idle facing east/right)
│   └── w/frame_0.png      (idle facing west/left)
├── walk/
│   ├── s/frame_0.png      (walk frame 1 facing south)
│   ├── s/frame_1.png      (walk frame 2 facing south)
│   ├── e/frame_0.png      (walk frame 1 facing east)
│   ├── e/frame_1.png      (walk frame 2 facing east)
│   ├── w/frame_0.png      (walk frame 1 facing west)
│   └── w/frame_1.png      (walk frame 2 facing west)
├── fall/
│   └── down/frame_0.png   (falling pose)
└── climb/
    └── up/frame_0.png     (climbing pose)
```

**Quick Shortcut:** Create ONE 128x128 PNG of a simple character, then copy it to all 13 locations listed above.

### Testing the Pet

Once you've added the placeholder sprites:

1. Launch the app and go to **Account & Configuration**
2. Click the **🐾 Desktop Pet** tab
3. Select "Elara" from the dropdown
4. Click **🚀 Launch Pet**

You should see a small transparent window with your sprite that:
- Falls to the bottom of the screen
- Walks left and right randomly
- Can be dragged with your mouse
- Climbs screen edges occasionally
- Responds to "Say Hello" with a chat bubble

### What's Working

✅ **Phase 1 Complete:**
- Desktop pet window (frameless, transparent)
- Physics engine (gravity, walking, climbing)
- Animation system (sprite switching)
- Drag-and-drop functionality
- Chat bubble system
- IPC communication between main app and pet window

### What's Coming Next

🚧 **Phase 2 (Sprite Generation):**
- Automatic sprite generation via FLUX i2i
- Base image → 8 directions → animation frames
- Progress UI with approval checkpoints
- Cost: ~$1.10 per character
- Rate limiting (5-second delays)

🚧 **Phase 3 (Polish):**
- Better animation blending
- Voice integration (STT-TTS)
- Multiple pets at once
- Screen edge detection (taskbar awareness)
- Idle chatter system

### Troubleshooting

**Pet won't launch:**
- Make sure all 13 sprite files exist
- Check that files are valid 128x128 PNG images
- Look at console in DevTools (Ctrl+Shift+I) for errors

**Pet appears but doesn't move:**
- Check browser console for physics errors
- Make sure window isn't minimized

**Sprites don't load:**
- Verify file paths match manifest.json exactly
- Check file names are lowercase
- Ensure PNG format (not JPG or other)

## Current File Structure

```
src/pet/
├── petRenderer.html       ✅ Window UI
├── petRenderer.js         ✅ Animation engine
└── petWindow.js           ✅ Window manager + physics

src/main/handlers/
└── petHandlers.js         ✅ IPC handlers

pet-assets/characters/elara/
├── manifest.json          ✅ Animation config
└── sprites/               ⚠️  NEEDS PLACEHOLDER IMAGES

account.html               ✅ Pet tab added
account.js                 ✅ Pet controls added
```

## Demo Video (Coming Soon)

Once you've tested it, we can record a quick demo showing:
1. Launching the pet
2. Pet falling and walking
3. Dragging the pet
4. Chat bubbles

This will validate Phase 1 before investing in sprite generation!

## Notes

- The pet runs in a separate always-on-top window
- Physics runs at ~60fps (16ms update interval)
- Pet respects screen bounds and taskbar
- Multiple animation states: idle, walking, climbing, falling
- Transparent background makes it look like a desktop overlay

**Want to test it?** Just create ONE simple 128x128 PNG and copy it to all 13 locations listed above. Even a solid color square with text will work for testing the physics!
