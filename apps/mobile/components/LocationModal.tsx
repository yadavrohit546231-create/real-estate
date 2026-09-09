import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { X, MapPin, Check } from 'lucide-react-native';
import { useStore } from '../store/useStore';

const SEED_CITIES = [
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
  const { selectedCity, setCity } = useStore();

  const handleSelect = (city: string) => {
    setCity(city);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MapPin size={20} color="#2563eb" />
              <Text style={styles.title}>Select City</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={SEED_CITIES}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = selectedCity === item;
              return (
                <TouchableOpacity
                  style={[styles.cityItem, isSelected && styles.cityItemSelected]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                    {item}
                  </Text>
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
  cityName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
  cityNameSelected: {
    fontWeight: '700',
    color: '#2563eb',
  },
});
