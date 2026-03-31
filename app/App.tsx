import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import BelleRose from './components/BelleRose';

const MenuIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9999bb" strokeWidth={2} strokeLinecap="round">
    <Path d="M3 12h18M3 6h18M3 18h18" />
  </Svg>
);

const SettingsIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9999bb" strokeWidth={2} strokeLinecap="round">
    <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </Svg>
);

interface Note {
  id: string;
  text: string;
  date: string;
  time: string;
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
  const [screen, setScreen] = useState<'home' | 'write' | 'view'>('home');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [loaded, setLoaded] = useState(false);

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

  const handleSave = () => {
    if (note.trim()) {
      if (editingId) {
        saveNotes(notes.map(n => n.id === editingId
          ? { ...n, text: note.trim() }
          : n
        ));
        setEditingId(null);
      } else {
        const newNote: Note = {
          id: Date.now().toString(),
          text: note.trim(),
          date: formatDate(),
          time: formatTime(),
        };
        saveNotes([newNote, ...notes]);
      }
      setNote('');
      setScreen('home');
    }
  };

  const handleDelete = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
    if (screen === 'view') setScreen('home');
  };

  const handleEdit = (item: Note) => {
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
          <Text style={styles.noteText} numberOfLines={3}>{item.text}</Text>
          <View style={styles.noteMeta}>
            <Text style={styles.noteDate}>{item.date}</Text>
            <Text style={styles.noteDot}>·</Text>
            <Text style={styles.noteTime}>{item.time}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.viewText}>{viewingNote.text}</Text>
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
          <TouchableOpacity onPress={() => { setScreen('home'); setNote(''); }}>
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
        <TouchableOpacity style={styles.iconButton}>
          <SettingsIcon />
        </TouchableOpacity>
      </View>

      {/* Notes List */}
      <FlatList
        data={notes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <BelleRose size={80} />
            <Text style={styles.title}>Aleyna Pocket Belle</Text>
            <Text style={styles.subtitle}>Günlük Not Defterim</Text>
            {notes.length > 0 && (
              <Text style={styles.noteCount}>{notes.length} not</Text>
            )}
            <View style={styles.divider} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>Henüz not yok</Text>
            <Text style={styles.emptySubtext}>İlk notunu yazmaya başla!</Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setScreen('write')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  noteText: {
    color: '#e8e0d0',
    fontSize: 15,
    lineHeight: 23,
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
    bottom: 50,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffe082',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffe082',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#12122a',
    fontWeight: '600',
    marginTop: -2,
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
  writeInput: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 8,
    color: '#f0e6d3',
    fontSize: 17,
    lineHeight: 28,
  },
});
