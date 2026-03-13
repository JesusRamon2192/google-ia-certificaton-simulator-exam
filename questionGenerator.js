// ===============================
// QuestionGenerator.js
// ===============================

class QuestionGenerator {
  constructor() {
    this.apis = CONFIG.APIS || [];
    this.currentApiIndex = parseInt(localStorage.getItem('ai-current-api-index')) || 0;
    if (this.currentApiIndex >= this.apis.length) {
      this.currentApiIndex = 0;
    }
    this.topics = [];
    this.studyGuide = "";
    this.BATCH_SIZE = 2; // Reducido para evitar alucinaciones por sobrecarga de contexto
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* ===============================
   * CARGA DE TEMAS Y GUÍA DE ESTUDIO
   * =============================== */
  async loadTopics() {
    if (this.topics.length > 0) return this.topics;

    try {
      const response = await fetch("topics.json");
      if (!response.ok) throw new Error("No se pudo cargar topics.json");
      this.topics = await response.json();
      return this.topics;
    } catch (err) {
      console.error("❌ Error cargando temas:", err);
      // Fallback mínimo en caso de error
      this.topics = ["Google Cloud Basics"];
      return this.topics;
    }
  }

  async loadStudyGuide() {
    if (this.studyGuide) return this.studyGuide;

    try {
      const response = await fetch("study-guide.txt");
      if (!response.ok) throw new Error("No se pudo cargar study-guide.txt");
      this.studyGuide = await response.text();
      return this.studyGuide;
    } catch (err) {
      console.error("❌ Error cargando la guía de estudio:", err);
      this.studyGuide = "";
      return this.studyGuide;
    }
  }

  /* ===============================
   * API PÚBLICA
   * =============================== */
  async generateMultipleQuestions(total) {
    await this.loadTopics();
    await this.loadStudyGuide();
    const allQuestions = [];
    const usedHashes = new Set();
    let topicIndex = 0;

    while (allQuestions.length < total) {
      const remaining = total - allQuestions.length;
      const batchSize = Math.min(this.BATCH_SIZE, remaining);

      const topicsForBatch = [];
      for (let i = 0; i < batchSize; i++) {
        topicsForBatch.push(this.topics[topicIndex % this.topics.length]);
        topicIndex++;
      }

      // Pausa activa entre lotes para no saturar los límites de peticiones por minuto de las APIs
      if (allQuestions.length > 0) {
        console.log(`⏳ Esperando 2.5s antes del siguiente lote...`);
        await this.sleep(2500);
      }

      const batch = await this.generateBatch(batchSize, topicsForBatch);
      const unique = [];

      for (const q of batch) {
        const hash = this.hashQuestion(q.question);
        if (!usedHashes.has(hash)) {
          usedHashes.add(hash);
          unique.push(q);
        }
      }

      if (unique.length === 0) {
        console.warn("⚠️ Lote duplicado, regenerando...");
        continue;
      }

      allQuestions.push(...unique);
    }

    // Identificamos las preguntas agregando qué API se utilizó para esta corrida de batch
    allQuestions.forEach(q => {
      if (!q.apiUsed) {
        q.apiUsed = this.apis[this.currentApiIndex].name;
      }
    });

    // Moverse al siguiente índice API (Round Robin)
    this.currentApiIndex = (this.currentApiIndex + 1) % this.apis.length;
    localStorage.setItem('ai-current-api-index', this.currentApiIndex);

    return allQuestions.slice(0, total);
  }

  /* ===============================
   * GENERACIÓN DE LOTE
   * =============================== */
  async generateBatch(count, topics) {
    const prompt = this.buildPrompt(count, topics, this.studyGuide);

    let attempts = 0;
    const maxAttempts = this.apis.length;
    let globalRetries = 0;
    const maxGlobalRetries = 1; // Un reintento global con backoff para evitar 429 Too Many Requests

    while (globalRetries <= maxGlobalRetries) {
      attempts = 0;
      while (attempts < maxAttempts) {
        try {
          const raw = await this.callOpenAI(prompt);
          return this.parseResponse(raw);
        } catch (err) {
          const failedApi = this.apis[this.currentApiIndex]?.name || `API #${this.currentApiIndex}`;
          console.warn(`⚠️ Intento fallido con ${failedApi}: ${err.message}`);

          // Cambiar a la siguiente API
          this.currentApiIndex = (this.currentApiIndex + 1) % this.apis.length;
          localStorage.setItem('ai-current-api-index', this.currentApiIndex);

          attempts++;
          if (attempts < maxAttempts) {
            const nextApi = this.apis[this.currentApiIndex]?.name;
            console.log(`🔄 Reintentando con siguiente API: ${nextApi}...`);

            // Mostrar validación visual al usuario
            if (typeof showToast === 'function') {
              showToast(`${failedApi} falló. Reintentando con ${nextApi}...`, 'warning');
            }
          }
        }
      }

      if (globalRetries < maxGlobalRetries) {
        console.warn(`⏳ Todas las APIs fallaron en este intento. Aplicando backoff de 10 segundos antes del reintento final...`);
        if (typeof showToast === 'function') {
          showToast(`Límites de API saturados. Pausando 10s para recuperar tokens...`, 'warning');
        }
        await this.sleep(10000);
        globalRetries++;
      } else {
        break;
      }
    }

    // Si llegamos aquí después de los reintentos globales, falló definitivamente
    if (typeof showToast === 'function') {
      showToast("Todas las APIs fallaron tras los reintentos. Verifica tus tokens o conexión.", 'error');
    }
    throw new Error("Todas las APIs fallaron. Verifica que tengas tokens o saldo disponible en alguna de ellas.");
  }

  /* ===============================
   * PROMPT
   * =============================== */
  buildPrompt(count, topics, studyGuide) {
    return `
Actúa como un examinador riguroso de certificación de Google Cloud. Genera ${count} preguntas DIFERENTES de nivel de certificación para el examen "Google Cloud Generative AI".

RESTRICCIÓN CRÍTICA:
- TU ÚNICA FUENTE DE INFORMACIÓN ES EL SIGUIENTE DOCUMENTO. PROHIBIDO usar conocimientos externos o inventar servicios que no aparezcan verbatim en él. Si un tema no está en el documento, elige otro tema que sí lo esté.

<study_guide>
${studyGuide}
</study_guide>

REGLAS OBLIGATORIAS:
- Cada pregunta debe usar UN tema distinto de esta lista (evalúa si están en la guía):
${topics.map(t => `- ${t}`).join("\n")}

- No repitas preguntas ni escenarios de preguntas anteriores.
- Idioma: Español.
- TERMINOLOGÍA: Utiliza SIEMPRE los acrónimos estándar de la industria, incluso si el texto está en español.
- Debe tener exactamente 4 opciones de respuesta.
- Solo 1 opción debe ser la correcta. Las otras 3 deben ser plausibles pero indudablemente incorrectas. Los distractores deben ser términos que SÍ existan en la guía de estudio, pero correspondientes a conceptos diferentes.
- EVITA opciones ambiguas, obvias o como "Todas las anteriores" / "Ninguna de las anteriores".
- La posición de la respuesta correcta (A, B, C o D) debe ser elegida de forma ALEATORIA por ti para cada pregunta. No pongas siempre la respuesta correcta en la misma opción.
- Para evitar errores lógicos, tu salida debe incluir tu ruta de razonamiento ("razonamiento_interno") y extraer la cita exacta de la guía de estudio ("cita_textual") en la que te basas, ANTES de generar la pregunta.
- La explicación DEBE empezar explícitamente indicando la letra de la opción correcta (ej: "La respuesta correcta es la C) porque..."). Esta letra y justificación deben coincidir exactamente con la opción correcta generada.
- La explicación DEBE justificar claramente por qué la respuesta correcta es correcta y por qué las demás fallan, basándose en la cita.
- El índice de la respuesta correcta ("answer") DEBE coincidir sin ninguna duda con la opción correcta descrita en la explicación.
- Responde SOLO con JSON válido. Ni una sola palabra fuera del JSON. Sin bloques de código markdown (\`\`\`json).

FORMATO EXACTO DEL JSON:
{
  "questions": [
    {
      "razonamiento_interno": "Análisis paso a paso para formular la pregunta y distractores basados en el texto...",
      "cita_textual": "Fragmento exacto copiado y pegado de la guía de estudio que respalda la respuesta...",
      "question": "Texto detallado de la pregunta",
      "options": [
        "A) Texto de la opción A",
        "B) Texto de la opción B",
        "C) Texto de la opción C",
        "D) Texto de la opción D"
      ],
      "explicacion": "Primero, explica detalladamente el razonamiento para llegar a la respuesta correcta y descartar las demás, referenciando la cita textual.",
      "answer": 0
    }
  ]
}
NOTA SOBRE "answer": Debe ser numérico, correspondiendo al índice de la opción correcta (0 para la opción A, 1 para la B, 2 para la C, 3 para la D).
`;
  }

  /* ===============================
   * OPENAI COMPATIBLE API CALL
   * =============================== */
  async callOpenAI(prompt) {
    const api = this.apis[this.currentApiIndex];
    if (!api || !api.key) {
      throw new Error(`API key no configurada para ${api?.name || 'la API actual'}.`);
    }

    const body = {
      model: api.model,
      messages: [
        { role: "system", content: "Responde únicamente con JSON válido." },
        { role: "user", content: prompt }
      ],
      temperature: CONFIG.TEMPERATURE,
      max_tokens: CONFIG.MAX_TOKENS
    };

    const res = await fetch(api.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api.key}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Error API (${api.name}):`, err);
      throw new Error("Error al generar preguntas");
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  /* ===============================
   * PARSEO ROBUSTO
   * =============================== */
  parseResponse(text) {
    let cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];

    const parsed = JSON.parse(cleaned);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Respuesta sin questions[]");
    }

    const valid = parsed.questions.filter(q => this.validate(q));
    if (valid.length === 0) {
      throw new Error("Preguntas inválidas");
    }

    // Se eliminó la mezcla local de opciones (shuffleOptions) para que la letra de la opción 
    // coincida perfectamente con la explicación generada por la IA.
    // La responsabilidad de la aleatorización ahora recae en el prompt de la IA.

    return valid;
  }

  /* ===============================
   * VALIDACIÓN + HASH
   * =============================== */
  validate(q) {
    const isValidStructure = (
      typeof q.razonamiento_interno === "string" &&
      typeof q.cita_textual === "string" &&
      typeof q.question === "string" &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.answer === "number" &&
      q.answer >= 0 &&
      q.answer <= 3 &&
      typeof q.explicacion === "string"
    );

    if (!isValidStructure) return false;

    // Validación estricta de la cita textual contra la guía de estudio
    if (this.studyGuide && q.cita_textual) {
       const normalizedGuide = this.normalizeStrict(this.studyGuide);
       const normalizedQuote = this.normalizeStrict(q.cita_textual);
       
       if (normalizedQuote.length > 5 && !normalizedGuide.includes(normalizedQuote)) {
          console.warn(`⚠️ Pregunta descartada por alucinación de cita: "${q.cita_textual}"`);
          return false;
       }
    }

    return true;
  }

  normalizeStrict(text) {
    if (!text) return "";
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Limpiar acentos
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ""); // Mantener sólo alfanuméricos
  }

  normalize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  hashQuestion(text) {
    return this.normalize(text);
  }
}

if (typeof module !== "undefined") {
  module.exports = QuestionGenerator;
}
