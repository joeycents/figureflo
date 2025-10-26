# WebGL Fluid Simulation Integration Plan

## Overview
Integrate the WebGL Fluid Simulation as a side-by-side visual representation of the music being created in FigureFlo. The fluid simulation will respond to hand movements, musical parameters, and detected emotions in real-time.

## Layout Design

### Side-by-Side Layout (Option 1)
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────────────┐              ┌──────────────┐       │
│  │   Webcam     │              │    Fluid     │       │
│  │   + Hand     │              │  Simulation  │       │
│  │  Tracking    │              │              │       │
│  │              │              │              │       │
│  └──────────────┘              └──────────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Proportions:**
- Webcam: 45% width (left side)
- Fluid: 50% width (right side)
- Gap: 5% margin between them
- Both containers maintain aspect ratio

## Implementation Tasks

### 1. Create Fluid Simulation Component/Hook

**File:** `src/hooks/useFluidSimulation.js`

**Responsibilities:**
- Initialize WebGL context and fluid simulation
- Expose methods to control fluid (splat, updateConfig, etc.)
- Handle canvas resizing
- Clean up WebGL resources on unmount

**Key Functions:**
- `initializeFluid(canvasRef)` - Set up WebGL and shaders
- `createSplat(x, y, dx, dy, color)` - Trigger fluid splat at position
- `updateFluidConfig(config)` - Change simulation parameters
- `animate()` - Main render loop
- `cleanup()` - Dispose of WebGL resources

### 2. Modify App.jsx Layout

**Changes:**
- Add new `fluidCanvasRef` for fluid simulation
- Restructure main layout to have two columns
- Add CSS classes for side-by-side layout
- Import and use `useFluidSimulation` hook

**Structure:**
```jsx
<main>
  <div className="dual-view-container">
    <div className="webcam-column">
      {/* Existing video + canvas */}
    </div>
    <div className="fluid-column">
      <canvas ref={fluidCanvasRef} className="fluid-canvas" />
    </div>
  </div>
  {/* Existing controls below */}
</main>
```

### 3. Add CSS Styling

**File:** `src/App.css`

**New Classes:**
- `.dual-view-container` - Flexbox container for side-by-side
- `.webcam-column` - Left column styling
- `.fluid-column` - Right column styling
- `.fluid-canvas` - Fluid canvas specific styling
- Responsive breakpoints for mobile (stack vertically)

### 4. Hand Position → Fluid Splats

**Mapping Logic:**

```javascript
// For each hand detected:
params.hands.forEach((hand, index) => {
  // Map hand position (0-1 normalized) to fluid canvas coordinates
  const x = hand.normalizedX
  const y = hand.normalizedY
  
  // Calculate velocity for splat force
  const dx = hand.velocityX * SPLAT_FORCE_MULTIPLIER
  const dy = hand.velocityY * SPLAT_FORCE_MULTIPLIER
  
  // Only create splat when pinched (actively playing)
  if (hand.isPinched) {
    createSplat(x, y, dx, dy, handColor)
  }
})
```

**Velocity Calculation:**
- Track previous hand positions
- Calculate delta between frames
- Apply smoothing to prevent jitter
- Scale to appropriate force values

### 5. Musical Parameters → Visual Properties

**Mapping Table:**

| Musical Parameter | Fluid Property | Calculation |
|------------------|----------------|-------------|
| **Note/Pitch** | Color Hue | `hue = (noteIndex % 12) / 12` → 0-1 rainbow |
| **Velocity** | Color Intensity | `intensity = velocity * 2` → brighter = louder |
| **Brightness** | Splat Size | `radius = 0.15 + (brightness * 0.2)` → 0.15-0.35 |
| **Filter Freq** | Bloom Intensity | `bloom = filterFreq / 20000 * 2` → bright = high freq |
| **Reverb** | Dissipation | `dissipation = 1 - (reverb * 0.5)` → high reverb = slower fade |
| **Hand Count** | Active Splats | Each hand gets its own color/splat stream |

**Color Schemes:**
- **Left Hand:** Cool colors (blues, purples, cyans)
- **Right Hand:** Warm colors (reds, oranges, yellows)
- **Both Hands:** Colors blend in the middle

### 6. Emotion Detection → Fluid Aesthetics

**Emotion Mappings:**

```javascript
const emotionPresets = {
  'Joy': {
    COLORFUL: true,
    BLOOM_INTENSITY: 1.2,
    BLOOM_THRESHOLD: 0.4,
    SUNRAYS: true,
    SUNRAYS_WEIGHT: 1.0,
    VELOCITY_DISSIPATION: 0.15,  // Fast, energetic
    SPLAT_FORCE: 7000
  },
  'Sadness': {
    COLORFUL: false,
    BLOOM_INTENSITY: 0.3,
    BLOOM_THRESHOLD: 0.8,
    SUNRAYS: false,
    VELOCITY_DISSIPATION: 0.4,  // Slow, heavy
    SPLAT_FORCE: 3000,
    BACK_COLOR: { r: 10, g: 10, b: 30 }  // Dark blue
  },
  'Excitement': {
    COLORFUL: true,
    BLOOM_INTENSITY: 1.5,
    BLOOM_THRESHOLD: 0.3,
    SUNRAYS: true,
    SUNRAYS_WEIGHT: 1.2,
    VELOCITY_DISSIPATION: 0.1,  // Very fast
    SPLAT_FORCE: 8000,
    CURL: 40  // More vorticity
  },
  'Calm': {
    COLORFUL: false,
    BLOOM_INTENSITY: 0.6,
    BLOOM_THRESHOLD: 0.5,
    SUNRAYS: true,
    SUNRAYS_WEIGHT: 0.5,
    VELOCITY_DISSIPATION: 0.5,  // Slow, gentle
    SPLAT_FORCE: 4000,
    BACK_COLOR: { r: 5, g: 20, b: 20 }  // Teal
  },
  'Anger': {
    COLORFUL: true,
    BLOOM_INTENSITY: 1.0,
    BLOOM_THRESHOLD: 0.2,
    SUNRAYS: false,
    VELOCITY_DISSIPATION: 0.05,  // Chaotic
    SPLAT_FORCE: 9000,
    CURL: 50,  // Maximum vorticity
    PRESSURE: 0.9
  },
  'Neutral': {
    COLORFUL: true,
    BLOOM_INTENSITY: 0.8,
    BLOOM_THRESHOLD: 0.6,
    SUNRAYS: true,
    SUNRAYS_WEIGHT: 1.0,
    VELOCITY_DISSIPATION: 0.2,  // Default
    SPLAT_FORCE: 6000
  }
}
```

**Application:**
- Smoothly interpolate between emotion presets
- Update every 2-3 seconds to avoid jarring changes
- Use emotion confidence score to blend with neutral

### 7. Gesture-Based Fluid Controls

**Special Gestures → Fluid Effects:**

| Gesture | Fluid Effect |
|---------|--------------|
| **Both Hands Open** | Clear/fade fluid quickly |
| **Both Fists** | Freeze simulation (pause) |
| **Victory Sign** | Trigger random splats (visual fireworks) |
| **Thumbs Up/Down** | Cycle through color palettes |

### 8. Performance Optimizations

**Strategies:**
- Use lower DYE_RESOLUTION on mobile (512 instead of 1024)
- Reduce SIM_RESOLUTION if needed (64 instead of 128)
- Throttle splat creation (max 60 splats per second)
- Use `will-change: transform` CSS for smooth animations
- Lazy load fluid simulation (only after calibration complete)

### 9. Configuration

**Default Fluid Settings for FigureFlo:**
```javascript
const FIGUREFLO_FLUID_CONFIG = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 1024,
  DENSITY_DISSIPATION: 1,
  VELOCITY_DISSIPATION: 0.2,
  PRESSURE: 0.8,
  PRESSURE_ITERATIONS: 20,
  CURL: 30,
  SPLAT_RADIUS: 0.25,
  SPLAT_FORCE: 6000,
  SHADING: true,
  COLORFUL: true,
  COLOR_UPDATE_SPEED: 10,
  BLOOM: true,
  BLOOM_INTENSITY: 0.8,
  BLOOM_THRESHOLD: 0.6,
  SUNRAYS: true,
  SUNRAYS_WEIGHT: 1.0,
  TRANSPARENT: false,
  BACK_COLOR: { r: 0, g: 0, b: 0 }
}
```

## File Structure

```
src/
├── hooks/
│   ├── useFluidSimulation.js          [NEW]
│   ├── useHandTracking.js
│   ├── useSynthesizer.js
│   ├── useEmotionDetection.js
│   └── useCalibration.js
├── utils/
│   ├── fluidShaders.js                [NEW] - GLSL shaders
│   ├── fluidPrograms.js               [NEW] - WebGL programs
│   ├── fluidHelpers.js                [NEW] - Utility functions
│   └── emotionFluidMapping.js         [NEW] - Emotion presets
├── App.jsx                            [MODIFIED]
├── App.css                            [MODIFIED]
└── components/
    └── CalibrationOverlay.jsx
```

## Implementation Order

1. ✅ **Create fluid.md** (this file)
2. ⬜ **Copy and adapt WebGL shaders** (`fluidShaders.js`, `fluidPrograms.js`)
3. ⬜ **Create helper utilities** (`fluidHelpers.js`)
4. ⬜ **Build useFluidSimulation hook** - Core functionality
5. ⬜ **Create emotion mapping module** (`emotionFluidMapping.js`)
6. ⬜ **Update App.css** - Add side-by-side layout
7. ⬜ **Modify App.jsx** - Integrate fluid canvas and hook
8. ⬜ **Connect hand data to fluid splats** - Position mapping
9. ⬜ **Map musical parameters to visual properties** - Note→Color, etc.
10. ⬜ **Integrate emotion detection** - Apply emotion presets
11. ⬜ **Add gesture controls** - Special fluid effects
12. ⬜ **Test and refine** - Performance tuning

## Testing Checklist

- [ ] Fluid simulation renders correctly
- [ ] Hand positions create splats at correct locations
- [ ] Colors change based on musical notes
- [ ] Brightness affects visual intensity
- [ ] Emotion changes affect fluid aesthetics smoothly
- [ ] Performance is acceptable (30+ FPS)
- [ ] Layout is responsive (works on tablet)
- [ ] No memory leaks after long sessions
- [ ] Gestures trigger appropriate fluid effects
- [ ] Calibration overlay doesn't interfere with fluid view

## Future Enhancements (Post-MVP)

- Performance Mode toggle (full-screen fluid)
- Fluid preset selector (user-configurable styles)
- Recording fluid animations with music
- Screenshot/export fluid art
- Audio analyzer integration (frequency → colors)
- Multi-user mode (multiple webcams, shared fluid)
- VR/AR mode using device orientation

---

**Status:** Planning Complete → Ready for Implementation
**Estimated Time:** 6-8 hours development + 2-3 hours testing/refinement
**Risk Level:** Medium (WebGL complexity, performance considerations)
