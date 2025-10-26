import React, { useRef, useEffect, useState } from 'react'
import './App.css'
import { useHandTracking } from './hooks/useHandTracking'
import { useSynthesizer } from './hooks/useSynthesizer'
import { processGestures } from './utils/gestureMapping'

function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  
  const { handData, isLoading, error } = useHandTracking(videoRef, canvasRef)
  const {
    start,
    triggerAttack,
    triggerRelease,
    setFilterFrequency,
    setReverb,
    setVolume,
    isStarted,
    isPlaying,
    isLoaded,
    instrument,
    setInstrument,
    loadError
  } = useSynthesizer()
  
  const [gestureData, setGestureData] = useState(null)
  const [wasPlaying, setWasPlaying] = useState(false)

  // Start audio context on user interaction
  const handleStart = async () => {
    await start()
  }

  // Process gestures and control synthesizer
  useEffect(() => {
    if (!handData || !isStarted) return

    const params = processGestures(handData)
    
    if (params) {
      setGestureData(params)
      
      // Update filter and reverb continuously
      setFilterFrequency(params.filterFreq)
      setReverb(params.reverb)
      setVolume(params.volume)
      
      // Trigger note on pinch
      if (params.isPinched && !wasPlaying) {
        triggerAttack(params.note, params.pinch)
        setWasPlaying(true)
      } else if (!params.isPinched && wasPlaying) {
        triggerRelease(params.note)
        setWasPlaying(false)
      }
    } else {
      setGestureData(null)
      if (wasPlaying) {
        setWasPlaying(false)
      }
    }
  }, [handData, isStarted, wasPlaying, setFilterFrequency, setReverb, setVolume, triggerAttack, triggerRelease])

  return (
    <div className="App">
      <header>
        <h1>🎵 FigureFlo</h1>
        <p>Gesture-Controlled Synthesizer</p>
      </header>

      <main>
        {error && (
          <div className="error">
            <p>❌ Error: {error}</p>
            <p>Please allow camera access to use FigureFlo</p>
          </div>
        )}

        {isLoading && (
          <div className="loading">
            <p>Loading MediaPipe hand tracking...</p>
          </div>
        )}

        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-feed"
          />
          <canvas
            ref={canvasRef}
            className="canvas-overlay"
          />
        </div>

        {!isStarted && !isLoading && (
          <button onClick={handleStart} className="start-button">
            🎹 Start Synthesizer
          </button>
        )}

        {isStarted && (
          <div className="status">
            <div className={`indicator ${isPlaying ? 'active' : ''}`}>
              {isPlaying ? '🔊 Playing' : '🔇 Silent'}
            </div>
            <div className="controls">
              <label>
                Instrument:
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
              </label>
              {!isLoaded && !loadError && (
                <span className="loading"> Loading instrument samples...</span>
              )}
              {loadError && (
                <span className="error" style={{ color: 'red', marginLeft: '10px' }}>
                  ⚠️ {loadError}
                </span>
              )}
            </div>
          </div>
        )}

        {gestureData && (
          <div className="gesture-info">
            <h3>Gesture Data</h3>
            <div className="data-grid">
              <div className="data-item">
                <span className="label">Note:</span>
                <span className="value">{gestureData.note || 'N/A'}</span>
              </div>
              <div className="data-item">
                <span className="label">Frequency:</span>
                <span className="value">{gestureData.frequency?.toFixed(1)} Hz</span>
              </div>
              <div className="data-item">
                <span className="label">Filter:</span>
                <span className="value">{gestureData.filterFreq?.toFixed(0)} Hz</span>
              </div>
              <div className="data-item">
                <span className="label">Pinch:</span>
                <span className="value">{(gestureData.pinch * 100).toFixed(0)}%</span>
              </div>
              <div className="data-item">
                <span className="label">Reverb:</span>
                <span className="value">{(gestureData.reverb * 100).toFixed(0)}%</span>
              </div>
              <div className="data-item">
                <span className="label">Volume:</span>
                <span className="value">{gestureData.volume.toFixed(1)} dB</span>
              </div>
            </div>
          </div>
        )}

        <div className="instructions">
          <h3>How to Play</h3>
          <ul>
            <li>✋ <strong>Hand Height</strong>: Controls pitch (higher = higher note)</li>
            <li>↔️ <strong>Hand Position</strong>: Controls filter frequency (left to right)</li>
            <li>🤏 <strong>Pinch</strong>: Trigger notes (thumb + index finger)</li>
            <li>👐 <strong>Hand Openness</strong>: Controls reverb amount</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default App

