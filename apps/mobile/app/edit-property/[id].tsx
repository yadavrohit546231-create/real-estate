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
import { ArrowLeft, Save, AlertCircle, Building2, Check, UploadCloud, X, CheckCircle, Sparkles, Plus } from 'lucide-react-native';
import { mobileApi, mobileUploadImage, resolveImageUrl } from '../../services/api';
import { useStore } from '../../store/useStore';
import { showToast } from '../../services/toast';
import { formatPriceINR } from '@real-estate/shared';
import { AmenityIcon } from '../../components/AmenityIcon';

const POPULAR_AMENITY_SUGGESTIONS = [
  'Lift / Elevator',
  'Car Parking',
  'Power Backup',
  '24x7 Security',
  'Gymnasium',
  'Swimming Pool',
  'Clubhouse',
  'Park / Garden',
  'CCTV Surveillance',
  'Modular Kitchen',
  'Water Storage (24x7)',
  'Piped Gas',
  'Fire Fighting System',
  'Gated Society',
  'Balcony',
  'Vastu Compliant',
  'Intercom',
  'Children Play Area',
];

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form states - no hardcoded dummy values
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listingType, setListingType] = useState('');
  const [category, setCategory] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState('DRAFT');
  const [featuredRequested, setFeaturedRequested] = useState(false);

  const handleAddAmenity = (nameToAdd?: string) => {
    const raw = (nameToAdd !== undefined ? nameToAdd : amenityInput).trim();
    if (!raw) return;

    const items = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setAmenities((prev) => {
      const copy = [...prev];
      for (const item of items) {
        if (!copy.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
          copy.push(item);
        }
      }
      return copy;
    });

    if (nameToAdd === undefined) {
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (indexToRemove: number) => {
    setAmenities((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearAllAmenities = () => {
    setAmenities([]);
  };

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user]);

  useEffect(() => {
    if (!id || !user) return;
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
        setBedrooms(p.bedrooms ? String(p.bedrooms) : '');
        setBathrooms(p.bathrooms ? String(p.bathrooms) : '');
        setFloorNumber(p.floorNumber ? String(p.floorNumber) : '');
        setTotalFloors(p.totalFloors ? String(p.totalFloors) : '');
        setLocality(p.locality || '');
        setAddress(p.address || '');
        setCity(p.city || '');
        setPincode(p.pincode || '');
        setCurrentStatus(p.status || 'DRAFT');
        setFeaturedRequested(Boolean(p.featuredRequested));

        if (p.amenities && Array.isArray(p.amenities)) {
          const loaded = p.amenities
            .map((item: any) => (item.amenity?.name || item.name || '').trim())
            .filter(Boolean);
          setAmenities(loaded);
        }

        if (p.images && p.images.length > 0) {
          setImages(p.images.map((img: any) => img.url).filter(Boolean).slice(0, 4));
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
    if (images.length >= 4) {
      showToast('Maximum 4 photos allowed. Remove a photo to add another.', 'info');
      return;
    }

    try {
      try {
        const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        }
      } catch (permErr) {
        console.warn('Media permission check:', permErr);
      }

      const remainingSlots = 4 - images.length;
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        allowsEditing: false,
        quality: 0.85,
        base64: true,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return;
      }

      setUploadingImage(true);
      const selectedAssets = pickerResult.assets.slice(0, remainingSlots);
      const newlyUploadedUrls: string[] = [];

      for (let i = 0; i < selectedAssets.length; i++) {
        const asset = selectedAssets[i];
        const uploadedUrl = await mobileUploadImage(
          asset.uri,
          asset.fileName || undefined,
          asset.mimeType || undefined,
          asset.base64 || undefined
        );
        if (uploadedUrl) {
          newlyUploadedUrls.push(uploadedUrl);
        }
      }

      if (newlyUploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...newlyUploadedUrls].slice(0, 4));
        showToast(
          `${newlyUploadedUrls.length} photo${newlyUploadedUrls.length > 1 ? 's' : ''} uploaded successfully!`,
          'success'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Could not upload photo from device.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetCoverPhoto = (indexToCover: number) => {
    if (indexToCover === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(indexToCover, 1);
      copy.unshift(selected);
      return copy;
    });
    showToast('Cover photo updated!', 'success');
  };

  const handleSave = async () => {
    if (!listingType) {
      showToast('Please select property purpose (Sell or Rent).', 'error');
      return;
    }
    if (!category) {
      showToast('Please select property category.', 'error');
      return;
    }
    if (!title.trim() || title.trim().length < 5) {
      showToast('Please enter a property title (at least 5 characters).', 'error');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      showToast('Please enter a property description (at least 10 characters).', 'error');
      return;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      showToast('Please enter a valid property price.', 'error');
      return;
    }
    if (!area.trim() || isNaN(Number(area)) || Number(area) <= 0) {
      showToast('Please enter a valid built-up area (Sq. Ft.).', 'error');
      return;
    }
    if (category !== 'COMMERCIAL') {
      if (!bedrooms.trim() || isNaN(Number(bedrooms)) || Number(bedrooms) < 0) {
        showToast('Please enter number of bedrooms (BHK).', 'error');
        return;
      }
      if (!bathrooms.trim() || isNaN(Number(bathrooms)) || Number(bathrooms) < 0) {
        showToast('Please enter number of bathrooms.', 'error');
        return;
      }
    }
    if (!locality.trim()) {
      showToast('Please enter locality / area name.', 'error');
      return;
    }
    if (!city.trim()) {
      showToast('Please enter city name.', 'error');
      return;
    }
    if (images.length === 0) {
      showToast('Please upload at least 1 property photo (maximum 4).', 'error');
      return;
    }
    if (images.length > 4) {
      showToast('Maximum 4 photos allowed.', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        listingType,
        category,
        propertyType: propertyType.trim() || 'APARTMENT',
        price: Number(price),
        area: Number(area),
        areaUnit: 'SQ_FT',
        bedrooms: bedrooms.trim() ? Number(bedrooms) : undefined,
        bathrooms: bathrooms.trim() ? Number(bathrooms) : undefined,
        floorNumber: floorNumber.trim() ? Number(floorNumber) : undefined,
        totalFloors: totalFloors.trim() ? Number(totalFloors) : undefined,
        address: address.trim(),
        locality: locality.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        amenities,
        images: images.map((url, idx) => ({ url: url.trim(), sortOrder: idx })),
        featuredRequested,
      };

      await mobileApi(`/properties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      showToast('Property updated successfully!', 'success');
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err: any) {
      showToast(err.message || 'Could not update property.', 'error');
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
          placeholder="e.g. Spacious 3 BHK Apartment with Park View & Balcony"
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Mention proximity to metro, schools, furnishings, parking, and key features..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={4}
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        />

        {/* Pricing & Area */}
        <Text style={styles.sectionHeader}>Price & Dimensions</Text>
        <Text style={styles.label}>Price (INR) *</Text>
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder={listingType === 'RENT' ? "e.g. 25000 (Monthly Rent in ₹)" : "e.g. 7500000 (Total Selling Price in ₹)"}
          placeholderTextColor="#94a3b8"
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
          placeholder="e.g. 1250 (in Sq. Ft.)"
          placeholderTextColor="#94a3b8"
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
              placeholder="e.g. 1, 2, 3, 4"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Bathrooms</Text>
            <TextInput
              value={bathrooms}
              onChangeText={setBathrooms}
              placeholder="e.g. 1, 2, 3"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </View>

        {/* Amenities & Features */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderNoMargin}>Amenities & Features</Text>
          <View style={styles.selectedCountPill}>
            <Sparkles size={13} color="#2563eb" />
            <Text style={styles.selectedCountPillText}>
              {amenities.length} Added
            </Text>
          </View>
        </View>
        <Text style={styles.subLabel}>
          Add or update the amenities and community features for this property manually.
        </Text>

        {/* Manual Amenity Input Box */}
        <Text style={styles.label}>Add Amenity or Feature</Text>
        <View style={styles.amenityInputRow}>
          <TextInput
            style={styles.amenityInputField}
            placeholder="e.g. Lift, 24/7 Security, Modular Kitchen"
            placeholderTextColor="#94a3b8"
            value={amenityInput}
            onChangeText={setAmenityInput}
            onSubmitEditing={() => handleAddAmenity()}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.addAmenityBtn,
              !amenityInput.trim() && styles.addAmenityBtnDisabled,
            ]}
            onPress={() => handleAddAmenity()}
            activeOpacity={0.7}
          >
            <Plus size={16} color="#ffffff" />
            <Text style={styles.addAmenityBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.amenityInputSubHint}>
          💡 Tip: You can type multiple amenities separated by commas (e.g. Lift, Parking, CCTV) and tap Add.
        </Text>

        {/* Added Amenities Action & Count */}
        <View style={styles.amenitiesStatusBar}>
          <View style={styles.selectedCountPill}>
            <Sparkles size={13} color="#2563eb" />
            <Text style={styles.selectedCountPillText}>
              {amenities.length} Features Added
            </Text>
          </View>
          {amenities.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAllAmenities}
              style={styles.quickActionBtn}
            >
              <Text style={[styles.quickActionBtnText, { color: '#dc2626' }]}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Added Amenities Badges */}
        {amenities.length > 0 ? (
          <View style={styles.addedAmenitiesWrap}>
            {amenities.map((item, idx) => (
              <View key={idx} style={styles.addedAmenityBadge}>
                <AmenityIcon name={item} size={15} color="#2563eb" />
                <Text style={styles.addedAmenityText}>{item}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveAmenity(idx)}
                  style={styles.removeAmenityBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color="#64748b" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyAmenitiesBox}>
            <Text style={styles.emptyAmenitiesTitle}>No amenities added yet</Text>
            <Text style={styles.emptyAmenitiesSub}>
              Type any feature in the input box above or tap quick suggestions below to add.
            </Text>
          </View>
        )}

        {/* Popular Quick Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Quick Suggestions (Tap to add):</Text>
          <View style={styles.suggestionsWrap}>
            {POPULAR_AMENITY_SUGGESTIONS.map((sug) => {
              const isAdded = amenities.some(
                (a) => a.toLowerCase() === sug.toLowerCase()
              );
              return (
                <TouchableOpacity
                  key={sug}
                  style={[
                    styles.suggestionChip,
                    isAdded && styles.suggestionChipAdded,
                  ]}
                  onPress={() => {
                    if (isAdded) {
                      setAmenities((prev) =>
                        prev.filter((a) => a.toLowerCase() !== sug.toLowerCase())
                      );
                    } else {
                      handleAddAmenity(sug);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {isAdded ? (
                    <Check size={12} color="#16a34a" />
                  ) : (
                    <Plus size={12} color="#475569" />
                  )}
                  <Text
                    style={[
                      styles.suggestionChipText,
                      isAdded && styles.suggestionChipTextAdded,
                    ]}
                  >
                    {sug}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Location Info */}
        <Text style={styles.sectionHeader}>Location Information</Text>
        <Text style={styles.label}>Locality / Sector *</Text>
        <TextInput
          value={locality}
          onChangeText={setLocality}
          placeholder="e.g. Bailey Road, Bandra West, Connaught Place"
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />

        <Text style={styles.label}>City *</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Patna, Mumbai, Delhi, Bengaluru"
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />

        <Text style={styles.label}>Full Address</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="e.g. Flat 302, Tower B, Green Valley Apartments"
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />

        <Text style={styles.label}>Pincode</Text>
        <TextInput
          value={pincode}
          onChangeText={setPincode}
          placeholder="e.g. 800001 or 400050"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          maxLength={6}
          style={styles.input}
        />

        {/* Photos & Device Upload */}
        <View style={styles.photoHeaderRow}>
          <Text style={styles.sectionHeaderNoMargin}>Property Photos * ({images.length}/4)</Text>
          <Text style={styles.photoLimitHint}>Max 4 photos</Text>
        </View>
        <Text style={styles.subLabel}>
          Upload up to 4 photos. The 1st photo serves as the main cover image.
        </Text>

        {/* Uploaded Photos Grid */}
        {images.length > 0 && (
          <View style={styles.photoGrid}>
            {images.map((imgUrl, idx) => (
              <View key={idx} style={styles.photoGridCard}>
                <Image
                  source={{ uri: resolveImageUrl(imgUrl) }}
                  style={styles.photoGridImage}
                  resizeMode="cover"
                />
                {idx === 0 ? (
                  <View style={styles.coverBadge}>
                    <CheckCircle size={11} color="#ffffff" />
                    <Text style={styles.coverBadgeText}>Cover</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.setCoverBtn}
                    onPress={() => handleSetCoverPhoto(idx)}
                  >
                    <Text style={styles.setCoverBtnText}>Make Cover</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => handleRemoveImage(idx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color="#ffffff" />
                </TouchableOpacity>
                <View style={styles.photoIndexBadge}>
                  <Text style={styles.photoIndexText}>{idx + 1}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Device Storage Upload Button */}
        {images.length < 4 ? (
          <TouchableOpacity
            style={[styles.deviceUploadCard, images.length > 0 && styles.deviceUploadCardCompact]}
            onPress={handlePickImage}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <View style={styles.uploadingCenter}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.uploadingText}>Uploading photos to server...</Text>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={styles.uploadIconWrap}>
                  <UploadCloud size={24} color="#2563eb" />
                </View>
                <Text style={styles.uploadTitle}>
                  {images.length === 0
                    ? 'Choose Photos from Device Storage (Max 4)'
                    : `+ Add More Photos (${4 - images.length} remaining)`}
                </Text>
                <Text style={styles.uploadSubtitle}>
                  Select original uncropped photos (JPG, PNG, WEBP)
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.maxPhotosNotice}>
            <CheckCircle size={16} color="#16a34a" />
            <Text style={styles.maxPhotosNoticeText}>
              Maximum 4 photos added. To change any photo, delete one above first.
            </Text>
          </View>
        )}

        {/* Featured Spotlight Request Option */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setFeaturedRequested(!featuredRequested)}
          style={[
            styles.featuredRequestBox,
            featuredRequested && styles.featuredRequestBoxActive,
          ]}
        >
          <View style={styles.featuredRequestLeft}>
            <View
              style={[
                styles.featuredIconWrap,
                featuredRequested && styles.featuredIconWrapActive,
              ]}
            >
              <Sparkles size={18} color={featuredRequested ? '#d97706' : '#64748b'} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text style={styles.featuredRequestTitle}>
                  Request "Featured" Spotlight
                </Text>
                <View style={styles.featuredFreeBadge}>
                  <Text style={styles.featuredFreeBadgeText}>SPOTLIGHT</Text>
                </View>
              </View>
              <Text style={styles.featuredRequestSubtitle}>
                Ask Super Admin to feature your property on the Home Screen carousel for 10x higher buyer visibility.
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.checkboxBox,
              featuredRequested && styles.checkboxBoxActive,
            ]}
          >
            {featuredRequested && <Check size={14} color="#ffffff" strokeWidth={3} />}
          </View>
        </TouchableOpacity>
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
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 4,
  },
  sectionHeaderNoMargin: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  photoLimitHint: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  subLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  photoGridCard: {
    width: '48%',
    height: 125,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coverBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  setCoverBtn: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  setCoverBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIndexBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIndexText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  deviceUploadCardCompact: {
    minHeight: 85,
    paddingVertical: 12,
  },
  maxPhotosNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 6,
  },
  maxPhotosNoticeText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
    fontWeight: '600',
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 4,
  },
  selectedCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  selectedCountPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  amenitiesStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amenityInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  amenityInputField: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  addAmenityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
  },
  addAmenityBtnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.7,
  },
  addAmenityBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  amenityInputSubHint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
    lineHeight: 16,
  },
  addedAmenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  addedAmenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addedAmenityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
  },
  removeAmenityBtn: {
    padding: 2,
    marginLeft: 2,
  },
  emptyAmenitiesBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyAmenitiesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  emptyAmenitiesSub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  suggestionChipAdded: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  suggestionChipTextAdded: {
    color: '#16a34a',
  },
  quickActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  quickActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  featuredRequestBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    marginBottom: 10,
  },
  featuredRequestBoxActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  featuredRequestLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 10,
  },
  featuredIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featuredIconWrapActive: {
    backgroundColor: '#fef3c7',
  },
  featuredRequestTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  featuredFreeBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  featuredFreeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 0.5,
  },
  featuredRequestSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 15,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: {
    backgroundColor: '#d97706',
    borderColor: '#d97706',
  },
});
