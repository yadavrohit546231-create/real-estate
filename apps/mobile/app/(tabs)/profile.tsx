import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  PlusCircle,
  MessageSquare,
  Calendar,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Heart,
  Home,
} from 'lucide-react-native';
import { useStore } from '../../store/useStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useStore();

  const handleLogout = () => {
    logout();
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* User Header */}
      {user ? (
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name?.[0] || 'U'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.guestCard}>
          <Text style={styles.guestTitle}>Welcome to EstatePlatform</Text>
          <Text style={styles.guestSub}>
            Sign in to post properties, connect with owners, and manage your enquiries.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginBtnText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Actions Menu */}
      <View style={styles.menuGroup}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/post-property')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#eff6ff' }]}>
              <PlusCircle size={20} color="#2563eb" />
            </View>
            <Text style={styles.menuItemText}>Post Property for Sale/Rent</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/leads')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#f5f3ff' }]}>
              <MessageSquare size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.menuItemText}>My Received Leads</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/site-visits')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#ecfdf5' }]}>
              <Calendar size={20} color="#10b981" />
            </View>
            <Text style={styles.menuItemText}>Scheduled Site Visits</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(tabs)/saved')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#fef2f2' }]}>
              <Heart size={20} color="#ef4444" />
            </View>
            <Text style={styles.menuItemText}>Favorites & Saved Searches</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Logout Action */}
      {user && (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#e11d48" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  userName: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  userEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  roleBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: '#2563eb' },
  guestCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  guestTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  guestSub: { fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 18 },
  loginBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  loginBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  menuGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuItemText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
    marginTop: 24,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#e11d48' },
});
