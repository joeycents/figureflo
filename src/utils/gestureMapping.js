// Map hand landmarks to synthesizer parameters

/**
 * Calculate distance between two landmarks
 */
export const calculateDistance = (landmark1, landmark2) => {
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
 * Takes hand landmarks and returns synthesizer parameters
 */
export const processGestures = (handData) => {
  if (!handData || !handData.landmarks || handData.landmarks.length === 0) {
    return null
  }
  
  // Process first hand
  const landmarks = handData.landmarks[0]
  
  const frequency = mapHandToPitch(landmarks)
  const filterFreq = mapHandToFilter(landmarks)
  const pinch = detectPinch(landmarks)
  const volume = mapPinchToVolume(pinch)
  const openness = calculateHandOpenness(landmarks)
  const reverb = mapOpennessToReverb(openness)
  
  return {
    frequency,
    note: frequency ? frequencyToNote(frequency) : null,
    filterFreq,
    pinch,
    volume,
    openness,
    reverb,
    isPinched: pinch > 0.7
  }
}

