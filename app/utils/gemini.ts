const OPENROUTER_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

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
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: noteText },
        ],
        temperature: 0.7,
        max_tokens: 200,
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
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
