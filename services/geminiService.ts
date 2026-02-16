
import { GoogleGenAI, Type } from "@google/genai";

// Use gemini-3-flash-preview for general purpose multimodal extraction tasks.
const MODEL_NAME = 'gemini-3-flash-preview';

export async function analyzeProductLabel(base64Image: string) {
  // Always initialize GoogleGenAI with a named apiKey parameter from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1] || base64Image,
    },
  };

  const prompt = `Age como um assistente especialista em inventário de retalho. 
Analisa a imagem do rótulo do produto e extrai:
1. O NOME DO PRODUTO (ex: "Leite Meio Gordo", "Iogurte Natural").
2. A DATA DE VALIDADE (EXPIRY DATE) visível. 

Instruções críticas:
- Se vires apenas Mês/Ano (ex: 12/2025), assume o último dia desse mês (ex: 2025-12-31).
- Formata a data estritamente como YYYY-MM-DD.
- Ignora datas de fabrico se houver uma data de validade clara.
- Se houver várias datas, escolhe a que indica expiração (EXP, VAL, Lote/Val).

Responde exclusivamente em formato JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING, description: "Nome detetado do produto" },
            expiryDate: { type: Type.STRING, description: "Data de validade formatada como YYYY-MM-DD" },
            confidence: { type: Type.NUMBER, description: "Grau de certeza da extração (0.0 a 1.0)" }
          },
          required: ["productName", "expiryDate"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro na análise Gemini AI:", error);
    return null;
  }
}
