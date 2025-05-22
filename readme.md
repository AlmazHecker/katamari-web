# Katamari Web

A Chrome extension that lets you roll a ball across web pages, collecting DOM elements as you go - inspired by the classic Katamari Damacy game.

![Demo GIF](https://raw.githubusercontent.com/AlmazHecker/katamari-web/master/assets/example.mp4)

## Features

- **Interactive Katamari Ball**: Control a 3D ball using WASD or Arrow keys and mouse clicks
- **DOM Element Collection**: Stick webpage elements (buttons, inputs, text) to your growing ball
- **Real-time Rendering**: Seamless DOM-to-Canvas conversion as you roll
- **Physics Simulation**: Realistic physics powered by Cannon.js and Three.js
- **Chrome Extension**: Easily inject the Katamari experience into any webpage

## How It Works

1. **Element Detection**: Uses `getElementsFromPoint` API to identify DOM elements under the ball
2. **DOM-to-Canvas**: Custom conversion system renders webpage elements onto the ball
3. **Physics Engine**: Cannon.js handles collision and physics while Three.js manages 3D rendering

## Installation

### Chrome Extension

1. Clone this repository:
   ```bash
   git clone https://github.com/AlmazHecker/katamari-web.git
   ```

2. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the extension directory from the cloned repo

## Usage

1. Click the extension icon in your Chrome toolbar
2. The Katamari ball will appear on your current webpage
3. Control the ball:
    - **WASD**: Movement controls
    - **Mouse Click**: Attract nearby elements
    - **Scroll Wheel**: Adjust camera zoom
4. Roll over page elements to collect them onto your ball!

## Technical Details

### Core Technologies

- **Three.js**: 3D rendering of the Katamari ball and collected elements
- **Cannon.js**: Physics simulation for realistic rolling and collisions
- **Chrome Extension API**: Injects the experience into web pages
- **getElementsFromPoint**: Detects DOM elements under the ball
- **Custom DOM-to-Canvas**: Converts webpage elements to texture maps

### Architecture

```
src/
├── core/                  # Main game systems
│   ├── physics/           # Physics components
│   │   ├── CollisionDetector.ts
│   │   ├── Ground.ts
│   │   └── Walls.ts
│   ├── objects/
│   │   └── PlayerBall.ts  # Main katamari ball
│   ├── setup.ts           # Initialization
│   └── markCollidable.ts  # Tagging system
│
├── input/                 # Control systems
│   └── keyboard.ts        # WASD & Arrow keys controls
│
├── dom-to-svg/        # DOM-to-SVG converter
│   ├── strategies/        # Element handlers
│   │   ├── base-handler.ts
│   │   ├── canvas-handler.ts
│   │   ├── iframe-handler.ts
│   │   ├── image-handler.ts
│   │   └── video-handler.ts
│   ├── services/          # Processing units
│   │   ├── css-processor.ts
│   │   ├── element-cloner.ts
│   │   └── svg-generator.ts
│   ├── utils/             # Helpers
│   │   ├── cache.ts
│   │   ├── dom.ts
│   │   └── ... (other utils)
│   ├── index.ts           # Main export
│   └── types.ts           # Shared types
│
├── background.js          # Extension background
│
└── index.ts               # Main entry point
```

## Known Limitations

- Performance may degrade with very large Katamari balls
- Some complex DOM elements may not render perfectly on the ball
- Currently Chrome-only due to extension and API dependencies
