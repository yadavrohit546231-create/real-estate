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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Save,
  Lock,
  ShieldAlert,
  Building2,
  UserCheck,
  UploadCloud,
  X,
  CheckCircle,
  Trash2,
} from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { mobileApi, mobileUploadImage, resolveImageUrl } from '../../services/api';
import { showToast } from '../../services/toast';
import { formatPriceINR } from '@real-estate/shared';

const MAX_PHOTOS = 4;

export default function PostPropertyScreen() {
  const router = useRouter();
  const { user, setUser, postPropertyDraft, updateDraft, clearDraft, selectedCity } = useStore();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Listing role is managed automatically based on user account type
  const isAgent = user?.role === 'AGENT';
  const roleDisplayLabel = isAgent ? 'Real Estate Agent' : user?.role === 'BUILDER' ? 'Builder' : 'Property Owner';

  // Form State initialized from draft if existing - NO dummy default values
  const [listingType, setListingType] = useState(postPropertyDraft.listingType || '');
  const [category, setCategory] = useState(postPropertyDraft.category || '');
  const [propertyType, setPropertyType] = useState(postPropertyDraft.propertyType || '');
  const [city, setCity] = useState(postPropertyDraft.city || '');
  const [locality, setLocality] = useState(postPropertyDraft.locality || '');
  const [address, setAddress] = useState(postPropertyDraft.address || '');
  const [pincode, setPincode] = useState(postPropertyDraft.pincode || '');
  const [bedrooms, setBedrooms] = useState(postPropertyDraft.bedrooms ? String(postPropertyDraft.bedrooms) : '');
  const [bathrooms, setBathrooms] = useState(postPropertyDraft.bathrooms ? String(postPropertyDraft.bathrooms) : '');
  const [area, setArea] = useState(postPropertyDraft.area ? String(postPropertyDraft.area) : '');
  const [floorNumber, setFloorNumber] = useState(postPropertyDraft.floorNumber ? String(postPropertyDraft.floorNumber) : '');
  const [totalFloors, setTotalFloors] = useState(postPropertyDraft.totalFloors ? String(postPropertyDraft.totalFloors) : '');
  const [price, setPrice] = useState(postPropertyDraft.price ? String(postPropertyDraft.price) : '');
  const [title, setTitle] = useState(postPropertyDraft.title || '');
  const [description, setDescription] = useState(postPropertyDraft.description || '');
  const [images, setImages] = useState<string[]>(() => {
    if (Array.isArray(postPropertyDraft.images) && postPropertyDraft.images.length > 0) {
      return postPropertyDraft.images;
    }
    if (postPropertyDraft.imageUrl) {
      return [postPropertyDraft.imageUrl];
    }
    return [];
  });

  // MANDATORY LOGIN GATE
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthContainer}>
          <View style={styles.unauthIconWrap}>
            <Lock size={36} color="#2563eb" />
          </View>
          <Text style={styles.unauthTitle}>Login Required to Post Property</Text>
          <Text style={styles.unauthSub}>
            To protect verified buyers, prevent duplicate spam, and ensure authentic transactions, you must be signed in to list a property.
          </Text>

          <TouchableOpacity
            style={styles.unauthLoginBtn}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.unauthLoginBtnText}>Sign In / Register Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.unauthBackBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.unauthBackBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
      images,
      imageUrl: images[0] || '',
    });
  };

  // Step-by-Step Validation: Prevent user from moving forward without completing required fields
  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!listingType) {
        showToast('Please select what you want to do (Sell or Rent).', 'error');
        return false;
      }
      if (!category) {
        showToast('Please select a property category.', 'error');
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      if (!city || !city.trim()) {
        showToast('Please enter the City name.', 'error');
        return false;
      }
      if (!locality || !locality.trim()) {
        showToast('Please enter the Locality or Area name.', 'error');
        return false;
      }
      if (!address || !address.trim()) {
        showToast('Please enter the full Address or Project name.', 'error');
        return false;
      }
      if (!pincode || !pincode.trim()) {
        showToast('Please enter the Pincode.', 'error');
        return false;
      }
      if (pincode.trim().length < 5) {
        showToast('Please enter a valid 6-digit Pincode.', 'error');
        return false;
      }
      return true;
    }

    if (currentStep === 3) {
      if (!propertyType || !propertyType.trim()) {
        showToast('Please enter or select the Property Type.', 'error');
        return false;
      }
      if (!area || !area.trim() || isNaN(Number(area)) || Number(area) <= 0) {
        showToast('Please enter a valid Built-up Area (in Sq. Ft.).', 'error');
        return false;
      }
      if (category !== 'COMMERCIAL') {
        if (!bedrooms || !bedrooms.trim() || isNaN(Number(bedrooms)) || Number(bedrooms) < 0) {
          showToast('Please enter the number of Bedrooms (BHK).', 'error');
          return false;
        }
        if (!bathrooms || !bathrooms.trim() || isNaN(Number(bathrooms)) || Number(bathrooms) < 0) {
          showToast('Please enter the number of Bathrooms.', 'error');
          return false;
        }
      }
      if (floorNumber.trim() && totalFloors.trim()) {
        if (Number(floorNumber) > Number(totalFloors)) {
          showToast('Floor number cannot exceed Total Floors.', 'error');
          return false;
        }
      }
      return true;
    }

    if (currentStep === 4) {
      if (!price || !price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
        showToast(
          listingType === 'RENT'
            ? 'Please enter a valid Monthly Rent (₹).'
            : 'Please enter a valid Selling Price (₹).',
          'error'
        );
        return false;
      }
      return true;
    }

    if (currentStep === 5) {
      if (!title || !title.trim() || title.trim().length < 5) {
        showToast('Please enter a Property Title (at least 5 characters).', 'error');
        return false;
      }
      if (!description || !description.trim() || description.trim().length < 10) {
        showToast('Please enter a Property Description (at least 10 characters).', 'error');
        return false;
      }
      if (images.length === 0) {
        showToast('Please upload at least 1 property photo (maximum 4).', 'error');
        return false;
      }
      if (images.length > MAX_PHOTOS) {
        showToast(`Maximum ${MAX_PHOTOS} photos allowed.`, 'error');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      return;
    }
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

  const handlePickImage = async () => {
    if (images.length >= MAX_PHOTOS) {
      showToast(`Maximum ${MAX_PHOTOS} photos allowed. Remove a photo to add another.`, 'info');
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

      const remainingSlots = MAX_PHOTOS - images.length;
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
        setImages((prev) => [...prev, ...newlyUploadedUrls].slice(0, MAX_PHOTOS));
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

  const handleSubmit = async () => {
    // Sequentially validate every step to make sure no required field is missed
    for (let s = 1; s <= 5; s++) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        listingType,
        category,
        propertyType: propertyType.trim(),
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
        state: 'State',
        country: 'India',
        pincode: pincode.trim(),
        images: images.map((url, idx) => ({ url: url.trim(), sortOrder: idx })),
        isDraft: false, // will become PENDING_REVIEW automatically
        listedAsRole: isAgent ? 'AGENT' : 'OWNER',
      };

      const res = await mobileApi('/properties', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Synchronize updated user role if converted from BUYER to OWNER
      if (res.data?.updatedUser?.role) {
        setUser({ ...user, role: res.data.updatedUser.role });
      }

      clearDraft();
      showToast('Property submitted for review successfully!', 'success');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    } catch (err: any) {
      showToast(err.message || 'Please check your inputs.', 'error');
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
            {user.role === 'BUYER' && (
              <View style={styles.buyerUpgradeNotice}>
                <ShieldAlert size={16} color="#b45309" />
                <Text style={styles.buyerUpgradeNoticeText}>
                  Your account is currently a <Text style={{ fontWeight: '700' }}>Buyer</Text>. Listing a property will automatically upgrade your profile to <Text style={{ fontWeight: '700' }}>Property Owner</Text>.
                </Text>
              </View>
            )}

            <Text style={styles.question}>What do you want to do? *</Text>
            <Text style={styles.fieldHint}>Choose whether you are selling or renting out this property</Text>
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

            <Text style={[styles.question, { marginTop: 24 }]}>Select Category *</Text>
            <Text style={styles.fieldHint}>Choose the main classification for this property</Text>
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

            <Text style={styles.inputLabel}>City *</Text>
            <TextInput
              placeholder="e.g. Patna, Mumbai, Delhi, Bengaluru"
              placeholderTextColor="#94a3b8"
              value={city}
              onChangeText={setCity}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Locality / Area Name *</Text>
            <TextInput
              placeholder="e.g. Bailey Road, Bandra West, Connaught Place"
              placeholderTextColor="#94a3b8"
              value={locality}
              onChangeText={setLocality}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Full Address / Project Name *</Text>
            <TextInput
              placeholder="e.g. Flat 402, Tower B, Sunshine Residency, Main Road"
              placeholderTextColor="#94a3b8"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Pincode *</Text>
            <TextInput
              placeholder="e.g. 800001 or 400050"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              maxLength={6}
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

            <Text style={styles.inputLabel}>Property Type *</Text>
            <TextInput
              placeholder="e.g. Apartment, Villa, Independent House, Plot, Office"
              placeholderTextColor="#94a3b8"
              value={propertyType}
              onChangeText={setPropertyType}
              style={styles.input}
            />
            {/* Quick-select chips for convenience */}
            <View style={styles.chipWrapRow}>
              {['Apartment', 'Independent House', 'Villa', 'Builder Floor', 'Plot', 'Commercial Office'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.smallChip, propertyType.toLowerCase() === t.toLowerCase() && styles.chipActive]}
                  onPress={() => setPropertyType(t)}
                >
                  <Text style={[styles.smallChipText, propertyType.toLowerCase() === t.toLowerCase() && styles.chipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {category !== 'COMMERCIAL' && (
              <View style={styles.twoCols}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Bedrooms (BHK) *</Text>
                  <TextInput
                    placeholder="e.g. 1, 2, 3, 4"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={bedrooms}
                    onChangeText={setBedrooms}
                    style={styles.input}
                  />
                  <View style={styles.chipWrapRow}>
                    {['1', '2', '3', '4'].map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={[styles.smallChip, bedrooms === b && styles.chipActive]}
                        onPress={() => setBedrooms(b)}
                      >
                        <Text style={[styles.smallChipText, bedrooms === b && styles.chipTextActive]}>{b} BHK</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Bathrooms *</Text>
                  <TextInput
                    placeholder="e.g. 1, 2, 3"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={bathrooms}
                    onChangeText={setBathrooms}
                    style={styles.input}
                  />
                  <View style={styles.chipWrapRow}>
                    {['1', '2', '3'].map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={[styles.smallChip, bathrooms === b && styles.chipActive]}
                        onPress={() => setBathrooms(b)}
                      >
                        <Text style={[styles.smallChipText, bathrooms === b && styles.chipTextActive]}>{b} Bath</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.inputLabel}>Super Built-up Area (Sq. Ft.) *</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="e.g. 1250 (in Sq. Ft.)"
              placeholderTextColor="#94a3b8"
              value={area}
              onChangeText={setArea}
              style={styles.input}
            />

            <View style={styles.twoCols}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Property on Floor (Optional)</Text>
                <TextInput
                  placeholder="e.g. 4 (Ground Floor: 0)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={floorNumber}
                  onChangeText={setFloorNumber}
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Total Floors (Optional)</Text>
                <TextInput
                  placeholder="e.g. 10"
                  placeholderTextColor="#94a3b8"
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
              {listingType === 'RENT' ? 'Expected Monthly Rent (₹) *' : 'Total Selling Price (₹) *'}
            </Text>
            <TextInput
              placeholder={listingType === 'RENT' ? "e.g. 25000 (Monthly Rent in ₹)" : "e.g. 7500000 (Selling Price in ₹)"}
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              style={[styles.input, { fontSize: 18, fontWeight: '700' }]}
            />
            {price !== '' && !isNaN(Number(price)) && Number(price) > 0 && (
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
              placeholder="e.g. Spacious 3 BHK Apartment with Park View & Balcony"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Detailed Description *</Text>
            <TextInput
              placeholder="Mention proximity to metro, schools, furnishings, parking, and unique highlights..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            />

            <View style={styles.photoHeaderRow}>
              <Text style={styles.inputLabelNoMargin}>
                Property Photos * ({images.length}/{MAX_PHOTOS})
              </Text>
              <Text style={styles.photoLimitHint}>Max 4 photos</Text>
            </View>
            <Text style={styles.fieldHint}>
              Upload up to 4 photos from device storage. The 1st photo is your main cover thumbnail.
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
            {images.length < MAX_PHOTOS ? (
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
                        : `+ Add More Photos (${MAX_PHOTOS - images.length} remaining)`}
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
          </View>
        )}

        {/* STEP 6: Preview & Submit */}
        {step === 6 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Review & Submit for Review</Text>
            <View style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryRoleTag,
                  isAgent
                    ? { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }
                    : { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
                ]}
              >
                <Text
                  style={[
                    styles.summaryRoleTagText,
                    isAgent ? { color: '#2563eb' } : { color: '#059669' },
                  ]}
                >
                  {isAgent ? 'LISTED BY AGENT' : user?.role === 'BUILDER' ? 'LISTED BY BUILDER' : 'LISTED BY OWNER'}
                </Text>
              </View>
              <Text style={styles.summaryTitle}>{title || 'Untitled Property'}</Text>
              <Text style={styles.summaryPrice}>{price ? formatPriceINR(Number(price || 0)) : '₹ 0'}</Text>
              <Text style={styles.summaryLoc}>
                {[locality, city].filter(Boolean).join(', ') || 'Location not specified'}
              </Text>

              {/* Photos preview strip in Step 6 */}
              {images.length > 0 && (
                <View style={{ marginTop: 12, marginBottom: 8 }}>
                  <Text style={styles.summaryPhotosLabel}>Uploaded Photos ({images.length}):</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewThumbStrip}>
                    {images.map((imgUri, idx) => (
                      <View key={idx} style={styles.previewThumbCard}>
                        <Image source={{ uri: resolveImageUrl(imgUri) }} style={styles.previewThumbImg} resizeMode="cover" />
                        {idx === 0 && (
                          <View style={styles.previewCoverTag}>
                            <Text style={styles.previewCoverTagText}>Cover</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.summarySpecs}>
                {[
                  category,
                  propertyType,
                  bedrooms ? `${bedrooms} BHK` : null,
                  area ? `${area} Sq Ft` : null,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
              <View style={styles.reviewAlert}>
                <Text style={styles.reviewAlertText}>
                  🛡️ Admin Review Rule: Newly posted properties enter "PENDING_REVIEW" and become LIVE once verified by Super Admin.
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
  unauthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  unauthIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  unauthTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 10,
  },
  unauthSub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  unauthLoginBtn: {
    width: '100%',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  unauthLoginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  unauthBackBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  unauthBackBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
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
  roleSubtext: { fontSize: 11, color: '#64748b', marginTop: 3 },
  buyerUpgradeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  buyerUpgradeNoticeText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
    lineHeight: 16,
  },
  fieldHint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    marginTop: -8,
  },
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
  chipWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  smallChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  smallChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
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
  summaryRoleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  summaryRoleTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    marginTop: 14,
    marginBottom: 6,
  },
  inputLabelNoMargin: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  photoLimitHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
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
  summaryPhotosLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  previewThumbStrip: {
    flexDirection: 'row',
  },
  previewThumbCard: {
    width: 65,
    height: 65,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewThumbImg: {
    width: '100%',
    height: '100%',
  },
  previewCoverTag: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: '#2563eb',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  previewCoverTagText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
  },
});
