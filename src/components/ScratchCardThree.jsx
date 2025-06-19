import { useRef, useState, useEffect, useCallback } from "react";

function ScratchCell({ prize, width, height, onReveal, disabled, highlight }) {
  const prizeRef = useRef();
  const maskRef = useRef();
  const [scratching, setScratching] = useState(false);
  const [wasScratched, setWasScratched] = useState(false); // 👈 nuevo estado

  useEffect(() => {
    const pCtx = prizeRef.current.getContext("2d");
    pCtx.clearRect(0, 0, width, height);
    pCtx.font = "32px sans-serif";
    pCtx.textAlign = "center";
    pCtx.textBaseline = "middle";
    pCtx.fillText(prize, width / 2, height / 2);

    const maskImg = new Image();
    maskImg.src = "/MONEDAS-RASPA-Y-GANA.png";
    maskImg.onload = () => {
      const mCtx = maskRef.current.getContext("2d");
      mCtx.clearRect(0, 0, width, height);
      mCtx.globalCompositeOperation = "source-over";
      mCtx.drawImage(maskImg, 0, 0, width, height);
      mCtx.globalCompositeOperation = "destination-out";
    };
  }, [prize, width, height]);

  const scratch = useCallback(
    (x, y) => {
      if (disabled) return;
      const ctx = maskRef.current.getContext("2d");
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      if (!wasScratched) {
        setWasScratched(true); // 👈 marcar como raspada
        onReveal(prize);
      }
    },
    [disabled, onReveal, prize, wasScratched]
  );

  const handleDown = () => {
    if (disabled) return;
    setScratching(true);
  };
  const handleMove = (e) => {
    if (!scratching || disabled) return;
    const rect = maskRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches[0].clientX) - rect.left;
    const y = (e.clientY ?? e.touches[0].clientY) - rect.top;
    scratch(x, y);
  };
  const handleUp = () => setScratching(false);

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        boxShadow: highlight && wasScratched ? "0 0 10px 4px gold" : "none",
        transition: "box-shadow 0.3s ease-in-out",
      }}
    >
      <canvas ref={prizeRef} width={width} height={height} />
      {!disabled && (
        <canvas
          ref={maskRef}
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, cursor: "pointer" }}
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
        />
      )}
    </div>
  );
}


export default function ScratchGrid({
  columns = 4,
  rows = 3,
  cellWidth = 100,
  cellHeight = 80,
  prizeOptions = ["🍉", "🏆", "🎁", "💰", "⭐️"],
  useVideoBackground = true,
}) {
  const total = columns * rows;
  const [gridPrizes, setGridPrizes] = useState([]);
  const [revealedCounts, setRevealedCounts] = useState({});
  const [won, setWon] = useState(false);
  const winSound = new Audio("/win-sound.mp3");
  const [winningPrize, setWinningPrize] = useState(null);

  const generateGrid = () => {
    const winner =
      prizeOptions[Math.floor(Math.random() * prizeOptions.length)];
    const prizes = Array(3).fill(winner);
    while (prizes.length < total) {
      const p = prizeOptions[Math.floor(Math.random() * prizeOptions.length)];
      prizes.push(p);
    }
    for (let i = prizes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [prizes[i], prizes[j]] = [prizes[j], prizes[i]];
    }
    setGridPrizes(prizes);
    setRevealedCounts({});
    setWon(false);
  };

  useEffect(() => {
    generateGrid();
  }, [columns, rows, prizeOptions, total]);

  const handleReveal = useCallback((prize) => {
    setRevealedCounts((prev) => {
      const count = (prev[prize] || 0) + 1;
      const updated = { ...prev, [prize]: count };
      if (count === 3) {
        setWon(true);
        setWinningPrize(prize);
        winSound.play();
      }
      return updated;
    });
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
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
          alt="Fondo Raspa y Listo"
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
      )}

      {/* Logo superior */}
      <img
        src="/LOGO_RASPA-Y-LISTO.png"
        alt="Logo"
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          height: "80px",
          zIndex: 2,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, ${cellWidth}px)`,
          gridGap: "10px",
          justifyContent: "center",
          alignContent: "center",
          width: "100%",
          height: "100%",
          paddingTop: "120px",
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
            highlight={won && prize === winningPrize}
          />
        ))}
      </div>

      {won && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            width: "100%",
            textAlign: "center",
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontSize: "24px",
              color: "green",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            🎉 ¡Has ganado revelando 3 iguales! 🎉
          </div>
          <button
            onClick={generateGrid}
            style={{
              position: "relative",
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
    </div>
  );
}
