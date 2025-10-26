# FigureFlo - New Gesture Features

## Overview
FigureFlo now supports **dual-hand parallel synthesis** with advanced gesture controls! Each hand can play independently with its own instrument.

## New Features

### 🎹 Dual-Hand Synthesis
- **Both hands tracked simultaneously**
- Each hand plays its own note in parallel
- Separate instrument selection per hand
- Independent volume and filter controls per hand

### 🎨 Position-Based Controls
- **Hand Center Position** (average of all landmarks) determines:
  - **Height (Y-axis)**: Controls pitch/note frequency
  - **Horizontal (X-axis)**: Controls filter frequency
- More stable than single-point tracking

### 👍👎 Instrument Switching Gestures
- **Thumbs Up (any hand)**: Cycle to next instrument for that hand
- **Thumbs Down (any hand)**: Cycle to previous instrument for that hand
- Works independently for left and right hands
- Console logs show instrument changes

### 🛑 Stop Gesture (Both Hands Open)
- Hold **both hands open** (all fingers extended) for **2 seconds**
- Stops all sound output from synthesizer
- Gesture again to resume playback
- Visual feedback in status indicator

### 🎙️ Recording Gesture (Both Fists) - DUMMY
- Hold **both hands in fists** for **2 seconds**
- Currently just logs to console (not fully implemented)
- Future feature: Will record and playback performances
- Visual indicator shows when "recording"

## Gesture Detection Details

### Open Palm Detection
- All four fingers (index, middle, ring, pinky) extended
- Fingertips higher than their respective knuckles
- Thumb extended outward

### Thumbs Up Detection
- Thumb pointing up (tip higher than base by significant margin)
- Other fingers curled close to palm
- Instant detection (no hold time required)

### Thumbs Down Detection
- Thumb pointing down (tip lower than base)
- Other fingers curled close to palm
- Instant detection (no hold time required)

### Fist Detection
- All fingertips (including thumb) close to wrist
- Distance threshold < 0.15 units

## Timing System

### 2-Second Hold Gestures
- **Both Hands Open**: Hold for 2 seconds to stop/resume
- **Both Fists**: Hold for 2 seconds to start/stop recording (dummy)

### Instant Gestures
- **Thumbs Up/Down**: Instantly changes instrument (no hold time)
- Prevents accidental double-triggers with timing state

## UI Updates

### Status Display
- Shows stopped/playing/silent state
- Shows recording status (when active)
- Displays current instrument for each hand
- Visual highlighting when each hand is playing

### Gesture Data Panel
- Shows data for each detected hand separately
- Displays active gestures (thumbs up/down, fist, open palm)
- Real-time feedback for all parameters

### Instructions Updated
- Complete list of all gesture controls
- Clear icons for each gesture type
- Separate calibration vs. play instructions

## Console Logging

All major events are logged with emoji prefixes:
- 🎹 Instrument changes
- 👍/👎 Gesture detections  
- 🛑 Stop/resume actions
- 🎙️ Recording events
- 🖐️ Gesture timing progress

## Available Instruments (17 total)

### Basic Waveforms
1. Sine Wave
2. Triangle Wave
3. Sawtooth Wave
4. Square Wave

### Advanced Synths
5. Basic Synth
6. Mono Synth
7. FM Synth
8. AM Synth
9. Duo Synth
10. Poly Synth
11. Membrane Synth
12. Metal Synth

### Acoustic Instruments
13. Bassoon
14. Cello
15. Acoustic Guitar
16. Violin

## Technical Implementation

### Files Modified
1. **`src/utils/gestureMapping.js`**
   - Added gesture detection functions
   - Hand center position calculation
   - Multi-hand processing

2. **`src/hooks/useSynthesizer.js`**
   - Dual synthesizer support (left + right)
   - Separate filters per hand
   - Instrument cycling functions
   - Stop/resume functionality

3. **`src/App.jsx`**
   - Gesture timing state management
   - Multi-hand control logic
   - Updated UI components

4. **`src/App.css`**
   - Instrument status styling
   - Multi-hand data display
   - Gesture detection animations

## Future Enhancements
- ✅ Basic dual-hand synthesis
- ✅ Gesture-based controls
- 🔄 Recording functionality (currently dummy)
- 📝 Playback system
- 💾 Save/load presets
- 🎵 More complex musical scales
