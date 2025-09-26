import React, { useRef, useState, useEffect, useCallback } from "react";

// Componente individual de celda raspable
function ScratchCell({ prize, width, height, onReveal, disabled, highlight }) {
  const prizeRef = useRef();
  const maskRef = useRef();

  const [scratching, setScratching] = useState(false);
  const [wasRevealed, setWasRevealed] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fallback visual tipo ALT cuando falla la imagen
  const drawFallback = useCallback(() => {
    const ctx = prizeRef.current.getContext("2d");
    ctx.clearRect(0, 0, width, height);

    // Fondo suave
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, width, height);

    // Texto con el nombre del premio
    const name = prize?.alt || "Premio";
    ctx.fillStyle = "#111827";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fontPx = Math.max(14, Math.floor(height * 0.22));
    ctx.font = `500 ${fontPx}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;

    // Si es largo, partir en dos líneas simples
    const maxChars = 8;
    if (name.length <= maxChars) {
      ctx.fillText(name, width / 2, height / 2);
    } else {
      const mid = Math.floor(name.length / 2);
      const space = name.indexOf(" ", mid);
      const splitAt = space > -1 ? space : mid;
      const l1 = name.slice(0, splitAt).trim();
      const l2 = name.slice(splitAt).trim();
      ctx.fillText(l1, width / 2, height / 2 - fontPx * 0.6);
      ctx.fillText(l2, width / 2, height / 2 + fontPx * 0.6);
    }
  }, [width, height, prize?.name]);

  // Dibuja imagen del premio y máscara inicial
  useEffect(() => {
    const pCtx = prizeRef.current.getContext("2d");
    pCtx.clearRect(0, 0, width, height);
    const img = new Image();
    img.onload = () => pCtx.drawImage(img, 0, 0, width, height);
    img.onerror = () => drawFallback(); // <- ALT visual si falla
    if (prize?.src) img.src = prize.src; // <- solo si hay src
    else drawFallback(); // <- ALT si no hay src

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
  }, [prize, width, height, drawFallback]);

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
            fontSize: "3rem",
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
                fontSize: "2rem",
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
          src="/RASPA_Y_GANA_FONDO.mp4"
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
          src="/FONDO_RASPA-Y-LISTO.gif"
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
        src="FRASE_SUPERIOR.png"
        alt="Frase Superior"
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          height: "210px",
          zIndex: 2,
        }}
      />

      <img
        src="/LOGO_RASPA-Y-LISTO.png"
        alt="Logo"
        style={{
          position: "absolute",
          top: "22%",
          left: "50%",
          transform: "translateX(-50%)",
          height: "180px",
          zIndex: 2,
        }}
      />

      {won && firstPrize && (
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            width: "100%",
            textAlign: "center",
            zIndex: 2,
            padding: "20px 0",
          }}
        >
          <div
            style={{
              color: "#fff", // Texto blanco
              fontWeight: "bold",
              marginBottom: "10px",
              fontSize: "3rem",
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
          marginTop: "30px",
          justifyContent: "center",
          alignContent: "center",
          width: "100%",
          height: "100%",
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
            bottom: "23%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "auto",
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
              fontSize: "40px",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              borderRadius: "12px",
              backgroundRepeat: "no-repeat",
              width: "500px",
            }}
          >
            JUGAR DE NUEVO
          </button>
        </div>
      )}
      <img
        src="/TEXTOS_LEGALES.png"
        alt="Logo"
        style={{
          position: "absolute",
          bottom: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          height: "230px",
          zIndex: 2,
        }}
      />
    </div>
  );
}
