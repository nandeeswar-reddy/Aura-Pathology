import React, { Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import DNA from './components/DNA';
import './index.css';

// Cinematic camera zoom transition when launching
const CameraTransition = ({ launching }) => {
  useFrame((state, delta) => {
    if (launching) {
      // Slowed down the zoom significantly to make it feel massive and incredibly smooth
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, -5, delta * 0.7);
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 2, delta * 0.4);
    }
  });
  return null;
};

// Component that generates random moving "data beams" permanently offloaded to CSS animations
const GridBeams = () => {
  const beams = React.useMemo(() => {
    // Generate static beams once. Increase count slightly to compensate for static tracks.
    // By using random prime-number durations and delays, they will mathematically never sync up, looking infinitely random.
    const maxVTracks = Math.floor(window.innerWidth / 60);
    const maxHTracks = Math.floor(window.innerHeight / 60);

    return Array.from({ length: 25 }).map((_, i) => {
      const isHorizontal = Math.random() > 0.5;
      return {
        id: i,
        isHorizontal,
        track: Math.floor(Math.random() * (isHorizontal ? maxHTracks : maxVTracks)), 
        duration: 3 + Math.random() * 8, // Random speed (3s to 11s)
        delay: -Math.random() * 10, // Negative delay so they start already moving on screen
        length: 50 + Math.random() * 200, // Beam length
        dir: Math.random() > 0.5 ? 1 : -1, // Move left/right or up/down
      };
    });
  }, []); // Only runs once on mount

  return (
    <div className="beams-container">
      {beams.map(b => (
        <div 
          key={b.id} 
          className={`grid-beam ${b.isHorizontal ? 'beam-h' : 'beam-v'}`} 
          style={{
            top: b.isHorizontal ? `${b.track * 60}px` : undefined,
            left: !b.isHorizontal ? `${b.track * 60}px` : undefined,
            width: b.isHorizontal ? `${b.length}px` : undefined,
            height: !b.isHorizontal ? `${b.length}px` : undefined,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            animationDirection: b.dir > 0 ? 'normal' : 'reverse',
            animationIterationCount: 'infinite' // CSS natively handles the infinite loop
          }}
        />
      ))}
    </div>
  );
};

function App() {
  const [launching, setLaunching] = useState(false);

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => {
        window.dispatchEvent(new Event('launchAura'));
    }, 3500);
  };

  return (
    <div className={`canvas-container ${launching ? 'launching' : ''}`}>
      {/* The black transition page that fades in at the end */}
      <div className={`transition-overlay ${launching ? 'active' : ''}`}>
        {/* Placeholder UI to indicate we've arrived */}
        <div className="workspace-placeholder">
          <h4>WORKSPACE ACTIVE</h4>
          <p>Secure connection established.</p>
        </div>
      </div>

      {/* Subtle animated background grid */}
      <div className={`grid-background ${launching ? 'launching' : ''}`}>
        <GridBeams />
      </div>

      {/* Capped max DPR to 1.2 to eliminate lag on high-res Retina/4K displays */}
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 1.2]} style={{ position: 'relative', zIndex: 1 }}>
        <CameraTransition launching={launching} />
        {/* Removed solid 3D background color so the CSS animated grid underneath can be seen */}
        
        {/* Soft studio lighting to create nice reflections */}
        <ambientLight intensity={0.5} />
        
        {/* Strong rim light from behind to highlight the edges of the black DNA */}
        <directionalLight position={[0, 0, -10]} intensity={3.0} color="#ffffff" />
        
        <spotLight position={[10, 10, 10]} angle={0.25} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#4466ff" />
        <pointLight position={[10, -10, 10]} intensity={1.5} color="#ff4466" />
        
        <Suspense fallback={null}>
          <DNA />
          {/* Environment map is CRUCIAL for making dark metallic materials reflect light and look 3D */}
          <Environment preset="city" />
          <EffectComposer disableNormalPass>
            {/* Added resolutionScale=0.5 to vastly improve Bloom performance on mobile/tablets */}
            <Bloom luminanceThreshold={0.2} intensity={1.5} resolutionScale={0.5} />
          </EffectComposer>
        </Suspense>
        
        {/* Completely removed OrbitControls to fully lock the camera and prevent any mouse zooming/dragging */}
      </Canvas>

      {/* 2D UI Overlay */}
      <div className={`ui-layer ${launching ? 'launching' : ''}`}>
        
        {/* Left Side (Red Box Area) */}
        <div className="ui-panel ui-left">
          <h2>About:</h2>
          <h3>Hybrid Deep Learning System for Automated Cancer Detection</h3>
          
          <div className="list-section">
            <h4>Core Technologies</h4>
            <ul>
              <li><span className="glow-check">✔</span> Hybrid CNN + Vision Transformer</li>
              <li><span className="glow-check">✔</span> Self-Supervised SimCLR Learning</li>
              <li><span className="glow-check">✔</span> Fine-Tuned Hybrid Architecture</li>
              <li><span className="glow-check">✔</span> Adaptive Token Selection</li>
              <li><span className="glow-check">✔</span> Grad-CAM Explainability</li>
              <li><span className="glow-check">✔</span> 5-Class Histopathology Classification</li>
              <li><span className="glow-check">✔</span> 99.63% Classification Accuracy</li>
            </ul>
          </div>

          <div className="list-section">
            <h4>Purpose</h4>
            <ul>
              <li><span className="glow-check">✔</span> AI-assisted lung & colon cancer detection</li>
              <li><span className="glow-check">✔</span> Designed for computational pathology research</li>
              <li><span className="glow-check">✔</span> Research & educational use only</li>
            </ul>
          </div>
        </div>

        {/* Right Side (Blue Box Area) */}
        <div className="ui-panel ui-right">
          <h2 className="main-title">
            <span className="title-white">AI BASED</span><br />
            <span className="title-accent">EARLY CANCER DETECTION SYSTEM</span>
          </h2>
          <div className="team-members">
            <p>Tatireddy Nandeeswar Reddy</p>
            <p>Damarla Pavan</p>
            <p>Anish Kunda</p>
            <p>Nallapalem Vinthashri</p>
          </div>

          <div className="disclaimer-box">
            <h4>Medical Disclaimer:</h4>
            <p>This AI system is intended strictly for research and educational purposes. It is not approved for clinical use and must not replace professional medical diagnosis.</p>
          </div>
        </div>

      </div>

      {/* Launch Workspace Button (Bottom Left Corner) */}
      <div className={`launch-button-wrapper ${launching ? 'launching' : ''}`}>
        <button className="launch-button" onClick={handleLaunch}>
          Launch Workspace
        </button>
      </div>
    </div>
  );
}

export default App;
