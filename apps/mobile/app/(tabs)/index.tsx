import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Bell, Search, ChevronDown, Sparkles, Building, Home as HomeIcon, Briefcase, Users } from 'lucide-react-native';
import { PropertyCard } from '../../components/PropertyCard';
import { LocationModal } from '../../components/LocationModal';
import { useStore } from '../../store/useStore';
import { mobileApi } from '../../services/api';

export default function HomeScreen() {
  const router = useRouter();
  const { selectedCity } = useStore();
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [recommendedProperties, setRecommendedProperties] = useState<any[]>([]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      // Fetch featured properties
      const featuredRes = await mobileApi(`/properties?city=${selectedCity}&isFeatured=true&limit=6`);
      setFeaturedProperties(featuredRes.data?.data || []);

      // Fetch recommended/recent live properties
      const recRes = await mobileApi(`/properties?city=${selectedCity}&limit=10`);
      setRecommendedProperties(recRes.data?.data || []);
    } catch (err) {
      console.log('Error loading home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, [selectedCity]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const categories = [
    { id: 'BUY', label: 'Buy', icon: HomeIcon, color: '#2563eb', bg: '#eff6ff', type: 'SALE' },
    { id: 'RENT', label: 'Rent', icon: Building, color: '#10b981', bg: '#ecfdf5', type: 'RENT' },
    { id: 'COMMERCIAL', label: 'Commercial', icon: Briefcase, color: '#f59e0b', bg: '#fffbeb', category: 'COMMERCIAL' },
    { id: 'PG', label: 'PG / Hostel', icon: Users, color: '#8b5cf6', bg: '#f5f3ff', category: 'PG' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>EstatePlatform</Text>
          <TouchableOpacity
            style={styles.locationSelector}
            onPress={() => setLocationModalVisible(true)}
          >
            <MapPin size={14} color="#2563eb" />
            <Text style={styles.locationText}>{selectedCity}</Text>
            <ChevronDown size={14} color="#64748b" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => router.push('/(tabs)/notifications')}
        >
          <Bell size={20} color="#334155" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Input trigger */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Search size={18} color="#94a3b8" />
          <Text style={styles.searchPlaceholder}>
            Search locality, project or landmark in {selectedCity}...
          </Text>
        </TouchableOpacity>

        {/* Categories Grid */}
        <View style={styles.categoriesContainer}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryItem}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/search',
                    params: cat.type ? { listingType: cat.type } : { category: cat.category },
                  });
                }}
              >
                <View style={[styles.categoryIconWrap, { backgroundColor: cat.bg }]}>
                  <Icon size={24} color={cat.color} />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Post Property Banner for Owners & Agents */}
        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Are you a Property Owner?</Text>
            <Text style={styles.bannerSubtitle}>
              Post your property for FREE & connect with verified buyers.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bannerBtn}
            onPress={() => router.push('/post-property')}
          >
            <Text style={styles.bannerBtnText}>Post Now</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Properties Horizontal Scroll */}
        {featuredProperties.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={18} color="#f59e0b" />
                <Text style={styles.sectionTitle}>Featured Properties</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
              {featuredProperties.map((prop) => (
                <View key={prop.id} style={{ width: 280, marginRight: 14 }}>
                  <PropertyCard
                    property={prop}
                    onPress={() => router.push(`/property/${prop.id}`)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recommended Properties */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended in {selectedCity}</Text>
          </View>

          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 30 }} />
          ) : recommendedProperties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No properties currently listed in {selectedCity}.</Text>
              <Text style={styles.emptySubtext}>Try switching cities or check back soon!</Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              {recommendedProperties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  onPress={() => router.push(`/property/${prop.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Location Selection Modal */}
      <LocationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 13,
    color: '#94a3b8',
    flex: 1,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  categoryItem: {
    alignItems: 'center',
    width: '22%',
  },
  categoryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  banner: {
    marginHorizontal: 16,
    marginVertical: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
    paddingRight: 8,
  },
  bannerBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bannerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginTop: 10,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  horizontalList: {
    paddingLeft: 16,
    marginBottom: 10,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});
