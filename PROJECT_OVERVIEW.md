## Inspiration
What if your hands could truly control something dynamic and expressive?

Our idea began with a project we once saw that used lasers projected on a wall, seemingly reacting to hand movements. We wanted to take that concept further — to make something where motion and interaction were real, not just simulated.

At first, we planned to use a Raspberry Pi, a camera, and lasers, powered by MediaPipe for hand tracking. But by the time we reached the hardware table, everything was gone — which, in hindsight, turned out to be a blessing.

That constraint pushed us to reimagine the idea entirely for the computer. Instead of lasers, we used music as the expressive medium. Acting like a digital conductor, your hand motions control sound and instruments. Later, we added a fluid simulation to visualize the music, combining the artistry of motion, sound, and visuals — the best of both worlds.

## What it does

Plays music through computer vision of your hands. Using MediaPipe by Google, we detect the location of your hand. The motion of your hand determines the sound that plays, and different gestures allow for controls such as stopping and starting the music as well as changing the instrument of each hand. To play music you touch your pointer finger to your thumb and move your hands in the air. We also added a fluid visualizer effected by the motion of your hands so you can see the art that you make live.

## How we built it

For all computer vision, we used MediaPipe. This allowed us to place landmarks on your hands/fingers to detect their position and gesture. For the fluid simulator, we leveraged a public github [repo](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation). For making the sound we used Tone.js and samples from this github [repo](https://github.com/nbrosowsky/tonejs-instruments/tree/master/samples). Also, all of our team leveraged AI coding tools significantly to build out this project working in Windsurf, Cursor, and VS Code.

## Challenges we ran into

We faced significant challenges implementing all the key features that make our project great. However, getting to a V1 with mediapipe working was extremely easy and took less than 2 hours.

Pleasant sounds:

Just simply adding sounds was relatively easy but it got much more complex than that. We originally varied the noise by pitch and volume based on the position of the hand (in a continuous way). This was cool to play with, but it didn’t sound pleasant. It more sounded like aliens abducting you. Then after some research we learned more about quantizing music, so that it was a little bit more discrete of sounds and we added a base beat. This had a significant difference in improving the sound and all it took was a little music theory. Now users can feel like a real conductor!

Adding Gestures:

We tried vibe coding gestures directly but kept running into issues with it and it would break across our devices. We had to do some research on the MediaPipe documentation and upload that to AI to better understand it, then implement it. Eventually we got it working but it took a lot of debugging to the console to ensure we were checking for the correct hand (which is still finicky and swaps them frequently) and have the best thresholds.

Fluid Simulation:

This was significantly difficult to implement, which was surprising because I thought all we had to do was import the files from the github and it would be a simple integration for AI. We were wrong. Adding this immediately broke the webcam and it took many iterations of ensuring the rendering process happened in the correct order and the hand movements affected the fluid (particularly getting them to affect the correct side was annoying). 

## Accomplishments that we're proud of

We’re especially proud of integrating the fluid simulation, which brought our project to life visually and made the experience genuinely fun and interactive. Overcoming the technical hurdles to make it work seamlessly with hand motion and sound was incredibly rewarding.

We’re also proud of how cohesive and polished the project looks — the UI and visual flow came together beautifully, especially given the short timeframe of a hackathon.

Finally, we wrote every line of code during the event. Our only pre-hackathon work was light research and planning the day before (which, in hindsight, we wish we had done more of!). This makes the final result feel even more fulfilling and authentic to the hackathon spirit.

## What we learned

- Project Management with a small team and a short timeline
- In-depth understanding of MediaPipe hand tracking.
- Sound design and quantization using Tone.js.
- How to integrate multiple real-time systems (audio, video, and WebGL rendering).
- Effective AI pair programming for debugging and experimentation.
- Deploying interactive web apps with Vercel.

## What's next for FigureFlo

We have many ideas to improve this project:
- Improving UI/UX (always)
- Integrating real songs into the program (including “stems”, where you play a part of a song like the drums)
- Haptic vibrations
- Recording/Exporting (”Share your flo!”)