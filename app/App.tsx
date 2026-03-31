import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
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
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import BelleRose from './components/BelleRose';
import { analyzeNote, AIResponse } from './utils/gemini';

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

export default function App() {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [screen, setScreen] = useState<'home' | 'write' | 'view' | 'stats'>('home');
  const [activeTab, setActiveTab] = useState<'home' | 'stats'>('home');
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

  const filteredNotes = searchQuery.trim()
    ? notes.filter(n => (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (n.text || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : notes;

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
        if (data) {
          setNotes(JSON.parse(data));
        }
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

  const handleSave = async () => {
    if (note.trim()) {
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
      <TouchableOpacity style={styles.noteCard} onPress={() => handleView(item)}>
        <View style={[styles.noteAccent, { backgroundColor: accentColor }]} />
        <View style={styles.noteContent}>
          <View style={styles.noteTitleRow}>
            <Text style={styles.noteTitle}>{item.title || 'Başlıksız'}</Text>
            {item.ai && <Text style={styles.noteEmoji}>{item.ai.emoji}</Text>}
          </View>
          <Text style={styles.noteText} numberOfLines={2}>{item.text}</Text>
          {item.ai && (
            <Text style={styles.noteAiMessage}>{item.ai.message}</Text>
          )}
          <View style={styles.noteMeta}>
            <Text style={styles.noteDate}>{item.date}</Text>
            <Text style={styles.noteDot}>·</Text>
            <Text style={styles.noteTime}>{item.time}</Text>
            {item.ai && (
              <>
                <Text style={styles.noteDot}>·</Text>
                <Text style={styles.noteMood}>{item.ai.mood}</Text>
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
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.topBar}>
          <View style={styles.iconButton} />
          <Text style={styles.topBarTitle}>İstatistikler</Text>
          <View style={styles.iconButton} />
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
                  <Text style={styles.statLabel}>Toplam Not</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{Object.keys(moodCounts).length}</Text>
                  <Text style={styles.statLabel}>Farklı Ruh Hali</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{topMood ? topMood[0] : '—'}</Text>
                  <Text style={styles.statLabel}>En Sık Ruh Hali</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{notes.reduce((sum, n) => sum + n.text.length, 0)}</Text>
                  <Text style={styles.statLabel}>Toplam Karakter</Text>
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
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => { setScreen('home'); setActiveTab('home'); }}>
            <HomeIcon active={false} />
            <Text style={styles.tabLabel}>Ana Sayfa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
            <StatsIcon active={true} />
            <Text style={styles.tabLabelActive}>İstatistik</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ========== VIEW SCREEN ==========
  if (screen === 'view' && viewingNote) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.writeTopBar}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.backButton}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.writeTopBarTitle}>Not Detay</Text>
          <TouchableOpacity onPress={() => handleEdit(viewingNote)}>
            <Text style={styles.saveTopButton}>Düzenle</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.writeDateRow}>
          <Text style={styles.writeDateText}>{viewingNote.date} · {viewingNote.time}</Text>
        </View>
        <View style={styles.viewContent}>
          <Text style={styles.viewTitle}>{viewingNote.title || 'Başlıksız'}</Text>
          <Text style={styles.viewText}>{viewingNote.text}</Text>
          {viewingNote.ai && (
            <View style={styles.aiCard}>
              <Text style={styles.aiCardEmoji}>{viewingNote.ai.emoji}</Text>
              <Text style={styles.aiCardMood}>Ruh hali: {viewingNote.ai.mood}</Text>
              <Text style={styles.aiCardMessage}>{viewingNote.ai.message}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteBottomButton}
          onPress={() => handleDelete(viewingNote.id)}
        >
          <Text style={styles.deleteBottomText}>Notu Sil</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ========== WRITE SCREEN ==========
  if (screen === 'write') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        {/* Write Top Bar */}
        <View style={styles.writeTopBar}>
          <TouchableOpacity onPress={() => { setScreen('home'); setNote(''); setTitle(''); }}>
            <Text style={styles.backButton}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.writeTopBarTitle}>{editingId ? 'Düzenle' : 'Yeni Not'}</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!note.trim()}
          >
            <Text style={[styles.saveTopButton, !note.trim() && styles.saveTopButtonDisabled]}>
              Kaydet
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Info */}
        <View style={styles.writeDateRow}>
          <Text style={styles.writeDateText}>{formatDate()} · {formatTime()}</Text>
        </View>

        {/* Title Input */}
        <TextInput
          style={styles.writeTitleInput}
          placeholder="Başlık"
          placeholderTextColor="#5a5a7a"
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        {/* Text Area */}
        <TextInput
          style={styles.writeInput}
          placeholder="Düşüncelerini yaz..."
          placeholderTextColor="#5a5a7a"
          value={note}
          onChangeText={setNote}
          multiline
          autoFocus
          textAlignVertical="top"
        />
      </SafeAreaView>
    );
  }

  // ========== HOME SCREEN ==========
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton}>
          <MenuIcon />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Pocket Belle</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => setShowSearch(!showSearch)}>
          <SearchIcon />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Notlarda ara..."
            placeholderTextColor="#6b6b8a"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
            <Text style={styles.searchClose}>✕</Text>
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
        ListHeaderComponent={
          <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
            <BelleRose size={80} />
            <Text style={styles.title}>Aleyna Pocket Belle</Text>
            <Text style={styles.subtitle}>Günlük Not Defterim</Text>
            {notes.length > 0 && (
              <Text style={styles.noteCount}>{notes.length} not</Text>
            )}
            <View style={styles.divider} />

            {/* Daily Quote */}
            {dailyQuote.text ? (
              <View style={styles.quoteCard}>
                <Text style={styles.quoteIcon}>✦</Text>
                <Text style={styles.quoteText}>"{dailyQuote.text}"</Text>
                <Text style={styles.quoteAuthor}>— {dailyQuote.author}</Text>
              </View>
            ) : null}
          </Animated.View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>Henüz not yok</Text>
            <Text style={styles.emptySubtext}>İlk notunu yazmaya başla!</Text>
          </View>
        }
      />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
          <HomeIcon active={true} />
          <Text style={styles.tabLabelActive}>Ana Sayfa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => { setScreen('stats'); setActiveTab('stats'); }}>
          <StatsIcon active={false} />
          <Text style={styles.tabLabel}>İstatistik</Text>
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
          style={styles.fabInner}
          onPress={() => setScreen('write')}
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1a1a38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    color: '#9999bb',
    fontWeight: '600',
    letterSpacing: 0.5,
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
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
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
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
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
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ffe08215',
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
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
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
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
  },
  noteAccent: {
    width: 3,
    borderRadius: 2,
    marginRight: 14,
    alignSelf: 'stretch',
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    color: '#ffe082',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  noteText: {
    color: '#9999bb',
    fontSize: 14,
    lineHeight: 20,
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
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
    bottom: 115,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#ffe082',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffe082',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 28,
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
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ffe08220',
    alignItems: 'center',
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
    marginHorizontal: 28,
    marginBottom: 40,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e05555',
    alignItems: 'center',
  },
  deleteBottomText: {
    color: '#e05555',
    fontSize: 15,
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
  writeInput: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
    color: '#f0e6d3',
    fontSize: 17,
    lineHeight: 28,
  },
});
