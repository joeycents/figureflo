import { useEffect, useRef, useState } from 'react'
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export const useHandTracking = (videoRef, canvasRef) => {
  const [handData, setHandData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const handLandmarkerRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    let stream = null

    const initializeHandTracking = async () => {
      try {
        setIsLoading(true)
        console.log('Starting hand tracking initialization...')

        // Request webcam access first (this triggers the browser prompt)
        console.log('Requesting webcam access...')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 }
        })
        console.log('Webcam access granted!')

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        // Now initialize MediaPipe in parallel
        console.log('Loading MediaPipe models...')
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        )
        console.log('MediaPipe wasm loaded, creating hand landmarker...')

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        })
        console.log('Hand landmarker created successfully!')

        // Wait for video to be ready, then start tracking
        if (videoRef.current) {
          if (videoRef.current.readyState >= 2) {
            startTracking()
          } else {
            videoRef.current.addEventListener('loadeddata', startTracking)
          }
        }

        setIsLoading(false)
        console.log('Hand tracking fully initialized!')
      } catch (err) {
        console.error('Error initializing hand tracking:', err)
        setError(err.message || 'Failed to initialize hand tracking')
        setIsLoading(false)
      }
    }

    const startTracking = () => {
      if (!videoRef.current || !handLandmarkerRef.current) return

      const detectHands = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const startTimeMs = performance.now()
          const results = handLandmarkerRef.current.detectForVideo(
            videoRef.current,
            startTimeMs
          )

          // Draw on canvas
          if (canvasRef.current && results.landmarks) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw landmarks
            results.landmarks.forEach((landmarks) => {
              landmarks.forEach((landmark, index) => {
                const x = landmark.x * canvas.width
                const y = landmark.y * canvas.height

                // Draw point
                ctx.fillStyle = '#00ff00'
                ctx.beginPath()
                ctx.arc(x, y, 5, 0, 2 * Math.PI)
                ctx.fill()

                // Draw connections
                if (index > 0) {
                  ctx.strokeStyle = '#00ff00'
                  ctx.lineWidth = 2
                  ctx.beginPath()
                  const prevLandmark = landmarks[index - 1]
                  ctx.moveTo(prevLandmark.x * canvas.width, prevLandmark.y * canvas.height)
                  ctx.lineTo(x, y)
                  ctx.stroke()
                }
              })
            })
          }

          setHandData(results)
        }

        animationFrameRef.current = requestAnimationFrame(detectHands)
      }

      detectHands()
    }

    initializeHandTracking()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadeddata', startTracking)
      }
    }
  }, [videoRef, canvasRef])

  return { handData, isLoading, error }
}

