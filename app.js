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
          <label>Probabilidad:</label>
          <select id="prob${num}">
            <option value="">-- Selecciona --</option>
            <option value="1">1 - Baja (ocurrirá rara vez)</option>
            <option value="2">2 - Media (puede pasar en varias ocasiones)</option>
            <option value="4">4 - Alta (ocurrirá siempre o casi siempre)</option>
          </select>
          <label>Consecuencia:</label>
          <select id="impact${num}">
            <option value="">-- Selecciona --</option>
            <option value="1">1 - Ligeramente dañino</option>
            <option value="2">2 - Dañino</option>
            <option value="4">4 - Extremadamente dañino</option>
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

// --- Función para mapear nivel ---
function getNivelTexto(nivel) {
  if (nivel === 1) return { txt: "Trivial", cls: "nivel-trivial" };
  if (nivel === 2) return { txt: "Tolerable", cls: "nivel-tolerable" };
  if (nivel === 4) return { txt: "Moderado", cls: "nivel-moderado" };
  if (nivel === 8) return { txt: "Importante", cls: "nivel-importante" };
  if (nivel === 16) return { txt: "Intolerable", cls: "nivel-intolerable" };
  return { txt: "No definido", cls: "nivel-indefinido" };
}

// --- Mostrar resultados ---
async function mostrarResumen() {
  console.log("🔎 mostrarResumen() iniciado...");

  // --- Tabla individual ---
  let tbody = document.querySelector("#tablaResumen tbody");
  tbody.innerHTML = "";
  let i = 1;
  for (let s in respuestas) {
    let r = respuestas[s];
    let { txt, cls } = getNivelTexto(r.nivel);

    let row = `
      <tr>
        <td>${i}</td>
        <td>${r.riesgo}</td>
        <td>${r.probabilidad}</td>
        <td>${r.impacto}</td>
        <td class="${cls}">${r.nivel} (${txt})</td>
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

// --- Contar respuestas totales ---
let totalRespuestas = 0;
try {
  const { count, error: countError } = await supabase
    .from("respuestas_participantes")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("❌ Error al contar respuestas:", countError.message);
  } else {
    totalRespuestas = count;
  }
} catch (e) {
  console.error("❌ Error inesperado al contar:", e);
}

// 🔹 Actualizar título con (n=...)
const tituloColectivos = document.querySelector("#tituloColectivos");
if (tituloColectivos) {
  tituloColectivos.innerHTML = `Resultados de otros participantes del curso (n=${totalRespuestas})`;
}

  // --- Tabla colectivos ---
let tbody2 = document.querySelector("#tablaColectivos tbody");
tbody2.innerHTML = "";
data.forEach((d) => {
  let { txt, cls } = getNivelTexto(d.vep_moda);

  let row = `
    <tr>
      <td>${d.situacion_id}</td>
      <td style="text-align: left;">${d.riesgo_mas_frecuente}</td>
      <td>${d.porcentaje ? Math.round(d.porcentaje) : 0}%</td>
      <td>${d.prob_moda ?? '-'}</td>
      <td>${d.impact_moda ?? '-'}</td>
      <td class="${cls}">${d.vep_moda ?? '-'} (${txt})</td>
    </tr>`;
  tbody2.innerHTML += row;
});

// 🔹 Texto fijo al final de la tabla
tbody2.innerHTML += `
  <tr>
    <td colspan="6" style="text-align:center; padding-top:15px;">
      <br>
      <p style="font-style:italic; color:#555;">
        Los valores mostrados en esta tabla corresponden a las modas, es decir, las respuestas más repetidas por los participantes en cada dimensión (probabilidad, consecuencia y VEP). Por esta razón, el VEP más reportado no siempre coincide con el cálculo directo de multiplicar la probabilidad y la consecuencia, sino que refleja la tendencia grupal.
      </p>
    </td>
  </tr>
`;


  // --- Comparación personalizada ---
const cont = document.getElementById("comparacion");
let comparadorHTML = `<h3>Comparación con tus respuestas</h3>`;

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

  let { txt: tuNivel } = getNivelTexto(tu.nivel);
  let { txt: grupoNivel } = getNivelTexto(d.vep_moda);

  if (tuNivel === grupoNivel) {
    texto += ` También coincidiste en el nivel de riesgo (${grupoNivel}).`;
  } else {
    texto += ` Pero tú lo valoraste como ${tuNivel} y la mayoría como ${grupoNivel}.`;
  }

  comparadorHTML += `
    <div class="card-mini">
      <h4>Situación ${d.situacion_id}</h4>
      <p>${texto}</p>
    </div>`;
});

// 🔹 ahora sí, al final agregamos el texto fijo
comparadorHTML += `
  <br>
  <p style="font-style:italic; color:#555; text-align:center;">
    La comparación entre tu percepción y la de los demás participantes es una oportunidad para reflexionar sobre cómo evaluamos el riesgo de manera individual y cómo influyen factores como la experiencia o el contexto laboral en esa percepción.
  </p>
`;


cont.innerHTML = comparadorHTML;

}


// --- Finalizar ---
window.finalizar = function () {
  respuestas = {};
  ultimaPantalla = null;
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById("screen1").classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
};
