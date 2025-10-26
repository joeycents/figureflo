/**
 * CalibrationOverlay Component
 * Displays the calibration UI with embedded webcam, progress, and instructions
 */

import React from 'react'
import './CalibrationOverlay.css'

const CalibrationOverlay = ({
  currentStep,
  currentStepIndex,
  totalSteps,
  progressPercentage,
  gestureHoldProgress,
  isHoldingGesture,
  showSuccessAnimation,
  allSteps,
  canSkip,
  onSkip
}) => {
  return (
    <div className="calibration-overlay">
      <div className="calibration-container">
        {/* Header */}
        <div className="calibration-header">
          <h2>🎯 Gesture Calibration</h2>
          <p className="calibration-subtitle">
            Complete these gestures to unlock FigureFlo
          </p>
        </div>

        {/* Progress Bar */}
        <div className="calibration-progress-bar">
          <div
            className="calibration-progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step Timeline */}
        <div className="calibration-timeline">
          {allSteps.map((step, index) => (
            <div
              key={step.id}
              className={`timeline-item ${
                index < currentStepIndex ? 'completed' : ''
              } ${index === currentStepIndex ? 'active' : ''} ${
                index > currentStepIndex ? 'pending' : ''
              }`}
            >
              <div className="timeline-circle">
                {index < currentStepIndex ? '✓' : step.emoji}
              </div>
              <div className="timeline-label">{step.title}</div>
            </div>
          ))}
        </div>

        {/* Hold Progress Indicator */}
        <div className="hold-progress-container">
          <div className="hold-progress-text">
            {isHoldingGesture ? (
              <>
                <span className="pulse-dot">●</span> Hold gesture...
              </>
            ) : (
              'Show the gesture to begin'
            )}
          </div>
          <div className="hold-progress-bar">
            <div
              className={`hold-progress-fill ${
                showSuccessAnimation ? 'success' : ''
              } ${isHoldingGesture ? 'active' : ''}`}
              style={{ width: `${gestureHoldProgress}%` }}
            />
          </div>
          <div className="hold-progress-percentage">
            {Math.round(gestureHoldProgress)}%
          </div>
        </div>

        {/* Help Text */}
        <div className="calibration-help">
          <p>💡 Tip: Hold each gesture steady until the progress bar fills</p>
        </div>

        {/* Skip Button (appears after 10 seconds) */}
        {canSkip && (
          <div className="skip-button-container">
            <button className="skip-button" onClick={onSkip}>
              Skip This Step →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CalibrationOverlay
