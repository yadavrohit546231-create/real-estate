import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { PropertyCard } from '../../components/PropertyCard';
import { useStore } from '../../store/useStore';
import { mobileApi } from '../../services/api';

export default function SavedScreen() {
  const router = useRouter();
  const { user, favorites, setFavorites } = useStore();
  const [favoriteProperties, setFavoriteProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavoriteListings = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        const res = await mobileApi('/favorites');
        const properties = res.data || [];
        setFavoriteProperties(properties);
        setFavorites(properties.map((p: any) => p.id));
      } catch (err) {
        console.log('Error loading favorites:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, setFavorites]
  );

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchFavoriteListings();
      } else {
        setFavoriteProperties([]);
      }
    }, [user, fetchFavoriteListings])
  );

  // Filter properties in real-time if a property was unfavorited in store
  const displayProperties = favoriteProperties.filter((p) => favorites.includes(p.id));

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Heart size={48} color="#cbd5e1" />
        <Text style={styles.title}>Save your favorite homes</Text>
        <Text style={styles.subtitle}>
          Sign in to sync your saved properties across mobile, tablet, and web.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.btnText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && !refreshing && favoriteProperties.length === 0 ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : displayProperties.length === 0 ? (
        <View style={styles.centerContainer}>
          <Heart size={48} color="#cbd5e1" />
          <Text style={styles.title}>No saved properties yet</Text>
          <Text style={styles.subtitle}>
            Tap the heart icon on any listing to bookmark it here for later.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.btnText}>Explore Properties</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayProperties}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchFavoriteListings(true)}
              colors={['#2563eb']}
            />
          }
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => router.push(`/property/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginTop: 14 },
  subtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  btn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  btnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
