import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, LogIn } from 'lucide-react-native';
import { mobileApi } from '../../services/api';
import { useStore } from '../../store/useStore';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useStore();

  const [email, setEmail] = useState('owner1@gmail.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await mobileApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setUser(res.data?.user, res.data?.tokens?.accessToken);
      router.back();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillTestUser = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.subtitle}>Enter your email and password to access your account.</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.label}>Email Address</Text>
      <View style={styles.inputWrap}>
        <Mail size={18} color="#94a3b8" />
        <TextInput
          placeholder="yourname@domain.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
      </View>

      <Text style={styles.label}>Password</Text>
      <View style={styles.inputWrap}>
        <Lock size={18} color="#94a3b8" />
        <TextInput
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
      </View>

      <TouchableOpacity
        style={styles.loginBtn}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.loginBtnText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <View style={styles.registerRow}>
        <Text style={styles.noAccountText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Dev shortcuts */}
      <View style={styles.devSection}>
        <Text style={styles.devHeading}>Dev Test Logins:</Text>
        <View style={styles.devButtons}>
          <TouchableOpacity onPress={() => fillTestUser('buyer1@gmail.com')} style={styles.devBtn}>
            <Text style={styles.devBtnText}>Buyer 1</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => fillTestUser('owner1@gmail.com')} style={styles.devBtn}>
            <Text style={styles.devBtnText}>Owner 1</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => fillTestUser('agent1@realty.com')} style={styles.devBtn}>
            <Text style={styles.devBtnText}>Agent 1</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => fillTestUser('builder1@estate.com')} style={styles.devBtn}>
            <Text style={styles.devBtnText}>Builder 1</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 20 },
  errorText: { color: '#e11d48', fontSize: 13, marginBottom: 14, backgroundColor: '#ffe4e6', padding: 10, borderRadius: 8 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6, marginTop: 10 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  input: { flex: 1, fontSize: 14, color: '#0f172a' },
  loginBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  loginBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  noAccountText: { fontSize: 13, color: '#64748b' },
  registerLink: { fontSize: 13, fontWeight: '700', color: '#2563eb' },
  devSection: { marginTop: 40, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  devHeading: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 },
  devButtons: { flexDirection: 'row', gap: 8 },
  devBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  devBtnText: { fontSize: 12, fontWeight: '600', color: '#334155' },
});
