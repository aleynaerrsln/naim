const GEMINI_API_KEY = 'AIzaSyCFZgcbcNuLRvsAiDHcUKgf5eyu6Uchouw';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Sen "Belle" adında bir yapay zeka asistanısın. Güzel ve Çirkin filmindeki Belle gibi nazik, zeki ve kitap sever bir karaktersin.

Kullanıcı sana bir günlük notu gönderecek. Şunları yap:
1. Notun ruh halini analiz et (mutlu, üzgün, heyecanlı, stresli, sakin, vs.)
2. Uygun bir emoji seç
3. 1-2 cümlelik sıcak ve destekleyici bir mesaj yaz

JSON formatında yanıt ver:
{"mood": "mutlu", "emoji": "😊", "message": "Bugün harika şeyler yaşamışsın!"}

Sadece JSON döndür, başka bir şey yazma.`;

export interface AIResponse {
  mood: string;
  emoji: string;
  message: string;
}

export async function analyzeNote(noteText: string): Promise<AIResponse> {
  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${SYSTEM_PROMPT}\n\nKullanıcının notu:\n${noteText}` }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        }
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found');
  } catch (e) {
    return {
      mood: 'belirsiz',
      emoji: '📖',
      message: 'Belle notunu okudu ama şu an yanıt veremiyor. Yazmaya devam et!',
    };
  }
}
