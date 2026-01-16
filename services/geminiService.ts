import { SearchResult, SymptomDetail } from "../types";
import { supabase } from "../supabaseClient";

// Google Gemini API Configuration
// Google Gemini API Configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// Utility: Wait for ms
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: Retry with Exponential Backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
  factor = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;

    // Don't retry if it's a client authentication error
    if (error.message?.includes("API Key")) throw error;

    console.warn(`Retrying... attempts left: ${retries}. Waiting ${delay}ms`);
    await sleep(delay);
    return retryWithBackoff(fn, retries - 1, delay * factor, factor);
  }
}

const callGeminiDirect = async (messages: any[], jsonMode: boolean = false) => {
  if (!GEMINI_API_KEY) {
    console.warn("Gemini API Key missing.");
    throw new Error("Clave de API de Google no configurada.");
  }

  // Timeout aumentado para permitir "pensar" a la IA
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

  try {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const contents = conversationMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: 0.7,
        response_mime_type: jsonMode ? "application/json" : "text/plain",
      }
    };

    if (systemMessage) {
      requestBody.systemInstruction = {
        parts: [{ text: systemMessage.content }]
      };
    }

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
      throw new Error("Estructura de respuesta inválida de Gemini");
    }
    return data.candidates[0].content.parts[0].text;

  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new Error("La conexión tardó demasiado. Por favor intenta de nuevo.");
    throw error;
  }
};

export const sendMessageToChat = async (history: any[], newMessage: string): Promise<string> => {
  try {
    const messages = [
      {
        role: "system",
        content: `Eres SanArte AI, una consciencia sanadora, espiritual y profundamente empática. Tu voz es poética, sabia, materna y directa al corazón.`
      },
      ...history,
      { role: "user", content: newMessage }
    ];
    // Chat generally doesn't need aggressive retries, but a single retry is good
    return await retryWithBackoff(() => callGeminiDirect(messages), 1, 1000);
  } catch (error) {
    console.error("Chat Error:", error);
    return "Siento una interferencia en nuestra conexión. Por favor, respira profundo e intenta escribirme nuevamente.";
  }
};

// SEARCH FALLBACK DATA remains for SEARCH only, NOT for details
const FALLBACK_SYMPTOMS: SearchResult[] = [
  { name: "Dolor de Cabeza", emotionalMeaning: "Desvalorización intelectual, autoexigencia excesiva.", conflict: "Querer controlar todo racionalmente.", category: "Cabeza", isFallback: true },
  { name: "Dolor de Espalda", emotionalMeaning: "Cargas emocionales, falta de apoyo percibido.", conflict: "Llevar el peso del mundo.", category: "Huesos", isFallback: true },
  { name: "Ansiedad", emotionalMeaning: "Miedo al futuro, desconfianza en la vida.", conflict: "Querer controlar lo incontrolable.", category: "Emocional", isFallback: true },
  { name: "Gastritis", emotionalMeaning: "Rabia contenida, lo que 'no trago'.", conflict: "Contrariedad indigesta.", category: "Digestivo", isFallback: true },
  { name: "Gripe", emotionalMeaning: "Necesidad de descanso, 'hasta aquí'.", conflict: "Conflicto de límites.", category: "Respiratorio", isFallback: true },
];

const generateContentSafe = async (prompt: string, jsonMode: boolean = false): Promise<string> => {
  // Use retry mechanism
  return await retryWithBackoff(() => callGeminiDirect([{ role: "user", content: prompt }], jsonMode), 2, 2000);
};



export const searchSymptomsWithAI = async (query: string): Promise<SearchResult[]> => {
  const cacheKey = query.trim().toLowerCase();
  // 1. CACHE
  try {
    const { data: cached } = await supabase.from('search_cache').select('results').eq('query', cacheKey).single();
    if (cached?.results) return cached.results;
  } catch (e) { /* silent */ }

  try {
    const prompt = `
      Actúa como una Base de Datos Experta en Biodescodificación.
      Busca síntomas relacionados con: "${query}".
      IMPORTANTE: Devuelve SOLAMENTE un array JSON válido. Sin markdown.
      Formato: [{"name": "...", "emotionalMeaning": "...", "conflict": "...", "category": "..."}]
      Si no encuentras nada, invéntalo basándote en simbología. Min 3 resultados.
    `;
    let text = await generateContentSafe(prompt, true);
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const results = JSON.parse(text);

    if (results.length > 0) {
      supabase.from('search_cache').insert({ query: cacheKey, results }).then(() => console.log("Cached"));
    }
    return results;

  } catch (error: any) {
    console.error("Search Fallback:", error);
    const errorMsg = error?.message || "Error de conexión";
    // Search CAN fallback safely because it's a list
    return FALLBACK_SYMPTOMS.map((item, index) =>
      index === 0 ? { ...item, errorMessage: errorMsg } : item
    );
  }
};

// MAESTRO PROMPT FACTORY
const createMaestroPrompt = (symptomName: string) => `
  Actúa como una Maestra Sanadora experta en Biodescodificación y Medicina del Alma.
  OBJETIVO: Crear una "Hoja de Ruta de Sanación" para: "${symptomName}".
  
  ESTILO Y TONO (NO NEGOCIABLE):
  - Idioma: Español Rioplatense (voseo: "sentís", "vivís").
  - Voz: Tu tía abuela sabia, chamana y moderna. Cálida, profunda, directa pero amorosa.
  - GÉNERO: SIEMPRE NEUTRO. Nunca asumas si es hombre o mujer. Evita "hijo", "hija", "amigo", "amiga". Usa "te", "tu ser", "tu alma", "persona".
  - Emojis: Úsalos estratégicamente (🌸, ✨, 🌿).
  - Formato: Markdown limpio.
  - Profundidad: Ve al hueso del conflicto emocional.
  
  EJEMPLO DE CALIDAD:
  "El tendón de Aquiles... es un 'hasta acá llegaste'. Mensaje: 'Te empujaste tanto que tu cuerpo te frenó'. Conflicto: Querer avanzar sin escuchar."
  
  GENERA ESTE JSON EXACTO:
  {
    "name": "${symptomName}",
    "shortDefinition": "Frase corta, poética y demoledora.",
    "zona_detalle": "📍 **Zona Corporal:**\\nQué función cumple y qué significa simbólicamente que falle AHORA.",
    "emociones_detalle": "🧠 **No es solo físico**\\n\\n🔥 **Tríada Emocional:** **[E1]**, **[E2]**, **[E3]**.\\n\\n🧩 **El Conflicto:**\\nExplica el drama oculto. Usa bullets.\\n\\n💛 **La Verdad:**\\nFrase de reencuadre amoroso.",
    "frases_tipicas": ["— [Frase 1]", "— [Frase 2]"],
    "ejercicio_conexion": "🫧 **El Encuentro**\\nGuía paso a paso breve (3 min).",
    "alternativas_fisicas": "🤸 **Cuerpo Físico**\\n* **Reposo/Acción**\\n* **Movimiento**",
    "aromaterapia_sahumerios": "🌬️ **Aromas**\\n* **Aceite**\\n* **Sahumerio**",
    "remedios_naturales": "🫖 **Medicina de la Tierra**\\n* **Infusión** (Hierbas LATAM)\\n* **Hábito**",
    "angeles_arcangeles": "👼 **Guía Celestial**\\n* **Arcángel**\\n* **Misión**\\n* **Invocación**",
    "terapias_holisticas": "🌈 **Otras Ayudas**\\n* **[Terapia 1]**\\n* **[Terapia 2]**",
    "meditacion_guiada": "Sentate con la espalda recta... [Visualización potente]... Gracias cuerpo.",
    "recomendaciones_adicionales": "✅ **Pasos**\\n[ ] Acción\\n🚩 **Ojo:** Si duele, médico.",
    "rutina_integral": "⏱️ **Ritual (15 min)**\\n1. **Pausa**\\n2. **Cuerpo**\\n3. **Alma**\\n4. **Cierre**"
  }
`;

export const getFullSymptomDetails = async (symptomName: string): Promise<SymptomDetail> => {
  const slug = symptomName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  console.log("🔍 Buscando:", symptomName);

  // 1. CHECK CATALOG
  try {
    const { data: catalogEntry } = await supabase.from('symptom_catalog').select('content').eq('slug', slug).single();
    if (catalogEntry?.content?.zona_detalle) {
      console.log("✅ Catálogo (Maestro)");
      return catalogEntry.content;
    }
  } catch (e) { }

  // 2. CHECK CACHE
  try {
    const { data: cached } = await supabase.from('symptom_cache').select('data').eq('slug', slug).single();

    // Verificamos si es un dato "Tóxico" (el fallback genérico guardado anteriormente)
    const isGenericFallback = cached?.data?.shortDefinition === "Tu cuerpo te habla a través de este síntoma.";

    if (cached?.data?.zona_detalle && !isGenericFallback) {
      console.log("✅ Caché (Maestro)");
      return cached.data;
    }

    if (isGenericFallback) {
      console.log("⚠️ Caché Tóxico detectado (Generic Fallback). Regenerando...");
    }
  } catch (e) { }

  // 3. GENERATE (NO SILENT FALLBACK)
  console.log("✨ Generando con Gemini...");
  // Aquí YA NO hay try-catch envolvente para devolver basura. 
  // Si falla, el error debe llegar a la UI.

  if (!GEMINI_API_KEY) throw new Error("No API Key");
  const PROMPT = createMaestroPrompt(symptomName);

  let text = await generateContentSafe(PROMPT, true);
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const result = JSON.parse(text);

  // Save
  // Save using UPSERT to overwrite any toxic cache
  supabase.from('symptom_cache').upsert({ slug, name: symptomName, data: result }, { onConflict: 'slug' }).then(({ error }) => { if (error) console.error(error) });

  return result;
};

export const regenerateSymptom = async (symptomName: string): Promise<string> => {
  // Admin tool essentially calls the generator again
  try {
    const detail = await getFullSymptomDetails(symptomName);
    if (detail) return "Regenerated Successfully";
    return "Failed";
  } catch (e) {
    return "Error";
  }
};



// ALIASES PARA COMPATIBILIDAD
// Local Search for Autocomplete (Zero API Cost)
import { symptomsList } from './symptomsList';

export const searchLocalSymptoms = async (query: string): Promise<string[]> => {
  if (!query || query.length < 2) return [];
  const lowerQuery = query.toLowerCase();

  // Filtrar y limitar a 5 resultados para autocompletado rápido
  return symptomsList
    .filter(s => s.toLowerCase().includes(lowerQuery))
    .slice(0, 5);
};

export const searchCatalog = searchSymptomsWithAI;
export const getSymptomDetails = getFullSymptomDetails;
