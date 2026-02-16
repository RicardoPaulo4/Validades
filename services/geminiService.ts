
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

  const prompt = "Analisa esta imagem de um rótulo de produto ou selo de validade. Extrai o NOME DO PRODUTO e a DATA DE VALIDADE (EXPIRY DATE). Se encontrares apenas o mês/ano, assume o último dia do mês. Responde obrigatoriamente em formato JSON seguindo o esquema definido.";

  try {
    // Calling ai.models.generateContent with both model name and prompt parts.
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING, description: "Nome detetado do produto (Ex: Iogurte Grego)" },
            expiryDate: { type: Type.STRING, description: "Data de validade formatada como YYYY-MM-DD" },
            confidence: { type: Type.NUMBER, description: "Confiança na deteção (0 a 1)" }
          },
          required: ["productName", "expiryDate"]
        }
      }
    });

    // Directly access the text property of the GenerateContentResponse object.
    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro na análise Gemini AI:", error);
    return null;
  }
}
