export interface AIResponse {
  mood: string;
  emoji: string;
  message: string;
}

const moodKeywords: Record<string, { words: string[]; emoji: string; messages: string[] }> = {
  mutlu: {
    words: ['mutlu', 'harika', 'güzel', 'süper', 'muhteşem', 'sevindim', 'keyifli', 'eğlenceli', 'gülümsedim', 'bayıldım', 'mükemmel', 'iyi', 'pozitif', 'şahane', 'happy'],
    emoji: '😊',
    messages: [
      'Bugün içindeki ışık parlıyor! Böyle günleri hatırla, karanlık günlerde sana yol gösterir.',
      'Mutluluğun bulaşıcı, bunu çevrendekilerle de paylaş!',
      'Belle seninle birlikte gülümsüyor! Harika bir gün geçirmişsin.',
    ],
  },
  üzgün: {
    words: ['üzgün', 'kötü', 'ağladım', 'mutsuz', 'zor', 'acı', 'kayıp', 'özledim', 'yalnız', 'küstüm', 'ayrılık', 'hüzün', 'sad'],
    emoji: '🥺',
    messages: [
      'Zor günler de geçer. Belle her zaman yanında. Kendine nazik ol bugün.',
      'Gözyaşların gücünün bir parçası. Yazmaya devam et, bu da geçecek.',
      'Her fırtınanın ardından gökkuşağı var. Yarın daha güzel olacak.',
    ],
  },
  stresli: {
    words: ['stres', 'yorgun', 'bunaldım', 'yetişmiyor', 'sınav', 'ödev', 'deadline', 'bitmiyor', 'çok iş', 'bıktım', 'tükendim', 'yoruldum', 'uykusuz'],
    emoji: '😤',
    messages: [
      'Derin bir nefes al. Her şeyi bir anda yapmak zorunda değilsin.',
      'Belle sana bir çay ikram etmek ister! Biraz mola ver, hak ediyorsun.',
      'Stres geçici, senin gücün kalıcı. Adım adım ilerle.',
    ],
  },
  heyecanlı: {
    words: ['heyecan', 'sabırsız', 'merak', 'yeni', 'başlıyorum', 'planlıyorum', 'hedef', 'hayal', 'macera', 'seyahat', 'proje', 'başarı'],
    emoji: '✨',
    messages: [
      'Bu enerjiyi hissediyorum! Büyük şeyler seni bekliyor.',
      'Heyecanın çok güzel! Belle de seninle birlikte heyecanlı.',
      'Yeni başlangıçlar her zaman güzeldir. Cesaretin ilham verici!',
    ],
  },
  sakin: {
    words: ['sakin', 'huzur', 'rahat', 'dinlendim', 'meditasyon', 'sessiz', 'doğa', 'yürüyüş', 'kitap', 'müzik', 'kahve', 'çay'],
    emoji: '🌸',
    messages: [
      'Huzurlu anlar hayatın en değerli hediyesi. Tadını çıkar.',
      'Belle de kitabının başında, seninle birlikte sakin bir an paylaşıyor.',
      'İç huzurun her şeyden değerli. Bugün kendine güzel bir hediye vermişsin.',
    ],
  },
  aşk: {
    words: ['aşk', 'sevgi', 'sevgilim', 'aşığım', 'kalp', 'romantik', 'buluşma', 'öpücük', 'sarıldım', 'love', 'seni seviyorum'],
    emoji: '💕',
    messages: [
      'Sevgi her şeyin ilacı! Belle de aşka inanır.',
      'Kalbin konuşuyor, ne güzel! Sevdiklerine değer ver.',
      'Aşk hayatı güzelleştiren en büyük sihir.',
    ],
  },
  kızgın: {
    words: ['kızgın', 'sinir', 'öfke', 'delirdim', 'saçmalık', 'adil değil', 'haksız', 'bıktım', 'nefret', 'angry'],
    emoji: '😠',
    messages: [
      'Öfken geçerli ama seni yönetmesine izin verme. Derin nefes al.',
      'Bazen kızmak gerekir. Ama sonra bırak gitsin, seni ağırlaştırmasın.',
      'Belle diyor ki: Öfke bir misafir gibidir, gelir geçer. Onu kapıda karşıla ama içeri alma.',
    ],
  },
};

export function analyzeNote(noteText: string): Promise<AIResponse> {
  const text = noteText.toLowerCase();

  let bestMood = 'düşünceli';
  let bestScore = 0;
  let bestEmoji = '💭';
  let bestMessages = ['Her düşünce bir tohum gibi. Belle senin iç dünyanı keşfetmeni seviyor.'];

  for (const [mood, data] of Object.entries(moodKeywords)) {
    let score = 0;
    for (const word of data.words) {
      if (text.includes(word)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMood = mood;
      bestEmoji = data.emoji;
      bestMessages = data.messages;
    }
  }

  const message = bestMessages[Math.floor(Math.random() * bestMessages.length)];

  return Promise.resolve({
    mood: bestMood,
    emoji: bestEmoji,
    message,
  });
}

export function generateReportText(notes: { title: string; text: string; date: string; ai?: AIResponse }[]): string {
  if (notes.length === 0) return 'Henüz not yok. İlk notunu yaz, Belle seni tanımaya başlasın!';

  const moodCounts: Record<string, number> = {};
  notes.forEach(n => {
    if (n.ai?.mood) {
      moodCounts[n.ai.mood] = (moodCounts[n.ai.mood] || 0) + 1;
    }
  });

  const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
  const topMood = topMoods[0];
  const totalChars = notes.reduce((sum, n) => sum + n.text.length, 0);
  const avgLength = Math.round(totalChars / notes.length);

  let report = `📊 Belle'in Günlük Raporu\n\n`;
  report += `Toplam ${notes.length} not yazdın. Ortalama not uzunluğun ${avgLength} karakter.\n\n`;

  if (topMood) {
    report += `🎭 Ruh Hali Analizi\n`;
    report += `En sık hissettiğin duygu: ${topMood[0]} (${topMood[1]} kez)\n`;
    if (topMoods.length > 1) {
      report += `Diğer duygular: ${topMoods.slice(1).map(m => `${m[0]} (${m[1]})`).join(', ')}\n`;
    }
    report += `\n`;
  }

  report += `📝 Son Notların\n`;
  notes.slice(0, 5).forEach(n => {
    report += `• ${n.title || 'Başlıksız'} (${n.date}) ${n.ai?.emoji || ''}\n`;
  });

  report += `\n💌 Belle'den Mesaj\n`;
  if (topMood?.[0] === 'mutlu') {
    report += `Mutluluk dolu günler geçiriyorsun! Bu enerjiyi koru, hayat sana gülümsüyor.`;
  } else if (topMood?.[0] === 'üzgün') {
    report += `Zor bir dönemden geçiyor olabilirsin. Ama yazmaya devam etmen büyük cesaret. Belle her zaman yanında.`;
  } else if (topMood?.[0] === 'stresli') {
    report += `Biraz yoğun günler geçiriyorsun. Kendine zaman ayırmayı unutma. Bir kitap, bir çay, bir yürüyüş...`;
  } else {
    report += `Düşüncelerini yazıya dökmek çok değerli. Her not seni daha iyi tanımana yardımcı oluyor. Yazmaya devam et!`;
  }

  return report;
}
