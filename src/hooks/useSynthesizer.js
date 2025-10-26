import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

// Verified working instruments from CDN + synthesizer options
const INSTRUMENTS = [
  // Basic Oscillator Synthesizers
  { id: 'synth-sine', name: 'Sine Wave', type: 'synth', oscillator: 'sine' },
  { id: 'synth-triangle', name: 'Triangle Wave', type: 'synth', oscillator: 'triangle' },
  { id: 'synth-sawtooth', name: 'Sawtooth Wave', type: 'synth', oscillator: 'sawtooth' },
  { id: 'synth-square', name: 'Square Wave', type: 'synth', oscillator: 'square' },
  
  // Advanced Tone.js Synthesizers
  { id: 'Synth', name: 'Basic Synth', type: 'tone-synth', synthType: 'Synth' },
  { id: 'MonoSynth', name: 'Mono Synth', type: 'tone-synth', synthType: 'MonoSynth' },
  { id: 'FMSynth', name: 'FM Synth', type: 'tone-synth', synthType: 'FMSynth' },
  { id: 'AMSynth', name: 'AM Synth', type: 'tone-synth', synthType: 'AMSynth' },
  { id: 'DuoSynth', name: 'Duo Synth', type: 'tone-synth', synthType: 'DuoSynth' },
  { id: 'PolySynth', name: 'Poly Synth', type: 'tone-synth', synthType: 'PolySynth' },
  { id: 'MembraneSynth', name: 'Membrane Synth', type: 'tone-synth', synthType: 'MembraneSynth' },
  { id: 'MetalSynth', name: 'Metal Synth', type: 'tone-synth', synthType: 'MetalSynth' },
  
  // Sampled instruments (from CDN)
  { id: 'bassoon', name: 'Bassoon', type: 'sampler', notes: ['A3', 'C4', 'E4', 'G4', 'A4'] },
  { id: 'cello', name: 'Cello', type: 'sampler', notes: ['C2', 'D2', 'E2', 'G2', 'A2', 'C3', 'D3', 'E3', 'G3', 'A3'] },
  { id: 'guitar-acoustic', name: 'Acoustic Guitar', type: 'sampler', notes: ['A2', 'C3', 'E3', 'A3', 'C4', 'E4'] },
  { id: 'violin', name: 'Violin', type: 'sampler', notes: ['A3', 'C4', 'E4', 'G4', 'A4', 'C5', 'E5'] }
]

export const useSynthesizer = () => {
  // Separate synths for left and right hand (melody)
  const leftSynthRef = useRef(null)
  const rightSynthRef = useRef(null)
  // Bass synths for harmonic depth
  const leftBassRef = useRef(null)
  const rightBassRef = useRef(null)
  const reverbRef = useRef(null)
  const leftFilterRef = useRef(null)
  const rightFilterRef = useRef(null)
  
  // Current notes for each hand (for rhythmic scheduling)
  const leftNoteRef = useRef(null)
  const rightNoteRef = useRef(null)
  const leftVelocityRef = useRef(0.5)
  const rightVelocityRef = useRef(0.5)
  const leftActiveRef = useRef(false)
  const rightActiveRef = useRef(false)
  
  const [isStarted, setIsStarted] = useState(false)
  const [leftPlaying, setLeftPlaying] = useState(false)
  const [rightPlaying, setRightPlaying] = useState(false)
  const [leftInstrumentIndex, setLeftInstrumentIndex] = useState(0)
  const [rightInstrumentIndex, setRightInstrumentIndex] = useState(0)
  const [isStopped, setIsStopped] = useState(false)
  const transportLoopRef = useRef(null)

  const createInstrument = (instrumentIndex) => {
    const config = INSTRUMENTS[instrumentIndex]
    if (!config) {
      return new Tone.Synth()
    }

    // Create basic synthesizer with oscillator
    if (config.type === 'synth') {
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: config.oscillator
        },
        envelope: {
          attack: 0.05,
          decay: 0.3,
          sustain: 0.4,
          release: 1
        }
      })
    }

    // Create advanced Tone.js synthesizer
    if (config.type === 'tone-synth') {
      const synthType = config.synthType
      
      // PolySynth is already polyphonic, don't wrap it
      if (synthType === 'PolySynth') {
        return new Tone.PolySynth(Tone.Synth)
      }
      
      // MembraneSynth and MetalSynth need special handling
      if (synthType === 'MembraneSynth' || synthType === 'MetalSynth') {
        return new Tone[synthType]()
      }
      
      // Wrap monophonic synths in PolySynth for polyphony
      if (synthType === 'MonoSynth' || synthType === 'DuoSynth') {
        return new Tone.PolySynth(Tone[synthType])
      }
      
      // Default: wrap in PolySynth
      return new Tone.PolySynth(Tone[synthType])
    }

    // Create sampler for acoustic instruments
    if (config.type === 'sampler') {
      const samples = {}
      config.notes.forEach(note => {
        samples[note] = `${note}.mp3`
      })

      const baseUrl = config.url || 
        `https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/${config.id}/`

      return new Tone.Sampler(samples, () => {
        console.log(`✅ ${config.name} loaded`)
      }, baseUrl)
    }

    return new Tone.Synth()
  }

  useEffect(() => {
    // Create shared reverb with musical settings
    reverbRef.current = new Tone.Reverb({
      decay: 2,
      wet: 0.2
    }).toDestination()

    // Create filters for each hand (brightness control)
    leftFilterRef.current = new Tone.Filter({
      type: 'lowpass',
      frequency: 2000,
      rolloff: -12
    })

    rightFilterRef.current = new Tone.Filter({
      type: 'lowpass',
      frequency: 2000,
      rolloff: -12
    })

    return () => {
      // Cleanup on unmount
      if (transportLoopRef.current) {
        transportLoopRef.current.stop()
        transportLoopRef.current.dispose()
      }
      if (leftSynthRef.current) leftSynthRef.current.dispose()
      if (rightSynthRef.current) rightSynthRef.current.dispose()
      if (leftBassRef.current) leftBassRef.current.dispose()
      if (rightBassRef.current) rightBassRef.current.dispose()
      if (leftFilterRef.current) leftFilterRef.current.dispose()
      if (rightFilterRef.current) rightFilterRef.current.dispose()
      if (reverbRef.current) reverbRef.current.dispose()
      Tone.Transport.stop()
      Tone.Transport.cancel()
    }
  }, [])

  // Left hand instrument (melody + bass)
  useEffect(() => {
    // Dispose old instruments safely
    try {
      if (leftSynthRef.current) {
        leftSynthRef.current.dispose()
      }
      if (leftBassRef.current) {
        leftBassRef.current.dispose()
      }
    } catch (e) {
      console.error('Error disposing left instruments:', e)
    }
    
    // Create melody synth
    leftSynthRef.current = createInstrument(leftInstrumentIndex)
      .chain(leftFilterRef.current, reverbRef.current)
    
    // Create bass synth for harmonic depth
    leftBassRef.current = new Tone.MonoSynth({
      oscillator: { type: 'square' },
      filter: { type: 'lowpass', frequency: 400 },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 1.2 }
    }).connect(new Tone.Filter(300, 'lowpass')).connect(reverbRef.current)
    
    console.log(`🎹 Left hand: ${INSTRUMENTS[leftInstrumentIndex].name}`)

    return () => {
      try {
        if (leftSynthRef.current) {
          leftSynthRef.current.dispose()
        }
        if (leftBassRef.current) {
          leftBassRef.current.dispose()
        }
      } catch (e) {
        console.error('Error cleaning up left instruments:', e)
      }
    }
  }, [leftInstrumentIndex])

  // Right hand instrument (melody + bass)
  useEffect(() => {
    // Dispose old instruments safely
    try {
      if (rightSynthRef.current) {
        rightSynthRef.current.dispose()
      }
      if (rightBassRef.current) {
        rightBassRef.current.dispose()
      }
    } catch (e) {
      console.error('Error disposing right instruments:', e)
    }
    
    // Create melody synth
    rightSynthRef.current = createInstrument(rightInstrumentIndex)
      .chain(rightFilterRef.current, reverbRef.current)
    
    // Create bass synth for harmonic depth
    rightBassRef.current = new Tone.MonoSynth({
      oscillator: { type: 'square' },
      filter: { type: 'lowpass', frequency: 400 },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 1.2 }
    }).connect(new Tone.Filter(300, 'lowpass')).connect(reverbRef.current)
    
    console.log(`🎹 Right hand: ${INSTRUMENTS[rightInstrumentIndex].name}`)

    return () => {
      try {
        if (rightSynthRef.current) {
          rightSynthRef.current.dispose()
        }
        if (rightBassRef.current) {
          rightBassRef.current.dispose()
        }
      } catch (e) {
        console.error('Error cleaning up right instruments:', e)
      }
    }
  }, [rightInstrumentIndex])

  const start = async () => {
    if (!isStarted) {
      await Tone.start()
      
      // Set BPM for rhythmic quantization (120 BPM = moderate tempo)
      Tone.Transport.bpm.value = 120
      
      // Create rhythmic loop - triggers every 8th note
      // This provides musical timing like in the sound field example
      transportLoopRef.current = new Tone.Loop((time) => {
        // Left hand
        if (leftActiveRef.current && leftNoteRef.current && !isStopped) {
          const note = leftNoteRef.current
          const velocity = leftVelocityRef.current
          
          // Trigger melody (safely handle different synth types)
          if (leftSynthRef.current) {
            try {
              // MembraneSynth and MetalSynth don't take note parameter
              if (leftSynthRef.current instanceof Tone.MembraneSynth || 
                  leftSynthRef.current instanceof Tone.MetalSynth) {
                leftSynthRef.current.triggerAttackRelease('8n', time, velocity)
              } else {
                leftSynthRef.current.triggerAttackRelease(note, '8n', time, velocity)
              }
            } catch (e) {
              console.error('Error triggering left synth:', e)
            }
          }
          
          // Trigger bass (one octave below)
          if (leftBassRef.current && note) {
            const bassNote = note.replace(/\d/, (match) => Math.max(1, parseInt(match) - 1))
            leftBassRef.current.triggerAttackRelease(bassNote, '4n', time, velocity * 0.8)
          }
        }
        
        // Right hand
        if (rightActiveRef.current && rightNoteRef.current && !isStopped) {
          const note = rightNoteRef.current
          const velocity = rightVelocityRef.current
          
          // Trigger melody (safely handle different synth types)
          if (rightSynthRef.current) {
            try {
              // MembraneSynth and MetalSynth don't take note parameter
              if (rightSynthRef.current instanceof Tone.MembraneSynth || 
                  rightSynthRef.current instanceof Tone.MetalSynth) {
                rightSynthRef.current.triggerAttackRelease('8n', time, velocity)
              } else {
                rightSynthRef.current.triggerAttackRelease(note, '8n', time, velocity)
              }
            } catch (e) {
              console.error('Error triggering right synth:', e)
            }
          }
          
          // Trigger bass (one octave below)
          if (rightBassRef.current && note) {
            const bassNote = note.replace(/\d/, (match) => Math.max(1, parseInt(match) - 1))
            rightBassRef.current.triggerAttackRelease(bassNote, '4n', time, velocity * 0.8)
          }
        }
      }, '8n')
      
      transportLoopRef.current.start(0)
      Tone.Transport.start()
      
      setIsStarted(true)
      console.log('🎵 Audio context started with rhythmic quantization')
    }
  }

  const stop = () => {
    setIsStopped(true)
    leftActiveRef.current = false
    rightActiveRef.current = false
    setLeftPlaying(false)
    setRightPlaying(false)
    console.log('🛑 Synthesizer stopped')
  }

  const resume = () => {
    setIsStopped(false)
    console.log('▶️ Synthesizer resumed')
  }

  // Update continuous parameters (called from gesture tracking)
  const updateParams = (hand, note, velocity, filterFreq, reverb) => {
    if (isStopped || !isStarted) return
    
    const isLeft = hand === 'Left'
    
    // Update note and velocity for rhythmic triggering
    if (isLeft) {
      leftNoteRef.current = note
      leftVelocityRef.current = velocity
      leftActiveRef.current = true
      setLeftPlaying(true)
    } else {
      rightNoteRef.current = note
      rightVelocityRef.current = velocity
      rightActiveRef.current = true
      setRightPlaying(true)
    }
    
    // Update filter frequency (brightness)
    const filter = isLeft ? leftFilterRef.current : rightFilterRef.current
    if (filter) {
      filter.frequency.rampTo(filterFreq, 0.2)
    }
    
    // Update reverb (spatial depth)
    if (reverbRef.current) {
      reverbRef.current.wet.rampTo(reverb, 0.3)
    }
  }
  
  const stopHand = (hand) => {
    const isLeft = hand === 'Left'
    
    if (isLeft) {
      leftActiveRef.current = false
      setLeftPlaying(false)
    } else {
      rightActiveRef.current = false
      setRightPlaying(false)
    }
  }

  const cycleInstrument = (hand, direction) => {
    if (hand === 'Left') {
      setLeftInstrumentIndex(prev => {
        const next = direction === 'up' 
          ? (prev + 1) % INSTRUMENTS.length 
          : (prev - 1 + INSTRUMENTS.length) % INSTRUMENTS.length
        console.log(`👍 Left hand instrument: ${INSTRUMENTS[next].name}`)
        return next
      })
    } else {
      setRightInstrumentIndex(prev => {
        const next = direction === 'up' 
          ? (prev + 1) % INSTRUMENTS.length 
          : (prev - 1 + INSTRUMENTS.length) % INSTRUMENTS.length
        console.log(`👍 Right hand instrument: ${INSTRUMENTS[next].name}`)
        return next
      })
    }
  }

  // Dummy recording function (not implemented yet)
  const startRecording = () => {
    console.log('🎙️ Recording started (dummy function)')
  }

  const stopRecording = () => {
    console.log('⏹️ Recording stopped (dummy function)')
  }

  return {
    start,
    stop,
    resume,
    updateParams,
    stopHand,
    cycleInstrument,
    startRecording,
    stopRecording,
    isStarted,
    isPlaying: leftPlaying || rightPlaying,
    leftPlaying,
    rightPlaying,
    isStopped,
    leftInstrument: INSTRUMENTS[leftInstrumentIndex],
    rightInstrument: INSTRUMENTS[rightInstrumentIndex],
    instruments: INSTRUMENTS
  }
}

