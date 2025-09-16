// --- Inicializar Supabase ---
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://bzjsjuehullgextzraqf.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6anNqdWVodWxsZ2V4dHpyYXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjA0NjksImV4cCI6MjA3MzU5NjQ2OX0.g6KlSAYARCPANWpbEj3ms3N4r7wqzsWobqhqMM7Nru4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Variables globales ---
let respuestas = {};
let ultimaPantalla = null;

// --- Cambiar de pantalla ---
function cambiarPantalla(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- Iniciar ---
window.iniciar = function () {
  document.getElementById("screen1").classList.remove("active");
  generarPantallas();
  setTimeout(() => {
    document.getElementById("screen1-1").classList.add("active");
  }, 50);
};

// --- Generar pantallas dinámicas ---
function generarPantallas() {
  const contenedor = document.getElementById("contenedor-situaciones");
  contenedor.innerHTML = "";

  situaciones.forEach((sit, idx) => {
    const num = idx + 1;

    const pantallaSel = `
      <div class="screen" id="screen${num}-1">
        <div class="card">
          <h3>Situación ${num}</h3>
          <p>${sit.texto}</p>
          <label>Selecciona el riesgo principal:</label>
          <select id="riesgo${num}">
            <option value="">-- Elige una opción --</option>
            ${sit.opciones.map((op) => `<option value="${op.valor}">${op.valor}</option>`).join("")}
          </select>
          ${num > 1 ? `<button class="btn btn-secondary" onclick="prevScreen(${num-1},2)">Volver</button>` : ""}
          <button class="btn" onclick="nextScreen(${num},2)">Continuar</button>
        </div>
      </div>`;

    const pantallaVal = `
      <div class="screen" id="screen${num}-2">
        <div class="card">
          <h3>Situación ${num} - Valoración</h3>
          <div id="riesgoSeleccionado${num}" class="riesgo-destacado"></div>
          <label>Probabilidad (1-5):</label>
          <select id="prob${num}">
            <option value="">-- Selecciona --</option>
            <option value="1">1 - Raro</option>
            <option value="2">2 - Poco probable</option>
            <option value="3">3 - Moderado</option>
            <option value="4">4 - Probable</option>
            <option value="5">5 - Casi seguro</option>
          </select>
          <label>Impacto (1-5):</label>
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

// --- Navegación ---
window.nextScreen = function (num, paso) {
  if (paso === 2) {
    const riesgo = document.getElementById(`riesgo${num}`).value;
    if (!riesgo) {
      alert("Debes seleccionar un riesgo antes de continuar.");
      return;
    }
    document.getElementById(`riesgoSeleccionado${num}`).innerText =
      "Riesgo seleccionado: " + riesgo;
  }
  cambiarPantalla(`screen${num}-${paso}`);
};

window.prevScreen = function (num, paso) {
  cambiarPantalla(`screen${num}-${paso}`);
};

// --- Guardar respuestas ---
window.guardar = async function (num, next) {
  let riesgo = document.getElementById("riesgo" + num).value;
  let prob = parseInt(document.getElementById("prob" + num).value);
  let impact = parseInt(document.getElementById("impact" + num).value);

  if (!riesgo || !prob || !impact) {
    alert("Completa todas las opciones");
    return;
  }

  let nivel = prob * impact;
  respuestas["situacion" + num] = { riesgo, probabilidad: prob, impacto: impact, nivel };

  if (next === "resumen") {
    ultimaPantalla = `screen${num}-2`;
    cambiarPantalla("screenLoading");

    const { error } = await supabase.from("respuestas_participantes").insert([{ respuestas }]);
    if (error) console.error("❌ Error guardando en Supabase:", error.message);
    else console.log("✅ Respuestas guardadas en Supabase");

    setTimeout(async () => {
      await mostrarResumen();
      cambiarPantalla("screenResumen");
    }, 2000);
  } else {
    nextScreen(next, 1);
  }
};

// --- Mostrar resultados ---
async function mostrarResumen() {
  console.log("🔎 mostrarResumen() iniciado...");

  // --- Tabla individual ---
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

  // --- Resultados colectivos ---
  console.log("⏳ Llamando a resultados_colectivos...");
  const { data, error } = await supabase.rpc("resultados_colectivos");

  if (error) {
    console.error("❌ Error RPC:", error.message);
    return;
  }
  if (!data || data.length === 0) {
    console.warn("⚠️ La RPC no devolvió datos");
    return;
  }

  console.log("📊 Datos colectivos recibidos:", data);

  // --- Tabla colectivos ---
  let tbody2 = document.querySelector("#tablaColectivos tbody");
  tbody2.innerHTML = "";
  data.forEach((d) => {
    let nivelClass =
      d.nivel_mas_reportado === "Bajo" ? "nivel-bajo" :
      d.nivel_mas_reportado === "Medio" ? "nivel-medio" :
      "nivel-alto";

    let row = `
      <tr>
        <td>${d.situacion_id}</td>
        <td style="text-align: left;">${d.riesgo_mas_frecuente}</td>
        <td>${d.porcentaje ? d.porcentaje.toFixed(1) : 0}%</td>
        <td>${d.prob_promedio ? d.prob_promedio.toFixed(1) : "-"}</td>
        <td>${d.impact_promedio ? d.impact_promedio.toFixed(1) : "-"}</td>
        <td class="${nivelClass}">${d.nivel_mas_reportado || "-"}</td>
      </tr>`;
    tbody2.innerHTML += row;
  });

  // --- Comparación personalizada ---
  const cont = document.getElementById("comparacion");
  cont.innerHTML = `<h3>Comparación con tus respuestas</h3>`;
  data.forEach((d) => {
    const tu = respuestas["situacion" + d.situacion_id];
    if (!tu) return;

    const riesgoTu = tu.riesgo.replace(/\(distractor\)/gi, "").trim().toLowerCase();
    const riesgoGrupo = d.riesgo_mas_frecuente.replace(/\(distractor\)/gi, "").trim().toLowerCase();

    let texto = "";
    if (riesgoTu === riesgoGrupo) {
      texto = `Coincidiste con la mayoría en identificar "${tu.riesgo}".`;
    } else {
      texto = `Tú elegiste "${tu.riesgo}", pero la mayoría eligió "${d.riesgo_mas_frecuente}".`;
    }

    let tuNivel = tu.nivel <= 5 ? "Bajo" : tu.nivel <= 15 ? "Medio" : "Alto";
    if (tuNivel === d.nivel_mas_reportado) {
      texto += ` También coincidiste en el nivel de riesgo (${d.nivel_mas_reportado}).`;
    } else {
      texto += ` Pero tú lo valoraste como ${tuNivel} y la mayoría como ${d.nivel_mas_reportado}.`;
    }

    cont.innerHTML += `
      <div class="card-mini">
        <h4>Situación ${d.situacion_id}</h4>
        <p>${texto}</p>
      </div>`;
  });
}

// --- Finalizar ---
window.finalizar = function () {
  respuestas = {};
  ultimaPantalla = null;
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById("screen1").classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
};
