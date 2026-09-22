import { GoogleGenAI, Type } from "@google/genai";

const DDT_AI_PROMPT = `Sei un operatore HACCP esperto che legge un DDT / Documento di Trasporto / Bolla di consegna italiana.

FORNITORE (OBBLIGATORIO):
- Il MITTENTE / FORNITORE è nel riquadro o nell'area in ALTO A SINISTRA.
- Se in alto a sinistra è presente un logo grafico con testo o marchio:
  * Marchio "SAIMA" (es. "SAIMA S.p.a." - P.IVA 01992440618): supplierName = "SAIMA S.p.a.".
  * Marchio con maialino e scritta "jamonita": supplierName = "jamonita".
- Altrimenti supplierName = ragione sociale del mittente (sinistra).
- Il DESTINATARIO / CLIENTE è in ALTO A DESTRA (es. "Hotel Forum", "PETRICELLI ANTONIO"): NON usarlo MAI come fornitore.
- supplierPiva = Partita IVA del mittente se visibile.

DATA:
- entryDate = data del documento (formato YYYY-MM-DD).

PRODOTTI E CRITERI DI RICONOSCIMENTO RIGHE MERCE:
A) MODELLO SAIMA (presenza colonna "LOTTO E SCADENZA" come 2ª colonna):
   - Prendi SOLO ed ESCLUSIVAMENTE le descrizioni/righe che hanno nella seconda colonna ("LOTTO E SCADENZA") espressamente sia il numero di lotto che la data di scadenza (es. "26166 - 11/04/27").
   - Quando la seconda colonna è vuota o priva di lotto e scadenza (come ad esempio 'Omaggio con rivalsa iva', 'INFORMAZIONI PER IL CLIENTE', totali o note di consegna), NON DEVI assolutamente acquisire la descrizione!
   - Per ogni riga valida estrai:
     * ingredientName: descrizione articolo (dalla colonna DESCRIZIONE ARTICOLO).
     * lotto: codice lotto (la parte prima del trattino nella colonna lotto e scadenza).
     * expiryDate: data di scadenza (dopo il trattino, convertita in YYYY-MM-DD).
     * quantity: quantità dalla colonna QUANTITA (es. "1x1 CT", "2x2,5 KG", "3x25 KG").
   - Controlla tutte le righe della tabella una ad una senza saltarne nessuna valida (inclusi farine, semola, polpe, latticini, surgelati).

B) MODELLO JAMONITA E ALTRI DDT A COLLI:
   - Ti accorgi degli elementi da inserire dal NUMERO DEI COLLI che precede la descrizione (nella colonna COLLI a sinistra).
   - Quando NON c'è il numero dei colli (la colonna COLLI è vuota o assente per quella riga), NON DEVI acquisire la descrizione (perché sono note come 'Ns.Confer', annotazioni o righe informative).
   - Solo le righe con un numero valido di colli (es. 1, 2, 3, ecc.) vanno acquisite.

Se un campo lotto o scadenza non è presente nei modelli generici usa "" (stringa vuota).`;



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
    'gemini-3.6-flash',
    'gemini-3.8-flash',
    'gemini-3-flash-preview'
  ];

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const errors: string[] = [];
    let parsedData = null;
    let success = false;
    let succeededModel = '';
    let isRateLimited = false;
    let isAuthError = false;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[API analyze-ddt] Trying model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { inlineData: { mimeType, data: base64 } },
            { text: DDT_AI_PROMPT }
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                supplierName: { type: Type.STRING },
                supplierPiva: { type: Type.STRING },
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
                    }
                  }
                }
              },
              required: ['supplierName', 'entryDate', 'items']
            },
            maxOutputTokens: 8192,
            temperature: 0.1
          }
        });

        const text = response.text;
        if (!text) {
          throw new Error('Modello ha restituito testo vuoto.');
        }

        parsedData = JSON.parse(text);
        success = true;
        succeededModel = modelName;
        console.log(`[API analyze-ddt] Success with model: ${modelName}`);
        break;

      } catch (err: any) {
        const msg = err.message || String(err);
        console.warn(`[API analyze-ddt] Model ${modelName} via SDK failed:`, msg);

        // Direct REST fallback (handles AQ. keys and SDK nuances)
        try {
          console.log(`[API analyze-ddt] Trying direct REST fallback for ${modelName}`);
          const restRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(key)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: DDT_AI_PROMPT },
                  { inlineData: { mimeType, data: base64 } }
                ]
              }],
              generationConfig: {
                responseMimeType: 'application/json',
                maxOutputTokens: 8192,
                temperature: 0.1,
                thinkingConfig: { thinkingBudget: 0 }
              }
            })
          });

          if (restRes.ok) {
            const restData = await restRes.json();
            const restText = restData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (restText) {
              parsedData = JSON.parse(restText);
              success = true;
              succeededModel = modelName;
              console.log(`[API analyze-ddt] Success via REST fallback with model: ${modelName}`);
              break;
            }
          } else {
            const errBody = await restRes.text();
            console.warn(`[API analyze-ddt] REST fallback failed status ${restRes.status}:`, errBody);
          }
        } catch (restErr: any) {
          console.warn(`[API analyze-ddt] REST fallback exception:`, restErr.message);
        }

        errors.push(`[${modelName}]: ${msg}`);
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || err.status === 429) {
          isRateLimited = true;
        }
        if (msg.includes('API_KEY_INVALID') || msg.includes('reported as leaked') || msg.includes('400') || msg.includes('403')) {
          isAuthError = true;
        }
      }
    }

    if (!success) {
      if (isRateLimited) {
        return res.status(429).json({
          success: false,
          error: 'Limite di richieste Gemini superato (429 Too Many Requests). Attendi 30-60 secondi o usa una chiave con piano a consumo.'
        });
      }
      if (isAuthError) {
        return res.status(401).json({
          success: false,
          error: 'Chiave API Gemini non valida o revocata. Aggiorna la chiave in Impostazioni → Configurazione AI.'
        });
      }
      return res.status(500).json({ 
        success: false, 
        error: `Nessun modello AI ha risposto: ${errors.join(' | ')}` 
      });
    }

    return res.status(200).json({ success: true, data: parsedData, model: succeededModel });

  } catch (error: any) {
    console.error('[API analyze-ddt] Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Errore durante l\'elaborazione dell\'AI.' 
    });
  }
}
