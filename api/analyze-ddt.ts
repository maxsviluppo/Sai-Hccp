import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64, mimeType } = req.body;
  const key = req.body.apiKey || process.env.GEMINI_API_KEY;

  if (!base64 || !mimeType) {
    return res.status(400).json({ error: 'Missing base64 data or mimeType' });
  }

  if (!key) {
    return res.status(400).json({ error: 'Manca la chiave API di Gemini. Configurala nelle impostazioni o come variabile d\'ambiente.' });
  }

  const modelsToTry = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const prompt = `Analyze this DDT (shipping document) and extract all products. Extract the supplier name, document date (entryDate), and the list of items with their name, lot number, quantity, and expiry date. If some fields are not readable, return them as empty strings. Response must be strictly in JSON.`;

    let lastError = '';
    let parsedData = null;
    let success = false;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[API analyze-ddt] Trying model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { inlineData: { mimeType, data: base64 } },
            { text: prompt }
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                supplierName: { type: Type.STRING },
                entryDate: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      ingredientName: { type: Type.STRING },
                      lotto: { type: Type.STRING },
                      quantity: { type: Type.STRING },
                      expiryDate: { type: Type.STRING }
                    },
                    required: ['ingredientName', 'lotto', 'quantity', 'expiryDate']
                  }
                }
              },
              required: ['supplierName', 'entryDate', 'items']
            },
            maxOutputTokens: 1500,
            temperature: 0.1
          }
        });

        const text = response.text;
        if (!text) {
          throw new Error('Modello ha restituito testo vuoto.');
        }

        parsedData = JSON.parse(text);
        success = true;
        console.log(`[API analyze-ddt] Success with model: ${modelName}`);
        break; // Success! Exit loop

      } catch (err: any) {
        console.warn(`[API analyze-ddt] Model ${modelName} failed:`, err.message);
        lastError = err.message;
      }
    }

    if (!success) {
      return res.status(500).json({ success: false, error: `Nessun modello AI disponibile: ${lastError}` });
    }

    return res.status(200).json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error('[API analyze-ddt] Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Errore durante l\'elaborazione dell\'AI.' 
    });
  }
}
