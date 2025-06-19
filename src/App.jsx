import React from "react";
import ScratchCard from "./components/ScratchCard";

const prizeOptions = [
  { src: "/premios/PREMIOS-01.png", name: "BOTILITO" },
  { src: "/premios/PREMIOS-02.png", name: "TWISTER VASO" },
  { src: "/premios/PREMIOS-03.png", name: "BONO SPOTIFY" },
  { src: "/premios/PREMIOS-04.png", name: "BONO PARAMOUNT" },
  { src: "/premios/PREMIOS-05.png", name: "NUEVO TURNO" },
];

function App() {
  return (
    <ScratchCard
      useVideoBackground={false}
      columns={4}
      rows={3}
      cellWidth={100}
      cellHeight={80}
      prizeOptions={prizeOptions}
    />
  );
}

export default App;
