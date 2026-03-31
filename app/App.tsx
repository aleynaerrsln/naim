import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
import BelleRose from './components/BelleRose';

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

export default function App() {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [screen, setScreen] = useState<'home' | 'write'>('home');

  const handleSave = () => {
    if (note.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        text: note.trim(),
        date: formatDate(),
        time: formatTime(),
      };
      setNotes([newNote, ...notes]);
      setNote('');
      setScreen('home');
    }
  };

  const renderNote = ({ item, index }: { item: Note; index: number }) => {
    const colors = ['#ffe082', '#f0a0b8', '#a0d8ef', '#b8e0a0', '#d4a0f0'];
    const accentColor = colors[index % colors.length];

    return (
      <View style={styles.noteCard}>
        <View style={[styles.noteAccent, { backgroundColor: accentColor }]} />
        <View style={styles.noteContent}>
          <Text style={styles.noteText}>{item.text}</Text>
          <View style={styles.noteMeta}>
            <Text style={styles.noteDate}>{item.date}</Text>
            <Text style={styles.noteDot}>·</Text>
            <Text style={styles.noteTime}>{item.time}</Text>
          </View>
        </View>
      </View>
    );
  };

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
          <Text style={styles.writeTopBarTitle}>Yeni Not</Text>
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
        <Text style={styles.menuIcon}>☰</Text>
        <Text style={styles.topBarTitle}>Pocket Belle</Text>
        <Text style={styles.menuIcon}>⚙️</Text>
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
  menuIcon: {
    fontSize: 22,
    color: '#9999bb',
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
    bottom: 30,
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
