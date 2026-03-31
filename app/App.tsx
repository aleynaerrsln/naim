import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import BelleRose from './components/BelleRose';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <BelleRose size={140} />
      <Text style={styles.title}>Aleyna Pocket Belle</Text>
      <Text style={styles.subtitle}>Günlük Not Defterim</Text>
      <Text style={styles.description}>
        Belle gibi her gün bir sayfa daha yaz.{'\n'}
        Düşüncelerini, hayallerini ve anılarını kaydet.
      </Text>
      <Text style={styles.version}>v1.0 — NAIM Challenge</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f4d03f',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#e8c547',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#f0e6d3',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  version: {
    fontSize: 12,
    color: '#8888aa',
  },
});
