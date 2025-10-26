import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Custom hook for detecting facial emotions using Hume AI WebSocket Streaming API
 * Provides real-time emotion detection from video feed
 */
export const useEmotionDetection = (videoRef, isEnabled = false) => {
  const [emotions, setEmotions] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  
  const wsRef = useRef(null)
  const canvasRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const frameIntervalRef = useRef(null)

  // Get API key from environment
  const apiKey = import.meta.env.VITE_HUME_API_KEY

  /**
   * Capture a frame from the video element and convert to base64
   */
  const captureFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      return null
    }

    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Use smaller resolution for faster processing
    const targetWidth = 640
    const targetHeight = (video.videoHeight / video.videoWidth) * targetWidth
    
    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight)

    // Convert to base64 (just the data, no prefix)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    return dataUrl.split(',')[1]
  }, [videoRef])

  /**
   * Connect to Hume WebSocket streaming API
   */
  const connectWebSocket = useCallback(() => {
    if (!apiKey) {
      setError('Hume API key not found. Please set VITE_HUME_API_KEY in your .env file')
      return
    }

    if (!isEnabled) {
      return
    }

    try {
      console.log('Connecting to Hume WebSocket API...')
      
      // Connect to Hume's streaming API
      const ws = new WebSocket(
        `wss://api.hume.ai/v0/stream/models?apikey=${apiKey}`
      )

      ws.onopen = () => {
        console.log('✅ Connected to Hume WebSocket')
        setError(null)
        setIsProcessing(false)

        // Send configuration message
        ws.send(JSON.stringify({
          models: {
            face: {}
          }
        }))

        // Start sending frames
        if (frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current)
        }

        frameIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const frameData = captureFrame()
            if (frameData) {
              ws.send(JSON.stringify({
                data: frameData,
                models: {
                  face: {}
                }
              }))
              setIsProcessing(true)
            }
          }
        }, 1000) // Send frame every second
      }

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data)
          
          // Handle different response types
          if (response.face?.predictions && response.face.predictions.length > 0) {
            const prediction = response.face.predictions[0]
            
            if (prediction.emotions && prediction.emotions.length > 0) {
              // Sort emotions by score
              const sortedEmotions = [...prediction.emotions]
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
              
              setEmotions({
                topEmotion: sortedEmotions[0],
                allEmotions: sortedEmotions,
                timestamp: Date.now()
              })
              setIsProcessing(false)
              setError(null)
            }
          } else if (response.error) {
            console.error('Hume API error:', response.error)
            setError(response.error.message || 'Unknown error from Hume API')
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('WebSocket connection error. Check your API key and network connection.')
        setIsProcessing(false)
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        setIsProcessing(false)
        
        // Clear frame sending interval
        if (frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current)
          frameIntervalRef.current = null
        }

        // Attempt to reconnect if closed unexpectedly and still enabled
        if (isEnabled && event.code !== 1000) {
          console.log('Attempting to reconnect in 3 seconds...')
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, 3000)
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Error creating WebSocket:', err)
      setError(err.message)
      setIsProcessing(false)
    }
  }, [apiKey, isEnabled, captureFrame])

  /**
   * Initialize WebSocket connection when enabled
   */
  useEffect(() => {
    if (isEnabled && apiKey) {
      connectWebSocket()
    }

    return () => {
      // Cleanup
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current)
        frameIntervalRef.current = null
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting')
        wsRef.current = null
      }
    }
  }, [isEnabled, apiKey, connectWebSocket])

  return {
    emotions,
    isProcessing,
    error,
    hasApiKey: !!apiKey
  }
}


