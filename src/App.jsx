import React from "react";
import ScratchCard from "./components/ScratchCard";
import "./components/touchDebugOverlay.ts";
import './components/touchDebugOverlay.css';

const prizeOptions = [
  { src: "/premios/PREMIOS-01.png", name: "BOTILITO" },
  { src: "/premios/PREMIOS-02.png", name: "TWISTER VASO" },
  { src: "/premios/PREMIOS-03.png", name: "BONO SPOTIFY" },
  { src: "/premios/PREMIOS-04.png", name: "BONO PARAMOUNT" },
  { src: "/premios/PREMIOS-05.png", name: "NUEVO TURNO" },
];

function App() {
  const handleBackToMenu = () => {
    const hostname = window.location.hostname;
    const target = hostname === 'localhost'
      ? 'http://localhost:5175/'
      : 'https://betplay-game.netlify.app';
    window.location.href = target;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <button
        onClick={handleBackToMenu}
        style={{
          position: 'absolute',
          top: '16px',
          left: '160px',
          zIndex: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: '#ffd24c',
          border: 'none',
          padding: '10px 16px',
          borderRadius: 8,
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '1.5rem',
          transition: 'background 0.3s',
        }}
      >
        Volver
      </button>

      <ScratchCard
        useVideoBackground={false}
        columns={4}
        rows={3}
        cellWidth={100}
        cellHeight={80}
        prizeOptions={prizeOptions}
      />
    </div>
  );
}

export default App;
