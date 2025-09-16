const situaciones = [
  {
    texto: "Un movilizador cruza una zona de alto tránsito sin mirar, mientras habla por radio con otro compañero.",
    opciones: [
      { valor: "Golpeado por vehículo en movimiento" },
      { valor: "Fatiga laboral" },
      { valor: "Exposición a sustancias químicas" },
      { valor: "Caída a distinto nivel" }
    ]
  },
  {
    texto: "Un trabajador manipula carga sin elementos de protección personal (EPP) durante una faena rutinaria.",
    opciones: [
      { valor: "Lesiones por falta de EPP" },
      { valor: "Golpeado por objeto en movimiento" },
      { valor: "Fatiga laboral" },
      { valor: "Exposición a sustancias químicas" }
    ]
  },
  {
    texto: "Al iniciar el turno, se detectan eslingas, estrobos y cadenas en malas condiciones, pero la operación comienza de todos modos.",
    opciones: [
      { valor: "Falla de equipos de izaje" },
      { valor: "Golpeado por objeto en movimiento" },
      { valor: "Exposición a sustancias químicas" },
      { valor: "Caída de altura" }
    ]
  },
  {
    texto: "Un operador de equipo escucha música con audífonos en una zona donde debe atender señales auditivas y visuales para evitar colisiones.",
    opciones: [
      { valor: "Colisión por distracción" },
      { valor: "Fatiga laboral" },
      { valor: "Exposición a ruido" },
      { valor: "Caída a mismo nivel" }
    ]
  }
];
situaciones.push({
  texto: "Trabajar en altura sin línea de vida",
  opciones: [
    { valor: "Caída a distinto nivel" },
    { valor: "Golpeado por objeto en caída" },
    { valor: "Otros riesgos asociados" }
  ]
});
