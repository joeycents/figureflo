import { useEffect, useRef, useState } from 'react'
import { HandLandmarker, GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision'

export const useHandTracking = (videoRef, canvasRef) => {
  const [handData, setHandData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const handLandmarkerRef = useRef(null)
  const gestureRecognizerRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    let stream = null

    const initializeHandTracking = async () => {
      try {
        setIsLoading(true)

        // Request webcam access first (this triggers the browser prompt)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 }
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        // Now initialize MediaPipe in parallel
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        )

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

        // Also create gesture recognizer
        gestureRecognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2
        })

        // Wait for video to be ready, then start tracking
        if (videoRef.current) {
          if (videoRef.current.readyState >= 2) {
            startTracking()
          } else {
            videoRef.current.addEventListener('loadeddata', startTracking)
          }
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Error initializing hand tracking:', err)
        setError(err.message || 'Failed to initialize hand tracking')
        setIsLoading(false)
      }
    }

    const startTracking = () => {
      if (!videoRef.current || !handLandmarkerRef.current || !gestureRecognizerRef.current) return

      const detectHands = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const startTimeMs = performance.now()
          
          // Get landmarks from HandLandmarker
          const landmarkResults = handLandmarkerRef.current.detectForVideo(
            videoRef.current,
            startTimeMs
          )

          // Get gestures from GestureRecognizer
          const gestureResults = gestureRecognizerRef.current.recognizeForVideo(
            videoRef.current,
            startTimeMs
          )

          // Combine results
          const combinedResults = {
            landmarks: landmarkResults.landmarks,
            worldLandmarks: landmarkResults.worldLandmarks,
            handedness: landmarkResults.handednesses,
            gestures: gestureResults.gestures,
            gestureHandedness: gestureResults.handednesses
          }

          // Draw on canvas
          if (canvasRef.current && combinedResults.landmarks) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw landmarks
            combinedResults.landmarks.forEach((landmarks) => {
              landmarks.forEach((landmark, index) => {
                const x = landmark.x * canvas.width
                const y = landmark.y * canvas.height

                // Draw point
                ctx.fillStyle = '#F8B83A'
                ctx.beginPath()
                ctx.arc(x, y, 5, 0, 2 * Math.PI)
                ctx.fill()

                // Draw connections
                if (index > 0) {
                  ctx.strokeStyle = '#F8B83A'
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

          setHandData(combinedResults)
        }

        animationFrameRef.current = requestAnimationFrame(detectHands)
      }

      detectHands()
    }

    initializeHandTracking()

    return () => {
      // Stop animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      // Stop webcam stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      
      // Clean up video element
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadeddata', startTracking)
        videoRef.current.srcObject = null
      }
      
      // Close MediaPipe hand landmarker
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close()
        handLandmarkerRef.current = null
      }

      // Close MediaPipe gesture recognizer
      if (gestureRecognizerRef.current) {
        gestureRecognizerRef.current.close()
        gestureRecognizerRef.current = null
      }
    }
  }, [videoRef, canvasRef])

  return { handData, isLoading, error }
}

