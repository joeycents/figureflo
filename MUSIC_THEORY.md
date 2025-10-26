# FigureFlo Music Theory

## Overview
FigureFlo now uses sound field theory to create an expressive, always-musical gesture instrument. Based on interactive music composition principles, hand movements are mapped to musical parameters using quantization and harmonic structure.

---

## Core Concepts

### 1. **Pentatonic Scale Quantization**
**Why**: Free-pitch control (like a theremin) is hard to control and often sounds dissonant.

**Solution**: Quantize hand height to a **C major pentatonic scale** (C-D-E-G-A).

```javascript
const PENTATONIC_SCALE = ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5']
```

**Benefits**:
- Every note harmonizes with every other note
- No "wrong notes" possible - all consonant intervals
- Used worldwide in folk, jazz, and world music
- Instant musicality without training

**Implementation**:
- Y-axis (hand height) maps to scale index
- Higher hand = higher pitch in the scale
- Always sounds good, no dissonance

---

### 2. **Spatial Mapping**

#### Y-Axis (Vertical) → **Pitch**
- Hand height controls which note in the pentatonic scale
- Higher hand = higher note
- Lower hand = lower note
- Quantized to discrete pitches (not continuous frequency)

#### X-Axis (Horizontal) → **Brightness/Timbre**
- Hand position left/right controls tonal color
- **Left = Dark**: Low filter cutoff (~300Hz), less reverb
- **Right = Bright**: High filter cutoff (~5000Hz), more reverb
- Smooth, continuous control (not quantized)

This mimics orchestration theory:
- Bass/cello (dark) vs. flute/violin (bright)
- Intimate vs. spacious sound

---

### 3. **Rhythmic Quantization**

**Problem**: Triggering notes on every gesture creates chaotic, asynchronous sound.

**Solution**: Use `Tone.Transport` to lock notes to a steady rhythmic grid.

```javascript
Tone.Transport.bpm.value = 120  // 120 beats per minute

// Trigger notes every 8th note (eighth note = 1/8 of a measure)
transportLoopRef.current = new Tone.Loop((time) => {
  synth.triggerAttackRelease(note, '8n', time, velocity)
}, '8n')
```

**Benefits**:
- Notes sync to musical timing
- Gesture influences *what* plays, but timing stays organized
- Like playing over a metronome
- Creates groove and rhythm automatically

---

### 4. **Dual-Layer Harmonic Structure**

Each hand plays **two instruments simultaneously**:

1. **Melody Synth**: Plays the selected pentatonic note
2. **Bass Synth**: Plays the same note one octave lower

```javascript
// Melody layer
leftSynthRef.current.triggerAttackRelease(note, '8n', time, velocity)

// Bass layer (one octave below)
const bassNote = note.replace(/\d/, (match) => Math.max(1, parseInt(match) - 1))
leftBassRef.current.triggerAttackRelease(bassNote, '4n', time, velocity * 0.8)
```

**Why**:
- Creates **harmonic depth** and fullness
- Melody + bass line = foundation of Western harmony
- Even a single gesture creates polyphonic texture
- Bass plays quarter notes (longer), melody plays eighth notes (faster)

---

### 5. **Continuous Parameter Control**

While notes are quantized rhythmically, **timbre changes continuously**:

#### Filter Frequency (Brightness)
```javascript
filter.frequency.rampTo(filterFreq, 0.2)  // Smooth 200ms transition
```

#### Reverb Mix (Spatial Depth)
```javascript
reverb.wet.rampTo(reverbAmount, 0.3)  // Smooth 300ms transition
```

These parameters update in real-time as you move, creating **expressive morphing** between orchestral colors.

---

## Gesture Mapping Summary

| Hand Movement | Musical Parameter | Range | Quantization |
|--------------|-------------------|-------|--------------|
| **Height** (Y) | Pitch | C3 to E5 | Pentatonic scale |
| **Position** (X) | Brightness/Timbre | Dark → Bright | Continuous |
| **Position** (X) | Filter Frequency | 300Hz → 5000Hz | Continuous |
| **Position** (X) | Reverb Mix | 10% → 50% | Continuous |
| **Pinch** | Note Trigger | On/Off | Binary + velocity |
| **Pinch Strength** | Velocity | 0.3 → 1.0 | Continuous |

---

## Implementation Files Changed

### 1. **`src/utils/gestureMapping.js`**
- Added `PENTATONIC_SCALE` constant
- `mapHandToNote()` - Quantizes Y position to scale
- `getBassNote()` - Calculates octave-below bass note
- `mapHandToBrightness()` - Maps X to filter + reverb
- `mapPinchToVelocity()` - Maps pinch to expressive velocity
- Updated `processGestures()` to return note, bassNote, brightness, velocity

### 2. **`src/hooks/useSynthesizer.js`**
- Added bass synthesizers (`leftBassRef`, `rightBassRef`)
- Implemented `Tone.Transport` with 120 BPM rhythmic loop
- Changed API from `triggerAttack/Release` to `updateParams/stopHand`
- Notes trigger every 8th note automatically
- Melody + bass layers play simultaneously
- Smooth parameter ramping for filter and reverb

### 3. **`src/App.jsx`**
- Updated gesture processing to use new API
- Changed display to show: note, bassNote, brightness, velocity
- Updated instructions to explain pentatonic scale and rhythmic quantization

---

## Musical Benefits

✅ **Always sounds musical** - Pentatonic scale prevents dissonance  
✅ **Expressive control** - Brightness and velocity add emotion  
✅ **Rhythmic coherence** - Transport keeps timing organized  
✅ **Harmonic richness** - Automatic bass creates depth  
✅ **Smooth transitions** - Filter/reverb ramp smoothly  
✅ **No music theory required** - System guides you to good-sounding results

---

## Key Differences from Previous Version

| Before | After |
|--------|-------|
| Continuous frequency (200-1000Hz) | Quantized pentatonic notes |
| Direct note triggering | Rhythmic quantization (8th notes) |
| Single voice per hand | Melody + bass per hand |
| Separate filter/reverb/volume controls | Unified brightness control |
| Volume controlled by pinch | Velocity controlled by pinch |
| Manual timing | Automatic musical timing at 120 BPM |

---

## Try It!

1. **Victory sign** with both hands to start
2. **Pinch** one hand to activate it
3. **Move hand up/down** → hear different pentatonic notes
4. **Move hand left/right** → hear brightness change from dark to bright
5. **Release pinch** → that hand stops playing
6. Notice how notes sync to a steady pulse automatically!

The system will always sound musical, even with random movements, because:
- Notes are quantized to a consonant scale
- Timing is locked to rhythm
- Brightness morphs smoothly
- Bass provides harmonic grounding
