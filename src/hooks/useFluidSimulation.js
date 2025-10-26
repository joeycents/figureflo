/**
 * React Hook for WebGL Fluid Simulation
 * Adapted from Pavel Dobryakov's WebGL-Fluid-Simulation for FigureFlo
 */

import { useEffect, useRef, useCallback } from 'react'
import {
  getWebGLContext,
  getResolution,
  correctRadius,
  HSVtoRGB,
  noteToHue,
  isMobile
} from '../utils/fluidHelpers'
import {
  Material,
  Program,
  compileShader,
  createFBO,
  createDoubleFBO,
  resizeDoubleFBO,
  blit,
  initBlitBuffers
} from '../utils/fluidPrograms'
import * as shaders from '../utils/fluidShaders'
import { EmotionTransitioner } from '../utils/emotionFluidMapping'

export const useFluidSimulation = (canvasRef, config = {}) => {
  const glRef = useRef(null)
  const extRef = useRef(null)
  const programsRef = useRef({})
  const fbosRef = useRef({})
  const animationFrameRef = useRef(null)
  const lastUpdateTimeRef = useRef(Date.now())
  const emotionTransitionerRef = useRef(null)
  const renderCountRef = useRef(0)
  
  // Default configuration
  const defaultConfig = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: isMobile() ? 512 : 1024,
    DENSITY_DISSIPATION: 1,
    VELOCITY_DISSIPATION: 0.2,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 30,
    SPLAT_RADIUS: 0.25,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLORFUL: true,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.8,
    BLOOM_THRESHOLD: 0.6,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 1.0,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: false
  }

  const configRef = useRef({ ...defaultConfig, ...config })
  const isReadyRef = useRef(config.isReady || false)

  // Update config when it changes
  useEffect(() => {
    configRef.current = { ...defaultConfig, ...config }
    isReadyRef.current = config.isReady || false
  }, [config])

  // Initialize WebGL and simulation
  useEffect(() => {
    // Wait until explicitly ready
    if (!isReadyRef.current) {
      console.log('❌ Fluid: Not ready yet (waiting for calibration)')
      return
    }
    
    if (!canvasRef || !canvasRef.current) {
      console.log('❌ Fluid: Canvas ref not available yet')
      return
    }

    console.log('🎨 Fluid: Initializing canvas', canvasRef.current)

    try {
      const canvas = canvasRef.current
      
      // Ensure canvas has dimensions before initializing WebGL
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height || rect.width < 10 || rect.height < 10) {
        console.log('❌ Fluid: Canvas has invalid dimensions', rect.width, rect.height)
        return
      }
      
      canvas.width = rect.width
      canvas.height = rect.height
      console.log('🎨 Fluid: Set canvas dimensions to', canvas.width, 'x', canvas.height)
      
      console.log('🎨 Fluid: Canvas dimensions', canvas.width, canvas.height, canvas.clientWidth, canvas.clientHeight)
      
      const { gl, ext } = getWebGLContext(canvas)
      glRef.current = gl
      extRef.current = ext
      console.log('✅ Fluid: WebGL context created', { gl, ext })

      // Compile all shaders
      const baseVertex = compileShader(gl, gl.VERTEX_SHADER, shaders.baseVertexShader)
      const blurVertex = compileShader(gl, gl.VERTEX_SHADER, shaders.blurVertexShader)
      const blurFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.blurShader)
      const copyFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.copyShader)
      const clearFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.clearShader)
      const colorFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.colorShader)
      const splatFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.splatShader)
      const advectionFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.advectionShader,
        ext.supportLinearFiltering ? null : ['MANUAL_FILTERING'])
      const divergenceFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.divergenceShader)
      const curlFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.curlShader)
      const vorticityFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.vorticityShader)
      const pressureFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.pressureShader)
      const gradientSubtractFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.gradientSubtractShader)
      const bloomPrefilterFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.bloomPrefilterShader)
      const bloomBlurFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.bloomBlurShader)
      const bloomFinalFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.bloomFinalShader)
      const sunraysMaskFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.sunraysMaskShader)
      const sunraysFrag = compileShader(gl, gl.FRAGMENT_SHADER, shaders.sunraysShader)

      // Create programs
      programsRef.current = {
        blur: new Program(gl, blurVertex, blurFrag),
        copy: new Program(gl, baseVertex, copyFrag),
        clear: new Program(gl, baseVertex, clearFrag),
        color: new Program(gl, baseVertex, colorFrag),
        splat: new Program(gl, baseVertex, splatFrag),
        advection: new Program(gl, baseVertex, advectionFrag),
        divergence: new Program(gl, baseVertex, divergenceFrag),
        curl: new Program(gl, baseVertex, curlFrag),
        vorticity: new Program(gl, baseVertex, vorticityFrag),
        pressure: new Program(gl, baseVertex, pressureFrag),
        gradientSubtract: new Program(gl, baseVertex, gradientSubtractFrag),
        bloomPrefilter: new Program(gl, baseVertex, bloomPrefilterFrag),
        bloomBlur: new Program(gl, baseVertex, bloomBlurFrag),
        bloomFinal: new Program(gl, baseVertex, bloomFinalFrag),
        sunraysMask: new Program(gl, baseVertex, sunraysMaskFrag),
        sunrays: new Program(gl, baseVertex, sunraysFrag),
        display: new Material(gl, baseVertex, shaders.displayShaderSource)
      }

      // Initialize blit buffers
      initBlitBuffers(gl)

      // Initialize framebuffers
      initFramebuffers()

      // Update display keywords
      updateKeywords()

      // Initialize emotion transitioner
      emotionTransitionerRef.current = new EmotionTransitioner()

      // Clear to a test color to verify rendering works
      gl.clearColor(0.1, 0.1, 0.2, 1.0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      console.log('🎨 Fluid: Cleared canvas to test color')

      // Start animation loop
      animate()

      console.log('✅ Fluid simulation initialized successfully')
      
      // Add a test splat after initialization to verify rendering
      setTimeout(() => {
        console.log('🎨 Creating test splat')
        const testColor = { r: 0.5, g: 0.2, b: 0.8 }
        // Call internal splat creation
        const gl = glRef.current
        const programs = programsRef.current
        const fbos = fbosRef.current
        const cfg = configRef.current
        const canvas = canvasRef.current
        if (gl && programs && fbos && canvas) {
          programs.splat.bind()
          gl.uniform1i(programs.splat.uniforms.uTarget, fbos.velocity.read.attach(0))
          gl.uniform1f(programs.splat.uniforms.aspectRatio, canvas.width / canvas.height)
          gl.uniform2f(programs.splat.uniforms.point, 0.5, 0.5)
          gl.uniform3f(programs.splat.uniforms.color, 10, 10, 0.0)
          gl.uniform1f(programs.splat.uniforms.radius, correctRadius(cfg.SPLAT_RADIUS / 100.0, canvas.width, canvas.height))
          blit(gl, fbos.velocity.write)
          fbos.velocity.swap()

          gl.uniform1i(programs.splat.uniforms.uTarget, fbos.dye.read.attach(0))
          gl.uniform3f(programs.splat.uniforms.color, testColor.r, testColor.g, testColor.b)
          blit(gl, fbos.dye.write)
          fbos.dye.swap()
          console.log('✅ Test splat created')
        }
      }, 1000)
    } catch (error) {
      console.error('❌ Failed to initialize fluid simulation:', error)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [canvasRef, config.isReady])

  // Initialize framebuffers
  const initFramebuffers = useCallback(() => {
    const gl = glRef.current
    const ext = extRef.current
    const cfg = configRef.current
    if (!gl || !ext) return

    const simRes = getResolution(cfg.SIM_RESOLUTION, gl.drawingBufferWidth, gl.drawingBufferHeight)
    const dyeRes = getResolution(cfg.DYE_RESOLUTION, gl.drawingBufferWidth, gl.drawingBufferHeight)

    const texType = ext.halfFloatTexType
    const rgba = ext.formatRGBA
    const rg = ext.formatRG
    const r = ext.formatR
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST

    gl.disable(gl.BLEND)

    fbosRef.current.dye = createDoubleFBO(gl, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering)
    fbosRef.current.velocity = createDoubleFBO(gl, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering)
    fbosRef.current.divergence = createFBO(gl, simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST)
    fbosRef.current.curl = createFBO(gl, simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST)
    fbosRef.current.pressure = createDoubleFBO(gl, simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST)

    // Bloom framebuffers
    const bloomRes = getResolution(cfg.BLOOM_RESOLUTION, gl.drawingBufferWidth, gl.drawingBufferHeight)
    fbosRef.current.bloom = createFBO(gl, bloomRes.width, bloomRes.height, rgba.internalFormat, rgba.format, texType, filtering)
    fbosRef.current.bloomFramebuffers = []
    for (let i = 0; i < cfg.BLOOM_ITERATIONS; i++) {
      const width = bloomRes.width >> (i + 1)
      const height = bloomRes.height >> (i + 1)
      if (width < 2 || height < 2) break
      const fbo = createFBO(gl, width, height, rgba.internalFormat, rgba.format, texType, filtering)
      fbosRef.current.bloomFramebuffers.push(fbo)
    }

    // Sunrays framebuffers
    const sunraysRes = getResolution(cfg.SUNRAYS_RESOLUTION, gl.drawingBufferWidth, gl.drawingBufferHeight)
    fbosRef.current.sunrays = createFBO(gl, sunraysRes.width, sunraysRes.height, r.internalFormat, r.format, texType, filtering)
    fbosRef.current.sunraysTemp = createFBO(gl, sunraysRes.width, sunraysRes.height, r.internalFormat, r.format, texType, filtering)
  }, [])

  // Update display keywords based on config
  const updateKeywords = useCallback(() => {
    const cfg = configRef.current
    const displayKeywords = []
    if (cfg.SHADING) displayKeywords.push('SHADING')
    if (cfg.BLOOM) displayKeywords.push('BLOOM')
    if (cfg.SUNRAYS) displayKeywords.push('SUNRAYS')
    programsRef.current.display?.setKeywords(displayKeywords)
  }, [])

  // Resize canvas if needed
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return false

    const width = canvas.clientWidth
    const height = canvas.clientHeight

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      return true
    }
    return false
  }, [canvasRef])

  // Simulation step
  const step = useCallback((dt) => {
    const gl = glRef.current
    const programs = programsRef.current
    const fbos = fbosRef.current
    const cfg = configRef.current
    if (!gl || !programs || !fbos) return

    gl.disable(gl.BLEND)

    // Curl
    programs.curl.bind()
    gl.uniform2f(programs.curl.uniforms.texelSize, fbos.velocity.texelSizeX, fbos.velocity.texelSizeY)
    gl.uniform1i(programs.curl.uniforms.uVelocity, fbos.velocity.read.attach(0))
    blit(gl, fbos.curl)

    // Vorticity
    programs.vorticity.bind()
    gl.uniform2f(programs.vorticity.uniforms.texelSize, fbos.velocity.texelSizeX, fbos.velocity.texelSizeY)
    gl.uniform1i(programs.vorticity.uniforms.uVelocity, fbos.velocity.read.attach(0))
    gl.uniform1i(programs.vorticity.uniforms.uCurl, fbos.curl.attach(1))
    gl.uniform1f(programs.vorticity.uniforms.curl, cfg.CURL)
    gl.uniform1f(programs.vorticity.uniforms.dt, dt)
    blit(gl, fbos.velocity.write)
    fbos.velocity.swap()

    // Divergence
    programs.divergence.bind()
    gl.uniform2f(programs.divergence.uniforms.texelSize, fbos.velocity.texelSizeX, fbos.velocity.texelSizeY)
    gl.uniform1i(programs.divergence.uniforms.uVelocity, fbos.velocity.read.attach(0))
    blit(gl, fbos.divergence)

    // Clear pressure
    programs.clear.bind()
    gl.uniform1i(programs.clear.uniforms.uTexture, fbos.pressure.read.attach(0))
    gl.uniform1f(programs.clear.uniforms.value, cfg.PRESSURE)
    blit(gl, fbos.pressure.write)
    fbos.pressure.swap()

    // Pressure iterations
    programs.pressure.bind()
    gl.uniform2f(programs.pressure.uniforms.texelSize, fbos.velocity.texelSizeX, fbos.velocity.texelSizeY)
    gl.uniform1i(programs.pressure.uniforms.uDivergence, fbos.divergence.attach(0))
    for (let i = 0; i < cfg.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(programs.pressure.uniforms.uPressure, fbos.pressure.read.attach(1))
      blit(gl, fbos.pressure.write)
      fbos.pressure.swap()
    }

    // Gradient subtract
    programs.gradientSubtract.bind()
    gl.uniform2f(programs.gradientSubtract.uniforms.texelSize, fbos.velocity.texelSizeX, fbos.velocity.texelSizeY)
    gl.uniform1i(programs.gradientSubtract.uniforms.uPressure, fbos.pressure.read.attach(0))
    gl.uniform1i(programs.gradientSubtract.uniforms.uVelocity, fbos.velocity.read.attach(1))
    blit(gl, fbos.velocity.write)
    fbos.velocity.swap()

    // Advection
    programs.advection.bind()
    gl.uniform2f(programs.advection.uniforms.texelSize, fbos.velocity.texelSizeX, fbos.velocity.texelSizeY)
    if (!extRef.current.supportLinearFiltering) {
      gl.uniform2f(programs.advection.uniforms.dyeTexelSize, fbos.velocity.texelSizeX, fbos.velocity.texelSizeY)
    }
    const velocityId = fbos.velocity.read.attach(0)
    gl.uniform1i(programs.advection.uniforms.uVelocity, velocityId)
    gl.uniform1i(programs.advection.uniforms.uSource, velocityId)
    gl.uniform1f(programs.advection.uniforms.dt, dt)
    gl.uniform1f(programs.advection.uniforms.dissipation, cfg.VELOCITY_DISSIPATION)
    blit(gl, fbos.velocity.write)
    fbos.velocity.swap()

    if (!extRef.current.supportLinearFiltering) {
      gl.uniform2f(programs.advection.uniforms.dyeTexelSize, fbos.dye.texelSizeX, fbos.dye.texelSizeY)
    }
    gl.uniform1i(programs.advection.uniforms.uVelocity, fbos.velocity.read.attach(0))
    gl.uniform1i(programs.advection.uniforms.uSource, fbos.dye.read.attach(1))
    gl.uniform1f(programs.advection.uniforms.dissipation, cfg.DENSITY_DISSIPATION)
    blit(gl, fbos.dye.write)
    fbos.dye.swap()
  }, [])

  // Render
  const render = useCallback(() => {
    const gl = glRef.current
    const programs = programsRef.current
    const fbos = fbosRef.current
    const cfg = configRef.current
    if (!gl || !programs || !fbos) {
      console.log('⚠️ Render skipped - missing refs')
      return
    }

    // Apply bloom
    if (cfg.BLOOM) {
      applyBloom(fbos.dye.read, fbos.bloom)
    }

    // Apply sunrays
    if (cfg.SUNRAYS) {
      applySunrays(fbos.dye.read, fbos.dye.write, fbos.sunrays)
      blurPass(fbos.sunrays, fbos.sunraysTemp, 1)
    }

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.BLEND)

    // Draw display
    drawDisplay(null)
  }, [])

  // Apply bloom effect
  const applyBloom = useCallback((source, destination) => {
    const gl = glRef.current
    const programs = programsRef.current
    const fbos = fbosRef.current
    const cfg = configRef.current
    if (!gl || !programs || !fbos || fbos.bloomFramebuffers.length < 2) return

    let last = destination

    gl.disable(gl.BLEND)
    programs.bloomPrefilter.bind()
    const knee = cfg.BLOOM_THRESHOLD * cfg.BLOOM_SOFT_KNEE + 0.0001
    const curve0 = cfg.BLOOM_THRESHOLD - knee
    const curve1 = knee * 2
    const curve2 = 0.25 / knee
    gl.uniform3f(programs.bloomPrefilter.uniforms.curve, curve0, curve1, curve2)
    gl.uniform1f(programs.bloomPrefilter.uniforms.threshold, cfg.BLOOM_THRESHOLD)
    gl.uniform1i(programs.bloomPrefilter.uniforms.uTexture, source.attach(0))
    blit(gl, last)

    programs.bloomBlur.bind()
    for (let i = 0; i < fbos.bloomFramebuffers.length; i++) {
      const dest = fbos.bloomFramebuffers[i]
      gl.uniform2f(programs.bloomBlur.uniforms.texelSize, last.texelSizeX, last.texelSizeY)
      gl.uniform1i(programs.bloomBlur.uniforms.uTexture, last.attach(0))
      blit(gl, dest)
      last = dest
    }

    gl.blendFunc(gl.ONE, gl.ONE)
    gl.enable(gl.BLEND)

    for (let i = fbos.bloomFramebuffers.length - 2; i >= 0; i--) {
      const baseTex = fbos.bloomFramebuffers[i]
      gl.uniform2f(programs.bloomBlur.uniforms.texelSize, last.texelSizeX, last.texelSizeY)
      gl.uniform1i(programs.bloomBlur.uniforms.uTexture, last.attach(0))
      gl.viewport(0, 0, baseTex.width, baseTex.height)
      blit(gl, baseTex)
      last = baseTex
    }

    gl.disable(gl.BLEND)
    programs.bloomFinal.bind()
    gl.uniform2f(programs.bloomFinal.uniforms.texelSize, last.texelSizeX, last.texelSizeY)
    gl.uniform1i(programs.bloomFinal.uniforms.uTexture, last.attach(0))
    gl.uniform1f(programs.bloomFinal.uniforms.intensity, cfg.BLOOM_INTENSITY)
    blit(gl, destination)
  }, [])

  // Apply sunrays effect
  const applySunrays = useCallback((source, mask, destination) => {
    const gl = glRef.current
    const programs = programsRef.current
    const cfg = configRef.current
    if (!gl || !programs) return

    gl.disable(gl.BLEND)
    programs.sunraysMask.bind()
    gl.uniform1i(programs.sunraysMask.uniforms.uTexture, source.attach(0))
    blit(gl, mask)

    programs.sunrays.bind()
    gl.uniform1f(programs.sunrays.uniforms.weight, cfg.SUNRAYS_WEIGHT)
    gl.uniform1i(programs.sunrays.uniforms.uTexture, mask.attach(0))
    blit(gl, destination)
  }, [])

  // Blur pass
  const blurPass = useCallback((target, temp, iterations) => {
    const gl = glRef.current
    const programs = programsRef.current
    if (!gl || !programs) return

    programs.blur.bind()
    for (let i = 0; i < iterations; i++) {
      gl.uniform2f(programs.blur.uniforms.texelSize, target.texelSizeX, 0.0)
      gl.uniform1i(programs.blur.uniforms.uTexture, target.attach(0))
      blit(gl, temp)

      gl.uniform2f(programs.blur.uniforms.texelSize, 0.0, target.texelSizeY)
      gl.uniform1i(programs.blur.uniforms.uTexture, temp.attach(0))
      blit(gl, target)
    }
  }, [])

  // Draw display
  const drawDisplay = useCallback((target) => {
    const gl = glRef.current
    const programs = programsRef.current
    const fbos = fbosRef.current
    const cfg = configRef.current
    if (!gl || !programs || !fbos) return

    const width = target == null ? gl.drawingBufferWidth : target.width
    const height = target == null ? gl.drawingBufferHeight : target.height

    programs.display.bind()
    if (cfg.SHADING) {
      gl.uniform2f(programs.display.uniforms.texelSize, 1.0 / width, 1.0 / height)
    }
    gl.uniform1i(programs.display.uniforms.uTexture, fbos.dye.read.attach(0))
    if (cfg.BLOOM) {
      gl.uniform1i(programs.display.uniforms.uBloom, fbos.bloom.attach(1))
    }
    if (cfg.SUNRAYS) {
      gl.uniform1i(programs.display.uniforms.uSunrays, fbos.sunrays.attach(2))
    }
    blit(gl, target)
  }, [])

  // Animation loop
  const animate = useCallback(() => {
    const now = Date.now()
    let dt = (now - lastUpdateTimeRef.current) / 1000
    dt = Math.min(dt, 0.016666)
    lastUpdateTimeRef.current = now

    renderCountRef.current++
    if (renderCountRef.current % 60 === 0) {
      console.log('🎨 Fluid: Rendered', renderCountRef.current, 'frames')
    }

    if (resizeCanvas()) {
      initFramebuffers()
    }

    // Update emotion config if transitioner exists
    if (emotionTransitionerRef.current) {
      const emotionConfig = emotionTransitionerRef.current.update()
      // Apply emotion config to simulation
      Object.assign(configRef.current, emotionConfig)
      updateKeywords()
    }

    step(dt)
    render()

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [resizeCanvas, initFramebuffers, step, render, updateKeywords])

  // Create splat
  const createSplat = useCallback((x, y, dx, dy, color) => {
    const gl = glRef.current
    const programs = programsRef.current
    const fbos = fbosRef.current
    const cfg = configRef.current
    const canvas = canvasRef.current
    if (!gl || !programs || !fbos || !canvas) {
      console.log('⚠️ Cannot create splat - missing refs:', { gl: !!gl, programs: !!programs, fbos: !!fbos, canvas: !!canvas })
      return
    }

    console.log('💧 Creating splat at', x, y, 'with velocity', dx, dy, 'and color', color)

    programs.splat.bind()
    gl.uniform1i(programs.splat.uniforms.uTarget, fbos.velocity.read.attach(0))
    gl.uniform1f(programs.splat.uniforms.aspectRatio, canvas.width / canvas.height)
    gl.uniform2f(programs.splat.uniforms.point, x, y)
    gl.uniform3f(programs.splat.uniforms.color, dx, dy, 0.0)
    gl.uniform1f(programs.splat.uniforms.radius, correctRadius(cfg.SPLAT_RADIUS / 100.0, canvas.width, canvas.height))
    blit(gl, fbos.velocity.write)
    fbos.velocity.swap()

    gl.uniform1i(programs.splat.uniforms.uTarget, fbos.dye.read.attach(0))
    gl.uniform3f(programs.splat.uniforms.color, color.r, color.g, color.b)
    blit(gl, fbos.dye.write)
    fbos.dye.swap()
  }, [canvasRef])

  // Update config
  const updateConfig = useCallback((newConfig) => {
    configRef.current = { ...configRef.current, ...newConfig }
    updateKeywords()
  }, [updateKeywords])

  // Set emotion
  const setEmotion = useCallback((emotionName, confidence) => {
    if (emotionTransitionerRef.current) {
      emotionTransitionerRef.current.setEmotion(emotionName, confidence)
    }
  }, [])

  return {
    createSplat,
    updateConfig,
    setEmotion,
    config: configRef.current
  }
}
