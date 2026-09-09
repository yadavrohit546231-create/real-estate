import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { X, MapPin, Check, Navigation, Globe } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { requestAndFetchUserLocation } from '../services/location';
import { showToast } from '../services/toast';

const SEED_CITIES = [
  'All Cities',
  'Patna',
  'Delhi',
  'Mumbai',
  'Bangalore',
  'Hyderabad',
  'Kolkata',
  'Pune',
  'Chennai',
  'Noida',
  'Gurgaon',
];

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ visible, onClose }) => {
  const { selectedCity, setCity, setUserLocation } = useStore();
  const [fetchingGps, setFetchingGps] = useState(false);

  const handleSelect = (city: string) => {
    setCity(city);
    onClose();
  };

  const handleUseGps = async () => {
    try {
      setFetchingGps(true);
      const loc = await requestAndFetchUserLocation();
      if (loc) {
        setUserLocation({ latitude: loc.latitude, longitude: loc.longitude });
        if (loc.city) {
          // If city matches or is close to one of the cities
          const matched = SEED_CITIES.find(
            (c) => c.toLowerCase() === loc.city?.toLowerCase()
          );
          setCity(matched || loc.city);
          showToast(`Location set to ${matched || loc.city}`, 'success');
        } else {
          showToast('GPS location fetched successfully!', 'success');
        }
        onClose();
      }
    } finally {
      setFetchingGps(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MapPin size={20} color="#2563eb" />
              <Text style={styles.title}>Select City / Location</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* GPS Location Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.gpsButton}
            onPress={handleUseGps}
            disabled={fetchingGps}
          >
            {fetchingGps ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <Navigation size={18} color="#2563eb" />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsButtonTitle}>Use Current GPS Location</Text>
              <Text style={styles.gpsButtonSubtitle}>
                {fetchingGps ? 'Detecting satellites...' : 'Find and display properties near your GPS position'}
              </Text>
            </View>
          </TouchableOpacity>

          <FlatList
            data={SEED_CITIES}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = selectedCity === item;
              const isAll = item === 'All Cities';
              return (
                <TouchableOpacity
                  style={[styles.cityItem, isSelected && styles.cityItemSelected]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.cityRow}>
                    {isAll ? (
                      <Globe size={18} color={isSelected ? '#2563eb' : '#64748b'} />
                    ) : (
                      <MapPin size={16} color={isSelected ? '#2563eb' : '#94a3b8'} />
                    )}
                    <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                      {item} {isAll ? '(All India Listings)' : ''}
                    </Text>
                  </View>
                  {isSelected && <Check size={18} color="#2563eb" />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  cityItemSelected: {
    backgroundColor: '#eff6ff',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
  cityNameSelected: {
    fontWeight: '700',
    color: '#2563eb',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  gpsButtonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  gpsButtonSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
});
