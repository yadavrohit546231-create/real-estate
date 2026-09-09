import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { UserRole } from '@real-estate/types';
import { mobileApi } from '../../services/api';
import { useStore } from '../../store/useStore';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BUYER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await mobileApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role,
        }),
      });

      setUser(res.data?.user, res.data?.tokens?.accessToken);
      router.back();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join India's fastest growing real estate network.</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.label}>I am a</Text>
      <View style={styles.rolesRow}>
        {[
          { id: UserRole.BUYER, label: 'Buyer / Tenant' },
          { id: UserRole.OWNER, label: 'Owner' },
          { id: UserRole.AGENT, label: 'Agent' },
          { id: UserRole.BUILDER, label: 'Builder' },
        ].map((r) => (
          <TouchableOpacity
            key={r.id}
            onPress={() => setRole(r.id)}
            style={[styles.roleChip, role === r.id && styles.roleChipActive]}
          >
            <Text style={[styles.roleText, role === r.id && styles.roleTextActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Text style={styles.label}>Email Address</Text>
      <TextInput
        placeholder="yourname@gmail.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        placeholder="+91 9876543210"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.btn}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.btnText}>Register Account</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 20 },
  errorText: { color: '#e11d48', fontSize: 13, marginBottom: 14, backgroundColor: '#ffe4e6', padding: 10, borderRadius: 8 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6, marginTop: 10 },
  rolesRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  roleText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  roleTextActive: { color: '#ffffff' },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  btn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
