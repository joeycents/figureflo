# FigureFlo

A gesture-controlled synthesizer using MediaPipe for hand and arm tracking, and Tone.js for audio synthesis.

## Tech Stack

- **Frontend**: React + Vite
- **Gesture Recognition**: MediaPipe.js (tasks-vision)
- **Audio Synthesis**: Tone.js
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

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3000`

## Project Structure

```
figureflo/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # App styles
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies and scripts
```

## Installed Dependencies

- `@mediapipe/tasks-vision` (v0.10.14) - Hand and pose detection
- `tone` (v15.0.4) - Audio synthesis
- `react` (v18.3.1) - UI framework
- `vite` (v5.4.0) - Build tool and dev server

## Next Steps

1. Integrate MediaPipe hand tracking
2. Set up Tone.js synthesizer
3. Map gestures to audio parameters
4. Add camera feed display
5. Configure GCP deployment

## Development

The project uses Vite for fast development and hot module replacement. Changes to your code will automatically reload in the browser.

