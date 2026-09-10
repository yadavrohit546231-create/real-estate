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
  Sparkles,
  Plus,
  MapPin,
  Layers,
  Tag,
} from 'lucide-react-native';
import { useStore } from '../../store/useStore';
import { mobileApi, mobileUploadImage, resolveImageUrl } from '../../services/api';
import { showToast } from '../../services/toast';
import { formatPriceINR } from '@real-estate/shared';
import { AmenityIcon } from '../../components/AmenityIcon';

const MAX_PHOTOS = 4;

const STAGES = [
  { id: 1, name: 'Intent', title: 'Basic Property Intent', subtitle: 'Choose whether you are selling or renting out, and pick the category.', icon: Layers },
  { id: 2, name: 'Location', title: 'Location & Address', subtitle: 'Pinpoint the exact location, city, full address, and pincode.', icon: MapPin },
  { id: 3, name: 'Specs', title: 'Configuration & Specs', subtitle: 'Define property type, area, bedrooms, bathrooms, and floor details.', icon: Building2 },
  { id: 4, name: 'Amenities', title: 'Amenities & Features', subtitle: 'Add the available amenities and lifestyle highlights of your property.', icon: Sparkles },
  { id: 5, name: 'Pricing', title: 'Pricing & Terms', subtitle: 'Set your expected selling price or monthly rental amount.', icon: Tag },
  { id: 6, name: 'Media', title: 'Photos & Description', subtitle: 'Upload up to 4 high quality photos and write an engaging description.', icon: UploadCloud },
  { id: 7, name: 'Review', title: 'Review & Submit', subtitle: 'Review all details and request Featured Spotlight before submitting for review.', icon: CheckCircle },
];

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

export default function PostPropertyScreen() {
  const router = useRouter();
  const { user, setUser, postPropertyDraft, updateDraft, clearDraft, selectedCity } = useStore();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollViewRef = React.useRef<ScrollView>(null);

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

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
  const [amenities, setAmenities] = useState<string[]>(() => {
    if (Array.isArray(postPropertyDraft.amenities) && postPropertyDraft.amenities.length > 0) {
      return postPropertyDraft.amenities;
    }
    return [];
  });
  const [amenityInput, setAmenityInput] = useState('');
  const [images, setImages] = useState<string[]>(() => {
    if (Array.isArray(postPropertyDraft.images) && postPropertyDraft.images.length > 0) {
      return postPropertyDraft.images;
    }
    if (postPropertyDraft.imageUrl) {
      return [postPropertyDraft.imageUrl];
    }
    return [];
  });
  const [featuredRequested, setFeaturedRequested] = useState<boolean>(
    Boolean(postPropertyDraft.featuredRequested) || false
  );

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

  // DIRECT LOGIN REDIRECT
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user]);

  if (!user) {
    return null;
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
      amenities,
      featuredRequested,
    });
  };

  // Step-by-Step Validation: Sets error messages and highlights fields in RED without toasts
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!listingType) {
        newErrors.listingType = 'Please choose whether to Sell or Rent.';
      }
      if (!category) {
        newErrors.category = 'Please select a property category.';
      }
    }

    if (currentStep === 2) {
      if (!city || !city.trim()) {
        newErrors.city = 'City name is required.';
      }
      if (!locality || !locality.trim()) {
        newErrors.locality = 'Locality or Area name is required.';
      }
      if (!address || !address.trim()) {
        newErrors.address = 'Full address or project name is required.';
      }
      if (!pincode || !pincode.trim()) {
        newErrors.pincode = 'Pincode is required.';
      } else if (pincode.trim().length < 5) {
        newErrors.pincode = 'Please enter a valid 5 or 6 digit pincode.';
      }
    }

    if (currentStep === 3) {
      if (!propertyType || !propertyType.trim()) {
        newErrors.propertyType = 'Property type is required.';
      }
      if (!area || !area.trim() || isNaN(Number(area)) || Number(area) <= 0) {
        newErrors.area = 'Please enter a valid built-up area (in Sq. Ft.).';
      }
      if (category !== 'COMMERCIAL') {
        if (!bedrooms || !bedrooms.trim() || isNaN(Number(bedrooms)) || Number(bedrooms) < 0) {
          newErrors.bedrooms = 'Number of bedrooms (BHK) is required.';
        }
        if (!bathrooms || !bathrooms.trim() || isNaN(Number(bathrooms)) || Number(bathrooms) < 0) {
          newErrors.bathrooms = 'Number of bathrooms is required.';
        }
      }
      if (floorNumber.trim() && totalFloors.trim()) {
        if (Number(floorNumber) > Number(totalFloors)) {
          newErrors.floorNumber = 'Floor number cannot exceed Total Floors.';
        }
      }
    }

    if (currentStep === 5) {
      if (!price || !price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
        newErrors.price =
          listingType === 'RENT'
            ? 'Please enter a valid monthly rent amount (₹).'
            : 'Please enter a valid selling price (₹).';
      }
    }

    if (currentStep === 6) {
      if (!title || !title.trim() || title.trim().length < 5) {
        newErrors.title = 'Title must be at least 5 characters long.';
      }
      if (!description || !description.trim() || description.trim().length < 10) {
        newErrors.description = 'Description must be at least 10 characters long.';
      }
      if (images.length === 0) {
        newErrors.images = 'Please upload at least 1 photo of the property.';
      } else if (images.length > MAX_PHOTOS) {
        newErrors.images = `Maximum ${MAX_PHOTOS} photos allowed.`;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      return;
    }
    saveCurrentDraft();
    if (step < 7) {
      setStep(step + 1);
      setErrors({});
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleBack = () => {
    saveCurrentDraft();
    setErrors({});
    if (step > 1) {
      setStep(step - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
        clearError('images');
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
    for (let s = 1; s <= 6; s++) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }

    try {
      setSubmitting(true);
      const parsedPrice = Number(price);
      const parsedArea = Number(area);
      const parsedBedrooms = bedrooms.trim() && !isNaN(Number(bedrooms)) ? Number(bedrooms) : undefined;
      const parsedBathrooms = bathrooms.trim() && !isNaN(Number(bathrooms)) ? Number(bathrooms) : undefined;
      const parsedFloor = floorNumber.trim() && !isNaN(Number(floorNumber)) ? Number(floorNumber) : undefined;
      const parsedTotalFloors = totalFloors.trim() && !isNaN(Number(totalFloors)) ? Number(totalFloors) : undefined;

      // Safe state derivation or fallback
      const derivedState = (() => {
        const c = (city || '').toLowerCase();
        if (['mumbai', 'pune', 'nagpur', 'thane', 'nashik'].some((s) => c.includes(s))) return 'Maharashtra';
        if (['delhi', 'noida', 'gurugram', 'gurgaon', 'ghaziabad', 'faridabad'].some((s) => c.includes(s))) return 'Delhi NCR';
        if (['bengaluru', 'bangalore', 'mysore'].some((s) => c.includes(s))) return 'Karnataka';
        if (['kolkata', 'howrah'].some((s) => c.includes(s))) return 'West Bengal';
        if (['chennai', 'coimbatore'].some((s) => c.includes(s))) return 'Tamil Nadu';
        if (['hyderabad'].some((s) => c.includes(s))) return 'Telangana';
        if (['jaipur', 'udaipur', 'jodhpur'].some((s) => c.includes(s))) return 'Rajasthan';
        if (['lucknow', 'kanpur', 'varanasi', 'agra'].some((s) => c.includes(s))) return 'Uttar Pradesh';
        if (['ahmedabad', 'surat', 'vadodara'].some((s) => c.includes(s))) return 'Gujarat';
        return 'Bihar';
      })();

      const payload = {
        title: title.trim(),
        description: description.trim(),
        listingType,
        category,
        propertyType: propertyType.trim(),
        price: parsedPrice,
        rentAmount: listingType === 'RENT' ? parsedPrice : undefined,
        area: parsedArea,
        areaUnit: 'SQ_FT',
        bedrooms: parsedBedrooms,
        bathrooms: parsedBathrooms,
        floorNumber: parsedFloor,
        totalFloors: parsedTotalFloors,
        address: address.trim(),
        locality: locality.trim(),
        city: city.trim(),
        state: derivedState,
        country: 'India',
        pincode: pincode.trim(),
        amenities,
        images: images.filter(Boolean).map((url, idx) => ({ url: url.trim(), sortOrder: idx })),
        featuredRequested,
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
      // Map any backend validation errors directly to form input fields with red borders!
      const backendErrors: string[] = Array.isArray(err.errors) ? err.errors : [];
      const newErrors: Record<string, string> = {};
      let targetStep = 1;

      if (backendErrors.length > 0) {
        backendErrors.forEach((e: string) => {
          const [fieldPath, ...msgParts] = e.split(': ');
          const msg = msgParts.join(': ') || e;
          const cleanField = fieldPath.split('.')[0];

          if (['title', 'description', 'images'].includes(cleanField)) {
            newErrors[cleanField] = msg;
            targetStep = 6;
          } else if (['price', 'rentAmount'].includes(cleanField)) {
            newErrors.price = msg;
            targetStep = 5;
          } else if (['propertyType', 'bedrooms', 'bathrooms', 'area', 'floorNumber', 'totalFloors'].includes(cleanField)) {
            newErrors[cleanField] = msg;
            targetStep = 3;
          } else if (['city', 'locality', 'address', 'pincode', 'state'].includes(cleanField)) {
            newErrors[cleanField] = msg;
            targetStep = 2;
          } else if (['listingType', 'category'].includes(cleanField)) {
            newErrors[cleanField] = msg;
            targetStep = 1;
          }
        });
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setStep(targetStep);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        // No error toast - red border on inputs instead!
      } else {
        // Fallback for non-field errors (e.g. auth or network)
        showToast(err.message || 'Submission failed. Please check your inputs.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={styles.topBarTitle}>Post Property</Text>
          <Text style={styles.topBarSubtitle}>Step {step} of 7 • {STAGES[step - 1]?.name}</Text>
        </View>
        <TouchableOpacity onPress={saveCurrentDraft} style={styles.saveBtn} activeOpacity={0.7}>
          <Save size={18} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Interactive Horizontal Stages Stepper */}
      <View style={styles.stepperContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepperScroll}
        >
          {STAGES.map((s) => {
            const isCurrent = step === s.id;
            const isCompleted = step > s.id;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => {
                  if (isCompleted) {
                    setStep(s.id);
                    setErrors({});
                  }
                }}
                disabled={!isCompleted && !isCurrent}
                activeOpacity={0.75}
                style={[
                  styles.stepPill,
                  isCurrent && styles.stepPillActive,
                  isCompleted && styles.stepPillCompleted,
                ]}
              >
                <View
                  style={[
                    styles.stepPillBadge,
                    isCurrent && styles.stepPillBadgeActive,
                    isCompleted && styles.stepPillBadgeCompleted,
                  ]}
                >
                  {isCompleted ? (
                    <Check size={10} color="#ffffff" strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.stepPillBadgeText,
                        isCurrent && styles.stepPillBadgeTextActive,
                      ]}
                    >
                      {s.id}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepPillName,
                    isCurrent && styles.stepPillNameActive,
                    isCompleted && styles.stepPillNameCompleted,
                  ]}
                >
                  {s.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Stage Context Banner Card */}
      <View style={styles.stageContextCard}>
        <View style={styles.stageContextTop}>
          <View style={styles.stageContextBadgeWrap}>
            <Text style={styles.stageContextBadge}>STAGE {step} OF 7</Text>
          </View>
          <Text style={styles.stageProgressPercent}>{Math.round((step / 7) * 100)}% Completed</Text>
        </View>
        <Text style={styles.stageContextTitle}>{STAGES[step - 1]?.title}</Text>
        <Text style={styles.stageContextSubtitle}>{STAGES[step - 1]?.subtitle}</Text>
        <View style={styles.stageContextProgressTrack}>
          <View
            style={[
              styles.stageContextProgressFill,
              { width: `${(step / 7) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
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
            <View style={[styles.optionsRow, errors.listingType && styles.optionGroupError]}>
              {[
                { id: 'SALE', label: 'Sell Property' },
                { id: 'RENT', label: 'Rent Out Property' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.bigCard, listingType === item.id && styles.bigCardActive]}
                  onPress={() => {
                    setListingType(item.id);
                    clearError('listingType');
                  }}
                >
                  <Text style={[styles.bigCardText, listingType === item.id && styles.bigCardTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.listingType && (
              <Text style={styles.fieldErrorText}>⚠️ {errors.listingType}</Text>
            )}

            <Text style={[styles.question, { marginTop: 24 }]}>Select Category *</Text>
            <Text style={styles.fieldHint}>Choose the main classification for this property</Text>
            <View style={[styles.optionsRow, errors.category && styles.optionGroupError]}>
              {[
                { id: 'RESIDENTIAL', label: 'Residential' },
                { id: 'COMMERCIAL', label: 'Commercial' },
                { id: 'PG', label: 'PG / Hostel' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.chip, category === item.id && styles.chipActive]}
                  onPress={() => {
                    setCategory(item.id);
                    clearError('category');
                  }}
                >
                  <Text style={[styles.chipText, category === item.id && styles.chipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category && (
              <Text style={styles.fieldErrorText}>⚠️ {errors.category}</Text>
            )}
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
              onChangeText={(val) => {
                setCity(val);
                clearError('city');
              }}
              style={[styles.input, errors.city && styles.inputError]}
            />
            {errors.city && <Text style={styles.fieldErrorText}>⚠️ {errors.city}</Text>}

            <Text style={styles.inputLabel}>Locality / Area Name *</Text>
            <TextInput
              placeholder="e.g. Bailey Road, Bandra West, Connaught Place"
              placeholderTextColor="#94a3b8"
              value={locality}
              onChangeText={(val) => {
                setLocality(val);
                clearError('locality');
              }}
              style={[styles.input, errors.locality && styles.inputError]}
            />
            {errors.locality && <Text style={styles.fieldErrorText}>⚠️ {errors.locality}</Text>}

            <Text style={styles.inputLabel}>Full Address / Project Name *</Text>
            <TextInput
              placeholder="e.g. Flat 402, Tower B, Sunshine Residency, Main Road"
              placeholderTextColor="#94a3b8"
              value={address}
              onChangeText={(val) => {
                setAddress(val);
                clearError('address');
              }}
              style={[styles.input, errors.address && styles.inputError]}
            />
            {errors.address && <Text style={styles.fieldErrorText}>⚠️ {errors.address}</Text>}

            <Text style={styles.inputLabel}>Pincode *</Text>
            <TextInput
              placeholder="e.g. 800001 or 400050"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              maxLength={6}
              value={pincode}
              onChangeText={(val) => {
                setPincode(val);
                clearError('pincode');
              }}
              style={[styles.input, errors.pincode && styles.inputError]}
            />
            {errors.pincode && <Text style={styles.fieldErrorText}>⚠️ {errors.pincode}</Text>}
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
              onChangeText={(val) => {
                setPropertyType(val);
                clearError('propertyType');
              }}
              style={[styles.input, errors.propertyType && styles.inputError]}
            />
            {errors.propertyType && <Text style={styles.fieldErrorText}>⚠️ {errors.propertyType}</Text>}

            {/* Quick-select chips for convenience */}
            <View style={styles.chipWrapRow}>
              {['Apartment', 'Independent House', 'Villa', 'Builder Floor', 'Plot', 'Commercial Office'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.smallChip, propertyType.toLowerCase() === t.toLowerCase() && styles.chipActive]}
                  onPress={() => {
                    setPropertyType(t);
                    clearError('propertyType');
                  }}
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
                    onChangeText={(val) => {
                      setBedrooms(val);
                      clearError('bedrooms');
                    }}
                    style={[styles.input, errors.bedrooms && styles.inputError]}
                  />
                  {errors.bedrooms && <Text style={styles.fieldErrorText}>⚠️ {errors.bedrooms}</Text>}
                  <View style={styles.chipWrapRow}>
                    {['1', '2', '3', '4'].map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={[styles.smallChip, bedrooms === b && styles.chipActive]}
                        onPress={() => {
                          setBedrooms(b);
                          clearError('bedrooms');
                        }}
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
                    onChangeText={(val) => {
                      setBathrooms(val);
                      clearError('bathrooms');
                    }}
                    style={[styles.input, errors.bathrooms && styles.inputError]}
                  />
                  {errors.bathrooms && <Text style={styles.fieldErrorText}>⚠️ {errors.bathrooms}</Text>}
                  <View style={styles.chipWrapRow}>
                    {['1', '2', '3'].map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={[styles.smallChip, bathrooms === b && styles.chipActive]}
                        onPress={() => {
                          setBathrooms(b);
                          clearError('bathrooms');
                        }}
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
              onChangeText={(val) => {
                setArea(val);
                clearError('area');
              }}
              style={[styles.input, errors.area && styles.inputError]}
            />
            {errors.area && <Text style={styles.fieldErrorText}>⚠️ {errors.area}</Text>}

            <View style={styles.twoCols}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Property on Floor (Optional)</Text>
                <TextInput
                  placeholder="e.g. 4 (Ground Floor: 0)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={floorNumber}
                  onChangeText={(val) => {
                    setFloorNumber(val);
                    clearError('floorNumber');
                  }}
                  style={[styles.input, errors.floorNumber && styles.inputError]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Total Floors (Optional)</Text>
                <TextInput
                  placeholder="e.g. 10"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={totalFloors}
                  onChangeText={(val) => {
                    setTotalFloors(val);
                    clearError('floorNumber');
                  }}
                  style={styles.input}
                />
              </View>
            </View>
            {errors.floorNumber && <Text style={styles.fieldErrorText}>⚠️ {errors.floorNumber}</Text>}
          </View>
        )}

        {/* STEP 4: Amenities & Features */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <View style={styles.amenitiesHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.question}>Amenities & Features</Text>
                <Text style={styles.fieldHint}>
                  Add the amenities, facilities, and lifestyle features available at your property manually.
                </Text>
              </View>
            </View>

            {/* Manual Amenity Input Box */}
            <Text style={styles.inputLabel}>Add Amenity or Feature</Text>
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

            {/* Added Amenities Status Bar */}
            <View style={styles.amenitiesStatusBar}>
              <View style={styles.selectedCountPill}>
                <Sparkles size={14} color="#2563eb" />
                <Text style={styles.selectedCountPillText}>
                  {amenities.length} Added
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
          </View>
        )}

        {/* STEP 5: Price */}
        {step === 5 && (
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
              onChangeText={(val) => {
                setPrice(val);
                clearError('price');
              }}
              style={[
                styles.input,
                { fontSize: 18, fontWeight: '700' },
                errors.price && styles.inputError,
              ]}
            />
            {errors.price && <Text style={styles.fieldErrorText}>⚠️ {errors.price}</Text>}
            {price !== '' && !isNaN(Number(price)) && Number(price) > 0 && (
              <Text style={styles.priceHelper}>
                Estimated: {formatPriceINR(Number(price))}
              </Text>
            )}
          </View>
        )}

        {/* STEP 6: Photos & Narrative */}
        {step === 6 && (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Title & Description</Text>

            <Text style={styles.inputLabel}>Property Title *</Text>
            <TextInput
              placeholder="e.g. Spacious 3 BHK Apartment with Park View & Balcony"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={(val) => {
                setTitle(val);
                clearError('title');
              }}
              style={[styles.input, errors.title && styles.inputError]}
            />
            {errors.title && <Text style={styles.fieldErrorText}>⚠️ {errors.title}</Text>}

            <Text style={styles.inputLabel}>Detailed Description *</Text>
            <TextInput
              placeholder="Mention proximity to metro, schools, furnishings, parking, and unique highlights..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={(val) => {
                setDescription(val);
                clearError('description');
              }}
              style={[
                styles.input,
                { height: 100, textAlignVertical: 'top' },
                errors.description && styles.inputError,
              ]}
            />
            {errors.description && <Text style={styles.fieldErrorText}>⚠️ {errors.description}</Text>}

            <View style={styles.photoHeaderRow}>
              <Text style={styles.inputLabelNoMargin}>
                Property Photos * ({images.length}/{MAX_PHOTOS})
              </Text>
              <Text style={styles.photoLimitHint}>Max 4 photos</Text>
            </View>
            <Text style={styles.fieldHint}>
              Upload up to 4 photos from device storage. The 1st photo is your main cover thumbnail.
            </Text>
            {errors.images && <Text style={styles.fieldErrorText}>⚠️ {errors.images}</Text>}

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
                style={[
                  styles.deviceUploadCard,
                  images.length > 0 && styles.deviceUploadCardCompact,
                  errors.images && styles.inputError,
                ]}
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

        {/* STEP 7: Preview & Submit */}
        {step === 7 && (
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

              {/* Photos preview strip in Step 7 */}
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

              {/* Amenities in Step 7 Summary */}
              <View style={styles.summaryAmenitiesSection}>
                <Text style={styles.summaryAmenitiesHeader}>
                  Amenities & Features ({amenities.length})
                </Text>
                {amenities.length > 0 ? (
                  <View style={styles.summaryAmenitiesWrap}>
                    {amenities.map((item, idx) => (
                      <View key={idx} style={styles.summaryAmenityChip}>
                        <CheckCircle size={12} color="#2563eb" />
                        <Text style={styles.summaryAmenityChipText}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.summaryAmenityEmpty}>No amenities added</Text>
                )}
              </View>

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
        {step < 7 ? (
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
  amenitiesHeaderRow: {
    marginBottom: 4,
  },
  amenitiesStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedCountPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  amenitiesQuickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quickActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  amenitiesLoading: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  amenitiesLoadingText: {
    fontSize: 13,
    color: '#64748b',
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
    paddingVertical: 11,
    fontSize: 14,
    color: '#0f172a',
  },
  addAmenityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginBottom: 16,
    lineHeight: 16,
  },
  addedAmenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
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
    marginBottom: 20,
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
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
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
  summaryAmenitiesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  summaryAmenitiesHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryAmenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryAmenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  summaryAmenityChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e40af',
  },
  summaryAmenityEmpty: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
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
    marginTop: 14,
    marginBottom: 8,
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
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  topBarSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  stepperContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
  },
  stepperScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepPillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepPillCompleted: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  stepPillBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  stepPillBadgeActive: {
    backgroundColor: '#2563eb',
  },
  stepPillBadgeCompleted: {
    backgroundColor: '#059669',
  },
  stepPillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  stepPillBadgeTextActive: {
    color: '#ffffff',
  },
  stepPillName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  stepPillNameActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  stepPillNameCompleted: {
    color: '#047857',
  },
  stageContextCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stageContextTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stageContextBadgeWrap: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  stageContextBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 0.8,
  },
  stageProgressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  stageContextTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  stageContextSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 16,
  },
  stageContextProgressTrack: {
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  stageContextProgressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 1.5,
    backgroundColor: '#fef2f2',
  },
  fieldErrorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
  },
  optionGroupError: {
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 14,
    padding: 6,
    backgroundColor: '#fef2f2',
  },
});
