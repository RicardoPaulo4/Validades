
import { GoogleGenAI, Type } from "@google/genai";

// We use gemini-3-flash-preview for fast image processing and text extraction
const MODEL_NAME = 'gemini-3-flash-preview';

export async function analyzeProductLabel(base64Image: string) {
  // Always use process.env.API_KEY directly without fallbacks or modifications
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1] || base64Image,
    },
  };

  const prompt = "Analisa esta imagem de um rótulo de produto. Extrai o nome do produto e a data de validade. Se não encontrares a data exata, tenta estimar com base em códigos de lote se visíveis. Responde apenas em formato JSON.";

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING, description: "Nome do produto detetado" },
            expiryDate: { type: Type.STRING, description: "Data de validade no formato YYYY-MM-DD" },
            confidence: { type: Type.NUMBER, description: "Nível de confiança de 0 a 1" }
          },
          required: ["productName", "expiryDate"]
        }
      }
    });

    // Directly access the .text property from the GenerateContentResponse object
    const jsonStr = response.text;
    return JSON.parse(jsonStr || '{}');
  } catch (error) {
    console.error("Erro ao analisar imagem com Gemini:", error);
    return null;
  }
}
