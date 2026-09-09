import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: any;
  onApply: (newFilters: any) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
}) => {
  const [listingType, setListingType] = useState(filters.listingType || '');
  const [category, setCategory] = useState(filters.category || '');
  const [bedrooms, setBedrooms] = useState<number | null>(filters.bedrooms || null);
  const [minPrice, setMinPrice] = useState(filters.minPrice ? String(filters.minPrice) : '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice ? String(filters.maxPrice) : '');
  const [sortBy, setSortBy] = useState(filters.sortBy || 'newest');

  const handleReset = () => {
    setListingType('');
    setCategory('');
    setBedrooms(null);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  const handleApply = () => {
    onApply({
      listingType: listingType || undefined,
      category: category || undefined,
      bedrooms: bedrooms !== null ? bedrooms : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <SlidersHorizontal size={18} color="#2563eb" />
              <Text style={styles.title}>Filter Properties</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
                <RotateCcw size={14} color="#64748b" />
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Listing Type */}
            <Text style={styles.sectionTitle}>I Want To</Text>
            <View style={styles.optionsRow}>
              {['', 'SALE', 'RENT'].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setListingType(type)}
                  style={[styles.chip, listingType === type && styles.chipActive]}
                >
                  <Text style={[styles.chipText, listingType === type && styles.chipTextActive]}>
                    {type === '' ? 'Any' : type === 'SALE' ? 'Buy' : 'Rent'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text style={styles.sectionTitle}>Property Category</Text>
            <View style={styles.optionsRow}>
              {[
                { id: '', label: 'All' },
                { id: 'RESIDENTIAL', label: 'Residential' },
                { id: 'COMMERCIAL', label: 'Commercial' },
                { id: 'PG', label: 'PG / Co-Living' },
              ].map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  style={[styles.chip, category === c.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, category === c.id && styles.chipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bedrooms */}
            <Text style={styles.sectionTitle}>Bedrooms (BHK)</Text>
            <View style={styles.optionsRow}>
              {[null, 1, 2, 3, 4].map((bhk) => (
                <TouchableOpacity
                  key={String(bhk)}
                  onPress={() => setBedrooms(bhk)}
                  style={[styles.chip, bedrooms === bhk && styles.chipActive]}
                >
                  <Text style={[styles.chipText, bedrooms === bhk && styles.chipTextActive]}>
                    {bhk === null ? 'Any' : `${bhk} BHK`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Budget Range */}
            <Text style={styles.sectionTitle}>Budget Range (₹)</Text>
            <View style={styles.priceInputs}>
              <TextInput
                placeholder="Min Price (₹)"
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
                style={styles.input}
              />
              <Text style={styles.dash}>—</Text>
              <TextInput
                placeholder="Max Price (₹)"
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
                style={styles.input}
              />
            </View>

            {/* Sort Options */}
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.optionsWrap}>
              {[
                { id: 'newest', label: 'Newest First' },
                { id: 'price_asc', label: 'Price: Low to High' },
                { id: 'price_desc', label: 'Price: High to Low' },
                { id: 'area_desc', label: 'Area: Largest First' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSortBy(s.id)}
                  style={[styles.chip, sortBy === s.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, sortBy === s.id && styles.chipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer Apply Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: '85%',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  dash: {
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  applyBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
