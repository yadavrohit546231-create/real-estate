import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Heart,
  Share2,
  Phone,
  MessageCircle,
  Calendar,
  Send,
  MapPin,
  CheckCircle,
  Sparkles,
  Layers,
  Compass,
  X,
} from 'lucide-react-native';
import { mobileApi, resolveImageUrl } from '../../services/api';
import { useStore } from '../../store/useStore';
import { formatPriceINR, buildWhatsAppLink } from '@real-estate/shared';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, favorites, toggleFavorite } = useStore();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  // Enquiry Modal state
  const [enquiryModalVisible, setEnquiryModalVisible] = useState(false);
  const [enquiryName, setEnquiryName] = useState(user?.name || '');
  const [enquiryPhone, setEnquiryPhone] = useState(user?.phone || '');
  const [enquiryEmail, setEnquiryEmail] = useState(user?.email || '');
  const [enquiryMessage, setEnquiryMessage] = useState('I am interested in this property. Please contact me.');
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);

  // Site Visit Modal state
  const [visitModalVisible, setVisitModalVisible] = useState(false);
  const [visitDate, setVisitDate] = useState('2026-09-12');
  const [visitTimeSlot, setVisitTimeSlot] = useState('11:00 AM - 01:00 PM');
  const [visitNotes, setVisitNotes] = useState('');
  const [submittingVisit, setSubmittingVisit] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const res = await mobileApi(`/properties/${id}`);
        setProperty(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProperty();
  }, [id]);

  const handleShare = async () => {
    if (!property) return;
    try {
      await Share.share({
        message: `Check out this property on EstatePlatform: ${property.title} in ${property.locality}, ${property.city}. Price: ${formatPriceINR(property.price)}`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleCall = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please sign in to contact the property lister directly.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    const phone = property.listedBy?.phone || property.owner?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please sign in to message the property lister on WhatsApp.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    const phone = property.listedBy?.phone || property.owner?.phone;
    if (phone) {
      const url = buildWhatsAppLink(phone, property.title, property.id);
      Linking.openURL(url);
    }
  };

  const handleOpenEnquiryModal = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please sign in to send an enquiry for this property.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    setEnquiryModalVisible(true);
  };

  const handleOpenVisitModal = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please sign in to schedule a site visit.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    setVisitModalVisible(true);
  };

  const handleSendEnquiry = async () => {
    if (!user) {
      alert('Please log in to submit an enquiry.');
      router.push('/(auth)/login');
      return;
    }

    try {
      setSubmittingEnquiry(true);
      await mobileApi(`/leads/property/${property.id}`, {
        method: 'POST',
        body: JSON.stringify({
          name: enquiryName,
          phone: enquiryPhone,
          email: enquiryEmail,
          message: enquiryMessage,
        }),
      });
      alert('Thank you! Your enquiry has been sent directly to the property owner.');
      setEnquiryModalVisible(false);
    } catch (err: any) {
      alert(err.message || 'Failed to submit enquiry');
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const handleScheduleVisit = async () => {
    if (!user) {
      alert('Please log in to schedule a site visit.');
      router.push('/(auth)/login');
      return;
    }

    try {
      setSubmittingVisit(true);
      await mobileApi(`/site-visits/property/${property.id}`, {
        method: 'POST',
        body: JSON.stringify({
          visitDate,
          timeSlot: visitTimeSlot,
          notes: visitNotes,
        }),
      });
      alert('Site visit request scheduled! You will receive an alert once confirmed.');
      setVisitModalVisible(false);
    } catch (err: any) {
      alert(err.message || 'Failed to schedule site visit');
    } finally {
      setSubmittingVisit(false);
    }
  };

  if (loading || !property) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const isFavorite = favorites.includes(property.id);
  const images = property.images && property.images.length > 0
    ? property.images
    : [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80' }];

  return (
    <View style={styles.screenContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Photo Carousel */}
        <View style={styles.galleryContainer}>
          <Image source={{ uri: resolveImageUrl(images[activePhoto]?.url) }} style={styles.mainImage} />

          {/* Badges */}
          <View style={styles.topBadgesRow}>
            {property.isFeatured && (
              <View style={styles.featuredBadge}>
                <Sparkles size={12} color="#ffffff" />
                <Text style={styles.badgeText}>FEATURED</Text>
              </View>
            )}
            {property.isVerified && (
              <View style={styles.verifiedBadge}>
                <CheckCircle size={12} color="#10b981" />
                <Text style={styles.verifiedText}>Verified Listing</Text>
              </View>
            )}
          </View>

          {/* Floating Actions */}
          <View style={styles.floatingActions}>
            <TouchableOpacity style={styles.actionIconBtn} onPress={() => toggleFavorite(property.id)}>
              <Heart size={20} color={isFavorite ? '#ef4444' : '#0f172a'} fill={isFavorite ? '#ef4444' : 'none'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIconBtn} onPress={handleShare}>
              <Share2 size={20} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {/* Photo Counter */}
          <View style={styles.counter}>
            <Text style={styles.counterText}>{activePhoto + 1}/{images.length}</Text>
          </View>
        </View>

        {/* Thumbnail Selector */}
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbStrip}>
            {images.map((img: any, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setActivePhoto(idx)}
                style={[styles.thumbBox, activePhoto === idx && styles.thumbActive]}
              >
                <Image source={{ uri: resolveImageUrl(img.url) }} style={styles.thumbImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Core Specs */}
        <View style={styles.body}>
          {/* Price & Title */}
          <Text style={styles.price}>{formatPriceINR(property.price)}</Text>
          <Text style={styles.title}>{property.title}</Text>

          {/* Location */}
          <View style={styles.locationWrap}>
            <MapPin size={16} color="#64748b" />
            <Text style={styles.locationText}>
              {property.address ? `${property.address}, ` : ''}{property.locality}, {property.city} - {property.pincode}
            </Text>
          </View>

          {/* Key Facts Grid */}
          <View style={styles.factsGrid}>
            <View style={styles.factBox}>
              <Text style={styles.factLabel}>Configuration</Text>
              <Text style={styles.factValue}>{property.bedrooms ? `${property.bedrooms} BHK` : property.propertyType}</Text>
            </View>
            <View style={styles.factBox}>
              <Text style={styles.factLabel}>Super Built-up Area</Text>
              <Text style={styles.factValue}>{property.area} {property.areaUnit}</Text>
            </View>
            <View style={styles.factBox}>
              <Text style={styles.factLabel}>Floor Details</Text>
              <Text style={styles.factValue}>Floor {property.floorNumber || 'G'} of {property.totalFloors || 1}</Text>
            </View>
            <View style={styles.factBox}>
              <Text style={styles.factLabel}>Furnishing</Text>
              <Text style={styles.factValue}>{property.furnishing ? property.furnishing.replace('_', ' ') : 'Unspecified'}</Text>
            </View>
          </View>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities & Features</Text>
              <View style={styles.amenitiesWrap}>
                {property.amenities.map((item: any) => (
                  <View key={item.amenity?.id || item.id} style={styles.amenityChip}>
                    <CheckCircle size={14} color="#2563eb" />
                    <Text style={styles.amenityName}>{item.amenity?.name || item.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Description</Text>
            <Text style={styles.descriptionText}>{property.description}</Text>
          </View>

          {/* Owner / Agent Card */}
          <View style={styles.ownerCard}>
            <View style={styles.ownerHeaderRow}>
              <View
                style={[
                  styles.listerBadge,
                  property.listedBy?.role === 'AGENT' || property.owner?.role === 'AGENT'
                    ? styles.agentBadge
                    : styles.ownerBadge,
                ]}
              >
                <Text style={styles.listerBadgeText}>
                  {property.listedBy?.role === 'AGENT' || property.owner?.role === 'AGENT'
                    ? 'LISTED BY AGENT'
                    : 'LISTED BY OWNER'}
                </Text>
              </View>
              <Text style={styles.ownerName}>
                {property.listedBy?.name || property.owner?.name || 'Property Owner'}
              </Text>
              {property.listedBy?.agencyName && (
                <Text style={styles.agencyText}>Agency: {property.listedBy.agencyName}</Text>
              )}
            </View>

            {/* Lister Contact Phone: Visible to all users (including logged-out guests) */}
            <View style={styles.contactVerifiedBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.ownerContactLabel}>Contact Phone Number:</Text>
                <View style={styles.verifiedPill}>
                  <Text style={styles.verifiedPillText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.ownerContactValue}>
                {property.listedBy?.phone || property.owner?.phone || 'Available'}
              </Text>
              {!user && (
                <View style={styles.guestInquiryNotice}>
                  <Text style={styles.guestInquiryNoticeText}>
                    💡 Login is required to initiate direct Call, WhatsApp, or submit an Enquiry.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleCall}>
          <Phone size={18} color="#0f172a" />
          <Text style={styles.secondaryActionText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
          <MessageCircle size={18} color="#16a34a" />
          <Text style={styles.whatsappText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={handleOpenEnquiryModal}
        >
          <Send size={16} color="#ffffff" />
          <Text style={styles.primaryActionText}>Enquire Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.visitBtn}
          onPress={handleOpenVisitModal}
        >
          <Calendar size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Enquiry Modal */}
      <Modal visible={enquiryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Enquiry to Owner</Text>
              <TouchableOpacity onPress={() => setEnquiryModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Your Full Name"
              value={enquiryName}
              onChangeText={setEnquiryName}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={enquiryPhone}
              onChangeText={setEnquiryPhone}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Email Address"
              keyboardType="email-address"
              value={enquiryEmail}
              onChangeText={setEnquiryEmail}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Message"
              multiline
              numberOfLines={3}
              value={enquiryMessage}
              onChangeText={setEnquiryMessage}
              style={[styles.modalInput, { height: 70 }]}
            />
            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSendEnquiry}
              disabled={submittingEnquiry}
            >
              <Text style={styles.modalSubmitText}>
                {submittingEnquiry ? 'Sending...' : 'Confirm Enquiry'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Site Visit Modal */}
      <Modal visible={visitModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Physical Site Visit</Text>
              <TouchableOpacity onPress={() => setVisitModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Visit Date (YYYY-MM-DD)</Text>
            <TextInput
              placeholder="2026-09-12"
              value={visitDate}
              onChangeText={setVisitDate}
              style={styles.modalInput}
            />
            <Text style={styles.fieldLabel}>Preferred Time Slot</Text>
            <TextInput
              placeholder="11:00 AM - 01:00 PM"
              value={visitTimeSlot}
              onChangeText={setVisitTimeSlot}
              style={styles.modalInput}
            />
            <Text style={styles.fieldLabel}>Notes / Instructions</Text>
            <TextInput
              placeholder="e.g., Please meet at main security gate..."
              value={visitNotes}
              onChangeText={setVisitNotes}
              style={styles.modalInput}
            />
            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleScheduleVisit}
              disabled={submittingVisit}
            >
              <Text style={styles.modalSubmitText}>
                {submittingVisit ? 'Scheduling...' : 'Request Site Visit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#ffffff' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  galleryContainer: { width: '100%', height: 260, position: 'relative' },
  mainImage: { width: '100%', height: '100%', backgroundColor: '#f1f5f9' },
  topBadgesRow: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 },
  featuredBadge: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  verifiedBadge: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: { color: '#0f172a', fontSize: 10, fontWeight: '700' },
  floatingActions: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8 },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  counter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  counterText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  thumbStrip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f8fafc' },
  thumbBox: { width: 60, height: 45, borderRadius: 8, overflow: 'hidden', marginRight: 8, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: '#2563eb' },
  thumbImage: { width: '100%', height: '100%' },
  body: { padding: 16 },
  price: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 8, lineHeight: 22 },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  locationText: { fontSize: 13, color: '#64748b', flex: 1 },
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  factBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  factLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  factValue: { fontSize: 13, color: '#0f172a', fontWeight: '700', marginTop: 2 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  amenityName: { fontSize: 12, fontWeight: '600', color: '#1e40af' },
  descriptionText: { fontSize: 13, color: '#475569', lineHeight: 20 },
  ownerCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 20,
  },
  ownerHeaderRow: {
    marginBottom: 10,
  },
  listerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  ownerBadge: {
    backgroundColor: '#059669',
  },
  agentBadge: {
    backgroundColor: '#2563eb',
  },
  listerBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ownerName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  agencyText: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
  contactVerifiedBox: {
    marginTop: 10,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ownerContactLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  ownerContactValue: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  verifiedPill: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  verifiedPillText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  guestInquiryNotice: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  guestInquiryNoticeText: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  secondaryActionText: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  whatsappText: { fontSize: 12, fontWeight: '700', color: '#15803d' },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  primaryActionText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  visitBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 12,
  },
  modalSubmitBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSubmitText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
