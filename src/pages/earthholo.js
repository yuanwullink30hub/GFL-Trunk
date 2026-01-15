<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1CbS_Wx6QxMVcwV_tJGftw60JpNn6bECj

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

   GEMINI_API_KEY=PLACEHOLDER_API_KEY

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import HoloEarth from './components/HoloEarth';

// Define intrinsic elements as any to bypass TypeScript checks
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;

const App = () => {
  return (
    <main className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center">
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-10 pointer-events-none">
        <h1 className="text-2xl md:text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-green-400 to-orange-400 animate-pulse">
          GEO.HOLOGRAM
        </h1>
        <p className="text-xs md:text-base text-gray-400 mt-1 md:mt-2 font-mono uppercase tracking-widest">
          System Status: Online
        </p>
      </div>

      <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-10 pointer-events-none text-right">
        <div className="flex flex-col gap-1 text-[10px] md:text-xs font-mono text-green-500/70">
           <span>LAT: 34.0522 N</span>
           <span>LNG: 118.2437 W</span>
           <span>VEL: 1670 KM/H</span>
        </div>
      </div>

      {/* 3D Scene Container */}
      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <Suspense fallback={
             <Html center>
                <div className="text-green-500 font-mono animate-pulse">Initializing Holo-Core...</div>
             </Html>
          }>
            {/* Ambient light reduced for darker, higher contrast mood */}
            <AmbientLight intensity={0.1} />
            
            {/* Dynamic lights */}
            <PointLight position={[10, 10, 10]} intensity={1} color="#f97316" />
            <PointLight position={[-10, -10, -10]} intensity={0.5} color="#4c1d95" />

            {/* Main Hologram */}
            <HoloEarth />
            
            {/* Interaction Controls */}
            <OrbitControls 
                enablePan={false} 
                enableZoom={false} 
                autoRotate={true}
                autoRotateSpeed={0.5}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI - Math.PI / 4}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_4px,6px_100%]"></div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] z-[2]"></div>
    </main>
  );
};

export default App;

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HoloEarth</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: #050505; }
    </style>
  <script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@^19.2.3",
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
    "react/": "https://esm.sh/react@^19.2.3/",
    "@react-three/fiber": "https://esm.sh/@react-three/fiber@^9.5.0",
    "three": "https://esm.sh/three@^0.182.0",
    "@react-three/drei": "https://esm.sh/@react-three/drei@^10.7.7"
  }
}
</script>
<link rel="stylesheet" href="/index.css">
</head>
  <body>
    <div id="root"></div>
  <script type="module" src="/index.tsx"></script>
</body>
</html>

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

{
  "name": "HoloEarth",
  "description": "A holographic, translucent rotating earth visualization using React Three Fiber.",
  "requestFramePermissions": []
}

{
  "name": "holoearth",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "@react-three/fiber": "^9.5.0",
    "three": "^0.182.0",
    "@react-three/drei": "^10.7.7"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}

{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "skipLibCheck": true,
    "types": [
      "node"
    ],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}

export interface HolographicMaterialProps {
  glowColor: string;
  coreColor: string;
  rimColor: string;
}

export interface RotationSpeed {
  x: number;
  y: number;
}

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
