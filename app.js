let respuestas = {};
let ultimaPantalla = null;

function cambiarPantalla(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function iniciar() {
  document.getElementById("screen1").classList.remove("active");
  generarPantallas();

  // esperar un "tick" antes de activar la primera pantalla
  setTimeout(() => {
    document.getElementById("screen1-1").classList.add("active");
  }, 50); // 50ms es suficiente para que se note el fade
}



function generarPantallas() {
  const contenedor = document.getElementById("contenedor-situaciones");
  contenedor.innerHTML = "";

  situaciones.forEach((sit, idx) => {
    const num = idx + 1;

    // Pantalla selección
    const pantallaSel = `
      <div class="screen" id="screen${num}-1">
        <div class="card">
          <h3>Situación ${num}</h3>
          <p>${sit.texto}</p>
          <label>Selecciona el riesgo principal:</label>
          <select id="riesgo${num}">
            <option value="">-- Elige una opción --</option>
            ${sit.opciones.map(op => `<option value="${op.valor}">${op.valor}</option>`).join("")}
          </select>
          ${num > 1 ? `<button class="btn btn-secondary" onclick="prevScreen(${num-1},2)">Volver</button>` : ""}
          <button class="btn" onclick="nextScreen(${num},2)">Continuar</button>
        </div>
      </div>`;

    // Pantalla valoración
    const pantallaVal = `
      <div class="screen" id="screen${num}-2">
        <div class="card">
          <h3>Situación ${num} - Valoración</h3>
          <div id="riesgoSeleccionado${num}" class="riesgo-destacado"></div>
          <label>Probabilidad (1-5): </label>
          <select id="prob${num}">
            <option value="">-- Selecciona --</option>
            <option value="1">1 - Raro</option>
            <option value="2">2 - Poco probable</option>
            <option value="3">3 - Moderado</option>
            <option value="4">4 - Probable</option>
            <option value="5">5 - Casi seguro</option>
          </select>
          <label>Impacto (1-5): </label>
          <select id="impact${num}">
            <option value="">-- Selecciona --</option>
            <option value="1">1 - Insignificante</option>
            <option value="2">2 - Menor</option>
            <option value="3">3 - Significativo</option>
            <option value="4">4 - Mayor</option>
            <option value="5">5 - Severo</option>
          </select>
          <button class="btn btn-secondary" onclick="prevScreen(${num},1)">Volver</button>
          <button class="btn" onclick="guardar(${num},${num === situaciones.length ? "'resumen'" : num+1})">
            ${num === situaciones.length ? "Guardar y ver resultados" : "Guardar y continuar"}
          </button>
        </div>
      </div>`;

    contenedor.innerHTML += pantallaSel + pantallaVal;
  });
}

function nextScreen(num, paso) {
  // Validar que en el paso 1 se haya elegido un riesgo
  if (paso === 2) {
    const riesgo = document.getElementById(`riesgo${num}`).value;
    if (!riesgo) {
      alert("Debes seleccionar un riesgo antes de continuar.");
      return;
    }
    document.getElementById(`riesgoSeleccionado${num}`).innerText =
      "Riesgo seleccionado: " + riesgo;
  }

  // Transición normal
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(`screen${num}-${paso}`).classList.add("active");
}


function prevScreen(num, paso) {
  cambiarPantalla(`screen${num}-${paso}`);
}

function guardar(num, next) {
  let riesgo = document.getElementById("riesgo" + num).value;
  let prob = parseInt(document.getElementById("prob" + num).value);
  let impact = parseInt(document.getElementById("impact" + num).value);

  if (!riesgo || !prob || !impact) {
    alert("Completa todas las opciones");
    return;
  }

  let nivel = prob * impact;
  respuestas["situacion" + num] = { riesgo, probabilidad: prob, impacto: impact, nivel };

  if (next === 'resumen') {
    ultimaPantalla = `screen${num}-2`;

    // Mostrar pantalla de carga
    cambiarPantalla("screenLoading");

    // Simular tiempo de procesamiento y luego mostrar resumen
    setTimeout(() => {
      mostrarResumen();
      cambiarPantalla("screenResumen");
    }, 1500);

  } else {
    nextScreen(next, 1);
  }
}

function mostrarResumen() {
  // --- Sección individual ---
  let tbody = document.querySelector("#tablaResumen tbody");
  tbody.innerHTML = "";
  let i = 1;
  for (let s in respuestas) {
    let r = respuestas[s];
    let nivelTxt = "", nivelClass = "";
    if (r.nivel <= 5) { nivelTxt = "Bajo"; nivelClass = "nivel-bajo"; }
    else if (r.nivel <= 15) { nivelTxt = "Medio"; nivelClass = "nivel-medio"; }
    else { nivelTxt = "Alto"; nivelClass = "nivel-alto"; }

    let row = `
      <tr>
        <td>${i}</td>
        <td>${r.riesgo}</td>
        <td>${r.probabilidad}</td>
        <td>${r.impacto}</td>
        <td class="${nivelClass}">${r.nivel} (${nivelTxt})</td>
      </tr>`;
    tbody.innerHTML += row;
    i++;
  }

  // --- Sección colectivos (simulada) ---
  const mayorias = {
    1: { riesgo: "Golpeado por vehículo en movimiento", nivel: "Alto" },
    2: { riesgo: "Lesiones por falta de EPP", nivel: "Medio" },
    3: { riesgo: "Falla de equipos de izaje", nivel: "Alto" },
    4: { riesgo: "Colisión por distracción", nivel: "Bajo" }
  };

  const cont = document.getElementById("comparacion");
  cont.innerHTML = `<h3>Comparación con tus respuestas</h3>`;

  for (let i = 1; i <= Object.keys(mayorias).length; i++) {
    const tu = respuestas["situacion" + i];
    const grupo = mayorias[i];
    if (!tu) continue;

    let texto = "";
    if (tu.riesgo === grupo.riesgo) {
      texto = `Coincidiste con la mayoría en identificar "${tu.riesgo}".`;
    } else {
      texto = `Tú elegiste "${tu.riesgo}", pero la mayoría eligió "${grupo.riesgo}".`;
    }

    if (tu.nivel <= 5) tu.nivelTxt = "Bajo";
    else if (tu.nivel <= 15) tu.nivelTxt = "Medio";
    else tu.nivelTxt = "Alto";

    if (tu.nivelTxt === grupo.nivel) {
      texto += ` También coincidiste en el nivel de riesgo (${grupo.nivel}).`;
    } else {
      texto += ` Pero tú lo valoraste como ${tu.nivelTxt} y la mayoría como ${grupo.nivel}.`;
    }

    cont.innerHTML += `
      <div class="card-mini">
        <h4>Situación ${i}</h4>
        <p>${texto}</p>
      </div>`;
  }
}

function volverUltima() {
  if (ultimaPantalla) {
    cambiarPantalla(ultimaPantalla);
  }
}
function finalizar() {
  // Vaciar respuestas para reiniciar
  respuestas = {};
  ultimaPantalla = null;

  // Ocultar todas las pantallas
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));

  // Mostrar la pantalla inicial
  document.getElementById("screen1").classList.add("active");

  // Asegurar que vuelva al tope de la página
  window.scrollTo({ top: 0, behavior: "smooth" });
}
