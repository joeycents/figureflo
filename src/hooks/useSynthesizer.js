import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

export const useSynthesizer = () => {
  const synthRef = useRef(null)
  const reverbRef = useRef(null)
  const filterRef = useRef(null)
  const [isStarted, setIsStarted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [instrument, setInstrument] = useState('piano')

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

    const createSampler = () => {
      setIsLoaded(false)
      if (instrument === 'piano') {
        return new Tone.Sampler(
          {
            A1: 'A1.mp3',
            C2: 'C2.mp3',
            C3: 'C3.mp3',
            C4: 'C4.mp3',
            C5: 'C5.mp3'
          },
          () => setIsLoaded(true),
          'https://tonejs.github.io/audio/salamander/'
        )
      }
      if (instrument === 'violin') {
        return new Tone.Sampler(
          {
            A3: 'A3.mp3',
            C4: 'C4.mp3',
            E4: 'E4.mp3',
            A4: 'A4.mp3',
            C5: 'C5.mp3'
          },
          () => setIsLoaded(true),
          'https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/violin/'
        )
      }
      return new Tone.Sampler(
        { C4: 'C4.mp3' },
        () => setIsLoaded(true),
        'https://tonejs.github.io/audio/salamander/'
      )
    }

    synthRef.current = createSampler().chain(filterRef.current, reverbRef.current, Tone.Destination)

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
    playNote,
    triggerAttack,
    triggerRelease,
    setFrequency,
    setFilterFrequency,
    setReverb,
    setVolume,
    isStarted,
    isPlaying,
    isLoaded,
    instrument,
    setInstrument
  }
}

