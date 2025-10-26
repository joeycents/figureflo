import React, { useRef, useEffect, useState } from 'react'
import './App.css'
import { useHandTracking } from './hooks/useHandTracking'
import { useSynthesizer } from './hooks/useSynthesizer'
import { useEmotionDetection } from './hooks/useEmotionDetection'
import { useCalibration } from './hooks/useCalibration'
import { processGestures } from './utils/gestureMapping'
import CalibrationOverlay from './components/CalibrationOverlay'

function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const videoContainerRef = useRef(null)
  
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
  
  // Calibration hook
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    progressPercentage,
    gestureHoldProgress,
    isHoldingGesture,
    isComplete: calibrationComplete,
    showSuccessAnimation,
    allSteps,
    canSkip,
    skipCurrentStep
  } = useCalibration(handData, !isLoading && !error)
  
  const [gestureData, setGestureData] = useState(null)
  const [wasPlaying, setWasPlaying] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showLoading, setShowLoading] = useState(true)
  const [isAnimatingComplete, setIsAnimatingComplete] = useState(false)
  const [isAnimatingWebcam, setIsAnimatingWebcam] = useState(false)

  // Progress bar effect - increase to 80% over 8 seconds
  useEffect(() => {
    if (isLoading && !error) {
      setShowLoading(true)
      setLoadingProgress(0)
      setIsAnimatingComplete(false)
      
      const startTime = Date.now()
      const duration = 8000 // 8 seconds
      const targetProgress = 80
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min((elapsed / duration) * targetProgress, targetProgress)
        setLoadingProgress(progress)
      }, 50)
      
      return () => clearInterval(interval)
    }
  }, [isLoading, error])

  // Handle completion animation when loading finishes
  useEffect(() => {
    if (!isLoading && !error && showLoading && !isAnimatingComplete) {
      setIsAnimatingComplete(true)
      
      const animateCompletion = () => {
        let currentProgress = Math.max(loadingProgress, 80)
        const startTime = Date.now()
        const catchUpDuration = currentProgress < 80 ? 200 : 0
        const fillDuration = 400
        
        const animate = () => {
          const elapsed = Date.now() - startTime
          
          // Phase 1: Catch up to 80% if needed (0-200ms)
          if (elapsed < catchUpDuration) {
            const catchUpProgress = 80 * (elapsed / catchUpDuration)
            setLoadingProgress(Math.max(loadingProgress, catchUpProgress))
            requestAnimationFrame(animate)
          }
          // Phase 2: Animate from 80% to 100% (200-600ms)
          else if (elapsed < catchUpDuration + fillDuration) {
            const fillElapsed = elapsed - catchUpDuration
            const fillProgress = 80 + (20 * (fillElapsed / fillDuration))
            setLoadingProgress(Math.min(fillProgress, 100))
            requestAnimationFrame(animate)
          }
          // Phase 3: Complete
          else {
            setLoadingProgress(100)
            setTimeout(() => setShowLoading(false), 1400)
          }
        }
        
        requestAnimationFrame(animate)
      }
      
      animateCompletion()
    }
  }, [isLoading, error, showLoading, isAnimatingComplete, loadingProgress])

  // Emotion detection (enabled after synthesizer starts)
  const { emotions, isProcessing: isProcessingEmotion, error: emotionError, hasApiKey } = useEmotionDetection(videoRef, isStarted)

  // Start audio context on user interaction
  const handleStart = async () => {
    await start()
  }

  // Process gestures and control synthesizer
  useEffect(() => {
    if (!handData || !isStarted || !calibrationComplete) return

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
  }, [handData, isStarted, calibrationComplete, wasPlaying, setFilterFrequency, setReverb, setVolume, triggerAttack, triggerRelease])

  // Green glow effect when gesture is successfully detected during calibration
  useEffect(() => {
    if (showSuccessAnimation && videoContainerRef.current) {
      videoContainerRef.current.classList.add('gesture-success')
      
      const timer = setTimeout(() => {
        if (videoContainerRef.current) {
          videoContainerRef.current.classList.remove('gesture-success')
        }
      }, 800)
      
      return () => clearTimeout(timer)
    }
  }, [showSuccessAnimation])

  // Handle calibration completion with webcam animation
  useEffect(() => {
    if (calibrationComplete && !isAnimatingWebcam) {
      setIsAnimatingWebcam(true)
      
      // Add slide animation class when video container appears
      setTimeout(() => {
        if (videoContainerRef.current) {
          videoContainerRef.current.classList.add('slide-to-position')
        }
      }, 100)
    }
  }, [calibrationComplete, isAnimatingWebcam])

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

        {showLoading && (
          <div className="loading">
            <p>{loadingProgress >= 80 ? 'Almost there...' : 'Initializing application...'}</p>
            <div className="progress-bar-container">
              <div 
                className={`progress-bar-fill ${loadingProgress >= 100 ? 'complete' : ''}`}
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="progress-text">{loadingProgress.toFixed(0)}%</p>
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

        {/* Hidden video/canvas during loading - needed for MediaPipe to initialize */}
        <div 
          ref={videoContainerRef}
          className="video-container"
          style={{ 
            position: showLoading ? 'absolute' : 'relative',
            visibility: showLoading ? 'hidden' : 'visible',
            width: '100%',
            maxWidth: '800px'
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              transform: 'scaleX(-1)',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Calibration Overlay - overlays on top of video */}
        {!showLoading && !calibrationComplete && !error && (
          <CalibrationOverlay
            currentStep={currentStep}
            currentStepIndex={currentStepIndex}
            totalSteps={totalSteps}
            progressPercentage={progressPercentage}
            gestureHoldProgress={gestureHoldProgress}
            isHoldingGesture={isHoldingGesture}
            showSuccessAnimation={showSuccessAnimation}
            allSteps={allSteps}
            canSkip={canSkip}
            onSkip={skipCurrentStep}
          />
        )}

        {!isStarted && !showLoading && calibrationComplete && (
          <button onClick={handleStart} className="start-button">
            🎹 Start Synthesizer
          </button>
        )}

        {isStarted && calibrationComplete && (
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

        {gestureData && calibrationComplete && (
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
          {calibrationComplete ? (
            <ul>
              <li>✋ <strong>Hand Height</strong>: Controls pitch (higher = higher note)</li>
              <li>↔️ <strong>Hand Position</strong>: Controls filter frequency (left to right)</li>
              <li>🤏 <strong>Pinch</strong>: Trigger notes (thumb + index finger)</li>
              <li>👐 <strong>Hand Openness</strong>: Controls reverb amount</li>
            </ul>
          ) : (
            <ul>
              <li>📹 <strong>Complete calibration</strong> to unlock the synthesizer</li>
              <li>🖐️ <strong>Follow the instructions</strong> above to perform each gesture</li>
              <li>⏱️ <strong>Hold each gesture</strong> until the progress bar fills</li>
              <li>✨ <strong>Watch for the green glow</strong> when you succeed!</li>
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default App

