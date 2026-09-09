import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { mobileApi } from '../../services/api';
import { formatPriceINR } from '@real-estate/shared';

export default function PostPropertyScreen() {
  const router = useRouter();
  const { user, postPropertyDraft, updateDraft, clearDraft, selectedCity } = useStore();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State initialized from draft if existing
  const [listingType, setListingType] = useState(postPropertyDraft.listingType || 'SALE');
  const [category, setCategory] = useState(postPropertyDraft.category || 'RESIDENTIAL');
  const [propertyType, setPropertyType] = useState(postPropertyDraft.propertyType || 'APARTMENT');
  const [city, setCity] = useState(postPropertyDraft.city || selectedCity);
  const [locality, setLocality] = useState(postPropertyDraft.locality || '');
  const [address, setAddress] = useState(postPropertyDraft.address || '');
  const [pincode, setPincode] = useState(postPropertyDraft.pincode || '800001');
  const [bedrooms, setBedrooms] = useState(postPropertyDraft.bedrooms ? String(postPropertyDraft.bedrooms) : '3');
  const [bathrooms, setBathrooms] = useState(postPropertyDraft.bathrooms ? String(postPropertyDraft.bathrooms) : '2');
  const [area, setArea] = useState(postPropertyDraft.area ? String(postPropertyDraft.area) : '1450');
  const [floorNumber, setFloorNumber] = useState(postPropertyDraft.floorNumber ? String(postPropertyDraft.floorNumber) : '4');
  const [totalFloors, setTotalFloors] = useState(postPropertyDraft.totalFloors ? String(postPropertyDraft.totalFloors) : '10');
  const [price, setPrice] = useState(postPropertyDraft.price ? String(postPropertyDraft.price) : '');
  const [title, setTitle] = useState(postPropertyDraft.title || '');
  const [description, setDescription] = useState(postPropertyDraft.description || '');
  const [imageUrl, setImageUrl] = useState(
    postPropertyDraft.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80'
  );

  // Auto-save draft on step change
  const saveCurrentDraft = () => {
    updateDraft({
      listingType,
      category,
      propertyType,
      city,
      locality,
      address,
      pincode,
      bedrooms,
      bathrooms,
      area,
      floorNumber,
      totalFloors,
      price,
      title,
      description,
      imageUrl,
    });
  };

  const handleNext = () => {
    saveCurrentDraft();
    if (step < 6) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    saveCurrentDraft();
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Login Required', 'You must log in to submit a property for listing.', [
        { text: 'Cancel' },
        { text: 'Login', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (!title || !description || !locality || !price || !area) {
      Alert.alert('Validation Error', 'Please complete all mandatory fields.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title,
        description,
        listingType,
        category,
        propertyType,
        price: Number(price),
        area: Number(area),
        areaUnit: 'SQ_FT',
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        floorNumber: floorNumber ? Number(floorNumber) : undefined,
        totalFloors: totalFloors ? Number(totalFloors) : undefined,
        address,
        locality,
        city,
        state: 'State',
        country: 'India',
        pincode,
        images: [{ url: imageUrl, sortOrder: 0 }],
        isDraft: false, // will become PENDING_REVIEW automatically
      };

      const res = await mobileApi('/properties', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      clearDraft();
      Alert.alert(
        'Listing Submitted!',
        'Your property has been submitted for Admin Review. Once verified, it will be published LIVE to buyers.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.stepTitle}>Step {step} of 6</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 6) * 100}%` }]} />
          </View>
        </View>
        <TouchableOpacity onPress={saveCurrentDraft} style={styles.saveBtn}>
          <Save size={18} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* STEP 1: Basic Intent */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>What do you want to do?</Text>
            <View style={styles.optionsRow}>
              {[
                { id: 'SALE', label: 'Sell Property' },
                { id: 'RENT', label: 'Rent Out Property' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.bigCard, listingType === item.id && styles.bigCardActive]}
                  onPress={() => setListingType(item.id)}
                >
                  <Text style={[styles.bigCardText, listingType === item.id && styles.bigCardTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.question, { marginTop: 24 }]}>Select Category</Text>
            <View style={styles.optionsRow}>
              {[
                { id: 'RESIDENTIAL', label: 'Residential' },
                { id: 'COMMERCIAL', label: 'Commercial' },
                { id: 'PG', label: 'PG / Hostel' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.chip, category === item.id && styles.chipActive]}
                  onPress={() => setCategory(item.id)}
                >
                  <Text style={[styles.chipText, category === item.id && styles.chipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 2: Location */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Where is your property located?</Text>
            <Text style={styles.inputLabel}>City</Text>
            <TextInput value={city} onChangeText={setCity} style={styles.input} />

            <Text style={styles.inputLabel}>Locality / Area Name *</Text>
            <TextInput
              placeholder="e.g. Bailey Road or Connaught Place"
              value={locality}
              onChangeText={setLocality}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Full Address / Project Name</Text>
            <TextInput
              placeholder="e.g. Tower B, Flat 402, Sunshine Apartments"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Pincode</Text>
            <TextInput
              placeholder="800001"
              keyboardType="numeric"
              value={pincode}
              onChangeText={setPincode}
              style={styles.input}
            />
          </View>
        )}

        {/* STEP 3: Property Specs */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Tell us about the property specs</Text>
            <Text style={styles.inputLabel}>Property Type</Text>
            <TextInput
              placeholder="APARTMENT / FLAT / VILLA / PLOT"
              value={propertyType}
              onChangeText={setPropertyType}
              style={styles.input}
            />

            <View style={styles.twoCols}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Bedrooms (BHK)</Text>
                <TextInput
                  keyboardType="numeric"
                  value={bedrooms}
                  onChangeText={setBedrooms}
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Bathrooms</Text>
                <TextInput
                  keyboardType="numeric"
                  value={bathrooms}
                  onChangeText={setBathrooms}
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Super Built-up Area (Sq. Ft.) *</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="1250"
              value={area}
              onChangeText={setArea}
              style={styles.input}
            />

            <View style={styles.twoCols}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Property on Floor</Text>
                <TextInput
                  keyboardType="numeric"
                  value={floorNumber}
                  onChangeText={setFloorNumber}
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Total Floors</Text>
                <TextInput
                  keyboardType="numeric"
                  value={totalFloors}
                  onChangeText={setTotalFloors}
                  style={styles.input}
                />
              </View>
            </View>
          </View>
        )}

        {/* STEP 4: Price */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Set your expected price</Text>
            <Text style={styles.inputLabel}>
              {listingType === 'SALE' ? 'Total Selling Price (₹) *' : 'Monthly Rent (₹) *'}
            </Text>
            <TextInput
              placeholder="e.g. 7500000"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              style={[styles.input, { fontSize: 18, fontWeight: '700' }]}
            />
            {price !== '' && (
              <Text style={styles.priceHelper}>
                Estimated: {formatPriceINR(Number(price))}
              </Text>
            )}
          </View>
        )}

        {/* STEP 5: Photos & Narrative */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Title & Description</Text>
            <Text style={styles.inputLabel}>Property Title *</Text>
            <TextInput
              placeholder="e.g. Spacious 3 BHK Apartment with Park View"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Detailed Description *</Text>
            <TextInput
              placeholder="Mention proximity to metro, schools, furnishings, and unique highlights..."
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 100 }]}
            />

            <Text style={styles.inputLabel}>Primary Photo URL</Text>
            <TextInput
              placeholder="https://..."
              value={imageUrl}
              onChangeText={setImageUrl}
              style={styles.input}
            />
          </View>
        )}

        {/* STEP 6: Preview & Submit */}
        {step === 6 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Review & Submit for Review</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{title || 'Untitled Property'}</Text>
              <Text style={styles.summaryPrice}>{formatPriceINR(Number(price || 0))}</Text>
              <Text style={styles.summaryLoc}>{locality}, {city}</Text>
              <Text style={styles.summarySpecs}>
                {category} • {propertyType} • {bedrooms} BHK • {area} Sq Ft
              </Text>
              <View style={styles.reviewAlert}>
                <Text style={styles.reviewAlertText}>
                  🛡️ Admin Review Rule: Newly posted properties enter "PENDING_REVIEW" and become LIVE once verified.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        {step < 6 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>Continue</Text>
            <ArrowRight size={18} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: '#16a34a' }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Check size={18} color="#ffffff" />
                <Text style={styles.nextBtnText}>Submit for Admin Review</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: { padding: 6 },
  saveBtn: { padding: 6 },
  stepTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  progressBar: { height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 2 },
  scrollBody: { padding: 20, paddingBottom: 100 },
  stepContainer: {},
  question: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  optionsRow: { flexDirection: 'row', gap: 10 },
  bigCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  bigCardActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  bigCardText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  bigCardTextActive: { color: '#2563eb' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#ffffff' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 14, marginBottom: 6 },
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
  twoCols: { flexDirection: 'row', gap: 12 },
  priceHelper: { fontSize: 14, fontWeight: '700', color: '#16a34a', marginTop: 6 },
  summaryCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  summaryPrice: { fontSize: 20, fontWeight: '800', color: '#2563eb', marginVertical: 4 },
  summaryLoc: { fontSize: 13, color: '#64748b' },
  summarySpecs: { fontSize: 13, fontWeight: '600', color: '#334155', marginTop: 6 },
  reviewAlert: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  reviewAlertText: { fontSize: 12, color: '#92400e', lineHeight: 18 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  nextBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
