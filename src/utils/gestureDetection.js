/**
 * Advanced Hand Gesture Detection
 * Provides functions to identify specific hand gestures using MediaPipe landmarks
 */

import { calculateDistance } from './gestureMapping'

/**
 * Get finger tips and base landmarks
 */
const getLandmarkPoints = (landmarks) => {
  return {
    wrist: landmarks[0],
    thumbCMC: landmarks[1],
    thumbMCP: landmarks[2],
    thumbIP: landmarks[3],
    thumbTip: landmarks[4],
    indexMCP: landmarks[5],
    indexPIP: landmarks[6],
    indexDIP: landmarks[7],
    indexTip: landmarks[8],
    middleMCP: landmarks[9],
    middlePIP: landmarks[10],
    middleDIP: landmarks[11],
    middleTip: landmarks[12],
    ringMCP: landmarks[13],
    ringPIP: landmarks[14],
    ringDIP: landmarks[15],
    ringTip: landmarks[16],
    pinkyMCP: landmarks[17],
    pinkyPIP: landmarks[18],
    pinkyDIP: landmarks[19],
    pinkyTip: landmarks[20]
  }
}

/**
 * Check if a finger is extended by comparing tip position to MCP joint
 */
const isFingerExtended = (tipLandmark, mcpLandmark, pipLandmark) => {
  // Calculate the distance from tip to MCP
  const tipToMCP = calculateDistance(tipLandmark, mcpLandmark)
  // Calculate the distance from PIP to MCP (middle joint to base)
  const pipToMCP = calculateDistance(pipLandmark, mcpLandmark)
  
  // If tip is significantly further from MCP than PIP is, finger is extended
  return tipToMCP > pipToMCP * 1.2
}

/**
 * Check if thumb is extended (different check since thumb moves differently)
 */
const isThumbExtended = (landmarks) => {
  const points = getLandmarkPoints(landmarks)
  
  // Check if thumb tip is far from index finger base
  const thumbToIndex = calculateDistance(points.thumbTip, points.indexMCP)
  // Check thumb tip to wrist distance
  const thumbToWrist = calculateDistance(points.thumbTip, points.wrist)
  
  // Thumb is extended if it's far from the hand
  return thumbToIndex > 0.1 && thumbToWrist > 0.15
}

/**
 * Check if thumb is curled/folded
 */
const isThumbCurled = (landmarks) => {
  const points = getLandmarkPoints(landmarks)
  
  // Check if thumb tip is close to palm
  const thumbToIndexBase = calculateDistance(points.thumbTip, points.indexMCP)
  const thumbToMiddleBase = calculateDistance(points.thumbTip, points.middleMCP)
  
  // Thumb is curled if close to palm area
  return thumbToIndexBase < 0.08 || thumbToMiddleBase < 0.08
}

/**
 * Detect PALM OUT gesture (all five fingers extended)
 * @param {Array} landmarks - Hand landmarks from MediaPipe
 * @returns {Object} - { detected: boolean, confidence: number }
 */
export const detectPalmOut = (landmarks) => {
  if (!landmarks || landmarks.length < 21) {
    return { detected: false, confidence: 0 }
  }
  
  const points = getLandmarkPoints(landmarks)
  
  // Check if all fingers are extended
  const indexExtended = isFingerExtended(points.indexTip, points.indexMCP, points.indexPIP)
  const middleExtended = isFingerExtended(points.middleTip, points.middleMCP, points.middlePIP)
  const ringExtended = isFingerExtended(points.ringTip, points.ringMCP, points.ringPIP)
  const pinkyExtended = isFingerExtended(points.pinkyTip, points.pinkyMCP, points.pinkyPIP)
  const thumbExtended = isThumbExtended(landmarks)
  
  // Count extended fingers
  const extendedCount = [
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended,
    thumbExtended
  ].filter(Boolean).length
  
  // Calculate confidence based on extended fingers
  const confidence = extendedCount / 5
  const detected = extendedCount >= 4 // Allow for some detection error
  
  return { detected, confidence }
}

/**
 * Detect TWO PALMS OUT gesture (both hands with palms out)
 * @param {Array} landmarks - Array of hand landmarks from MediaPipe
 * @param {Array} handedness - Array of handedness info from MediaPipe
 * @returns {Object} - { detected: boolean, confidence: number }
 */
export const detectTwoPalmsOut = (landmarks, handedness) => {
  if (!landmarks || landmarks.length < 2) {
    return { detected: false, confidence: 0 }
  }
  
  // Check both hands
  const hand1 = detectPalmOut(landmarks[0])
  const hand2 = detectPalmOut(landmarks[1])
  
  const detected = hand1.detected && hand2.detected
  const confidence = detected ? (hand1.confidence + hand2.confidence) / 2 : 0
  
  return { detected, confidence }
}

/**
 * Detect FIST gesture (all fingers curled)
 * @param {Array} landmarks - Hand landmarks from MediaPipe
 * @returns {Object} - { detected: boolean, confidence: number }
 */
export const detectFist = (landmarks) => {
  if (!landmarks || landmarks.length < 21) {
    return { detected: false, confidence: 0 }
  }
  
  const points = getLandmarkPoints(landmarks)
  
  // Check if all fingers are curled (tips close to palm)
  const indexCurled = calculateDistance(points.indexTip, points.wrist) < 0.12
  const middleCurled = calculateDistance(points.middleTip, points.wrist) < 0.12
  const ringCurled = calculateDistance(points.ringTip, points.wrist) < 0.12
  const pinkyCurled = calculateDistance(points.pinkyTip, points.wrist) < 0.12
  const thumbCurled = isThumbCurled(landmarks)
  
  // Count curled fingers
  const curledCount = [
    indexCurled,
    middleCurled,
    ringCurled,
    pinkyCurled,
    thumbCurled
  ].filter(Boolean).length
  
  const confidence = curledCount / 5
  const detected = curledCount >= 4 // Allow for detection error
  
  return { detected, confidence }
}

/**
 * Detect TWO FISTS gesture (both hands making fists)
 * @param {Array} landmarks - Array of hand landmarks from MediaPipe
 * @param {Array} handedness - Array of handedness info from MediaPipe
 * @returns {Object} - { detected: boolean, confidence: number }
 */
export const detectTwoFists = (landmarks, handedness) => {
  if (!landmarks || landmarks.length < 2) {
    return { detected: false, confidence: 0 }
  }
  
  // Check both hands
  const hand1 = detectFist(landmarks[0])
  const hand2 = detectFist(landmarks[1])
  
  const detected = hand1.detected && hand2.detected
  const confidence = detected ? (hand1.confidence + hand2.confidence) / 2 : 0
  
  return { detected, confidence }
}

/**
 * Detect VICTORY/PEACE SIGN gesture (index and middle finger extended, others curled)
 * @param {Array} landmarks - Hand landmarks from MediaPipe
 * @returns {Object} - { detected: boolean, confidence: number }
 */
export const detectVictorySign = (landmarks) => {
  if (!landmarks || landmarks.length < 21) {
    return { detected: false, confidence: 0 }
  }
  
  const points = getLandmarkPoints(landmarks)
  
  // Check if index and middle fingers are extended
  const indexExtended = isFingerExtended(points.indexTip, points.indexMCP, points.indexPIP)
  const middleExtended = isFingerExtended(points.middleTip, points.middleMCP, points.middlePIP)
  
  // Check if ring and pinky are curled
  const ringCurled = calculateDistance(points.ringTip, points.wrist) < 0.12
  const pinkyCurled = calculateDistance(points.pinkyTip, points.wrist) < 0.12
  
  // Check if thumb is not extended (can be either)
  const thumbNotFullyExtended = calculateDistance(points.thumbTip, points.indexMCP) < 0.15
  
  // Calculate confidence
  let confidence = 0
  if (indexExtended) confidence += 0.3
  if (middleExtended) confidence += 0.3
  if (ringCurled) confidence += 0.2
  if (pinkyCurled) confidence += 0.2
  
  const detected = indexExtended && middleExtended && ringCurled && pinkyCurled
  
  return { detected, confidence }
}

/**
 * Detect THUMBS UP gesture (thumb extended up, other fingers curled)
 * @param {Array} landmarks - Hand landmarks from MediaPipe
 * @returns {Object} - { detected: boolean, confidence: number }
 */
export const detectThumbsUp = (landmarks) => {
  if (!landmarks || landmarks.length < 21) {
    return { detected: false, confidence: 0 }
  }
  
  const points = getLandmarkPoints(landmarks)
  
  // Check if thumb is extended upward (thumb tip Y < thumb base Y in screen coords)
  const thumbExtended = isThumbExtended(landmarks)
  const thumbPointingUp = points.thumbTip.y < points.thumbCMC.y - 0.05
  
  // Check if other fingers are curled
  const indexCurled = calculateDistance(points.indexTip, points.indexMCP) < 0.08
  const middleCurled = calculateDistance(points.middleTip, points.middleMCP) < 0.08
  const ringCurled = calculateDistance(points.ringTip, points.ringMCP) < 0.08
  const pinkyCurled = calculateDistance(points.pinkyTip, points.pinkyMCP) < 0.08
  
  const curledCount = [indexCurled, middleCurled, ringCurled, pinkyCurled].filter(Boolean).length
  
  // Calculate confidence
  let confidence = 0
  if (thumbExtended) confidence += 0.3
  if (thumbPointingUp) confidence += 0.3
  confidence += (curledCount / 4) * 0.4
  
  const detected = thumbExtended && thumbPointingUp && curledCount >= 3
  
  return { detected, confidence }
}

/**
 * Detect if a specific hand (left or right) is making a gesture
 * @param {Array} landmarks - Array of all hand landmarks
 * @param {Array} handedness - Array of handedness info from MediaPipe
 * @param {string} targetHand - 'Left' or 'Right'
 * @param {Function} gestureDetector - The gesture detection function to use
 * @returns {Object} - { detected: boolean, confidence: number }
 */
export const detectHandSpecificGesture = (landmarks, handedness, targetHand, gestureDetector) => {
  if (!landmarks || !handedness || landmarks.length === 0) {
    return { detected: false, confidence: 0 }
  }
  
  // Find the target hand
  for (let i = 0; i < landmarks.length; i++) {
    if (handedness[i] && handedness[i].categoryName === targetHand) {
      return gestureDetector(landmarks[i])
    }
  }
  
  return { detected: false, confidence: 0 }
}

/**
 * Main gesture detection function for calibration
 * Detects all calibration gestures and returns results
 * Uses both MediaPipe's built-in gestures and custom detection
 */
export const detectCalibrationGestures = (handData) => {
  if (!handData || !handData.landmarks) {
    return {
      twoPalmsOut: { detected: false, confidence: 0 },
      twoFists: { detected: false, confidence: 0 },
      victorySignRight: { detected: false, confidence: 0 },
      thumbsUpLeft: { detected: false, confidence: 0 }
    }
  }
  
  const { landmarks, handedness, gestures } = handData
  
  // Use MediaPipe's built-in gesture recognition when available
  let twoPalmsOut = detectTwoPalmsOut(landmarks, handedness)
  let twoFists = { detected: false, confidence: 0 }
  let victorySignRight = { detected: false, confidence: 0 }
  let thumbsUpLeft = { detected: false, confidence: 0 }

  // Check MediaPipe gestures if available
  if (gestures && gestures.length > 0) {
    // Count Open_Palm gestures
    let openPalmCount = 0
    let closedFistCount = 0
    let victoryDetected = false
    let thumbsUpDetected = false

    gestures.forEach((gestureList, index) => {
      if (gestureList && gestureList.length > 0) {
        const gesture = gestureList[0]
        const hand = handedness && handedness[index] ? handedness[index].categoryName : null
        
        if (gesture.categoryName === 'Open_Palm') {
          openPalmCount++
        } else if (gesture.categoryName === 'Closed_Fist') {
          closedFistCount++
        } else if (gesture.categoryName === 'Victory' && hand === 'Right') {
          victoryDetected = true
          victorySignRight = { detected: true, confidence: gesture.score }
        } else if (gesture.categoryName === 'Thumb_Up' && hand === 'Left') {
          thumbsUpDetected = true
          thumbsUpLeft = { detected: true, confidence: gesture.score }
        }
      }
    })

    // Update two palms if both hands show Open_Palm
    if (openPalmCount >= 2) {
      twoPalmsOut = { detected: true, confidence: 0.9 }
    }

    // Update two fists if both hands show Closed_Fist
    if (closedFistCount >= 2) {
      twoFists = { detected: true, confidence: 0.9 }
    }
  }

  // Fallback to custom detection if MediaPipe didn't detect
  if (!twoFists.detected) {
    twoFists = detectTwoFists(landmarks, handedness)
  }
  
  if (!victorySignRight.detected) {
    victorySignRight = detectHandSpecificGesture(landmarks, handedness, 'Right', detectVictorySign)
  }
  
  if (!thumbsUpLeft.detected) {
    thumbsUpLeft = detectHandSpecificGesture(landmarks, handedness, 'Left', detectThumbsUp)
  }
  
  return {
    twoPalmsOut,
    twoFists,
    victorySignRight,
    thumbsUpLeft
  }
}
