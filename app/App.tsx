import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  FlatList,
  SafeAreaView,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { useAudioRecorder, RecordingPresets, setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import BelleRose from './components/BelleRose';
import { analyzeNote, AIResponse, generateReportText } from './utils/gemini';
import { translations, Lang } from './utils/i18n';

const MenuIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9999bb" strokeWidth={2} strokeLinecap="round">
    <Path d="M3 12h18M3 6h18M3 18h18" />
  </Svg>
);

const HomeIcon = ({ active }: { active: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? '#ffe082' : '#6b6b8a'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <Path d="M9 22V12h6v10" />
  </Svg>
);

const StatsIcon = ({ active }: { active: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? '#ffe082' : '#6b6b8a'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 20V10M12 20V4M6 20v-6" />
  </Svg>
);

const SearchIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9999bb" strokeWidth={2} strokeLinecap="round">
    <Path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" />
  </Svg>
);

interface Note {
  id: string;
  title: string;
  text: string;
  date: string;
  time: string;
  image?: string;
  audio?: string;
  category?: string;
  ai?: AIResponse;
}

const formatDate = () => {
  const now = new Date();
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${now.getDate()} ${months[now.getMonth()]}`;
};

const formatTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const STORAGE_KEY = 'pocket_belle_notes';
const THEME_KEY = 'pocket_belle_theme';
const LANG_KEY = 'pocket_belle_lang';

const themes = {
  dark: {
    bg: '#12122a',
    card: '#1a1a38',
    border: '#2a2a50',
    text: '#e8e0d0',
    textSecondary: '#9999bb',
    textMuted: '#6b6b8a',
    textDim: '#7777aa',
    accent: '#ffe082',
    accent2: '#ffff7a',
    statusBar: 'light' as const,
  },
  light: {
    bg: '#f5f0e8',
    card: '#ffffff',
    border: '#d4c8b0',
    text: '#2a2a3a',
    textSecondary: '#5a5a6a',
    textMuted: '#8888aa',
    textDim: '#aaaacc',
    accent: '#b8860b',
    accent2: '#c49520',
    statusBar: 'dark' as const,
  },
};
const CATEGORIES_KEY = 'pocket_belle_categories';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const scheduleReminder = async () => {
  await Notifications.requestPermissionsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📖 Pocket Belle',
      body: 'Bugün günlüğüne bir şey yazdın mı? Belle seni bekliyor!',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
    },
  });
};

const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'Tümü', color: '#ffe082', icon: '📒' },
  { id: 'personal', name: 'Kişisel', color: '#f0a0b8', icon: '💭' },
  { id: 'work', name: 'İş/Okul', color: '#a0d8ef', icon: '📚' },
  { id: 'ideas', name: 'Fikirler', color: '#b8e0a0', icon: '💡' },
  { id: 'goals', name: 'Hedefler', color: '#d4a0f0', icon: '🎯' },
];

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export default function App() {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [screen, setScreen] = useState<'home' | 'write' | 'view' | 'stats' | 'menu'>('home');
  const [activeTab, setActiveTab] = useState<'home' | 'stats'>('home');
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [noteCategory, setNoteCategory] = useState('personal');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📝');
  const [isRecording, setIsRecording] = useState(false);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);

  const generateReport = () => {
    if (notes.length === 0) return;
    const text = generateReportText(notes.map(n => ({
      title: n.title || 'Başlıksız',
      text: n.text,
      date: n.date,
      ai: n.ai,
    })));
    setReport(text);
  };
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<Lang>('tr');
  const [fontSize, setFontSize] = useState(1); // 0=small, 1=normal, 2=large
  const fontSizes = [
    { note: 12, title: 14, body: 13 },
    { note: 15, title: 17, body: 17 },
    { note: 20, title: 24, body: 22 },
  ];
  const fs = fontSizes[fontSize];
  const t = isDark ? themes.dark : themes.light;
  const l = translations[lang];

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    SecureStore.setItemAsync(THEME_KEY, next ? 'dark' : 'light');
  };

  const toggleLang = () => {
    const next = lang === 'tr' ? 'en' : 'tr';
    setLang(next);
    SecureStore.setItemAsync(LANG_KEY, next);
  };
  const [audioUri, setAudioUri] = useState<string | undefined>(undefined);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const playAudio = async (uri: string) => {
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const { createAudioPlayer } = require('expo-audio');
      const player = createAudioPlayer(uri);
      setPlayingAudio(uri);
      player.play();
      // Reset after playback
      setTimeout(() => setPlayingAudio(null), 10000);
    } catch (e) {
      console.log('Play error:', e);
      setPlayingAudio(null);
    }
  };

  const toggleVoice = async () => {
    try {
      if (isRecording) {
        await recorder.stop();
        setIsRecording(false);
        if (recorder.uri) {
          setAudioUri(recorder.uri);
        }
      } else {
        setAudioUri(undefined);
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        setIsRecording(true);
      }
    } catch (e) {
      console.log('Recording error:', e);
      setIsRecording(false);
    }
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState('');
  const [dailyQuote, setDailyQuote] = useState({ text: '', author: '' });
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(20)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredNotes = notes.filter(n => {
    const matchesSearch = !searchQuery.trim() || (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (n.text || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Header animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    // FAB pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(fabScale, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(fabScale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
  }, []);

  // Fetch daily quote
  useEffect(() => {
    fetch('https://api.quotable.io/random?maxLength=100')
      .then(res => res.json())
      .then(data => setDailyQuote({ text: data.content, author: data.author }))
      .catch(() => setDailyQuote({ text: 'Her gün yeni bir sayfa, yeni bir başlangıç.', author: 'Belle' }));
  }, []);

  // Load notes on startup
  useEffect(() => {
    const load = async () => {
      try {
        const data = await SecureStore.getItemAsync(STORAGE_KEY);
        if (data) setNotes(JSON.parse(data));
        const cats = await SecureStore.getItemAsync(CATEGORIES_KEY);
        if (cats) setCategories(JSON.parse(cats));
        const theme = await SecureStore.getItemAsync(THEME_KEY);
        if (theme) setIsDark(theme === 'dark');
        const savedLang = await SecureStore.getItemAsync(LANG_KEY);
        if (savedLang) setLang(savedLang as Lang);
      } catch (e) {
        console.log('Load error:', e);
      }
      setLoaded(true);
    };
    load();
  }, []);

  // Save notes whenever they change
  useEffect(() => {
    if (loaded) {
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(notes)).catch(console.log);
    }
  }, [notes, loaded]);

  const saveNotes = useCallback((updatedNotes: Note[]) => {
    setNotes(updatedNotes);
  }, []);

  const [analyzing, setAnalyzing] = useState(false);
  const [noteImage, setNoteImage] = useState<string | undefined>(undefined);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setNoteImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setNoteImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (note.trim() || audioUri) {
      if (editingId) {
        saveNotes(notes.map(n => n.id === editingId
          ? { ...n, title: title.trim() || 'Başlıksız', text: note.trim() }
          : n
        ));
        setEditingId(null);
      } else {
        const newNote: Note = {
          id: Date.now().toString(),
          title: title.trim() || 'Başlıksız',
          text: note.trim(),
          date: formatDate(),
          time: formatTime(),
          image: noteImage,
          audio: audioUri,
          category: noteCategory,
        };
        saveNotes([newNote, ...notes]);

        // AI analiz arka planda
        setAnalyzing(true);
        analyzeNote(note.trim()).then(ai => {
          setNotes(prev => {
            const updated = prev.map(n => n.id === newNote.id ? { ...n, ai } : n);
            SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated));
            return updated;
          });
          setAnalyzing(false);
        });
      }
      setNote('');
      setTitle('');
      setNoteImage(undefined);
      setAudioUri(undefined);
      setNoteCategory('personal');
      setScreen('home');
    }
  };

  const handleDelete = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
    if (screen === 'view') setScreen('home');
  };

  const handleEdit = (item: Note) => {
    setTitle(item.title);
    setNote(item.text);
    setEditingId(item.id);
    setScreen('write');
  };

  const handleView = (item: Note) => {
    setViewingNote(item);
    setScreen('view');
  };

  const renderNote = ({ item, index }: { item: Note; index: number }) => {
    const colors = ['#ffe082', '#f0a0b8', '#a0d8ef', '#b8e0a0', '#d4a0f0'];
    const accentColor = colors[index % colors.length];

    return (
      <TouchableOpacity style={[styles.noteCard, { backgroundColor: t.card }]} onPress={() => handleView(item)}>
        <View style={[styles.noteAccent, { backgroundColor: accentColor }]} />
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.noteImage} />
        )}
        <View style={styles.noteContent}>
          <View style={styles.noteTitleRow}>
            <Text style={[styles.noteTitle, { color: t.accent, fontSize: fs.title }]}>{item.title || 'Başlıksız'}</Text>
            {item.ai && <Text style={styles.noteEmoji}>{item.ai.emoji}</Text>}
          </View>
          <Text style={[styles.noteText, { color: t.textSecondary, fontSize: fs.note }]} numberOfLines={2}>{item.text}</Text>
          {item.ai && (
            <Text style={[styles.noteAiMessage, { fontSize: fs.note - 2 }]}>{item.ai.message}</Text>
          )}
          {item.audio && (
            <TouchableOpacity style={styles.audioPlayBtn} onPress={() => playAudio(item.audio!)}>
              <Text style={styles.audioPlayIcon}>{playingAudio === item.audio ? '⏸' : '🔊'}</Text>
              <Text style={styles.audioPlayText}>{playingAudio === item.audio ? 'Çalıyor...' : 'Ses Kaydını Dinle'}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.noteMeta}>
            <Text style={styles.noteDate}>{item.date}</Text>
            <Text style={styles.noteDot}>·</Text>
            <Text style={styles.noteTime}>{item.time}</Text>
            {item.category && (
              <>
                <Text style={styles.noteDot}>·</Text>
                <Text style={styles.noteMood}>{categories.find(c => c.id === item.category)?.icon} {categories.find(c => c.id === item.category)?.name}</Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ========== MENU SCREEN ==========
  if (screen === 'menu') {
    const addCategory = () => {
      if (newCatName.trim()) {
        const newCat: Category = {
          id: Date.now().toString(),
          name: newCatName.trim(),
          color: ['#f0a0b8', '#a0d8ef', '#b8e0a0', '#d4a0f0', '#f0c8a0'][Math.floor(Math.random() * 5)],
          icon: newCatIcon,
        };
        const updated = [...categories, newCat];
        setCategories(updated);
        SecureStore.setItemAsync(CATEGORIES_KEY, JSON.stringify(updated));
        setNewCatName('');
        setNewCatIcon('📝');
      }
    };

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
        <StatusBar style={t.statusBar} />
        <View style={styles.writeTopBar}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={[styles.backButton, { color: t.accent }]}>{l.back}</Text>
          </TouchableOpacity>
          <Text style={[styles.writeTopBarTitle, { color: t.text }]}>{l.menu}</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.menuScroll} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={[styles.menuProfileCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={styles.menuProfileTop}>
              <BelleRose size={55} />
              <View style={styles.menuProfileInfo}>
                <Text style={[styles.menuAppName, { color: t.accent }]}>{l.appName}</Text>
                <Text style={[styles.menuAppVersion, { color: t.textMuted }]}>v1.0</Text>
              </View>
            </View>
            <View style={[styles.menuProfileStats, { borderTopColor: t.border }]}>
              <View style={styles.menuProfileStat}>
                <Text style={[styles.menuProfileStatNum, { color: t.accent }]}>{notes.length}</Text>
                <Text style={[styles.menuProfileStatLabel, { color: t.textMuted }]}>{l.totalNotes}</Text>
              </View>
              <View style={[styles.menuProfileDivider, { backgroundColor: t.border }]} />
              <View style={styles.menuProfileStat}>
                <Text style={[styles.menuProfileStatNum, { color: t.accent }]}>{categories.filter(c => c.id !== 'all').length}</Text>
                <Text style={[styles.menuProfileStatLabel, { color: t.textMuted }]}>{l.categories}</Text>
              </View>
            </View>
          </View>

          {/* Categories Group */}
          <Text style={[styles.menuGroupTitle, { color: t.textMuted }]}>{l.categories}</Text>
          <View style={[styles.menuGroup, { backgroundColor: t.card, borderColor: t.border }]}>
            {categories.filter(c => c.id !== 'all').map((cat, i, arr) => (
              <View key={cat.id}>
                <View style={styles.menuGroupRow}>
                  <View style={[styles.menuIconCircle, { backgroundColor: cat.color + '20' }]}>
                    <Text style={styles.menuIconEmoji}>{cat.icon}</Text>
                  </View>
                  <Text style={[styles.menuGroupText, { color: t.text }]}>{cat.name}</Text>
                  <View style={[styles.menuBadge, { backgroundColor: cat.color + '20' }]}>
                    <Text style={[styles.menuBadgeText, { color: cat.color }]}>{notes.filter(n => n.category === cat.id).length}</Text>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={[styles.menuGroupSep, { backgroundColor: t.border }]} />}
              </View>
            ))}
          </View>

          {/* Add Category */}
          <View style={[styles.menuAddCat, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={[styles.menuIconCircle, { backgroundColor: t.accent + '20' }]}>
              <Text style={styles.menuIconEmoji}>📝</Text>
            </View>
            <TextInput
              style={[styles.menuAddCatInput, { color: t.text }]}
              placeholder={l.catPlaceholder}
              placeholderTextColor={t.textMuted}
              value={newCatName}
              onChangeText={setNewCatName}
            />
            <TouchableOpacity style={[styles.menuAddCatBtn, { backgroundColor: t.accent }]} onPress={addCategory}>
              <Text style={styles.menuAddCatBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Preferences Group */}
          <Text style={[styles.menuGroupTitle, { color: t.textMuted }]}>{l.appearance} & {l.language}</Text>
          <View style={[styles.menuGroup, { backgroundColor: t.card, borderColor: t.border }]}>
            <TouchableOpacity style={styles.menuGroupRow} onPress={toggleTheme}>
              <View style={[styles.menuIconCircle, { backgroundColor: isDark ? '#6b6baa20' : '#f4d03f20' }]}>
                <Text style={styles.menuIconEmoji}>{isDark ? '🌙' : '☀️'}</Text>
              </View>
              <Text style={[styles.menuGroupText, { color: t.text }]}>{isDark ? l.darkTheme : l.lightTheme}</Text>
              <Text style={[styles.menuGroupAction, { color: t.accent }]}>{l.change}</Text>
            </TouchableOpacity>
            <View style={[styles.menuGroupSep, { backgroundColor: t.border }]} />
            <TouchableOpacity style={styles.menuGroupRow} onPress={toggleLang}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#a0d8ef20' }]}>
                <Text style={styles.menuIconEmoji}>{lang === 'tr' ? '🇹🇷' : '🇬🇧'}</Text>
              </View>
              <Text style={[styles.menuGroupText, { color: t.text }]}>{lang === 'tr' ? l.turkish : l.english}</Text>
              <Text style={[styles.menuGroupAction, { color: t.accent }]}>{l.change}</Text>
            </TouchableOpacity>
            <View style={[styles.menuGroupSep, { backgroundColor: t.border }]} />
            <View style={styles.menuGroupRow}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#b8e0a020' }]}>
                <Text style={styles.menuIconEmoji}>🔤</Text>
              </View>
              <Text style={[styles.menuGroupText, { color: t.text }]}>{lang === 'tr' ? 'Yazı Boyutu' : 'Font Size'}</Text>
            </View>
            <View style={[styles.fontSizeSection, { borderTopColor: t.border }]}>
              <View style={styles.fontSizeRow}>
                <TouchableOpacity style={[styles.fontSizeBtn, fontSize === 0 && { backgroundColor: t.accent, borderColor: t.accent }]} onPress={() => setFontSize(0)}>
                  <Text style={[styles.fontSizeBtnText, { color: fontSize === 0 ? '#12122a' : t.text, fontSize: 11 }]}>A</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fontSizeBtn, fontSize === 1 && { backgroundColor: t.accent, borderColor: t.accent }]} onPress={() => setFontSize(1)}>
                  <Text style={[styles.fontSizeBtnText, { color: fontSize === 1 ? '#12122a' : t.text, fontSize: 16 }]}>A</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fontSizeBtn, fontSize === 2 && { backgroundColor: t.accent, borderColor: t.accent }]} onPress={() => setFontSize(2)}>
                  <Text style={[styles.fontSizeBtnText, { color: fontSize === 2 ? '#12122a' : t.text, fontSize: 22 }]}>A</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.fontSizePreview, { color: t.textSecondary, fontSize: fontSizes[fontSize].body }]}>
                Örnek yazı boyutu
              </Text>
            </View>
          </View>

          {/* AI Report */}
          <Text style={[styles.menuGroupTitle, { color: t.textMuted }]}>AI</Text>
          <TouchableOpacity
            style={[styles.reportButton, { backgroundColor: t.accent + '15', borderColor: t.accent + '30' }]}
            onPress={generateReport}
            disabled={notes.length === 0}
          >
            <Text style={{ fontSize: 24 }}>📊</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.reportButtonTitle, { color: t.accent }]}>
                Günlük Raporu Oluştur
              </Text>
              <Text style={[styles.reportButtonDesc, { color: t.textMuted }]}>
                Belle tüm notlarını analiz edip özet çıkarsın
              </Text>
            </View>
            <Text style={{ color: t.accent, fontSize: 18 }}>›</Text>
          </TouchableOpacity>

          {report && (
            <View style={[styles.reportCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={styles.reportCardHeader}>
                <Text style={{ fontSize: 16 }}>📖</Text>
                <Text style={[styles.reportCardTitle, { color: t.accent }]}>Belle'in Raporu</Text>
              </View>
              <Text style={[styles.reportCardText, { color: t.text }]}>{report}</Text>
              <TouchableOpacity onPress={() => setReport(null)} style={styles.reportCloseBtn}>
                <Text style={[styles.reportCloseText, { color: t.textMuted }]}>Kapat</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* App Group */}
          <Text style={[styles.menuGroupTitle, { color: t.textMuted }]}>{l.app}</Text>
          <View style={[styles.menuGroup, { backgroundColor: t.card, borderColor: t.border }]}>
            <TouchableOpacity style={styles.menuGroupRow} onPress={scheduleReminder}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#ffe08220' }]}>
                <Text style={styles.menuIconEmoji}>🔔</Text>
              </View>
              <Text style={[styles.menuGroupText, { color: t.text }]}>{l.sendReminder}</Text>
            </TouchableOpacity>
            <View style={[styles.menuGroupSep, { backgroundColor: t.border }]} />
            <View style={styles.menuGroupRow}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#f0a0b820' }]}>
                <Text style={styles.menuIconEmoji}>🌹</Text>
              </View>
              <Text style={[styles.menuGroupText, { color: t.text }]}>{l.aboutBelle}</Text>
            </View>
            <View style={[styles.menuGroupSep, { backgroundColor: t.border }]} />
            <View style={styles.menuGroupRow}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#ffe08220' }]}>
                <Text style={styles.menuIconEmoji}>⭐</Text>
              </View>
              <Text style={[styles.menuGroupText, { color: t.text }]}>{l.rateApp}</Text>
            </View>
            <View style={[styles.menuGroupSep, { backgroundColor: t.border }]} />
            <View style={styles.menuGroupRow}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#a0d8ef20' }]}>
                <Text style={styles.menuIconEmoji}>📤</Text>
              </View>
              <Text style={[styles.menuGroupText, { color: t.text }]}>{l.exportNotes}</Text>
            </View>
          </View>

          <Text style={[styles.menuFooter, { color: t.textMuted }]}>Aleyna Pocket Belle v1.0{'\n'}NAIM Challenge 2026</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ========== STATS SCREEN ==========
  if (screen === 'stats') {
    const moodCounts: Record<string, number> = {};
    notes.forEach(n => {
      if (n.ai?.mood) {
        moodCounts[n.ai.mood] = (moodCounts[n.ai.mood] || 0) + 1;
      }
    });
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
        <StatusBar style={t.statusBar} />
        <View style={styles.topBar}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: t.card }]} onPress={() => setScreen('menu')}>
            <MenuIcon />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: t.text }]}>{l.stats}</Text>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: t.card }]} onPress={() => { setScreen('home'); setSelectedCategory('all'); setShowSearch(true); }}>
            <SearchIcon />
          </TouchableOpacity>
        </View>

        <FlatList
          data={[]}
          renderItem={() => null}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              {/* Summary Cards */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{notes.length}</Text>
                  <Text style={styles.statLabel}>{l.totalNotes}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{Object.keys(moodCounts).length}</Text>
                  <Text style={styles.statLabel}>{l.diffMoods}</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{topMood ? topMood[0] : '—'}</Text>
                  <Text style={styles.statLabel}>{l.topMood}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{notes.reduce((sum, n) => sum + n.text.length, 0)}</Text>
                  <Text style={styles.statLabel}>{l.totalChars}</Text>
                </View>
              </View>

              {/* Mood History */}
              {notes.some(n => n.ai) && (
                <View style={styles.moodHistorySection}>
                  <Text style={styles.statsSubtitle}>Ruh Hali Geçmişi</Text>
                  {notes.filter(n => n.ai).map(n => (
                    <View key={n.id} style={styles.moodRow}>
                      <Text style={styles.moodEmoji}>{n.ai?.emoji}</Text>
                      <View style={styles.moodInfo}>
                        <Text style={styles.moodTitle}>{n.title || 'Başlıksız'}</Text>
                        <Text style={styles.moodDate}>{n.date} · {n.ai?.mood}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          }
        />

        {/* Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: t.card, borderTopColor: t.border }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => { setScreen('home'); setActiveTab('home'); }}>
            <HomeIcon active={false} />
            <Text style={styles.tabLabel}>{l.home}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
            <StatsIcon active={true} />
            <Text style={styles.tabLabelActive}>{l.statsTab}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ========== VIEW SCREEN ==========
  if (screen === 'view' && viewingNote) {
    if (fullImage) {
      return (
        <View style={styles.fullImageContainer}>
          <StatusBar style="light" />
          <Image source={{ uri: fullImage }} style={styles.fullImage} resizeMode="contain" />
          <TouchableOpacity style={styles.fullImageClose} onPress={() => setFullImage(null)}>
            <Text style={styles.fullImageCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
        <StatusBar style={t.statusBar} />
        <View style={styles.writeTopBar}>
          <TouchableOpacity onPress={() => { Keyboard.dismiss(); setScreen('home'); }}>
            <Text style={[styles.backButton, { color: t.accent }]}>{l.back}</Text>
          </TouchableOpacity>
          <Text style={[styles.writeTopBarTitle, { color: t.text }]}>{l.noteDetail}</Text>
          <TouchableOpacity onPress={() => handleEdit(viewingNote)}>
            <Text style={[styles.saveTopButton, { color: t.accent }]}>{l.edit}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.writeDateRow}>
            <Text style={[styles.writeDateText, { color: t.textMuted }]}>{viewingNote.date} · {viewingNote.time}</Text>
          </View>
          <View style={styles.viewContent}>
            {viewingNote.image && (
              <TouchableOpacity onPress={() => setFullImage(viewingNote.image!)}>
                <Image source={{ uri: viewingNote.image }} style={styles.viewImage} />
              </TouchableOpacity>
            )}
            {viewingNote.audio && (
              <TouchableOpacity style={styles.audioPlayBtnLarge} onPress={() => playAudio(viewingNote.audio!)}>
                <Text style={{ fontSize: 24 }}>{playingAudio === viewingNote.audio ? '⏸' : '🔊'}</Text>
                <Text style={[styles.audioPlayTextLarge, { color: t.text }]}>{playingAudio === viewingNote.audio ? 'Çalıyor...' : 'Ses Kaydını Dinle'}</Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.viewTitle, { color: t.accent, fontSize: fs.title + 5 }]}>{viewingNote.title || l.untitled}</Text>
            <Text style={[styles.viewText, { color: t.text, fontSize: fs.body }]}>{viewingNote.text}</Text>
            {viewingNote.ai && (
              <View style={[styles.aiCard, { backgroundColor: t.card, borderColor: t.accent + '20' }]}>
                <Text style={styles.aiCardEmoji}>{viewingNote.ai.emoji}</Text>
                <Text style={[styles.aiCardMood, { color: t.accent }]}>{l.mood}: {viewingNote.ai.mood}</Text>
                <Text style={[styles.aiCardMessage, { color: t.textSecondary }]}>{viewingNote.ai.message}</Text>
              </View>
            )}
          </View>
          <View style={{ paddingHorizontal: 28, marginTop: 30 }}>
            <TouchableOpacity
              style={styles.deleteBottomButton}
              onPress={() => handleDelete(viewingNote.id)}
            >
              <Text style={styles.deleteBottomText}>{l.delete}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ========== WRITE SCREEN ==========
  if (screen === 'write') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
        <StatusBar style={t.statusBar} />

        {/* Write Top Bar */}
        <View style={styles.writeTopBar}>
          <TouchableOpacity onPress={() => { Keyboard.dismiss(); if (note.trim() || audioUri) { handleSave(); } else { setScreen('home'); setNote(''); setTitle(''); setNoteImage(undefined); setAudioUri(undefined); } }}>
            <Text style={styles.backButton}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.writeTopBarTitle}>{editingId ? l.edit : l.newNote}</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {/* Date Info */}
          <View style={styles.writeDateRow}>
            <Text style={styles.writeDateText}>{formatDate()} · {formatTime()}</Text>
          </View>

          {/* Image */}
          {noteImage && (
            <View style={styles.writeImageContainer}>
              <Image source={{ uri: noteImage }} style={styles.writeImage} />
              <TouchableOpacity style={styles.removeImage} onPress={() => setNoteImage(undefined)}>
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Image Buttons */}
          <View style={styles.imageButtons}>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Text style={styles.imageButtonText}>{l.takePhoto}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={styles.imageButtonText}>{l.pickImage}</Text>
            </TouchableOpacity>
          </View>

          {/* Title Input */}
          <TextInput
            style={styles.writeTitleInput}
            placeholder={l.titlePlaceholder}
            placeholderTextColor="#5a5a7a"
            value={title}
            onChangeText={setTitle}
          />

          {/* Text Area */}
          <TextInput
            style={[styles.writeInput, { minHeight: 300 }]}
            placeholder={l.notePlaceholder}
            placeholderTextColor="#5a5a7a"
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />

          {/* Audio recorded indicator */}
          {audioUri && (
            <View style={styles.audioRecorded}>
              <Text style={styles.audioRecordedText}>✅ Ses kaydı eklendi</Text>
            </View>
          )}

          {/* Voice + Save Buttons */}
          <View style={styles.writeActions}>
            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
              onPress={toggleVoice}
            >
              <Text style={styles.voiceButtonText}>{isRecording ? '⏹️' : '🎤'}</Text>
              <Text style={[styles.voiceLabel, isRecording && styles.voiceLabelActive]}>
                {isRecording ? 'Kaydediliyor...' : 'Sesli Kaydet'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.writeSaveButton, (!note.trim() && !audioUri) && styles.writeSaveDisabled]}
              onPress={() => { Keyboard.dismiss(); handleSave(); }}
              disabled={!note.trim() && !audioUri}
            >
              <Text style={[styles.writeSaveText, (!note.trim() && !audioUri) && styles.writeSaveTextDisabled]}>{l.save}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ========== HOME SCREEN ==========

  // Folders view (like Apple Notes)
  if (selectedCategory === 'all' && !showSearch) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
        <StatusBar style={t.statusBar} />

        <ScrollView contentContainerStyle={styles.foldersScroll} showsVerticalScrollIndicator={false}>
          {/* Top Bar */}
          <View style={styles.foldersTopBar}>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: t.card }]} onPress={() => setScreen('menu')}>
              <MenuIcon />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: t.card }]} onPress={() => { setShowSearch(true); }}>
              <SearchIcon />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <Animated.View style={[styles.foldersHeader, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
            <BelleRose size={60} />
            <Text style={[styles.foldersTitle, { color: t.accent }]}>{l.appName}</Text>
          </Animated.View>

          {/* Daily Quote */}
          {dailyQuote.text ? (
            <View style={[styles.quoteCard, { backgroundColor: t.card, borderColor: t.accent + '20' }]}>
              <Text style={[styles.quoteIcon, { color: t.accent }]}>✦</Text>
              <Text style={[styles.quoteText, { color: t.textSecondary, fontSize: fs.note }]}>"{dailyQuote.text}"</Text>
              <Text style={[styles.quoteAuthor, { color: t.textMuted, fontSize: fs.note - 2 }]}>— {dailyQuote.author}</Text>
            </View>
          ) : null}

          {/* All Notes */}
          <TouchableOpacity
            style={[styles.folderAllCard, { backgroundColor: t.accent + '15', borderColor: t.accent + '30' }]}
            onPress={() => { setSelectedCategory('all'); setShowSearch(true); setSearchQuery(''); }}
          >
            <View style={[styles.folderAllIcon, { backgroundColor: t.accent + '25' }]}>
              <Text style={{ fontSize: 22 }}>📒</Text>
            </View>
            <View style={styles.folderAllInfo}>
              <Text style={[styles.folderAllName, { color: t.accent, fontSize: fs.body }]}>{l.all}</Text>
              <Text style={[styles.folderAllCount, { color: t.textMuted }]}>{notes.length} {l.noteCount}</Text>
            </View>
            <Text style={[styles.folderArrow, { color: t.textMuted }]}>›</Text>
          </TouchableOpacity>

          {/* Category Folders */}
          <Text style={[styles.menuGroupTitle, { color: t.textMuted }]}>{l.categories}</Text>
          <View style={[styles.menuGroup, { backgroundColor: t.card, borderColor: t.border }]}>
            {categories.filter(c => c.id !== 'all').map((cat, i, arr) => {
              const count = notes.filter(n => n.category === cat.id).length;
              return (
                <View key={cat.id}>
                  <TouchableOpacity
                    style={styles.folderRow}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <View style={[styles.folderIcon, { backgroundColor: cat.color + '20' }]}>
                      <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                    </View>
                    <Text style={[styles.folderName, { color: t.text, fontSize: fs.body }]}>{cat.name}</Text>
                    <Text style={[styles.folderCount, { color: t.textMuted }]}>{count}</Text>
                    <Text style={[styles.folderArrow, { color: t.textMuted }]}>›</Text>
                  </TouchableOpacity>
                  {i < arr.length - 1 && <View style={[styles.menuGroupSep, { backgroundColor: t.border }]} />}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: t.card, borderTopColor: t.border }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
            <HomeIcon active={true} />
            <Text style={styles.tabLabelActive}>{l.home}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => { setScreen('stats'); setActiveTab('stats'); }}>
            <StatsIcon active={false} />
            <Text style={styles.tabLabel}>{l.statsTab}</Text>
          </TouchableOpacity>
        </View>

        {/* FAB */}
        <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
          <TouchableOpacity style={[styles.fabInner, { backgroundColor: t.accent }]} onPress={() => { setNoteCategory(selectedCategory === 'all' ? 'personal' : selectedCategory); setScreen('write'); }}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* AI Analyzing */}
        {analyzing && (
          <View style={styles.analyzingBar}>
            <Text style={styles.analyzingText}>{l.analyzing}</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Notes list view (filtered by category or search)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar style={t.statusBar} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: t.card }]} onPress={() => { setSelectedCategory('all'); setShowSearch(false); setSearchQuery(''); }}>
          <Text style={{ color: t.accent, fontSize: 14, fontWeight: '600' }}>← </Text>
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: t.text }]}>
          {showSearch ? 'Pocket Belle' : categories.find(c => c.id === selectedCategory)?.name || l.all}
        </Text>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: t.card }]} onPress={() => setShowSearch(!showSearch)}>
          <SearchIcon />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: t.card }]}>
          <TextInput
            style={[styles.searchInput, { color: t.text }]}
            placeholder={l.searchPlaceholder}
            placeholderTextColor={t.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
            <Text style={[styles.searchClose, { color: t.textMuted }]}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={[styles.emptyText, { color: t.textMuted, fontSize: fs.body }]}>{l.emptyTitle}</Text>
            <Text style={[styles.emptySubtext, { color: t.textMuted, fontSize: fs.note }]}>{l.emptySubtitle}</Text>
          </View>
        }
      />

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: t.card, borderTopColor: t.border }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
          <HomeIcon active={true} />
          <Text style={styles.tabLabelActive}>{l.home}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => { setScreen('stats'); setActiveTab('stats'); }}>
          <StatsIcon active={false} />
          <Text style={styles.tabLabel}>{l.statsTab}</Text>
        </TouchableOpacity>
      </View>

      {/* AI Analyzing */}
      {analyzing && (
        <View style={styles.analyzingBar}>
          <Text style={styles.analyzingText}>✨ Belle notunu analiz ediyor...</Text>
        </View>
      )}

      {/* Floating Add Button */}
      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={[styles.fabInner, { backgroundColor: t.accent }]}
          onPress={() => { setNoteCategory(selectedCategory === 'all' ? 'personal' : selectedCategory); setScreen('write'); }}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12122a',
  },

  // ===== TOP BAR =====
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 8,
    paddingBottom: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#1a1a38',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  topBarTitle: {
    fontSize: 16,
    color: '#9999bb',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ===== CATEGORIES =====
  catFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    width: '100%',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a50',
  },
  catChipIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  catChipText: {
    color: '#7777aa',
    fontSize: 12,
    fontWeight: '500',
  },
  writeCatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 28,
    marginTop: 12,
  },
  writeCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a50',
  },
  writeCatChipText: {
    color: '#7777aa',
    fontSize: 12,
    fontWeight: '500',
  },

  // ===== MENU =====
  menuScroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  menuProfileCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 8,
    borderWidth: 1,
  },
  menuProfileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuProfileInfo: {
    flex: 1,
  },
  menuAppName: {
    fontSize: 20,
    fontWeight: '800',
  },
  menuAppVersion: {
    fontSize: 12,
    marginTop: 2,
  },
  menuProfileStats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  menuProfileStat: {
    flex: 1,
    alignItems: 'center',
  },
  menuProfileStatNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  menuProfileStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  menuProfileDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  menuGroupTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  menuGroupSep: {
    height: 1,
    marginLeft: 56,
  },
  menuIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconEmoji: {
    fontSize: 17,
  },
  menuGroupText: {
    fontSize: 15,
    flex: 1,
  },
  menuGroupAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  menuBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  menuAddCat: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 56,
    marginTop: 8,
    gap: 8,
  },
  menuAddCatIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
    padding: 0,
  },
  menuAddCatInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    margin: 0,
    height: '100%',
  },
  menuAddCatBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAddCatBtnText: {
    color: '#12122a',
    fontSize: 20,
    fontWeight: '700',
  },
  fontSizeSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  fontSizeRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  fontSizeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a50',
  },
  fontSizeBtnText: {
    fontWeight: '800',
  },
  fontSizePreview: {
    textAlign: 'center',
    marginTop: 10,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  reportButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  reportButtonDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  reportCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginTop: 12,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reportCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  reportCardText: {
    fontSize: 14,
    lineHeight: 22,
  },
  reportCloseBtn: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  reportCloseText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuFooter: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 30,
    lineHeight: 18,
  },

  // ===== TAB BAR =====
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a38',
    borderTopWidth: 1,
    borderTopColor: '#2a2a50',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: '#6b6b8a',
    fontSize: 11,
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#ffe082',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },

  // ===== STATS =====
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a38',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    color: '#ffe082',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: '#7777aa',
    fontSize: 12,
    marginTop: 6,
  },
  statsSubtitle: {
    color: '#9999bb',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  moodHistorySection: {
    marginTop: 12,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a38',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 24,
    marginRight: 14,
  },
  moodInfo: {
    flex: 1,
  },
  moodTitle: {
    color: '#e8e0d0',
    fontSize: 14,
    fontWeight: '600',
  },
  moodDate: {
    color: '#6b6b8a',
    fontSize: 12,
    marginTop: 2,
  },

  // ===== QUOTE =====
  quoteCard: {
    width: '100%',
    backgroundColor: '#1a1a38',
    borderRadius: 18,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ffe08215',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  quoteIcon: {
    color: '#ffe082',
    fontSize: 16,
    marginBottom: 8,
  },
  quoteText: {
    color: '#d0c8b8',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 8,
  },
  quoteAuthor: {
    color: '#7777aa',
    fontSize: 12,
    textAlign: 'right',
  },

  // ===== SEARCH =====
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: '#1a1a38',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    color: '#f0e6d3',
    fontSize: 15,
  },
  searchClose: {
    color: '#6b6b8a',
    fontSize: 18,
    padding: 4,
  },

  // ===== FOLDERS =====
  foldersScroll: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  foldersTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  foldersHeader: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  foldersTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 10,
  },
  folderAllCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  folderAllIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  folderAllInfo: {
    flex: 1,
  },
  folderAllName: {
    fontSize: 17,
    fontWeight: '700',
  },
  folderAllCount: {
    fontSize: 13,
    marginTop: 2,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  folderIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  folderName: {
    fontSize: 16,
    flex: 1,
  },
  folderCount: {
    fontSize: 15,
    marginRight: 8,
  },
  folderArrow: {
    fontSize: 22,
    fontWeight: '300',
  },

  // ===== HEADER =====
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffe082',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#ffff7a',
    marginTop: 4,
    fontWeight: '300',
    letterSpacing: 1,
  },
  noteCount: {
    fontSize: 12,
    color: '#7777aa',
    marginTop: 8,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: '#ffff7a25',
    marginTop: 14,
    borderRadius: 1,
  },

  // ===== LIST =====
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: '#7777aa',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#7777aa',
    fontSize: 13,
    marginTop: 4,
  },

  // ===== NOTE CARDS =====
  noteCard: {
    backgroundColor: '#1a1a38',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  noteAccent: {
    width: 4,
    borderRadius: 2,
    marginRight: 14,
    alignSelf: 'stretch',
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    color: '#ffe082',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  noteText: {
    color: '#9999bb',
    fontSize: 14,
    lineHeight: 21,
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
  },
  noteDate: {
    color: '#6b6b8a',
    fontSize: 12,
  },
  noteDot: {
    color: '#6b6b8a',
    fontSize: 12,
    marginHorizontal: 6,
  },
  noteTime: {
    color: '#6b6b8a',
    fontSize: 12,
  },

  // ===== FAB =====
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    shadowColor: '#ffe082',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  fabInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ffe082',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 30,
    color: '#12122a',
    fontWeight: '600',
    marginTop: -2,
  },

  // ===== AI =====
  noteTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteEmoji: {
    fontSize: 18,
  },
  noteAiMessage: {
    color: '#8888aa',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
  noteMood: {
    color: '#ffe082',
    fontSize: 12,
  },
  aiCard: {
    backgroundColor: '#1a1a38',
    borderRadius: 18,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#ffe08220',
    alignItems: 'center',
    shadowColor: '#ffe082',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  aiCardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  aiCardMood: {
    color: '#ffe082',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  aiCardMessage: {
    color: '#d0c8b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  analyzingBar: {
    position: 'absolute',
    bottom: 110,
    left: 24,
    right: 24,
    backgroundColor: '#1a1a38',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  analyzingText: {
    color: '#ffe082',
    fontSize: 13,
  },

  // ===== FULL IMAGE =====
  fullImageContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  fullImageClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#00000088',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImageCloseText: {
    color: '#fff',
    fontSize: 18,
  },

  // ===== IMAGE =====
  noteImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  viewImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 16,
  },
  writeImageContainer: {
    marginHorizontal: 28,
    marginTop: 12,
    position: 'relative',
  },
  writeImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#00000088',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 14,
  },
  imageButtons: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    marginTop: 10,
    gap: 10,
  },
  imageButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a50',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  imageButtonText: {
    color: '#7777aa',
    fontSize: 14,
  },

  // ===== DELETE BUTTON =====
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
  },
  deleteText: {
    color: '#5a5a7a',
    fontSize: 16,
  },

  // ===== VIEW SCREEN =====
  viewContent: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  viewTitle: {
    color: '#ffe082',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  viewText: {
    color: '#f0e6d3',
    fontSize: 17,
    lineHeight: 28,
  },
  deleteBottomButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#e0555515',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteBottomText: {
    color: '#e05555',
    fontSize: 14,
    fontWeight: '600',
  },

  // ===== WRITE SCREEN =====
  writeTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e3a',
  },
  backButton: {
    color: '#ffe082',
    fontSize: 16,
    fontWeight: '600',
  },
  writeTopBarTitle: {
    color: '#e8e0d0',
    fontSize: 17,
    fontWeight: '700',
  },
  saveTopButton: {
    color: '#ffe082',
    fontSize: 16,
    fontWeight: '700',
  },
  saveTopButtonDisabled: {
    color: '#3a3a5a',
  },
  writeDateRow: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 8,
  },
  writeDateText: {
    color: '#6b6b8a',
    fontSize: 13,
  },
  writeTitleInput: {
    paddingHorizontal: 28,
    paddingTop: 12,
    color: '#ffe082',
    fontSize: 22,
    fontWeight: '800',
  },
  writeActions: {
    paddingHorizontal: 28,
    marginTop: 20,
    marginBottom: 40,
    gap: 12,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a50',
    gap: 8,
  },
  voiceButtonActive: {
    borderColor: '#e05555',
    backgroundColor: '#e0555515',
  },
  voiceButtonText: {
    fontSize: 18,
  },
  voiceLabel: {
    color: '#7777aa',
    fontSize: 14,
    fontWeight: '600',
  },
  voiceLabelActive: {
    color: '#e05555',
  },
  audioPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe08212',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 10,
    alignSelf: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ffe08220',
  },
  audioPlayIcon: {
    fontSize: 16,
  },
  audioPlayText: {
    color: '#ffe082',
    fontSize: 13,
    fontWeight: '600',
  },
  audioPlayBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe08212',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#ffe08220',
  },
  audioPlayTextLarge: {
    fontSize: 16,
    fontWeight: '600',
  },
  audioRecorded: {
    marginHorizontal: 28,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#b8e0a020',
    alignItems: 'center',
  },
  audioRecordedText: {
    color: '#4a9e64',
    fontSize: 13,
    fontWeight: '600',
  },
  voiceModal: {
    marginHorizontal: 28,
    marginTop: 16,
    backgroundColor: '#1a1a38',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ffe08230',
  },
  voiceModalTitle: {
    color: '#ffe082',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  voiceModalDesc: {
    color: '#7777aa',
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  voiceModalInput: {
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 14,
    color: '#f0e6d3',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#2a2a50',
  },
  voiceModalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  voiceModalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a50',
    alignItems: 'center',
  },
  voiceModalCancelText: {
    color: '#7777aa',
    fontSize: 14,
    fontWeight: '600',
  },
  voiceModalSend: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffe082',
    alignItems: 'center',
  },
  voiceModalSendText: {
    color: '#12122a',
    fontSize: 14,
    fontWeight: '700',
  },
  writeSaveButton: {
    backgroundColor: '#ffe082',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  writeSaveDisabled: {
    backgroundColor: '#2a2a4a',
  },
  writeSaveText: {
    color: '#12122a',
    fontSize: 16,
    fontWeight: '700',
  },
  writeSaveTextDisabled: {
    color: '#6b6b8a',
  },
  writeInput: {
    paddingHorizontal: 28,
    paddingTop: 12,
    color: '#f0e6d3',
    fontSize: 17,
    lineHeight: 28,
  },
});
