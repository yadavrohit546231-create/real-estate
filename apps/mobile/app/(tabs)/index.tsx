import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Bell, Search, ChevronDown, Sparkles, Building, Home as HomeIcon, Briefcase, Users } from 'lucide-react-native';
import { PropertyCard } from '../../components/PropertyCard';
import { LocationModal } from '../../components/LocationModal';
import { useStore } from '../../store/useStore';
import { mobileApi } from '../../services/api';

export type HomeFilterType = 'ALL' | 'BUY' | 'RENT' | 'COMMERCIAL' | 'PG';

export default function HomeScreen() {
  const router = useRouter();
  const { selectedCity, user } = useStore();
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [recommendedProperties, setRecommendedProperties] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<HomeFilterType>('ALL');

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const cityQuery = selectedCity && selectedCity !== 'All Cities'
        ? `city=${encodeURIComponent(selectedCity)}&`
        : '';

      // Fetch featured properties
      const featuredRes = await mobileApi(`/properties?${cityQuery}isFeatured=true&limit=15`);
      setFeaturedProperties(featuredRes.data?.data || []);

      // Fetch all recommended/recent live properties (generous limit for smooth client filtering)
      const recRes = await mobileApi(`/properties?${cityQuery}limit=60`);
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

  const isPropertyInFilter = (p: any, filter: HomeFilterType) => {
    if (filter === 'ALL') return true;

    const pCat = (p.category || '').toUpperCase();
    const pType = (p.propertyType || '').toLowerCase();
    const isCommercial = pCat === 'COMMERCIAL' || ['office', 'shop', 'showroom', 'warehouse', 'commercial'].some((k) => pType.includes(k));
    const isPG = pCat === 'PG' || pType.includes('pg') || pType.includes('hostel');

    if (filter === 'BUY') {
      return p.listingType === 'SALE' && !isCommercial;
    }
    if (filter === 'RENT') {
      return p.listingType === 'RENT' && !isCommercial && !isPG;
    }
    if (filter === 'COMMERCIAL') {
      return isCommercial;
    }
    if (filter === 'PG') {
      return isPG;
    }
    return true;
  };

  const filteredRecommended = recommendedProperties.filter((p) => isPropertyInFilter(p, selectedFilter));
  const filteredFeatured = featuredProperties.filter((p) => isPropertyInFilter(p, selectedFilter));

  const counts: Record<HomeFilterType, number> = {
    ALL: recommendedProperties.length,
    BUY: recommendedProperties.filter((p) => isPropertyInFilter(p, 'BUY')).length,
    RENT: recommendedProperties.filter((p) => isPropertyInFilter(p, 'RENT')).length,
    COMMERCIAL: recommendedProperties.filter((p) => isPropertyInFilter(p, 'COMMERCIAL')).length,
    PG: recommendedProperties.filter((p) => isPropertyInFilter(p, 'PG')).length,
  };

  const categories = [
    { id: 'BUY' as HomeFilterType, label: 'Buy', icon: HomeIcon, color: '#2563eb', bg: '#eff6ff' },
    { id: 'RENT' as HomeFilterType, label: 'Rent', icon: Building, color: '#10b981', bg: '#ecfdf5' },
    { id: 'COMMERCIAL' as HomeFilterType, label: 'Commercial', icon: Briefcase, color: '#f59e0b', bg: '#fffbeb' },
    { id: 'PG' as HomeFilterType, label: 'PG / Hostel', icon: Users, color: '#8b5cf6', bg: '#f5f3ff' },
  ];

  const filterTabs: { id: HomeFilterType; label: string; icon: any }[] = [
    { id: 'ALL', label: 'All Listings', icon: Sparkles },
    { id: 'BUY', label: 'Buy', icon: HomeIcon },
    { id: 'RENT', label: 'Rent', icon: Building },
    { id: 'COMMERCIAL', label: 'Commercial', icon: Briefcase },
    { id: 'PG', label: 'PG / Hostel', icon: Users },
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
            {selectedCity === 'All Cities'
              ? 'Search all listed properties, project or city...'
              : `Search locality, project or landmark in ${selectedCity}...`}
          </Text>
        </TouchableOpacity>

        {/* Categories Grid (Click to filter or toggle back to All) */}
        <View style={styles.categoriesContainer}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedFilter === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  isSelected && styles.categoryItemActive,
                ]}
                onPress={() => {
                  setSelectedFilter((prev) => (prev === cat.id ? 'ALL' : cat.id));
                }}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.categoryIconWrap,
                    { backgroundColor: isSelected ? cat.color : cat.bg },
                    isSelected && styles.categoryIconWrapActive,
                  ]}
                >
                  <Icon size={24} color={isSelected ? '#ffffff' : cat.color} />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    isSelected && { color: cat.color, fontWeight: '800' },
                  ]}
                >
                  {cat.label}
                </Text>
                {isSelected && (
                  <View style={[styles.categoryActiveDot, { backgroundColor: cat.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Post Property Banner for Owners (Hidden for logged-in AGENT, BUILDER, OWNER) */}
        {(!user || user.role === 'BUYER') && (
          <View style={styles.banner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Are you a Property Owner?</Text>
              <Text style={styles.bannerSubtitle}>
                Post your property for FREE & connect with verified buyers.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.bannerBtn}
              onPress={() => {
                if (!user) {
                  router.push('/(auth)/login');
                } else {
                  router.push('/post-property');
                }
              }}
            >
              <Text style={styles.bannerBtnText}>Post Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Pills Bar: [All Listings, Buy, Rent, Commercial, PG / Hostel] */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsScroll}
          >
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedFilter === tab.id;
              const count = counts[tab.id] ?? 0;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setSelectedFilter(tab.id)}
                  activeOpacity={0.75}
                >
                  <Icon size={14} color={isActive ? '#ffffff' : '#64748b'} />
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {tab.label}
                  </Text>
                  <View style={[styles.filterPillBadge, isActive && styles.filterPillBadgeActive]}>
                    <Text style={[styles.filterPillBadgeText, isActive && styles.filterPillBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Featured Properties Horizontal Scroll (Filtered if active filter matches) */}
        {filteredFeatured.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={18} color="#f59e0b" />
                <Text style={styles.sectionTitle}>Featured Properties</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
              {filteredFeatured.map((prop) => (
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

        {/* Recommended & Filtered Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>
                {selectedFilter === 'ALL'
                  ? `Recommended in ${selectedCity}`
                  : selectedFilter === 'BUY'
                  ? `Properties for Sale in ${selectedCity}`
                  : selectedFilter === 'RENT'
                  ? `Properties for Rent in ${selectedCity}`
                  : selectedFilter === 'COMMERCIAL'
                  ? `Commercial Spaces in ${selectedCity}`
                  : `PG & Hostels in ${selectedCity}`}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {selectedFilter === 'ALL'
                  ? 'Miscellaneous listings & recent additions'
                  : `Filtered by ${selectedFilter} • Tap "All Listings" to reset`}
              </Text>
            </View>
            <View style={styles.countTag}>
              <Text style={styles.countTagText}>
                {filteredRecommended.length} {filteredRecommended.length === 1 ? 'Listing' : 'Listings'}
              </Text>
            </View>
          </View>

          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 30 }} />
          ) : filteredRecommended.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {selectedFilter === 'BUY' ? 'Sale' : selectedFilter === 'RENT' ? 'Rental' : selectedFilter} properties currently available in {selectedCity}.
              </Text>
              <Text style={styles.emptySubtext}>
                Tap below to view all available listings across all categories.
              </Text>
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => setSelectedFilter('ALL')}
                activeOpacity={0.8}
              >
                <Text style={styles.resetFilterBtnText}>Show All Properties (Miscellaneous)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              {filteredRecommended.map((prop) => (
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
  categoryItemActive: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconWrapActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  filterSection: {
    marginVertical: 10,
  },
  filterPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filterPillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  filterPillBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterPillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterPillBadgeTextActive: {
    color: '#ffffff',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  countTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  countTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  resetFilterBtn: {
    marginTop: 14,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetFilterBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
