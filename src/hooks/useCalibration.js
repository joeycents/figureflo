/**
 * useCalibration Hook
 * Manages the calibration process for hand gesture recognition
 */

import { useState, useEffect, useCallback } from 'react'
import { detectCalibrationGestures } from '../utils/gestureDetection'

const CALIBRATION_STEPS = [
  {
    id: 'twoPalmsOut',
    title: 'Two Palms Out',
    description: 'Show both palms with all fingers extended',
    emoji: '🖐️🖐️',
    holdDuration: 1500 // ms to hold gesture
  },
  {
    id: 'twoFists',
    title: 'Two Fists',
    description: 'Make fists with both hands',
    emoji: '✊✊',
    holdDuration: 1500
  },
  {
    id: 'victorySignRight',
    title: 'Victory Sign (Right Hand)',
    description: 'Make a peace sign with your right hand',
    emoji: '✌️',
    holdDuration: 1500
  },
  {
    id: 'thumbsUpLeft',
    title: 'Thumbs Up (Left Hand)',
    description: 'Give a thumbs up with your left hand',
    emoji: '👍',
    holdDuration: 1500
  }
]

export const useCalibration = (handData, enabled = true) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [gestureHoldProgress, setGestureHoldProgress] = useState(0)
  const [isHoldingGesture, setIsHoldingGesture] = useState(false)
  const [gestureStartTime, setGestureStartTime] = useState(null)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [detectedGestures, setDetectedGestures] = useState({})
  const [stepStartTime, setStepStartTime] = useState(null)
  const [canSkip, setCanSkip] = useState(false)

  const currentStep = CALIBRATION_STEPS[currentStepIndex]
  const totalSteps = CALIBRATION_STEPS.length
  const progressPercentage = (currentStepIndex / totalSteps) * 100

  // Reset calibration
  const resetCalibration = useCallback(() => {
    setCurrentStepIndex(0)
    setIsComplete(false)
    setGestureHoldProgress(0)
    setIsHoldingGesture(false)
    setGestureStartTime(null)
    setShowSuccessAnimation(false)
    setDetectedGestures({})
    setStepStartTime(null)
    setCanSkip(false)
  }, [])

  // Skip current step
  const skipCurrentStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1)
      setGestureHoldProgress(0)
      setIsHoldingGesture(false)
      setGestureStartTime(null)
      setShowSuccessAnimation(false)
      setStepStartTime(Date.now())
      setCanSkip(false)
    } else {
      // Last step, complete calibration
      setIsComplete(true)
    }
  }, [currentStepIndex, totalSteps])

  // Initialize step start time when step changes
  useEffect(() => {
    if (enabled && !isComplete) {
      setStepStartTime(Date.now())
      setCanSkip(false)
      
      // Enable skip after 10 seconds
      const timer = setTimeout(() => {
        setCanSkip(true)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [currentStepIndex, enabled, isComplete])

  // Process hand data and check for gestures
  useEffect(() => {
    if (!enabled || !handData || isComplete) return

    // Detect all gestures
    const gestures = detectCalibrationGestures(handData)
    setDetectedGestures(gestures)

    // Get the current step's gesture
    const currentGesture = gestures[currentStep.id]

    if (currentGesture && currentGesture.detected && currentGesture.confidence > 0.7) {
      // Gesture is being held
      if (!isHoldingGesture) {
        setIsHoldingGesture(true)
        setGestureStartTime(Date.now())
      }

      // Calculate hold progress
      if (gestureStartTime) {
        const elapsed = Date.now() - gestureStartTime
        const progress = Math.min((elapsed / currentStep.holdDuration) * 100, 100)
        setGestureHoldProgress(progress)

        // Check if held long enough
        if (progress >= 100 && !showSuccessAnimation) {
          setShowSuccessAnimation(true)

          // Move to next step after success animation
          setTimeout(() => {
            if (currentStepIndex < totalSteps - 1) {
              setCurrentStepIndex(prev => prev + 1)
              setGestureHoldProgress(0)
              setIsHoldingGesture(false)
              setGestureStartTime(null)
              setShowSuccessAnimation(false)
              setStepStartTime(Date.now())
              setCanSkip(false)
            } else {
              // Calibration complete!
              setIsComplete(true)
              setShowSuccessAnimation(false)
            }
          }, 800) // Duration of success animation
        }
      }
    } else {
      // Gesture lost or not detected
      if (isHoldingGesture && !showSuccessAnimation) {
        setIsHoldingGesture(false)
        setGestureStartTime(null)
        setGestureHoldProgress(0)
      }
    }
  }, [
    handData,
    enabled,
    isComplete,
    currentStep,
    currentStepIndex,
    totalSteps,
    isHoldingGesture,
    gestureStartTime,
    showSuccessAnimation
  ])

  return {
    currentStep,
    currentStepIndex,
    totalSteps,
    progressPercentage,
    gestureHoldProgress,
    isHoldingGesture,
    isComplete,
    showSuccessAnimation,
    detectedGestures,
    resetCalibration,
    skipCurrentStep,
    canSkip,
    allSteps: CALIBRATION_STEPS
  }
}
