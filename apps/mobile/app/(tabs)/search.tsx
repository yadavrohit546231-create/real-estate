import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search as SearchIcon, SlidersHorizontal, Map, List, Navigation, X } from 'lucide-react-native';
import { PropertyCard } from '../../components/PropertyCard';
import { FilterModal } from '../../components/FilterModal';
import { GoogleMapView } from '../../components/GoogleMapView';
import { useStore } from '../../store/useStore';
import { mobileApi } from '../../services/api';
import { requestAndFetchUserLocation } from '../../services/location';
import { showToast } from '../../services/toast';
import { formatPriceINR } from '@real-estate/shared';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { selectedCity, setCity, userLocation, setUserLocation } = useStore();

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [filters, setFilters] = useState<any>({
    listingType: params.listingType || undefined,
    category: params.category || undefined,
  });

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        ...(selectedCity && selectedCity !== 'All Cities' && { city: selectedCity }),
        ...(search && { search }),
        ...(filters.listingType && { listingType: filters.listingType }),
        ...(filters.category && { category: filters.category }),
        ...(filters.bedrooms && { bedrooms: String(filters.bedrooms) }),
        ...(filters.minPrice && { minPrice: String(filters.minPrice) }),
        ...(filters.maxPrice && { maxPrice: String(filters.maxPrice) }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        limit: '50',
      });

      const res = await mobileApi(`/properties?${query.toString()}`);
      setProperties(res.data?.data || []);
      setTotalCount(res.data?.pagination?.total || 0);
    } catch (err) {
      console.log('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchGps = async () => {
    try {
      setFetchingLocation(true);
      const loc = await requestAndFetchUserLocation();
      if (loc) {
        setUserLocation({ latitude: loc.latitude, longitude: loc.longitude });
        if (loc.city) {
          setCity(loc.city);
          showToast(`Location set to ${loc.city}`, 'success');
        } else {
          showToast('GPS coordinates fetched successfully!', 'success');
        }
      }
    } finally {
      setFetchingLocation(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedCity, filters]);

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Search & Filter Bar */}
      <View style={styles.topBar}>
        <View style={styles.inputContainer}>
          <SearchIcon size={18} color="#94a3b8" />
          <TextInput
            placeholder={
              selectedCity === 'All Cities'
                ? 'Search all listed properties...'
                : `Search in ${selectedCity}...`
            }
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchResults}
            style={styles.input}
            returnKeyType="search"
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => { setSearch(''); fetchResults(); }}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* GPS Location Button */}
        <TouchableOpacity
          style={styles.gpsButtonTop}
          onPress={handleFetchGps}
          disabled={fetchingLocation}
        >
          {fetchingLocation ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Navigation size={18} color="#2563eb" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <SlidersHorizontal size={18} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Sub-bar: Result count & View Mode Switcher */}
      <View style={styles.subBar}>
        <Text style={styles.resultCount}>
          {totalCount} Properties Found {selectedCity === 'All Cities' ? 'Across All Locations' : `in ${selectedCity}`}
        </Text>

        <View style={styles.viewSwitcher}>
          <TouchableOpacity
            style={[styles.viewTab, viewMode === 'list' && styles.viewTabActive]}
            onPress={() => setViewMode('list')}
          >
            <List size={14} color={viewMode === 'list' ? '#2563eb' : '#64748b'} />
            <Text style={[styles.viewTabText, viewMode === 'list' && styles.viewTabTextActive]}>
              List
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewTab, viewMode === 'map' && styles.viewTabActive]}
            onPress={() => setViewMode('map')}
          >
            <Map size={14} color={viewMode === 'map' ? '#2563eb' : '#64748b'} />
            <Text style={[styles.viewTabText, viewMode === 'map' && styles.viewTabTextActive]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results View */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Searching properties...</Text>
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => router.push(`/property/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No matching properties</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your budget or clearing filters to see more results.
              </Text>
            </View>
          }
        />
      ) : (
        /* Interactive Google Map View */
        <View style={styles.mapContainer}>
          <GoogleMapView
            properties={properties}
            userLocation={userLocation}
            onSelectProperty={(id) => router.push(`/property/${id}`)}
            onLocateMe={handleFetchGps}
            selectedCity={selectedCity}
          />

          {/* Bottom Card Carousel on Map */}
          {properties.length > 0 && (
            <View style={styles.mapCarouselWrap}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={properties}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.mapCard}
                    onPress={() => router.push(`/property/${item.id}`)}
                  >
                    <Text style={styles.mapCardPrice}>{formatPriceINR(item.price)}</Text>
                    <Text style={styles.mapCardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.mapCardLoc}>📍 {item.locality || item.city}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  gpsButtonTop: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 2,
  },
  viewTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  viewTabActive: {
    backgroundColor: '#ffffff',
  },
  viewTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  viewTabTextActive: {
    color: '#2563eb',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
  },
  mapHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  mapSub: {
    fontSize: 12,
    color: '#64748b',
  },
  mapCarouselWrap: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingLeft: 16,
  },
  mapCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    width: 220,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  mapCardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
  },
  mapCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 2,
  },
  mapCardLoc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
});
