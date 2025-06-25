import React, { useRef, useState, useEffect, useCallback } from "react";

// Componente individual de celda raspable
function ScratchCell({ prize, width, height, onReveal, disabled, highlight }) {
  const prizeRef = useRef();
  const maskRef = useRef();

  const [scratching, setScratching] = useState(false);
  const [wasRevealed, setWasRevealed] = useState(false);
  const [progress, setProgress] = useState(0);

  // Dibuja imagen del premio y máscara inicial
  useEffect(() => {
    const pCtx = prizeRef.current.getContext("2d");
    pCtx.clearRect(0, 0, width, height);
    const img = new Image();
    img.src = prize.src;
    img.onload = () => pCtx.drawImage(img, 0, 0, width, height);

    const maskImg = new Image();
    maskImg.src = "/MONEDAS-RASPA-Y-GANA.png";
    maskImg.onload = () => {
      const mCtx = maskRef.current.getContext("2d");
      mCtx.clearRect(0, 0, width, height);
      mCtx.globalCompositeOperation = "source-over";
      mCtx.drawImage(maskImg, 0, 0, width, height);
      mCtx.globalCompositeOperation = "destination-out";
    };

    setWasRevealed(false);
    setProgress(0);
  }, [prize, width, height]);

  // Función de raspado
  const scratch = useCallback(
    (x, y) => {
      if (disabled || wasRevealed) return;
      const mCtx = maskRef.current.getContext("2d");
      mCtx.beginPath();
      mCtx.arc(x, y, 10, 0, Math.PI * 2);
      mCtx.fill();

      // Calcular porcentaje raspado
      const data = mCtx.getImageData(0, 0, width, height).data;
      let cleared = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) cleared++;
      }
      const pct = cleared / (width * height);
      setProgress(pct);

      if (pct >= 0.1) {
        setWasRevealed(true);
        onReveal(prize);
      }
    },
    [disabled, wasRevealed, onReveal, prize, width, height]
  );

  const scratchSoundRef = useRef(new Audio("/scratching.mp3"));
  useEffect(() => {
    const snd = scratchSoundRef.current;
    snd.load();
  }, []);

  // Handlers de eventos de mouse/táctil
  const handleDown = () => {
    if (disabled || wasRevealed) return;
    const snd = scratchSoundRef.current;
    snd.currentTime = 0;
    snd.play().catch(() => {});
    setScratching(true);
  };
  const handleMove = (e) => {
    //if (!scratching) return;
    const rect = maskRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches[0].clientX) - rect.left;
    const y = (e.clientY ?? e.touches[0].clientY) - rect.top;
    scratch(x, y);
  };

  const handleUp = () => {
    scratchSoundRef.current.pause();
    setScratching(false);
  };

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        boxShadow: highlight && wasRevealed ? "0 0 10px 4px gold" : "none",
        borderRadius: "50%",
        transition: "box-shadow 0.3s ease-in-out",
        backgroundColor:
          highlight && wasRevealed
            ? "rgba(255, 255, 255, 0.83)"
            : "transparent",
      }}
    >
      {/* Canvas del premio con opacidad según progreso */}
      <canvas
        ref={prizeRef}
        width={width}
        height={height}
        style={{
          opacity: Math.min(progress / 0.8, 1),
          transition: "opacity 0.1s linear",
        }}
      />

      {/* Máscara siempre visible hasta revelar */}
      {!wasRevealed && (
        <canvas
          ref={maskRef}
          width={width}
          height={height}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onClick={handleMove}
          onMouseUp={handleUp}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
        />
      )}
    </div>
  );
}

// Componente principal de la cuadrícula
export default function ScratchGrid({
  columns = 4,
  rows = 3,
  cellWidth = 100,
  cellHeight = 80,
  prizeOptions = [],
  useVideoBackground = true,
}) {
  const total = columns * rows;
  const [gridPrizes, setGridPrizes] = useState([]);
  const [won, setWon] = useState(false);
  const [firstPrize, setFirstPrize] = useState(null);
  const [showModal, setShowModal] = useState(true);
  const winSound = new Audio("/win-sound.mp3");

  // Genera y baraja premios
  const generateGrid = () => {
    const prizes = Array.from(
      { length: total },
      () => prizeOptions[Math.floor(Math.random() * prizeOptions.length)]
    );
    for (let i = prizes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [prizes[i], prizes[j]] = [prizes[j], prizes[i]];
    }
    setGridPrizes(prizes);
    setShowModal(true);
    setWon(false);
    setFirstPrize(null);
  };

  useEffect(() => {
    generateGrid();
  }, [columns, rows, prizeOptions]);

  // Revelar primer premio raspado
  const handleReveal = useCallback(
    (prize) => {
      if (won) return;
      setFirstPrize(prize);
      setWon(true);
      winSound.play();
    },
    [won, winSound]
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Modal de premios al inicio */}
      {/* Modal de premios al inicio */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.92)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              background: "rgba(30, 30, 30, 0.6)",
              border: "6px solid #ffd24c",
              borderRadius: 24,
              boxShadow: "0 8px 40px 0 rgba(0,0,0,0.7)",
              padding: "40px 32px 32px 32px",
              maxWidth: "95vw",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Botón continuar en la esquina superior derecha */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "#ffd24c",
                color: "#222",
                fontWeight: "bold",
                fontSize: "1.1rem",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                letterSpacing: 1,
                transition: "background 0.2s",
              }}
            >
              Continuar
            </button>
            <h3 style={{ color: "#ffd24c", marginBottom: 24, marginTop: 0 }}>
              Premios disponibles
            </h3>
            <img
              src="/PREMIOS_RASPA-Y-LISTO.png"
              alt="Premios"
              style={{
                maxWidth: "90vw",
                maxHeight: "60vh",
                marginBottom: 16,
                borderRadius: 16,
                border: "2px solid #ffd24c",
              }}
            />
          </div>
        </div>
      )}

      {useVideoBackground ? (
        <video
          src="/RASPA Y LISTO_FONDO.mov"
          autoPlay
          loop
          muted
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "auto",
            height: "100%",
            transform: "translate(-50%, -50%)",
            zIndex: 0,
            objectFit: "cover",
          }}
        />
      ) : (
        <img
          src="/FONDO_RASPA-Y-LISTO.png"
          alt="Fondo"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100%",
            height: "100%",
            transform: "translate(-50%, -50%)",
            zIndex: 0,
            objectFit: "cover",
          }}
        />
      )}

      <img
        src="/LOGO_RASPA-Y-LISTO.png"
        alt="Logo"
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          height: "200px",
          zIndex: 2,
        }}
      />

      {won && firstPrize && (
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            width: "100%",
            textAlign: "center",
            zIndex: 2,
            padding: "20px 0",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              color: "#fff", // Texto blanco
              fontWeight: "bold",
              marginBottom: "10px",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)", // Sombra para resaltar
            }}
          >
            🎉 ¡Has ganado un <strong>{firstPrize.name}</strong>! 🎉
          </div>
        </div>
      )}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, ${cellWidth}px)`,
          gridGap: "25px",
          justifyContent: "center",
          alignContent: "center",
          width: "100%",
          height: "100%",
          paddingBottom: "70px"
        }}
      >
        {gridPrizes.map((prize, idx) => (
          <ScratchCell
            key={idx}
            prize={prize}
            width={cellWidth}
            height={cellHeight}
            onReveal={handleReveal}
            disabled={won}
            highlight={won && prize === firstPrize}
          />
        ))}
      </div>

      {won && firstPrize && (
        <div
          style={{
            position: "absolute",
            top: "5%",
            width: "100%",
            textAlign: "center",
            zIndex: 2,
          }}
        >
          <button
            onClick={generateGrid}
            style={{
              backgroundImage: "url(/BOTON_COMENZAR.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "none",
              padding: "20px 40px",
              fontSize: "18px",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              borderRadius: "12px",
              backgroundRepeat: "no-repeat",
            }}
          >
            JUGAR DE NUEVO
          </button>
        </div>
      )}
      <img
        src="/LEGALES.png"
        alt="Logo"
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          height: "80px",
          zIndex: 2,
        }}
      />
    </div>
  );
}
