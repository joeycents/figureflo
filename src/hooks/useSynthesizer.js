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
  // Separate synths for left and right hand
  const leftSynthRef = useRef(null)
  const rightSynthRef = useRef(null)
  const reverbRef = useRef(null)
  const leftFilterRef = useRef(null)
  const rightFilterRef = useRef(null)
  
  const [isStarted, setIsStarted] = useState(false)
  const [leftPlaying, setLeftPlaying] = useState(false)
  const [rightPlaying, setRightPlaying] = useState(false)
  const [leftInstrumentIndex, setLeftInstrumentIndex] = useState(0)
  const [rightInstrumentIndex, setRightInstrumentIndex] = useState(0)
  const [isStopped, setIsStopped] = useState(false)

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
      
      if (synthType === 'PolySynth') {
        return new Tone.PolySynth(Tone.Synth)
      }
      
      if (synthType === 'MonoSynth' || synthType === 'DuoSynth') {
        return new Tone.PolySynth(Tone[synthType])
      }
      
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
    // Create shared reverb
    reverbRef.current = new Tone.Reverb({
      decay: 3,
      wet: 0.3
    })

    // Create filters for each hand
    leftFilterRef.current = new Tone.Filter({
      type: 'lowpass',
      frequency: 2000,
      rolloff: -24
    })

    rightFilterRef.current = new Tone.Filter({
      type: 'lowpass',
      frequency: 2000,
      rolloff: -24
    })

    return () => {
      if (leftFilterRef.current) leftFilterRef.current.dispose()
      if (rightFilterRef.current) rightFilterRef.current.dispose()
      if (reverbRef.current) reverbRef.current.dispose()
    }
  }, [])

  // Left hand instrument
  useEffect(() => {
    if (leftSynthRef.current) {
      leftSynthRef.current.dispose()
    }
    
    leftSynthRef.current = createInstrument(leftInstrumentIndex)
      .chain(leftFilterRef.current, reverbRef.current, Tone.Destination)
    
    console.log(`🎹 Left hand: ${INSTRUMENTS[leftInstrumentIndex].name}`)

    return () => {
      if (leftSynthRef.current) {
        leftSynthRef.current.dispose()
      }
    }
  }, [leftInstrumentIndex])

  // Right hand instrument
  useEffect(() => {
    if (rightSynthRef.current) {
      rightSynthRef.current.dispose()
    }
    
    rightSynthRef.current = createInstrument(rightInstrumentIndex)
      .chain(rightFilterRef.current, reverbRef.current, Tone.Destination)
    
    console.log(`🎹 Right hand: ${INSTRUMENTS[rightInstrumentIndex].name}`)

    return () => {
      if (rightSynthRef.current) {
        rightSynthRef.current.dispose()
      }
    }
  }, [rightInstrumentIndex])

  const start = async () => {
    if (!isStarted) {
      await Tone.start()
      setIsStarted(true)
      console.log('🎵 Audio context started')
    }
  }

  const stop = () => {
    setIsStopped(true)
    if (leftSynthRef.current) leftSynthRef.current.releaseAll()
    if (rightSynthRef.current) rightSynthRef.current.releaseAll()
    setLeftPlaying(false)
    setRightPlaying(false)
    console.log('🛑 Synthesizer stopped')
  }

  const resume = () => {
    setIsStopped(false)
    console.log('▶️ Synthesizer resumed')
  }

  const triggerAttack = (hand, note, velocity = 0.5) => {
    if (isStopped || !isStarted) return
    
    const synth = hand === 'Left' ? leftSynthRef.current : rightSynthRef.current
    const setPlaying = hand === 'Left' ? setLeftPlaying : setRightPlaying
    
    if (synth) {
      synth.triggerAttack(note, undefined, velocity)
      setPlaying(true)
    }
  }

  const triggerRelease = (hand, note) => {
    const synth = hand === 'Left' ? leftSynthRef.current : rightSynthRef.current
    const setPlaying = hand === 'Left' ? setLeftPlaying : setRightPlaying
    
    if (synth) {
      synth.triggerRelease(note)
      setPlaying(false)
    }
  }

  const setFilterFrequency = (hand, freq) => {
    const filter = hand === 'Left' ? leftFilterRef.current : rightFilterRef.current
    if (filter) {
      filter.frequency.rampTo(freq, 0.1)
    }
  }

  const setReverb = (wet) => {
    if (reverbRef.current) {
      reverbRef.current.wet.value = wet
    }
  }

  const setVolume = (hand, volume) => {
    const synth = hand === 'Left' ? leftSynthRef.current : rightSynthRef.current
    if (synth) {
      synth.volume.value = volume
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
    triggerAttack,
    triggerRelease,
    setFilterFrequency,
    setReverb,
    setVolume,
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

