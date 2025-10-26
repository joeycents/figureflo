/**
 * Helper utilities for WebGL Fluid Simulation
 */

/**
 * Convert HSV color to RGB
 */
export function HSVtoRGB(h, s, v) {
  let r, g, b, i, f, p, q, t
  i = Math.floor(h * 6)
  f = h * 6 - i
  p = v * (1 - s)
  q = v * (1 - f * s)
  t = v * (1 - (1 - f) * s)

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
    default: r = 0; g = 0; b = 0; break
  }

  return { r, g, b }
}

/**
 * Normalize RGB color (0-255 to 0-1)
 */
export function normalizeColor(input) {
  return {
    r: input.r / 255,
    g: input.g / 255,
    b: input.b / 255
  }
}

/**
 * Wrap value within range
 */
export function wrap(value, min, max) {
  const range = max - min
  if (range === 0) return min
  return (value - min) % range + min
}

/**
 * Clamp value between 0 and 1
 */
export function clamp01(input) {
  return Math.min(Math.max(input, 0), 1)
}

/**
 * Get resolution for fluid simulation based on aspect ratio
 */
export function getResolution(resolution, drawingBufferWidth, drawingBufferHeight) {
  let aspectRatio = drawingBufferWidth / drawingBufferHeight
  if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio

  const min = Math.round(resolution)
  const max = Math.round(resolution * aspectRatio)

  if (drawingBufferWidth > drawingBufferHeight)
    return { width: max, height: min }
  else
    return { width: min, height: max }
}

/**
 * Scale input by device pixel ratio
 */
export function scaleByPixelRatio(input) {
  const pixelRatio = window.devicePixelRatio || 1
  return Math.floor(input * pixelRatio)
}

/**
 * Hash string to number (for shader keywords)
 */
export function hashCode(s) {
  if (s.length === 0) return 0
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

/**
 * Generate random color
 */
export function generateColor() {
  const c = HSVtoRGB(Math.random(), 1.0, 1.0)
  c.r *= 0.15
  c.g *= 0.15
  c.b *= 0.15
  return c
}

/**
 * Map musical note to color hue (pentatonic scale awareness)
 */
export function noteToHue(note, scale = 'pentatonic') {
  // Note is like "C4", "D#5", etc.
  if (!note) return Math.random()
  
  // Extract note name without octave
  const noteName = note.replace(/[0-9]/g, '')
  
  // Map note names to hue values (0-1)
  const noteHues = {
    'C': 0.0,      // Red
    'C#': 0.05,
    'Db': 0.05,
    'D': 0.15,     // Orange
    'D#': 0.20,
    'Eb': 0.20,
    'E': 0.30,     // Yellow
    'F': 0.40,     // Green-yellow
    'F#': 0.45,
    'Gb': 0.45,
    'G': 0.50,     // Green
    'G#': 0.55,
    'Ab': 0.55,
    'A': 0.65,     // Cyan-blue
    'A#': 0.70,
    'Bb': 0.70,
    'B': 0.80      // Blue-purple
  }
  
  return noteHues[noteName] || Math.random()
}

/**
 * Correct radius for aspect ratio
 */
export function correctRadius(radius, canvasWidth, canvasHeight) {
  let aspectRatio = canvasWidth / canvasHeight
  if (aspectRatio > 1) radius *= aspectRatio
  return radius
}

/**
 * Smooth interpolation between two values
 */
export function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Smooth interpolation for colors
 */
export function lerpColor(color1, color2, t) {
  return {
    r: lerp(color1.r, color2.r, t),
    g: lerp(color1.g, color2.g, t),
    b: lerp(color1.b, color2.b, t)
  }
}

/**
 * Check if device is mobile
 */
export function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent)
}

/**
 * Get WebGL context with fallback
 */
export function getWebGLContext(canvas) {
  const params = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false
  }

  let gl = canvas.getContext('webgl2', params)
  const isWebGL2 = !!gl
  if (!isWebGL2) {
    gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params)
  }

  if (!gl) {
    throw new Error('WebGL not supported')
  }

  let halfFloat
  let supportLinearFiltering
  if (isWebGL2) {
    gl.getExtension('EXT_color_buffer_float')
    supportLinearFiltering = gl.getExtension('OES_texture_float_linear')
  } else {
    halfFloat = gl.getExtension('OES_texture_half_float')
    supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear')
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0)

  const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES
  let formatRGBA, formatRG, formatR

  if (isWebGL2) {
    formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType)
    formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType)
    formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType)
  } else {
    formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType)
    formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType)
    formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType)
  }

  return {
    gl,
    ext: {
      formatRGBA,
      formatRG,
      formatR,
      halfFloatTexType,
      supportLinearFiltering
    }
  }
}

function getSupportedFormat(gl, internalFormat, format, type) {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    switch (internalFormat) {
      case gl.R16F:
        return getSupportedFormat(gl, gl.RG16F, gl.RG, type)
      case gl.RG16F:
        return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type)
      default:
        return null
    }
  }

  return { internalFormat, format }
}

function supportRenderTextureFormat(gl, internalFormat, format, type) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null)

  const fbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  return status === gl.FRAMEBUFFER_COMPLETE
}
