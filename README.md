# Peace Blur

Real-time Peace Sign Blur Detector.

Show a peace sign ✌️ to automatically blur your camera — all processing happens locally in your browser.

## Features

- Real-time webcam via `navigator.mediaDevices.getUserMedia`
- MediaPipe Tasks Vision hand detection (`maxNumHands=1`, confidence 0.5)
- Peace sign detection (Index + Middle up, Ring + Pinky down — preserves original `blur.py` logic)
- Automatic camera blur on peace sign, clears when gesture disappears
- Client-side processing — no video uploaded, no backend
- Privacy friendly
- Responsive + accessible UI (glassmorphism, dark mode)
- Vercel-ready static build

## Tech Stack

- React 18 + Vite 5 + TypeScript 5
- Tailwind CSS + shadcn/ui
- MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)
- HTML5 Video + CSS `filter: blur()`

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
# http://localhost:8080 (or 5173)
```

## Production Build

```bash
npm run build
npm run preview
```

Output: `dist/` — static, deploy anywhere.

## Vercel Deployment

1. Push to GitHub.
2. Import project in Vercel.
3. Framework preset: **Vite**.
4. Build command: `npm run build`
5. Output directory: `dist`
6. No env vars, no serverless functions required.

Or via CLI:

```bash
npm i -g vercel
vercel --prod
```

## How It Works

1. Click **Start Camera** → requests permission → attaches `MediaStream` to `<video>`.
2. MediaPipe `HandLandmarker` runs in `requestAnimationFrame` loop (`VIDEO` mode).
3. `isPeaceSign(landmarks)` checks tips vs PIPs: `8<6 && 12<10 && !(16<14) && !(20<18)`.
4. `peaceDetected === true` → video gets `blur-[18px]`; false → `blur-0`.

## Project Structure

```
src/
├── components/peace/  Header, CameraView, StatusPanel, ControlPanel, InfoSection
├── hooks/             useHandDetection.ts
├── utils/             gestureDetection.ts (isPeaceSign)
├── types/             detection.ts
├── pages/             PeaceBlur.tsx ("/"), Index.tsx ("/desktop")
└── index.css
```

## Privacy

```
Browser Camera → MediaPipe (WASM) → Hand Landmarks → Peace Detection → Blur
```

All on-device. No upload.

## Original Python Logic (preserved)

```python
index_up = finger_up(8, 6, landmarks)
middle_up = finger_up(12, 10, landmarks)
ring_up = finger_up(16, 14, landmarks)
pinky_up = finger_up(20, 18, landmarks)
peace_detected = index_up and middle_up and not ring_up and not pinky_up
```
