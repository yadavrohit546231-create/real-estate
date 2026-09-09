import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Save, AlertCircle, Building2, Check, UploadCloud } from 'lucide-react-native';
import { mobileApi, mobileUploadImage, resolveImageUrl } from '../../services/api';
import { useStore } from '../../store/useStore';
import { formatPriceINR } from '@real-estate/shared';

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listingType, setListingType] = useState('SALE');
  const [category, setCategory] = useState('RESIDENTIAL');
  const [propertyType, setPropertyType] = useState('APARTMENT');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [bedrooms, setBedrooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('2');
  const [floorNumber, setFloorNumber] = useState('1');
  const [totalFloors, setTotalFloors] = useState('5');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [currentStatus, setCurrentStatus] = useState('DRAFT');

  useEffect(() => {
    if (!id) return;
    const fetchPropertyDetails = async () => {
      try {
        setLoading(true);
        const res = await mobileApi(`/properties/${id}`);
        const p = res.data;
        if (!p) {
          Alert.alert('Error', 'Property not found');
          router.back();
          return;
        }

        setTitle(p.title || '');
        setDescription(p.description || '');
        setListingType(p.listingType || 'SALE');
        setCategory(p.category || 'RESIDENTIAL');
        setPropertyType(p.propertyType || 'APARTMENT');
        setPrice(p.price ? String(p.price) : '');
        setArea(p.area ? String(p.area) : '');
        setBedrooms(p.bedrooms ? String(p.bedrooms) : '3');
        setBathrooms(p.bathrooms ? String(p.bathrooms) : '2');
        setFloorNumber(p.floorNumber ? String(p.floorNumber) : '1');
        setTotalFloors(p.totalFloors ? String(p.totalFloors) : '5');
        setLocality(p.locality || '');
        setAddress(p.address || '');
        setCity(p.city || '');
        setPincode(p.pincode || '');
        setCurrentStatus(p.status || 'DRAFT');

        if (p.images && p.images.length > 0) {
          setImageUrl(p.images[0].url || '');
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to load property details');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [id]);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Storage Access Required',
          'Please allow photo gallery / storage access in your device settings to select property photos.'
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return;
      }

      const selectedAsset = pickerResult.assets[0];
      setUploadingImage(true);

      const uploadedUrl = await mobileUploadImage(selectedAsset.uri);
      setImageUrl(uploadedUrl);
      Alert.alert('Upload Complete', 'Property photo uploaded from device successfully!');
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload photo from device.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!title || !description || !locality || !price || !area) {
      Alert.alert('Validation Error', 'Please complete all required fields.');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
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
        pincode,
      };

      if (imageUrl && imageUrl.trim() !== '') {
        payload.images = [{ url: imageUrl.trim(), sortOrder: 0 }];
      }

      await mobileApi(`/properties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      Alert.alert(
        'Property Updated!',
        'Your listing changes have been saved and submitted for Super Admin review.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update property.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading property information...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Status notice */}
        <View style={styles.noticeBox}>
          <AlertCircle size={18} color="#d97706" />
          <Text style={styles.noticeText}>
            Current Status: <Text style={{ fontWeight: '800' }}>{currentStatus}</Text>. Any changes saved will be re-submitted for Super Admin approval before going live to buyers.
          </Text>
        </View>

        {/* Listing Type & Category */}
        <Text style={styles.sectionHeader}>Basic Details</Text>
        <Text style={styles.label}>Purpose</Text>
        <View style={styles.optionsRow}>
          {[
            { id: 'SALE', label: 'Sell Property' },
            { id: 'RENT', label: 'Rent Property' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.toggleBtn, listingType === item.id && styles.toggleBtnActive]}
              onPress={() => setListingType(item.id)}
            >
              <Text style={[styles.toggleBtnText, listingType === item.id && styles.toggleBtnTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Category</Text>
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

        {/* Title & Description */}
        <Text style={styles.label}>Property Title *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Spacious 3 BHK Apartment with Park View"
          style={styles.input}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your property..."
          multiline
          numberOfLines={4}
          style={[styles.input, { height: 90 }]}
        />

        {/* Pricing & Area */}
        <Text style={styles.sectionHeader}>Price & Dimensions</Text>
        <Text style={styles.label}>Price (INR) *</Text>
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 7500000"
          keyboardType="numeric"
          style={styles.input}
        />
        {price ? (
          <Text style={styles.priceHelper}>{formatPriceINR(Number(price))}</Text>
        ) : null}

        <Text style={styles.label}>Built-up Area (Sq Ft) *</Text>
        <TextInput
          value={area}
          onChangeText={setArea}
          placeholder="e.g. 1450"
          keyboardType="numeric"
          style={styles.input}
        />

        {/* Bedrooms / Bathrooms */}
        <View style={styles.twoCols}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Bedrooms (BHK)</Text>
            <TextInput
              value={bedrooms}
              onChangeText={setBedrooms}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Bathrooms</Text>
            <TextInput
              value={bathrooms}
              onChangeText={setBathrooms}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </View>

        {/* Location Info */}
        <Text style={styles.sectionHeader}>Location Information</Text>
        <Text style={styles.label}>Locality / Sector *</Text>
        <TextInput
          value={locality}
          onChangeText={setLocality}
          placeholder="e.g. Fraser Road or Indirapuram"
          style={styles.input}
        />

        <Text style={styles.label}>City *</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Patna or Delhi"
          style={styles.input}
        />

        <Text style={styles.label}>Full Address</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="e.g. Flat 302, Green Valley Apartments"
          style={styles.input}
        />

        <Text style={styles.label}>Pincode</Text>
        <TextInput
          value={pincode}
          onChangeText={setPincode}
          placeholder="800001"
          keyboardType="numeric"
          style={styles.input}
        />

        {/* Photos & Device Upload */}
        <Text style={styles.sectionHeader}>Property Photo</Text>
        <Text style={styles.label}>Upload from Device Storage</Text>
        <TouchableOpacity
          style={styles.deviceUploadCard}
          onPress={handlePickImage}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <View style={styles.uploadingCenter}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.uploadingText}>Uploading photo to server...</Text>
            </View>
          ) : imageUrl ? (
            <View style={styles.uploadedPreviewWrap}>
              <Image source={{ uri: resolveImageUrl(imageUrl) }} style={styles.uploadedPhotoPreview} />
              <View style={styles.changePhotoOverlay}>
                <UploadCloud size={16} color="#ffffff" />
                <Text style={styles.changePhotoText}>Change Photo from Device</Text>
              </View>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <View style={styles.uploadIconWrap}>
                <UploadCloud size={24} color="#2563eb" />
              </View>
              <Text style={styles.uploadTitle}>Choose Photo from Device Files</Text>
              <Text style={styles.uploadSubtitle}>Supports JPG, PNG from device gallery or files</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: 14 }]}>Or Direct Photo URL</Text>
        <TextInput
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://..."
          style={styles.input}
        />
      </ScrollView>

      {/* Sticky Save Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Check size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>Save & Update Listing</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 110,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  noticeText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  twoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  priceHelper: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  toggleBtnTextActive: {
    color: '#2563eb',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 16,
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  deviceUploadCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  uploadingCenter: {
    alignItems: 'center',
    padding: 24,
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  uploadedPreviewWrap: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  uploadedPhotoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  changePhotoOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changePhotoText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  uploadIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  uploadSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
});
