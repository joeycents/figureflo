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
    isPlaying
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
    skipCurrentStep,
    skipAllCalibration
  } = useCalibration(handData, !isLoading && !error)
  
  const [gestureData, setGestureData] = useState(null)
  const [wasPlaying, setWasPlaying] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showLoading, setShowLoading] = useState(true)
  const [isAnimatingComplete, setIsAnimatingComplete] = useState(false)

  // Progress bar effect - increase to 80% over 8 seconds
  useEffect(() => {
    if (isLoading && !error) {
      console.log('🚀 Starting loading animation')
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
      
      return () => {
        console.log('🧹 Cleaning up loading interval')
        clearInterval(interval)
      }
    }
  }, [isLoading, error])

  // Handle completion animation when loading finishes
  useEffect(() => {
    if (!isLoading && !error && showLoading && !isAnimatingComplete) {
      console.log('✅ MediaPipe loaded! Starting completion animation from progress:', loadingProgress)
      setIsAnimatingComplete(true)
      
      // First, ensure we reach at least 80% if we're below it
      const minimumProgress = Math.max(loadingProgress, 80)
      let currentProgress = loadingProgress
      
      // Quick catch-up to 80% if needed (200ms)
      if (currentProgress < 80) {
        console.log('⚡ Fast-forwarding to 80%')
        const catchUpInterval = setInterval(() => {
          currentProgress += (80 - loadingProgress) / 10
          if (currentProgress >= 80) {
            currentProgress = 80
            clearInterval(catchUpInterval)
            console.log('📍 Reached 80%, now filling to 100%')
          }
          setLoadingProgress(currentProgress)
        }, 20)
        
        // After catch-up, animate to 100%
        setTimeout(() => {
          animateToHundred(80)
        }, 200)
      } else {
        // Already at/past 80%, go straight to 100%
        animateToHundred(currentProgress)
      }
      
      function animateToHundred(startProgress) {
        console.log('🎯 Animating from', startProgress, 'to 100%')
        const targetProgress = 100
        const fillDuration = 400 // 400ms to fill to 100%
        const startTime = Date.now()
        
        const fillInterval = setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = startProgress + ((targetProgress - startProgress) * (elapsed / fillDuration))
          
          if (progress >= 100) {
            setLoadingProgress(100)
            clearInterval(fillInterval)
            console.log('💯 Reached 100%! Playing pop animation')
          } else {
            setLoadingProgress(progress)
          }
        }, 16)
        
        // After fill animation (400ms) + pop animation (600ms) + buffer (400ms) = 1400ms
        setTimeout(() => {
          console.log('🎉 Animation complete, hiding loading screen')
          setShowLoading(false)
        }, 1400)
      }
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


  return (
    <div className="App">
      {showLoading && (
        <div className="loading-fullscreen">
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
        </div>
      )}

      <header>
        <h1> FigureFlo</h1>
        <p>Gesture-Controlled Synthesizer</p>
      </header>

      <main>
        {error && (
          <div className="error">
            <p>❌ Error: {error}</p>
            <p>Please allow camera access to use FigureFlo</p>
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

        {/* Calibration Overlay or Gesture Data Panel - same position */}
        {!showLoading && !error && (
          <div className="right-panel">
            {!calibrationComplete ? (
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
                onExit={skipAllCalibration}
              />
            ) : (
              <>
                <div className="panel-header">
                  <h3>Gesture Data</h3>
                  <div className="help-icon">?</div>
                </div>
                
                <div className="panel-content">
                  <div className="gesture-data-view">
                    <table className="data-table">
                      <tbody>
                        <tr>
                          <td className="label">Status</td>
                          <td className={`value ${isPlaying ? 'active' : ''}`}>
                            {isPlaying ? 'Playing' : 'Silent'}
                          </td>
                        </tr>
                        <tr>
                          <td className="label">Note</td>
                          <td className="value">{gestureData?.note || '-'}</td>
                        </tr>
                        <tr>
                          <td className="label">Frequency</td>
                          <td className="value">{gestureData?.frequency ? `${gestureData.frequency.toFixed(1)} Hz` : '-'}</td>
                        </tr>
                        <tr>
                          <td className="label">Filter</td>
                          <td className="value">{gestureData?.filterFreq ? `${gestureData.filterFreq.toFixed(0)} Hz` : '-'}</td>
                        </tr>
                        <tr>
                          <td className="label">Pinch</td>
                          <td className="value">{gestureData?.pinch ? `${(gestureData.pinch * 100).toFixed(0)}%` : '-'}</td>
                        </tr>
                        <tr>
                          <td className="label">Reverb</td>
                          <td className="value">{gestureData?.reverb ? `${(gestureData.reverb * 100).toFixed(0)}%` : '-'}</td>
                        </tr>
                        <tr>
                          <td className="label">Volume</td>
                          <td className="value">{gestureData?.volume ? `${gestureData.volume.toFixed(1)} dB` : '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="help-view">
                    <div className="help-content">
                      <ul>
                        <li><strong>Hand Height</strong>: Controls pitch (higher = higher note)</li>
                        <li><strong>Hand Position</strong>: Controls filter frequency (left to right)</li>
                        <li><strong>Pinch</strong>: Trigger notes (thumb + index finger)</li>
                        <li><strong>Hand Openness</strong>: Controls reverb amount</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {!isStarted && (
                  <button onClick={handleStart} className="start-button">
                    Start Synthesizer
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App

