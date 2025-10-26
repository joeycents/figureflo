import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

// Verified working instruments from CDN + synthesizer options
const INSTRUMENTS = {
  // Basic Oscillator Synthesizers
  'synth-sine': { type: 'synth', oscillator: 'sine' },
  'synth-triangle': { type: 'synth', oscillator: 'triangle' },
  'synth-sawtooth': { type: 'synth', oscillator: 'sawtooth' },
  'synth-square': { type: 'synth', oscillator: 'square' },
  
  // Advanced Tone.js Synthesizers
  'Synth': { type: 'tone-synth', synthType: 'Synth' },
  'MonoSynth': { type: 'tone-synth', synthType: 'MonoSynth' },
  'FMSynth': { type: 'tone-synth', synthType: 'FMSynth' },
  'AMSynth': { type: 'tone-synth', synthType: 'AMSynth' },
  'DuoSynth': { type: 'tone-synth', synthType: 'DuoSynth' },
  'PolySynth': { type: 'tone-synth', synthType: 'PolySynth' },
  'MembraneSynth': { type: 'tone-synth', synthType: 'MembraneSynth' },
  'MetalSynth': { type: 'tone-synth', synthType: 'MetalSynth' },
  
  // Sampled instruments (from CDN)
  'bassoon': { type: 'sampler', notes: ['A3', 'C4', 'E4', 'G4', 'A4'] },
  'cello': { type: 'sampler', notes: ['C2', 'D2', 'E2', 'G2', 'A2', 'C3', 'D3', 'E3', 'G3', 'A3'] },
  'guitar-acoustic': { type: 'sampler', notes: ['A2', 'C3', 'E3', 'A3', 'C4', 'E4'] },
  'violin': { type: 'sampler', notes: ['A3', 'C4', 'E4', 'G4', 'A4', 'C5', 'E5'] }
}

export const useSynthesizer = () => {
  const synthRef = useRef(null)
  const reverbRef = useRef(null)
  const filterRef = useRef(null)
  const [isStarted, setIsStarted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [instrument, setInstrument] = useState('synth-sine')
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    // Create audio chain: Synth -> Filter -> Reverb -> Output
    filterRef.current = new Tone.Filter({
      type: 'lowpass',
      frequency: 2000,
      rolloff: -24
    })

    reverbRef.current = new Tone.Reverb({
      decay: 3,
      wet: 0.3
    })

    const createInstrument = () => {
      setIsLoaded(false)
      setLoadError(null)
      
      const config = INSTRUMENTS[instrument]
      if (!config) {
        setLoadError(`Instrument "${instrument}" not available`)
        return new Tone.Synth()
      }

      // Create basic synthesizer with oscillator
      if (config.type === 'synth') {
        setIsLoaded(true)
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
        setIsLoaded(true)
        const synthType = config.synthType
        
        // Special handling for polyphonic synths
        if (synthType === 'PolySynth') {
          return new Tone.PolySynth(Tone.Synth)
        }
        
        // MonoSynth and DuoSynth are monophonic, wrap in PolySynth for multiple notes
        if (synthType === 'MonoSynth' || synthType === 'DuoSynth') {
          return new Tone.PolySynth(Tone[synthType])
        }
        
        // Other synths
        return new Tone.PolySynth(Tone[synthType])
      }

      // Create sampler for acoustic instruments
      if (config.type === 'sampler') {
        const samples = {}
        config.notes.forEach(note => {
          samples[note] = `${note}.mp3`
        })

        const baseUrl = config.url || 
          `https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/${instrument}/`

        return new Tone.Sampler(
          samples,
          () => {
            setIsLoaded(true)
            setLoadError(null)
          },
          baseUrl
        )
      }

      // Fallback
      setIsLoaded(true)
      return new Tone.Synth()
    }

    synthRef.current = createInstrument().chain(filterRef.current, reverbRef.current, Tone.Destination)

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose()
      }
      if (filterRef.current) {
        filterRef.current.dispose()
      }
      if (reverbRef.current) {
        reverbRef.current.dispose()
      }
    }
  }, [instrument])

  const start = async () => {
    if (!isStarted) {
      await Tone.start()
      setIsStarted(true)
    }
  }

  const playNote = (note, duration = '8n', velocity = 0.5) => {
    if (synthRef.current && isStarted && isLoaded) {
      synthRef.current.triggerAttackRelease(note, duration, undefined, velocity)
      setIsPlaying(true)
      setTimeout(() => setIsPlaying(false), Tone.Time(duration).toMilliseconds())
    }
  }

  const triggerAttack = (note, velocity = 0.5) => {
    if (synthRef.current && isStarted && isLoaded) {
      synthRef.current.triggerAttack(note, undefined, velocity)
      setIsPlaying(true)
    }
  }

  const triggerRelease = (note) => {
    if (synthRef.current && isStarted && isLoaded) {
      synthRef.current.triggerRelease(note)
      setIsPlaying(false)
    }
  }

  const setFrequency = (freq) => {
    if (synthRef.current && isStarted && isLoaded && 'set' in synthRef.current) {
      synthRef.current.set({ frequency: freq })
    }
  }

  const setFilterFrequency = (freq) => {
    if (filterRef.current) {
      filterRef.current.frequency.rampTo(freq, 0.1)
    }
  }

  const setReverb = (wet) => {
    if (reverbRef.current) {
      reverbRef.current.wet.value = wet
    }
  }

  const setVolume = (volume) => {
    if (synthRef.current) {
      synthRef.current.volume.value = volume
    }
  }

  return {
    start,
    triggerAttack,
    triggerRelease,
    setFilterFrequency,
    setReverb,
    setVolume,
    isStarted,
    isPlaying,
    isLoaded,
    instrument,
    setInstrument,
    loadError
  }
}

