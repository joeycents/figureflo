/**
 * WebGL Program compilation and management
 */

import { hashCode } from './fluidHelpers'

/**
 * Material class for shaders with keywords
 */
export class Material {
  constructor(gl, vertexShader, fragmentShaderSource) {
    this.gl = gl
    this.vertexShader = vertexShader
    this.fragmentShaderSource = fragmentShaderSource
    this.programs = []
    this.activeProgram = null
    this.uniforms = []
  }

  setKeywords(keywords) {
    let hash = 0
    for (let i = 0; i < keywords.length; i++) {
      hash += hashCode(keywords[i])
    }

    let program = this.programs[hash]
    if (program == null) {
      const fragmentShader = compileShader(
        this.gl,
        this.gl.FRAGMENT_SHADER,
        this.fragmentShaderSource,
        keywords
      )
      program = createProgram(this.gl, this.vertexShader, fragmentShader)
      this.programs[hash] = program
    }

    if (program === this.activeProgram) return

    this.uniforms = getUniforms(this.gl, program)
    this.activeProgram = program
  }

  bind() {
    this.gl.useProgram(this.activeProgram)
  }
}

/**
 * Program class for simple shaders
 */
export class Program {
  constructor(gl, vertexShader, fragmentShader) {
    this.gl = gl
    this.uniforms = {}
    this.program = createProgram(gl, vertexShader, fragmentShader)
    this.uniforms = getUniforms(gl, this.program)
  }

  bind() {
    this.gl.useProgram(this.program)
  }
}

/**
 * Create WebGL program from vertex and fragment shaders
 */
function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
  }

  return program
}

/**
 * Get uniform locations from program
 */
function getUniforms(gl, program) {
  const uniforms = []
  const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < uniformCount; i++) {
    const uniformName = gl.getActiveUniform(program, i).name
    uniforms[uniformName] = gl.getUniformLocation(program, uniformName)
  }
  return uniforms
}

/**
 * Compile shader from source
 */
export function compileShader(gl, type, source, keywords) {
  source = addKeywords(source, keywords)

  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
  }

  return shader
}

/**
 * Add #define keywords to shader source
 */
function addKeywords(source, keywords) {
  if (keywords == null) return source
  let keywordsString = ''
  keywords.forEach(keyword => {
    keywordsString += '#define ' + keyword + '\n'
  })
  return keywordsString + source
}

/**
 * Create framebuffer object (FBO)
 */
export function createFBO(gl, w, h, internalFormat, format, type, param) {
  gl.activeTexture(gl.TEXTURE0)
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null)

  const fbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  gl.viewport(0, 0, w, h)
  gl.clear(gl.COLOR_BUFFER_BIT)

  const texelSizeX = 1.0 / w
  const texelSizeY = 1.0 / h

  return {
    texture,
    fbo,
    width: w,
    height: h,
    texelSizeX,
    texelSizeY,
    attach(id) {
      gl.activeTexture(gl.TEXTURE0 + id)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      return id
    }
  }
}

/**
 * Create double FBO for ping-pong rendering
 */
export function createDoubleFBO(gl, w, h, internalFormat, format, type, param) {
  let fbo1 = createFBO(gl, w, h, internalFormat, format, type, param)
  let fbo2 = createFBO(gl, w, h, internalFormat, format, type, param)

  return {
    width: w,
    height: h,
    texelSizeX: fbo1.texelSizeX,
    texelSizeY: fbo1.texelSizeY,
    get read() {
      return fbo1
    },
    set read(value) {
      fbo1 = value
    },
    get write() {
      return fbo2
    },
    set write(value) {
      fbo2 = value
    },
    swap() {
      const temp = fbo1
      fbo1 = fbo2
      fbo2 = temp
    }
  }
}

/**
 * Resize FBO
 */
export function resizeFBO(gl, target, w, h, internalFormat, format, type, param, copyProgram) {
  const newFBO = createFBO(gl, w, h, internalFormat, format, type, param)
  copyProgram.bind()
  gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0))
  blit(gl, newFBO)
  return newFBO
}

/**
 * Resize double FBO
 */
export function resizeDoubleFBO(gl, target, w, h, internalFormat, format, type, param, copyProgram) {
  if (target.width === w && target.height === h) return target
  target.read = resizeFBO(gl, target.read, w, h, internalFormat, format, type, param, copyProgram)
  target.write = createFBO(gl, w, h, internalFormat, format, type, param)
  target.width = w
  target.height = h
  target.texelSizeX = 1.0 / w
  target.texelSizeY = 1.0 / h
  return target
}

/**
 * Blit (render) to target
 */
export function blit(gl, target, clear = false) {
  if (target == null) {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  } else {
    gl.viewport(0, 0, target.width, target.height)
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
  }
  if (clear) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
}

/**
 * Initialize blit buffers (quad for rendering)
 */
export function initBlitBuffers(gl) {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
    gl.STATIC_DRAW
  )
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array([0, 1, 2, 0, 2, 3]),
    gl.STATIC_DRAW
  )
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(0)
}
