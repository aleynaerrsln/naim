import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import BelleRose from './components/BelleRose';

export default function App() {
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState('');

  const handleSave = () => {
    if (note.trim()) {
      setSavedNote(note.trim());
      setNote('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.menuIcon}>☰</Text>
          <Text style={styles.topBarTitle}>Pocket Belle</Text>
          <Text style={styles.menuIcon}>⚙️</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <BelleRose size={90} />
          <Text style={styles.title}>Aleyna Pocket Belle</Text>
          <Text style={styles.subtitle}>Günlük Not Defterim</Text>
          <View style={styles.divider} />
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Yeni Not</Text>
          <TextInput
            style={styles.input}
            placeholder="Bugün ne düşünüyorsun?"
            placeholderTextColor="#6b6b8a"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity
            style={[styles.button, !note.trim() && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={!note.trim()}
          >
            <Text style={styles.buttonText}>Kaydet</Text>
          </TouchableOpacity>
        </View>

        {/* Saved Note */}
        {savedNote ? (
          <View style={styles.noteSection}>
            <Text style={styles.sectionLabel}>📄  Son Notun</Text>
            <View style={styles.noteCard}>
              <View style={styles.noteAccent} />
              <Text style={styles.noteText}>{savedNote}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12122a',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuIcon: {
    fontSize: 22,
    color: '#9999bb',
  },
  topBarTitle: {
    fontSize: 16,
    color: '#9999bb',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffe082',
    marginTop: 14,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#ffff7a',
    marginTop: 4,
    fontWeight: '300',
    letterSpacing: 1,
  },
  divider: {
    width: 50,
    height: 2,
    backgroundColor: '#ffff7a30',
    marginTop: 16,
    borderRadius: 1,
  },
  inputSection: {
    width: '100%',
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#9999bb',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    backgroundColor: '#1e1e3a',
    borderRadius: 16,
    padding: 18,
    color: '#f0e6d3',
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 1.5,
    borderColor: '#2a2a50',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#ffe082',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 14,
    alignSelf: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#3a3a5a',
  },
  buttonText: {
    color: '#12122a',
    fontSize: 14,
    fontWeight: '700',
  },
  noteSection: {
    width: '100%',
  },
  noteCard: {
    width: '100%',
    backgroundColor: '#1e1e3a',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteAccent: {
    width: 3,
    minHeight: 20,
    backgroundColor: '#ffff7a',
    borderRadius: 2,
    marginRight: 14,
    alignSelf: 'stretch',
  },
  noteText: {
    color: '#f0e6d3',
    fontSize: 15,
    lineHeight: 24,
    flex: 1,
  },
});
