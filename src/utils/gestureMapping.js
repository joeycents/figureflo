/**
 * Calculate the average position of all landmarks in a hand
 */
export const calculateHandCenter = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return null
  
  const sum = landmarks.reduce((acc, landmark) => ({
    x: acc.x + landmark.x,
    y: acc.y + landmark.y,
    z: acc.z + landmark.z
  }), { x: 0, y: 0, z: 0 })
  
  return {
    x: sum.x / landmarks.length,
    y: sum.y / landmarks.length,
    z: sum.z / landmarks.length
  }
}

/**
 * Detect if hand is in "open palm" position (all fingers extended)
 */
export const detectOpenPalm = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return false
  
  // Check if all fingertips are extended (higher than their respective knuckles)
  const fingerPairs = [
    [8, 6],   // Index: tip vs middle joint
    [12, 10], // Middle: tip vs middle joint
    [16, 14], // Ring: tip vs middle joint
    [20, 18]  // Pinky: tip vs middle joint
  ]
  
  const allExtended = fingerPairs.every(([tipIdx, jointIdx]) => {
    return landmarks[tipIdx].y < landmarks[jointIdx].y - 0.02 // Tip is higher than joint
  })
  
  // Also check thumb is extended
  const thumbExtended = landmarks[4].x > landmarks[2].x + 0.02 || 
                       landmarks[4].x < landmarks[2].x - 0.02
  
  return allExtended && thumbExtended
}

/**
 * Detect victory/peace sign (index and middle fingers extended, others curled)
 */
export const detectVictorySign = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return false
  
  const indexTip = landmarks[8]
  const indexMid = landmarks[6]
  const middleTip = landmarks[12]
  const middleMid = landmarks[10]
  const ringTip = landmarks[16]
  const ringMid = landmarks[14]
  const pinkyTip = landmarks[20]
  const pinkyMid = landmarks[18]
  const thumbTip = landmarks[4]
  const palm = landmarks[0]
  
  // Index and middle fingers should be extended (tips higher than middle joints)
  const indexExtended = indexTip.y < indexMid.y - 0.02 // More forgiving threshold
  const middleExtended = middleTip.y < middleMid.y - 0.02
  
  // Ring and pinky should be curled (tips not much higher than their middle joints)
  const ringCurled = ringTip.y >= ringMid.y - 0.03 // Ring finger is down
  const pinkyCurled = pinkyTip.y >= pinkyMid.y - 0.03 // Pinky is down
  
  // Thumb can be anywhere (don't check it - peace sign works with thumb in any position)
  
  return indexExtended && middleExtended && ringCurled && pinkyCurled
}

/**
 * Detect thumbs up gesture
 */
export const detectThumbsUp = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return false
  
  const thumbTip = landmarks[4]
  const thumbBase = landmarks[2]
  const indexTip = landmarks[8]
  const middleTip = landmarks[12]
  const ringTip = landmarks[16]
  const pinkyTip = landmarks[20]
  
  // Thumb should be pointing up (tip higher than base)
  const thumbUp = thumbTip.y < thumbBase.y - 0.08
  
  // Other fingers should be curled (tips close to palm)
  const palm = landmarks[0]
  const fingersCurled = [indexTip, middleTip, ringTip, pinkyTip].every(tip => {
    const distanceY = Math.abs(tip.y - palm.y)
    return distanceY < 0.15
  })
  
  return thumbUp && fingersCurled
}

/**
 * Detect thumbs down gesture
 */
export const detectThumbsDown = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return false
  
  const thumbTip = landmarks[4]
  const thumbBase = landmarks[2]
  const indexTip = landmarks[8]
  const middleTip = landmarks[12]
  const ringTip = landmarks[16]
  const pinkyTip = landmarks[20]
  
  // Thumb should be pointing down (tip lower than base)
  const thumbDown = thumbTip.y > thumbBase.y + 0.08
  
  // Other fingers should be curled
  const palm = landmarks[0]
  const fingersCurled = [indexTip, middleTip, ringTip, pinkyTip].every(tip => {
    const distanceY = Math.abs(tip.y - palm.y)
    return distanceY < 0.15
  })
  
  return thumbDown && fingersCurled
}

/**
 * Detect fist gesture (all fingers curled)
 */
export const detectFist = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return false
  
  const palm = landmarks[0]
  const wrist = landmarks[0]
  
  // All fingertips should be close to palm
  const fingerTips = [
    landmarks[4],  // Thumb
    landmarks[8],  // Index
    landmarks[12], // Middle
    landmarks[16], // Ring
    landmarks[20]  // Pinky
  ]
  
  const allCurled = fingerTips.every(tip => {
    const distance = calculateDistance(tip, wrist)
    return distance < 0.15
  })
  
  return allCurled
}

/**
 * Map hand center position to pitch (frequency)
 * Uses average of all landmarks
 */
export const mapHandCenterToPitch = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return null
  
  const center = calculateHandCenter(landmarks)
  // Invert Y (0 = top, 1 = bottom in screen coords)
  const normalizedY = 1 - center.y
  
  // Map to frequency range (200 Hz to 1000 Hz)
  const minFreq = 200
  const maxFreq = 1000
  const frequency = minFreq + (normalizedY * (maxFreq - minFreq))
  
  return frequency
}

/**
 * Map hand center X position to filter frequency
 */
export const mapHandCenterToFilter = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return null
  
  const center = calculateHandCenter(landmarks)
  const normalizedX = center.x
  
  // Map to filter frequency range (200 Hz to 5000 Hz)
  const minFilter = 200
  const maxFilter = 5000
  const filterFreq = minFilter + (normalizedX * (maxFilter - minFilter))
  
  return filterFreq
}

/**
 * Calculate distance between two landmarks
 */
export const calculateDistance = (landmark1, landmark2) => {
  if (!landmark1 || !landmark2) return 0
  const dx = landmark1.x - landmark2.x
  const dy = landmark1.y - landmark2.y
  const dz = landmark1.z - landmark2.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Map hand height to pitch (frequency)
 * Higher hand = higher pitch
 */
export const mapHandToPitch = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return null
  
  // Use wrist position (landmark 0) for Y position
  const wrist = landmarks[0]
  // Invert Y (0 = top, 1 = bottom in screen coords)
  const normalizedY = 1 - wrist.y
  
  // Map to frequency range (200 Hz to 1000 Hz)
  const minFreq = 200
  const maxFreq = 1000
  const frequency = minFreq + (normalizedY * (maxFreq - minFreq))
  
  return frequency
}

/**
 * Map hand X position to filter frequency
 * Left = low cutoff, Right = high cutoff
 */
export const mapHandToFilter = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return null
  
  const wrist = landmarks[0]
  const normalizedX = wrist.x
  
  // Map to filter frequency range (200 Hz to 5000 Hz)
  const minFilter = 200
  const maxFilter = 5000
  const filterFreq = minFilter + (normalizedX * (maxFilter - minFilter))
  
  return filterFreq
}

/**
 * Detect pinch gesture (thumb and index finger touching)
 * Returns 0 to 1, where 1 = pinched, 0 = not pinched
 */
export const detectPinch = (landmarks) => {
  if (!landmarks || landmarks.length < 9) return 0
  
  // Thumb tip = 4, Index finger tip = 8
  const thumbTip = landmarks[4]
  const indexTip = landmarks[8]
  
  const distance = calculateDistance(thumbTip, indexTip)
  
  // Normalize distance (0.05 = touching, 0.2 = far apart)
  const pinchThreshold = 0.05
  const maxDistance = 0.2
  
  if (distance <= pinchThreshold) return 1
  if (distance >= maxDistance) return 0
  
  // Linear interpolation
  return 1 - ((distance - pinchThreshold) / (maxDistance - pinchThreshold))
}

/**
 * Map pinch strength to volume
 */
export const mapPinchToVolume = (pinchValue) => {
  // Map 0-1 pinch to -30 to 0 dB volume
  return (pinchValue * 30) - 30
}

/**
 * Calculate average distance between thumb and all fingers
 * Can be used for reverb/effect control
 */
export const calculateHandOpenness = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return 0
  
  const thumbTip = landmarks[4]
  const fingerTips = [
    landmarks[8],   // Index
    landmarks[12],  // Middle
    landmarks[16],  // Ring
    landmarks[20]   // Pinky
  ]
  
  const distances = fingerTips.map(tip => calculateDistance(thumbTip, tip))
  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length
  
  // Normalize to 0-1 range
  const minOpen = 0.05
  const maxOpen = 0.25
  
  return Math.max(0, Math.min(1, (avgDistance - minOpen) / (maxOpen - minOpen)))
}

/**
 * Map hand openness to reverb amount
 */
export const mapOpennessToReverb = (openness) => {
  // Open hand = more reverb (0 to 0.7)
  return openness * 0.7
}

/**
 * Generate a musical note from frequency
 * Maps to nearest note in chromatic scale
 */
export const frequencyToNote = (frequency) => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  // Calculate MIDI note number from frequency
  const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69)
  const octave = Math.floor(midiNote / 12) - 1
  const noteName = noteNames[midiNote % 12]
  
  return `${noteName}${octave}`
}

/**
 * Main gesture processing function
 * Takes hand landmarks and returns synthesizer parameters for each hand
 */
export const processGestures = (handData) => {
  if (!handData || !handData.landmarks || handData.landmarks.length === 0) {
    return null
  }
  
  const hands = []
  
  // Process each detected hand
  for (let i = 0; i < Math.min(handData.landmarks.length, 2); i++) {
    const landmarks = handData.landmarks[i]
    const handedness = handData.handednesses && handData.handednesses[i] 
      ? handData.handednesses[i][0].categoryName 
      : (i === 0 ? 'Left' : 'Right')
    
    // Use hand center for position-based controls
    const frequency = mapHandCenterToPitch(landmarks)
    const filterFreq = mapHandCenterToFilter(landmarks)
    const pinch = detectPinch(landmarks)
    const volume = mapPinchToVolume(pinch)
    const openness = calculateHandOpenness(landmarks)
    const reverb = mapOpennessToReverb(openness)
    
    // Detect gestures
    const isOpenPalm = detectOpenPalm(landmarks)
    const isThumbsUp = detectThumbsUp(landmarks)
    const isThumbsDown = detectThumbsDown(landmarks)
    const isFist = detectFist(landmarks)
    const isVictorySign = detectVictorySign(landmarks)
    
    hands.push({
      handedness,
      landmarks,
      frequency,
      note: frequency ? frequencyToNote(frequency) : null,
      filterFreq,
      pinch,
      volume,
      openness,
      reverb,
      isPinched: pinch > 0.7,
      isOpenPalm,
      isThumbsUp,
      isThumbsDown,
      isFist,
      isVictorySign
    })
  }
  
  // Detect both hands open palm (stop gesture)
  const bothHandsOpen = hands.length === 2 && 
                        hands.every(hand => hand.isOpenPalm)
  
  // Detect both hands fist (recording gesture - dummy for now)
  const bothHandsFist = hands.length === 2 && 
                        hands.every(hand => hand.isFist)
  
  // Detect both hands victory sign (start playing gesture)
  const bothHandsVictory = hands.length === 2 && 
                           hands.every(hand => hand.isVictorySign)
  
  return {
    hands,
    bothHandsOpen,
    bothHandsFist,
    bothHandsVictory,
    handCount: hands.length
  }
}

