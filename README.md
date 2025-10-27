# FigureFlo

[Demo](https://youtu.be/FaUGAlclXok)

A gesture-controlled musical synthesizer with real-time fluid visualization. Control music with your hands like a digital conductor — your movements create both sound and stunning visual art.

## 🎵 What it does

FigureFlo uses computer vision to detect your hand movements and translate them into music. Different gestures control playback, switch instruments, and modulate sound parameters. As you play, a WebGL-based fluid simulation visualizes your performance in real-time, creating a synesthetic experience that combines motion, music, and visual art.

## 🛠 Tech Stack

- **Frontend**: React + Vite
- **Hand Tracking**: MediaPipe.js (tasks-vision)
- **Audio Synthesis**: Tone.js with sampled instruments
- **Fluid Simulation**: WebGL (based on PavelDoGreat/WebGL-Fluid-Simulation)
- **Deployment**: Vercel

## Prerequisites

- **Node.js**: v18 or higher (MediaPipe.js works best with modern Node versions)
- **npm** or **yarn**
- A modern web browser with WebGL support (Chrome/Edge recommended for best MediaPipe performance)
- A working webcam

> **Note**: This project runs entirely in the browser — no Python or backend required!

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
   Navigate to `http://localhost:5173`

4. **Allow camera access** when prompted

5. **Complete the calibration**:
   Follow the on-screen instructions to calibrate your gestures

## Project Structure

```
figureflo/
├── src/
│   ├── App.jsx                    # Main application component
│   ├── App.css                    # App styles
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Global styles
│   ├── components/
│   │   ├── CalibrationOverlay.jsx # Calibration UI component
│   │   └── CalibrationOverlay.css # Calibration styles
│   ├── hooks/
│   │   ├── useHandTracking.js     # MediaPipe hand tracking
│   │   ├── useSynthesizer.js      # Tone.js audio synthesis
│   │   ├── useCalibration.js      # Gesture calibration system
│   │   ├── useFluidSimulation.js  # WebGL fluid simulation
│   │   └── useEmotionDetection.js # (Legacy - currently unused)
│   └── utils/
│       ├── gestureMapping.js      # Maps gestures to audio parameters
│       ├── gestureDetection.js    # Gesture recognition logic
│       ├── fluidHelpers.js        # Fluid simulation utilities
│       ├── fluidPrograms.js       # WebGL shader programs
│       ├── fluidShaders.js        # GLSL shader code
│       └── emotionFluidMapping.js # Emotion-based color palettes
├── WebGL-Fluid-Simulation/       # Third-party fluid simulation
├── index.html                     # HTML template
├── vite.config.js                 # Vite configuration
└── package.json                   # Dependencies and scripts
```

## ✨ Features

### 🎹 Gesture-Controlled Music
- **Victory Sign (Both Hands)**: Hold for 2 seconds to enable music playback
- **Pinch Gesture**: Touch thumb to index finger to activate sound
- **Hand Height**: Controls pitch (quantized to pentatonic scale for pleasant sounds)
- **Horizontal Position**: Controls brightness/timbre (left = dark, right = bright)
- **Automatic Bass**: Each hand plays melody plus harmonized bass notes
- **Rhythmic Quantization**: Notes sync to musical timing (8th notes at 120 BPM)

### 🎨 Fluid Visualization
- **Real-time WebGL simulation**: Beautiful fluid dynamics respond to hand movements
- **Color mapping**: Musical notes map to specific hues on the color spectrum
- **Velocity-based intensity**: Faster movements create brighter, more intense fluid effects
- **Emotion-influenced palettes**: (Legacy feature - color system can adapt to emotions)

### 🎮 Advanced Controls
- **Thumbs Up**: Cycle to next instrument
- **Thumbs Down**: Cycle to previous instrument
- **Both Hands Open**: Hold for 5 seconds to stop playback
- **Both Fists**: Hold for 2 seconds to start recording (placeholder feature)

### 📐 Calibration System
- **Interactive onboarding**: Learn gestures through guided calibration
- **Visual feedback**: Progress bars and success animations
- **Skip option**: Experienced users can skip calibration steps

## 📦 Installed Dependencies

- `@mediapipe/tasks-vision` (v0.10.14) - Hand detection and tracking
- `tone` (v15.0.4) - Audio synthesis and sampled instruments
- `react` (v18.3.1) - UI framework
- `react-dom` (v18.3.1) - React rendering
- `vite` (v5.4.21) - Build tool and dev server

## 🎮 How to Use

1. **Launch the app** and allow camera access when prompted
2. **Complete calibration** by following the on-screen instructions for each gesture
3. Click **"Start Synthesizer"** to enable audio
4. **Perform a victory sign** with both hands (✌️✌️) and hold for 2 seconds to enable playing
5. **Pinch your fingers** (thumb + index) and move your hands to create music:
   - Move hands **up/down** to change pitch
   - Move hands **left/right** to adjust brightness/timbre
   - Watch the **fluid simulation** respond to your movements
6. **Try different instruments** using thumbs up 👍 or thumbs down 👎
7. **Stop playing** by holding both hands open (🖐️🖐️) for 5 seconds

## 🔧 Development

The project uses Vite for fast development and hot module replacement. Changes to your code will automatically reload in the browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Key Technical Features

- **MediaPipe Hand Tracking**: 21 hand landmarks per hand with gesture recognition
- **Musical Quantization**: Notes snap to pentatonic scale for pleasant harmonies
- **Dual Audio Layers**: Melody + bass harmony for richer sound
- **WebGL Fluid Dynamics**: Real-time simulation with velocity-based rendering
- **Calibration System**: Progressive onboarding with hold-to-confirm gestures

## 🐛 Troubleshooting

### Camera Issues

- **Camera not working**: Ensure you've granted camera permissions in your browser settings
- **Poor tracking**: Make sure you have good lighting and your hands are clearly visible
- **Webcam shows black screen**: Try refreshing the page or restarting your browser

### Audio Issues

- **No sound**: Click the "Start Synthesizer" button to initialize the audio context
- **Audio cutting out**: Ensure you're pinching your fingers (thumb + index) to trigger notes
- **Delayed audio**: This is normal for browser-based audio synthesis; try closing other tabs

### Performance Issues

- **Laggy fluid simulation**: Try closing other browser tabs or applications
- **Hand tracking stuttering**: Ensure good lighting and reduce background clutter
- **Browser freezing**: Chrome/Edge typically perform best; try using a Chromium-based browser

### Gesture Recognition Issues

- **Gestures not detecting**: Complete the calibration to learn proper hand positions
- **Wrong hand detected**: MediaPipe sometimes swaps left/right; try repositioning your hands
- **Victory sign not working**: Make sure both hands show clear victory signs (✌️) simultaneously

## 🎓 What We Learned

- In-depth understanding of MediaPipe hand tracking and landmark detection
- Sound design and musical quantization using Tone.js
- Integrating real-time systems (audio, video, and WebGL rendering)
- Effective AI-assisted pair programming for rapid prototyping
- WebGL shader programming for fluid dynamics
- Project management with a small team and tight deadlines

## 🚀 What's Next

We have many ideas to improve FigureFlo:

- **Improved UI/UX**: Polish the interface and add more visual feedback
- **Real Songs Integration**: Play along with actual songs, including "stems" (isolated instruments like drums, bass, etc.)
- **Haptic Vibrations**: Add tactile feedback for supported devices
- **Recording/Export**: "Share your flo!" - Record and save your performances
- **Multi-user Mode**: Collaborate with friends in real-time
- **Custom Instruments**: Upload and use your own sound samples
- **Mobile Support**: Optimize for tablet and phone use

## 📝 Credits

- **WebGL Fluid Simulation**: Based on [PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)
- **Instrument Samples**: From [nbrosowsky/tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments)
- **Hand Tracking**: Google MediaPipe
- **Audio Engine**: Tone.js

---

Built with ❤️ during a hackathon. Every line of code written during the event!

