import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

export const useSynthesizer = () => {
  const synthRef = useRef(null)
  const reverbRef = useRef(null)
  const filterRef = useRef(null)
  const [isStarted, setIsStarted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

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

    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.05,
        decay: 0.3,
        sustain: 0.4,
        release: 1
      }
    }).chain(filterRef.current, reverbRef.current, Tone.Destination)

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
  }, [])

  const start = async () => {
    if (!isStarted) {
      await Tone.start()
      setIsStarted(true)
    }
  }

  const triggerAttack = (note, velocity = 0.5) => {
    if (synthRef.current && isStarted) {
      synthRef.current.triggerAttack(note, undefined, velocity)
      setIsPlaying(true)
    }
  }

  const triggerRelease = (note) => {
    if (synthRef.current && isStarted) {
      synthRef.current.triggerRelease(note)
      setIsPlaying(false)
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
    isPlaying
  }
}

