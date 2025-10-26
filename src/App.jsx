import React, { useRef, useEffect, useState } from 'react'
import './App.css'
import { useHandTracking } from './hooks/useHandTracking'
import { useSynthesizer } from './hooks/useSynthesizer'
import { useEmotionDetection } from './hooks/useEmotionDetection'
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
    isPlaying
  } = useSynthesizer()
  
  const [gestureData, setGestureData] = useState(null)
  const [wasPlaying, setWasPlaying] = useState(false)

  // Emotion detection (enabled after synthesizer starts)
  const { emotions, isProcessing: isProcessingEmotion, error: emotionError, hasApiKey } = useEmotionDetection(videoRef, isStarted)

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

        {/* Emotion Display - Simplified and outside video */}
        {emotions && (
          <div className="emotion-badge">
            <span className="emotion-icon">😊</span>
            <span className="emotion-label">{emotions.topEmotion.name}</span>
            <span className="emotion-score">{(emotions.topEmotion.score * 100).toFixed(0)}%</span>
          </div>
        )}
        
        {emotionError && !hasApiKey && (
          <div className="emotion-warning-inline">
            ⚠️ Hume API key not configured
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

