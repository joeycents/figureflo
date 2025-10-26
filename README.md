# FigureFlo

A gesture-controlled synthesizer with real-time facial emotion detection. Uses MediaPipe for hand tracking, Tone.js for audio synthesis, and Hume AI for emotion analysis.

## Tech Stack

- **Frontend**: React + Vite
- **Hand Tracking**: MediaPipe.js (tasks-vision)
- **Audio Synthesis**: Tone.js
- **Emotion Detection**: Hume AI API
- **Deployment**: Google Cloud Platform

## Prerequisites

- **Node.js**: v18 or higher (MediaPipe.js works best with modern Node versions)
- **npm** or **yarn**
- A modern web browser with WebGL support (Chrome/Edge recommended for best MediaPipe performance)

> **Note**: You don't need Python for this project! MediaPipe.js runs entirely in the browser.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Hume AI API** (required for emotion detection):
   - Sign up at [Hume AI Developer Platform](https://dev.hume.ai/)
   - Get your API key
   - Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   - Add your API key to `.env`:
   ```
   VITE_HUME_API_KEY=your_actual_api_key_here
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:5173`

## Project Structure

```
figureflo/
├── src/
│   ├── App.jsx                    # Main application component
│   ├── App.css                    # App styles
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Global styles
│   ├── hooks/
│   │   ├── useHandTracking.js     # MediaPipe hand tracking
│   │   ├── useSynthesizer.js      # Tone.js audio synthesis
│   │   └── useEmotionDetection.js # Hume AI emotion detection
│   └── utils/
│       └── gestureMapping.js      # Gesture to audio parameter mapping
├── index.html                     # HTML template
├── vite.config.js                 # Vite configuration
├── .env.example                   # Environment variables template
└── package.json                   # Dependencies and scripts
```

## Features

### 🎹 Gesture-Controlled Music
- **Hand Height**: Controls pitch (higher hand = higher note)
- **Hand Position**: Controls filter frequency (left to right)
- **Pinch Gesture**: Triggers notes (thumb + index finger)
- **Hand Openness**: Controls reverb amount

### 😊 Real-Time Emotion Detection
- Live facial emotion analysis using Hume AI
- Displays dominant emotion with confidence score
- Clean badge display above video feed
- Updates continuously while playing

## Installed Dependencies

- `@mediapipe/tasks-vision` (v0.10.14) - Hand detection
- `tone` (v15.0.4) - Audio synthesis
- `react` (v18.3.1) - UI framework
- `vite` (v5.4.0) - Build tool and dev server
- Hume AI API - Facial emotion detection (via WebSocket Streaming API)

## How to Use

1. **Allow camera access** when prompted
2. Click **"Start Synthesizer"** to enable audio
3. **Position your hand** in front of the camera:
   - Move hand up/down to change pitch
   - Move hand left/right to adjust filter
   - Pinch thumb and index finger to play notes
   - Open/close hand to control reverb
4. **Watch your emotion** displayed as a badge below the header in real-time

## Development

The project uses Vite for fast development and hot module replacement. Changes to your code will automatically reload in the browser.

### Environment Variables

- `VITE_HUME_API_KEY`: Your Hume AI API key (required for emotion detection)

### API Implementation

The emotion detection uses Hume AI's **WebSocket Streaming API** for real-time facial emotion analysis. Frames are sent every 1 second (1 fps) for processing. The WebSocket connection provides:

- Real-time emotion detection (no polling required)
- Automatic reconnection on connection loss
- Lower latency compared to the Batch API

**Note**: The Streaming API requires a valid API key with streaming permissions enabled on your Hume AI account.

## Troubleshooting

### Emotion Detection Issues

If emotion detection isn't working:

1. **Check your API key**:
   - Verify `VITE_HUME_API_KEY` is set in your `.env` file
   - Ensure the API key is active in your [Hume AI Dashboard](https://platform.hume.ai/)
   - Confirm your key has **streaming API permissions** enabled

2. **Check the browser console**:
   - Open Developer Tools (F12) and look at the Console tab
   - Look for messages like "✅ Connected to Hume WebSocket" (success)
   - Check for any WebSocket errors or API error messages

3. **Verify your face is visible**:
   - Ensure your face is clearly visible in the video feed
   - Check lighting conditions (good lighting improves detection)
   - Face the camera directly

4. **API Key Format**:
   - Make sure there are no extra spaces in your `.env` file
   - The format should be: `VITE_HUME_API_KEY=your_key_here` (no quotes needed)

5. **Restart the dev server** after changing `.env`:
   ```bash
   # Stop the server (Ctrl+C) then:
   npm run dev
   ```

### Other Issues

- **Camera not working**: Ensure you've granted camera permissions in your browser
- **Audio not playing**: Click the "Start Synthesizer" button to initialize the audio context
- **WebSocket connection errors**: Check your network connection and firewall settings

