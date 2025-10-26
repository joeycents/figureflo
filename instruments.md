# Instrument System Implementation

## Current State (16 Total Instruments)

### 🎛️ Basic Waveforms (4)
- Sine Wave, Triangle Wave, Sawtooth Wave, Square Wave
- Instant loading, built-in oscillators

### 🎹 Advanced Synths (8)
- Synth, MonoSynth, FMSynth, AMSynth, DuoSynth, PolySynth, MembraneSynth, MetalSynth
- Instant loading, Tone.js synthesizers

### 🎻 Acoustic Instruments (4)
- Violin, Cello, Bassoon, Acoustic Guitar
- Loaded from CDN: `https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/{instrument}/`

---

## Implementation

### `src/hooks/useSynthesizer.js`

**INSTRUMENTS Configuration:**
```javascript
const INSTRUMENTS = {
  // Basic waveforms
  'synth-sine': { type: 'synth', oscillator: 'sine' },
  'synth-triangle': { type: 'synth', oscillator: 'triangle' },
  'synth-sawtooth': { type: 'synth', oscillator: 'sawtooth' },
  'synth-square': { type: 'synth', oscillator: 'square' },
  
  // Advanced Tone.js synths
  'Synth': { type: 'tone-synth', synthType: 'Synth' },
  'MonoSynth': { type: 'tone-synth', synthType: 'MonoSynth' },
  'FMSynth': { type: 'tone-synth', synthType: 'FMSynth' },
  'AMSynth': { type: 'tone-synth', synthType: 'AMSynth' },
  'DuoSynth': { type: 'tone-synth', synthType: 'DuoSynth' },
  'PolySynth': { type: 'tone-synth', synthType: 'PolySynth' },
  'MembraneSynth': { type: 'tone-synth', synthType: 'MembraneSynth' },
  'MetalSynth': { type: 'tone-synth', synthType: 'MetalSynth' },
  
  // Sampled instruments
  'bassoon': { type: 'sampler', notes: ['A3', 'C4', 'E4', 'G4', 'A4'] },
  'cello': { type: 'sampler', notes: ['C2', 'D2', 'E2', 'G2', 'A2', 'C3', 'D3', 'E3', 'G3', 'A3'] },
  'guitar-acoustic': { type: 'sampler', notes: ['A2', 'C3', 'E3', 'A3', 'C4', 'E4'] },
  'violin': { type: 'sampler', notes: ['A3', 'C4', 'E4', 'G4', 'A4', 'C5', 'E5'] }
}
```

**createInstrument() Logic:**
- `type: 'synth'` → Creates `Tone.PolySynth(Tone.Synth, { oscillator: { type } })`
- `type: 'tone-synth'` → Creates `Tone.PolySynth(Tone[synthType])`
- `type: 'sampler'` → Creates `Tone.Sampler` loading from CDN

**State:**
- `isLoaded` - tracks sample loading
- `loadError` - captures errors
- `instrument` - current selection (default: 'synth-sine')

### `src/App.jsx`

**UI Dropdown:**
```jsx
<select value={instrument} onChange={(e) => setInstrument(e.target.value)}>
  <optgroup label="🎛️ Basic Waveforms">
    <option value="synth-sine">Sine Wave</option>
    <option value="synth-triangle">Triangle Wave</option>
    <option value="synth-sawtooth">Sawtooth Wave</option>
    <option value="synth-square">Square Wave</option>
  </optgroup>
  <optgroup label="🎹 Advanced Synths">
    <option value="Synth">Synth</option>
    <option value="MonoSynth">MonoSynth</option>
    <option value="FMSynth">FMSynth</option>
    <option value="AMSynth">AMSynth</option>
    <option value="DuoSynth">DuoSynth</option>
    <option value="PolySynth">PolySynth</option>
    <option value="MembraneSynth">MembraneSynth</option>
    <option value="MetalSynth">MetalSynth</option>
  </optgroup>
  <optgroup label="🎻 Acoustic Instruments">
    <option value="violin">Violin</option>
    <option value="cello">Cello</option>
    <option value="bassoon">Bassoon</option>
    <option value="guitar-acoustic">Acoustic Guitar</option>
  </optgroup>
</select>
```

**Loading Indicators:**
- Show "Loading instrument samples..." when `!isLoaded && !loadError`
- Show error message when `loadError` exists

---

## Key Points

1. **All synths wrapped in PolySynth** for polyphonic playback
2. **Only 4 sampled instruments work** - others from tonejs-instruments CDN return 403 errors
3. **Piano removed** per user request
4. **Audio chain:** Instrument → Filter → Reverb → Output
5. **Synths load instantly**, samplers load async from CDN
