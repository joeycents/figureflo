/**
 * Emotion to Fluid Simulation Mapping
 * Maps detected emotions to fluid visual parameters
 */

export const emotionPresets = {
  Joy: {
    COLORFUL: true,
    BLOOM_INTENSITY: 1.2,
    BLOOM_THRESHOLD: 0.4,
    SUNRAYS: true,
    SUNRAYS_WEIGHT: 1.0,
    VELOCITY_DISSIPATION: 0.15, // Fast, energetic
    DENSITY_DISSIPATION: 0.8,
    SPLAT_FORCE: 7000,
    CURL: 35,
    PRESSURE: 0.8,
    BACK_COLOR: { r: 5, g: 5, b: 10 }
  },
  Sadness: {
    COLORFUL: false,
    BLOOM_INTENSITY: 0.3,
    BLOOM_THRESHOLD: 0.8,
    SUNRAYS: false,
    SUNRAYS_WEIGHT: 0.3,
    VELOCITY_DISSIPATION: 0.4, // Slow, heavy
    DENSITY_DISSIPATION: 1.2,
    SPLAT_FORCE: 3000,
    CURL: 15,
    PRESSURE: 0.6,
    BACK_COLOR: { r: 0, g: 0, b: 20 } // Dark blue
  },
  Excitement: {
    COLORFUL: true,
    BLOOM_INTENSITY: 1.5,
    BLOOM_THRESHOLD: 0.3,
    SUNRAYS: true,
    SUNRAYS_WEIGHT: 1.2,
    VELOCITY_DISSIPATION: 0.1, // Very fast
    DENSITY_DISSIPATION: 0.6,
    SPLAT_FORCE: 8000,
    CURL: 40, // More vorticity
    PRESSURE: 0.85,
    BACK_COLOR: { r: 10, g: 0, b: 0 } // Slight red
  },
  Calmness: {
    COLORFUL: false,
    BLOOM_INTENSITY: 0.6,
    BLOOM_THRESHOLD: 0.5,
    SUNRAYS: true,
    SUNRAYS_WEIGHT: 0.5,
    VELOCITY_DISSIPATION: 0.5, // Slow, gentle
    DENSITY_DISSIPATION: 1.0,
    SPLAT_FORCE: 4000,
    CURL: 20,
    PRESSURE: 0.7,
    BACK_COLOR: { r: 0, g: 10, b: 10 } // Teal
  },
  Anger: {
    COLORFUL: true,
    BLOOM_INTENSITY: 1.0,
    BLOOM_THRESHOLD: 0.2,
    SUNRAYS: false,
    SUNRAYS_WEIGHT: 0.8,
    VELOCITY_DISSIPATION: 0.05, // Chaotic
    DENSITY_DISSIPATION: 0.5,
    SPLAT_FORCE: 9000,
    CURL: 50, // Maximum vorticity
    PRESSURE: 0.9,
    BACK_COLOR: { r: 20, g: 0, b: 0 } // Deep red
  },
  Fear: {
    COLORFUL: false,
    BLOOM_INTENSITY: 0.4,
    BLOOM_THRESHOLD: 0.7,
    SUNRAYS: false,
    SUNRAYS_WEIGHT: 0.2,
    VELOCITY_DISSIPATION: 0.3,
    DENSITY_DISSIPATION: 1.5, // Quick fade
    SPLAT_FORCE: 5000,
    CURL: 25,
    PRESSURE: 0.75,
    BACK_COLOR: { r: 5, g: 0, b: 10 } // Dark purple
  },
  Surprise: {
    COLORFUL: true,
    BLOOM_INTENSITY: 1.3,
    BLOOM_THRESHOLD: 0.35,
    SUNRAYS: true,
    SUNRAYS_WEIGHT: 1.1,
    VELOCITY_DISSIPATION: 0.12,
    DENSITY_DISSIPATION: 0.7,
    SPLAT_FORCE: 7500,
    CURL: 38,
    PRESSURE: 0.82,
    BACK_COLOR: { r: 8, g: 8, b: 0 } // Slight yellow
  },
  Neutral: {
    COLORFUL: true,
    BLOOM_INTENSITY: 0.8,
    BLOOM_THRESHOLD: 0.6,
    SUNRAYS: true,
    SUNRAYS_WEIGHT: 1.0,
    VELOCITY_DISSIPATION: 0.2, // Default
    DENSITY_DISSIPATION: 1.0,
    SPLAT_FORCE: 6000,
    CURL: 30,
    PRESSURE: 0.8,
    BACK_COLOR: { r: 0, g: 0, b: 0 }
  }
}

/**
 * Get fluid config for a specific emotion
 * @param {string} emotionName - Name of the emotion
 * @param {number} confidence - Confidence score (0-1)
 * @returns {Object} Fluid configuration object
 */
export function getEmotionFluidConfig(emotionName, confidence = 1.0) {
  // Normalize emotion name
  const normalizedName = emotionName.charAt(0).toUpperCase() + emotionName.slice(1).toLowerCase()
  
  // Get preset, default to Neutral if not found
  const preset = emotionPresets[normalizedName] || emotionPresets.Neutral
  
  // If confidence is low, blend with neutral
  if (confidence < 0.7) {
    return blendEmotionConfigs(preset, emotionPresets.Neutral, confidence)
  }
  
  return preset
}

/**
 * Blend two emotion configs based on a factor
 * @param {Object} config1 - First emotion config
 * @param {Object} config2 - Second emotion config
 * @param {number} factor - Blend factor (0 = config2, 1 = config1)
 * @returns {Object} Blended config
 */
export function blendEmotionConfigs(config1, config2, factor) {
  const lerp = (a, b, t) => a + (b - a) * t
  
  return {
    COLORFUL: factor > 0.5 ? config1.COLORFUL : config2.COLORFUL,
    BLOOM_INTENSITY: lerp(config2.BLOOM_INTENSITY, config1.BLOOM_INTENSITY, factor),
    BLOOM_THRESHOLD: lerp(config2.BLOOM_THRESHOLD, config1.BLOOM_THRESHOLD, factor),
    SUNRAYS: factor > 0.5 ? config1.SUNRAYS : config2.SUNRAYS,
    SUNRAYS_WEIGHT: lerp(config2.SUNRAYS_WEIGHT, config1.SUNRAYS_WEIGHT, factor),
    VELOCITY_DISSIPATION: lerp(config2.VELOCITY_DISSIPATION, config1.VELOCITY_DISSIPATION, factor),
    DENSITY_DISSIPATION: lerp(config2.DENSITY_DISSIPATION, config1.DENSITY_DISSIPATION, factor),
    SPLAT_FORCE: lerp(config2.SPLAT_FORCE, config1.SPLAT_FORCE, factor),
    CURL: lerp(config2.CURL, config1.CURL, factor),
    PRESSURE: lerp(config2.PRESSURE, config1.PRESSURE, factor),
    BACK_COLOR: {
      r: Math.round(lerp(config2.BACK_COLOR.r, config1.BACK_COLOR.r, factor)),
      g: Math.round(lerp(config2.BACK_COLOR.g, config1.BACK_COLOR.g, factor)),
      b: Math.round(lerp(config2.BACK_COLOR.b, config1.BACK_COLOR.b, factor))
    }
  }
}

/**
 * Smoothly transition between emotion configs over time
 */
export class EmotionTransitioner {
  constructor(initialConfig = emotionPresets.Neutral) {
    this.currentConfig = { ...initialConfig }
    this.targetConfig = { ...initialConfig }
    this.transitionProgress = 1.0
    this.transitionSpeed = 0.02 // Adjust for faster/slower transitions
  }

  /**
   * Set new target emotion
   * @param {string} emotionName - Name of emotion
   * @param {number} confidence - Confidence score
   */
  setEmotion(emotionName, confidence) {
    this.targetConfig = getEmotionFluidConfig(emotionName, confidence)
    this.transitionProgress = 0.0
  }

  /**
   * Update transition (call every frame)
   * @returns {Object} Current interpolated config
   */
  update() {
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(this.transitionProgress + this.transitionSpeed, 1.0)
      
      // Smooth easing function (ease-in-out)
      const t = this.transitionProgress
      const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      
      this.currentConfig = blendEmotionConfigs(
        this.targetConfig,
        this.currentConfig,
        easedT
      )
    }
    
    return this.currentConfig
  }

  /**
   * Get current config
   * @returns {Object} Current config
   */
  getConfig() {
    return this.currentConfig
  }

  /**
   * Check if transition is complete
   * @returns {boolean}
   */
  isTransitionComplete() {
    return this.transitionProgress >= 1.0
  }
}

/**
 * Map emotion to color palette for splats
 * @param {string} emotionName - Name of emotion
 * @returns {Object} Color palette info
 */
export function getEmotionColorPalette(emotionName) {
  const palettes = {
    Joy: {
      hueRange: [0.1, 0.2], // Yellow-orange
      saturation: 1.0,
      brightness: 1.0
    },
    Sadness: {
      hueRange: [0.55, 0.7], // Blue
      saturation: 0.6,
      brightness: 0.5
    },
    Excitement: {
      hueRange: [0.0, 0.1], // Red-orange
      saturation: 1.0,
      brightness: 1.2
    },
    Calmness: {
      hueRange: [0.45, 0.55], // Green-cyan
      saturation: 0.7,
      brightness: 0.7
    },
    Anger: {
      hueRange: [0.0, 0.05], // Deep red
      saturation: 1.0,
      brightness: 0.8
    },
    Fear: {
      hueRange: [0.75, 0.85], // Purple
      saturation: 0.5,
      brightness: 0.4
    },
    Surprise: {
      hueRange: [0.15, 0.25], // Orange-yellow
      saturation: 0.9,
      brightness: 1.0
    },
    Neutral: {
      hueRange: [0.0, 1.0], // Full spectrum
      saturation: 0.8,
      brightness: 0.8
    }
  }

  const normalizedName = emotionName.charAt(0).toUpperCase() + emotionName.slice(1).toLowerCase()
  return palettes[normalizedName] || palettes.Neutral
}
