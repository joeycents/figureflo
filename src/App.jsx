import React, { useRef, useEffect, useState } from 'react'
import './App.css'
import { useHandTracking } from './hooks/useHandTracking'
import { useSynthesizer } from './hooks/useSynthesizer'
import { useEmotionDetection } from './hooks/useEmotionDetection'
import { useCalibration } from './hooks/useCalibration'
import { useFluidSimulation } from './hooks/useFluidSimulation'
import { processGestures } from './utils/gestureMapping'
import { HSVtoRGB, noteToHue } from './utils/fluidHelpers'
import { getEmotionColorPalette } from './utils/emotionFluidMapping'
import CalibrationOverlay from './components/CalibrationOverlay'

function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const videoContainerRef = useRef(null)
  const fluidCanvasRef = useRef(null)
  
  const { handData, isLoading, error } = useHandTracking(videoRef, canvasRef)
  
  const {
    start,
    stop,
    resume,
    updateParams,
    stopHand,
    cycleInstrument,
    startRecording,
    stopRecording,
    isStarted,
    isPlaying,
    leftPlaying,
    rightPlaying,
    isStopped,
    leftInstrument,
    rightInstrument,
    instruments
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
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showLoading, setShowLoading] = useState(true)
  const [isAnimatingComplete, setIsAnimatingComplete] = useState(false)
  const [isAnimatingWebcam, setIsAnimatingWebcam] = useState(false)
  
  // Gesture timing states
  const [bothHandsOpenStartTime, setBothHandsOpenStartTime] = useState(null)
  const [bothHandsFistStartTime, setBothHandsFistStartTime] = useState(null)
  const [bothHandsVictoryStartTime, setBothHandsVictoryStartTime] = useState(null)
  const [leftThumbsUpTime, setLeftThumbsUpTime] = useState(null)
  const [leftThumbsDownTime, setLeftThumbsDownTime] = useState(null)
  const [rightThumbsUpTime, setRightThumbsUpTime] = useState(null)
  const [rightThumbsDownTime, setRightThumbsDownTime] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [canPlay, setCanPlay] = useState(false) // Controls whether music can play
  
  // Track which hands are playing
  const [leftWasPlaying, setLeftWasPlaying] = useState(false)
  const [rightWasPlaying, setRightWasPlaying] = useState(false)

  // Track previous hand positions for velocity calculation (fluid simulation)
  const prevHandPositionsRef = useRef({})

  // Initialize fluid simulation - pass config with isReady flag
  const { createSplat, updateConfig: updateFluidConfig, setEmotion: setFluidEmotion } = useFluidSimulation(
    fluidCanvasRef,
    { isReady: calibrationComplete && !showLoading }
  )
  
  // Debug effect
  useEffect(() => {
    console.log('🎬 App State:', {
      isLoading,
      calibrationComplete,
      showLoading,
      hasVideoRef: !!videoRef.current,
      hasCanvasRef: !!canvasRef.current,
      hasFluidCanvasRef: !!fluidCanvasRef.current
    })
  }, [isLoading, calibrationComplete, showLoading])
  
  // Ensure fluid canvas has proper dimensions
  useEffect(() => {
    if (fluidCanvasRef.current && calibrationComplete && !showLoading) {
      const canvas = fluidCanvasRef.current
      const rect = canvas.getBoundingClientRect()
      console.log('🎨 Setting fluid canvas dimensions:', rect.width, rect.height)
      canvas.width = rect.width
      canvas.height = rect.height
    }
  }, [calibrationComplete, showLoading])

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

  // Update fluid simulation based on emotions
  useEffect(() => {
    if (emotions && emotions.topEmotion && setFluidEmotion) {
      setFluidEmotion(emotions.topEmotion.name, emotions.topEmotion.score)
    }
  }, [emotions, setFluidEmotion])

  // Start audio context on user interaction
  const handleStart = async () => {
    await start()
  }

  // Process gestures and control synthesizer
  useEffect(() => {
    if (!handData || !isStarted || !calibrationComplete) return

    const params = processGestures(handData)
    
    if (!params || params.handCount === 0) {
      setGestureData(null)
      // Reset all timing states
      setBothHandsOpenStartTime(null)
      setBothHandsFistStartTime(null)
      setBothHandsVictoryStartTime(null)
      return
    }

    setGestureData(params)
    
    // Debug logging for victory sign
    if (params.hands.length === 2) {
      const hand1Victory = params.hands[0].isVictorySign
      const hand2Victory = params.hands[1].isVictorySign
      if (hand1Victory || hand2Victory) {
        console.log(`Victory debug - Hand 1: ${hand1Victory}, Hand 2: ${hand2Victory}, Both: ${params.bothHandsVictory}`)
      }
    }
    
    // Check for "both hands victory sign" to enable playing (held for 2 seconds)
    if (params.bothHandsVictory) {
      const now = Date.now()
      if (!bothHandsVictoryStartTime) {
        setBothHandsVictoryStartTime(now)
        console.log('✌️ Both hands victory sign detected, hold for 2 seconds to enable playing')
      } else if (now - bothHandsVictoryStartTime >= 2000) {
        if (!canPlay) {
          console.log('✅ Music playing ENABLED!')
          setCanPlay(true)
          resume()
        }
        setBothHandsVictoryStartTime(null)
      }
    } else {
      setBothHandsVictoryStartTime(null)
    }
    
    // Check for "both hands open" stop gesture (held for 5 seconds)
    if (params.bothHandsOpen) {
      const now = Date.now()
      if (!bothHandsOpenStartTime) {
        setBothHandsOpenStartTime(now)
        console.log('🖐️ Both hands open detected, hold for 5 seconds to stop')
      } else if (now - bothHandsOpenStartTime >= 5000 && canPlay) {
        console.log('🛑 Stopping music (both hands held open)')
        stop()
        setCanPlay(false)
        setBothHandsOpenStartTime(null)
      }
    } else {
      setBothHandsOpenStartTime(null)
    }

    // Check for "both hands fist" recording gesture (held for 2 seconds)
    if (params.bothHandsFist) {
      const now = Date.now()
      if (!bothHandsFistStartTime) {
        setBothHandsFistStartTime(now)
        console.log('✊ Both fists detected, hold for 2 seconds to start recording')
      } else if (now - bothHandsFistStartTime >= 2000 && !isRecording) {
        console.log('🎙️ Starting recording (dummy)')
        startRecording()
        setIsRecording(true)
        setBothHandsFistStartTime(null)
      }
    } else {
      if (bothHandsFistStartTime && isRecording) {
        console.log('⏹️ Stopping recording (dummy)')
        stopRecording()
        setIsRecording(false)
      }
      setBothHandsFistStartTime(null)
    }

    // Process each hand
    params.hands.forEach((hand) => {
      const handType = hand.handedness // This is the PHYSICAL hand (Left = left, Right = right)
      const isLeft = handType === 'Left'
      const wasPlaying = isLeft ? leftWasPlaying : rightWasPlaying
      const setWasPlaying = isLeft ? setLeftWasPlaying : setRightWasPlaying

      // Check for thumbs up (cycle instrument up)
      const currentThumbsUpTime = isLeft ? leftThumbsUpTime : rightThumbsUpTime
      if (hand.isThumbsUp && !currentThumbsUpTime) {
        // Only set time and cycle instrument if we weren't already holding thumbs up
        if (isLeft) {
          setLeftThumbsUpTime(Date.now())
        } else {
          setRightThumbsUpTime(Date.now())
        }
        console.log(`👍 ${handType} hand thumbs up - cycling instrument`)
        cycleInstrument(handType, 'up')
      } else if (!hand.isThumbsUp && currentThumbsUpTime) {
        // Only reset if we were holding thumbs up and now stopped
        if (isLeft) {
          setLeftThumbsUpTime(null)
        } else {
          setRightThumbsUpTime(null)
        }
      }

      // Check for thumbs down (cycle instrument down)
      const currentThumbsDownTime = isLeft ? leftThumbsDownTime : rightThumbsDownTime
      if (hand.isThumbsDown && !currentThumbsDownTime) {
        // Only set time and cycle instrument if we weren't already holding thumbs down
        if (isLeft) {
          setLeftThumbsDownTime(Date.now())
        } else {
          setRightThumbsDownTime(Date.now())
        }
        console.log(`👎 ${handType} hand thumbs down - cycling instrument`)
        cycleInstrument(handType, 'down')
      } else if (!hand.isThumbsDown && currentThumbsDownTime) {
        // Only reset if we were holding thumbs down and now stopped
        if (isLeft) {
          setLeftThumbsDownTime(null)
        } else {
          setRightThumbsDownTime(null)
        }
      }

      // Skip control gestures if music is not enabled or stopped
      if (!canPlay || isStopped) return

      // Calculate hand velocity for fluid simulation
      const handId = `${handType}_${hand.handedness}`
      const prevPos = prevHandPositionsRef.current[handId] || { x: hand.normalizedX, y: hand.normalizedY }
      const dx = (hand.normalizedX - prevPos.x) * 100 // Scale up velocity
      const dy = (hand.normalizedY - prevPos.y) * 100
      prevHandPositionsRef.current[handId] = { x: hand.normalizedX, y: hand.normalizedY }

      // Create fluid splat when hand is active (pinched)
      if (hand.isPinched && createSplat) {
        // Debug hand position
        if (hand.normalizedX === undefined || hand.normalizedY === undefined) {
          console.error('❌ Hand position undefined:', hand)
          return
        }
        
        // Map note to color
        const hue = noteToHue(hand.note)
        const emotionPalette = emotions?.topEmotion 
          ? getEmotionColorPalette(emotions.topEmotion.name)
          : null
        
        // Blend hue with emotion palette if available
        let finalHue = hue
        if (emotionPalette) {
          const [minHue, maxHue] = emotionPalette.hueRange
          // Constrain hue to emotion range
          finalHue = minHue + (hue * (maxHue - minHue))
        }
        
        // Generate color from hue
        const saturation = emotionPalette?.saturation || 1.0
        const brightness = emotionPalette?.brightness || 1.0
        const baseColor = HSVtoRGB(finalHue, saturation, brightness)
        
        // Adjust intensity by velocity
        const intensityMultiplier = hand.velocity * 0.3 // 0.3 factor to prevent too bright
        const color = {
          r: baseColor.r * intensityMultiplier,
          g: baseColor.g * intensityMultiplier,
          b: baseColor.b * intensityMultiplier
        }
        
        // Create splat at hand position
        // Flip X coordinate to un-mirror (webcam is mirrored, but fluid should match physical position)
        // Flip Y coordinate since canvas Y is inverted from hand tracking Y
        const fluidX = 1 - hand.normalizedX  // Un-mirror the X coordinate
        const fluidY = 1 - hand.normalizedY  // Invert Y as before
        createSplat(fluidX, fluidY, -dx, -dy, color) // Also flip dx since X is flipped
      }

      // Continuously update musical parameters based on hand position
      if (hand.isPinched) {
        updateParams(
          handType,
          hand.note,
          hand.velocity,
          hand.filterFreq,
          hand.reverb
        )
        setWasPlaying(true)
      } else if (wasPlaying) {
        // Stop playing when pinch is released
        stopHand(handType)
        setWasPlaying(false)
      }
    })
  }, [
    handData, 
    isStarted, 
    calibrationComplete, 
    leftWasPlaying, 
    rightWasPlaying, 
    isStopped,
    canPlay,
    bothHandsOpenStartTime,
    bothHandsFistStartTime,
    bothHandsVictoryStartTime,
    isRecording,
    leftThumbsUpTime,
    leftThumbsDownTime,
    rightThumbsUpTime,
    rightThumbsDownTime,
    createSplat,
    emotions
  ])

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
        <h1><span style={{ color: 'var(--coral-red)' }}>♪</span> FigureFlo</h1>
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

        {/* Dual View: Webcam + Fluid Simulation Side-by-Side */}
        {!showLoading && calibrationComplete && (
          <div className="dual-view-container">
            {/* Webcam Column */}
            <div className="webcam-column">
              <div 
                ref={videoContainerRef}
                className="video-container"
                style={{ position: 'relative', width: '100%', height: '100%' }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', display: 'block', transform: 'scaleX(-1)', objectFit: 'cover' }}
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
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  color: 'white',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  zIndex: 10
                }}>
                  📹 Webcam
                </div>
              </div>
            </div>

            {/* Fluid Simulation Column */}
            <div className="fluid-column">
              <div style={{ position: 'relative' }}>
                <canvas ref={fluidCanvasRef} className="fluid-canvas" />
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  color: 'white',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  🌊 Fluid Simulation
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden video/canvas during loading and calibration */}
        {(!calibrationComplete || showLoading) && (
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
        )}

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
            <div className={`indicator ${!canPlay ? 'waiting' : (isStopped ? 'stopped' : (isPlaying ? 'active' : ''))}`}>
              {!canPlay ? '✌️ Do Victory Sign to Start' : (isStopped ? '🛑 Stopped' : (isPlaying ? '🔊 Playing' : '🔇 Silent'))}
            </div>
            {isRecording && (
              <div className="indicator recording">
                🎙️ Recording (Dummy)
              </div>
            )}
            <div className="instrument-status">
              <div className={`hand-instrument ${leftPlaying ? 'playing' : ''}`}>
                <span className="hand-label">👈 Left Hand:</span>
                <span className="instrument-name">{leftInstrument.name}</span>
              </div>
              <div className={`hand-instrument ${rightPlaying ? 'playing' : ''}`}>
                <span className="hand-label">👉 Right Hand:</span>
                <span className="instrument-name">{rightInstrument.name}</span>
              </div>
            </div>
          </div>
        )}

        {gestureData && calibrationComplete && (
          <div className="gesture-info">
            <h3>Gesture Data ({gestureData.handCount} hand{gestureData.handCount !== 1 ? 's' : ''})</h3>
            {gestureData.hands.map((hand, index) => (
              <div key={index} className="hand-data">
                <h4>{hand.handedness === 'Left' ? '👈' : '👉'} {hand.handedness} Hand</h4>
                <div className="data-grid">
                  <div className="data-item">
                    <span className="label">Note:</span>
                    <span className="value">{hand.note || 'N/A'}</span>
                  </div>
                  <div className="data-item">
                    <span className="label">Bass:</span>
                    <span className="value">{hand.bassNote || 'N/A'}</span>
                  </div>
                  <div className="data-item">
                    <span className="label">Brightness:</span>
                    <span className="value">{(hand.brightness * 100).toFixed(0)}%</span>
                  </div>
                  <div className="data-item">
                    <span className="label">Filter:</span>
                    <span className="value">{hand.filterFreq?.toFixed(0)} Hz</span>
                  </div>
                  <div className="data-item">
                    <span className="label">Pinch:</span>
                    <span className="value">{(hand.pinch * 100).toFixed(0)}%</span>
                  </div>
                  <div className="data-item">
                    <span className="label">Reverb:</span>
                    <span className="value">{(hand.reverb * 100).toFixed(0)}%</span>
                  </div>
                  <div className="data-item">
                    <span className="label">Velocity:</span>
                    <span className="value">{hand.velocity.toFixed(2)}</span>
                  </div>
                  {hand.isThumbsUp && (
                    <div className="data-item gesture-detected">
                      <span className="value">👍 Thumbs Up</span>
                    </div>
                  )}
                  {hand.isThumbsDown && (
                    <div className="data-item gesture-detected">
                      <span className="value">👎 Thumbs Down</span>
                    </div>
                  )}
                  {hand.isVictorySign && (
                    <div className="data-item gesture-detected">
                      <span className="value">✌️ Victory Sign</span>
                    </div>
                  )}
                  {hand.isFist && (
                    <div className="data-item gesture-detected">
                      <span className="value">✊ Fist</span>
                    </div>
                  )}
                  {hand.isOpenPalm && (
                    <div className="data-item gesture-detected">
                      <span className="value">🖐️ Open Palm</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="instructions">
          <h3>How to Play</h3>
          {calibrationComplete ? (
            <ul>
              <li>✌️✌️ <strong>Both Hands Victory Sign</strong>: Hold for 2 seconds to START playing music</li>
              <li>🤏 <strong>Pinch (thumb + index)</strong>: Activate sound for that hand</li>
              <li>⬆️⬇️ <strong>Hand Height</strong>: Controls pitch (quantized to pentatonic scale - always sounds good!)</li>
              <li>⬅️➡️ <strong>Hand Position</strong>: Controls brightness/timbre (left = dark, right = bright)</li>
              <li>🎵 <strong>Automatic Bass</strong>: Each hand plays melody + bass harmony</li>
              <li>⏱️ <strong>Rhythmic Quantization</strong>: Notes sync to musical timing (8th notes at 120 BPM)</li>
              <li>👍 <strong>Thumbs Up</strong>: Cycle to next instrument (per hand)</li>
              <li>👎 <strong>Thumbs Down</strong>: Cycle to previous instrument (per hand)</li>
              <li>🖐️🖐️ <strong>Both Hands Open</strong>: Hold for 5 seconds to STOP playing</li>
              <li>✊✊ <strong>Both Fists</strong>: Hold for 2 seconds to record (dummy)</li>
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

