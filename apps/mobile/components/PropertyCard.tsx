import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, CheckCircle, Sparkles, MapPin } from 'lucide-react-native';
import { formatPriceINR } from '@real-estate/shared';
import { useStore } from '../store/useStore';
import { resolveImageUrl } from '../services/api';
import { showToast } from '../services/toast';

interface PropertyCardProps {
  property: any;
  onPress: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress }) => {
  const router = useRouter();
  const { favorites, toggleFavorite, user } = useStore();
  const isFavorite = favorites.includes(property.id);

  const imageUri = resolveImageUrl(
    property.images?.[0]?.url ||
    property.primaryImage ||
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80'
  );

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      {/* Property Image with Badges */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />

        {/* Featured Ribbon */}
        {property.isFeatured && (
          <View style={styles.featuredBadge}>
            <Sparkles size={12} color="#ffffff" />
            <Text style={styles.featuredText}>FEATURED</Text>
          </View>
        )}

        {/* Verified Badge */}
        {property.isVerified && (
          <View style={styles.verifiedBadge}>
            <CheckCircle size={12} color="#10b981" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}

        {/* Favorite Heart Button */}
        <TouchableOpacity
          style={styles.heartButton}
          onPress={async () => {
            if (!user) {
              router.push('/(auth)/login');
              return;
            }
            try {
              const added = await toggleFavorite(property.id);
              if (added) {
                showToast('Saved to your favorites!', 'success');
              } else {
                showToast('Removed from favorites', 'info');
              }
            } catch {
              showToast('Could not update favorites. Try again.', 'error');
            }
          }}
        >
          <Heart
            size={18}
            color={isFavorite ? '#ef4444' : '#ffffff'}
            fill={isFavorite ? '#ef4444' : 'rgba(0,0,0,0.3)'}
          />
        </TouchableOpacity>

        {/* Tags Row */}
        <View style={styles.tagsRow}>
          <View style={styles.listingTag}>
            <Text style={styles.listingText}>
              FOR {property.listingType || 'SALE'}
            </Text>
          </View>
          <View
            style={[
              styles.listerTag,
              property.listerRole === 'AGENT' || property.owner?.role === 'AGENT'
                ? styles.listerAgent
                : styles.listerOwner,
            ]}
          >
            <Text style={styles.listerText}>
              {property.listerRole === 'AGENT' || property.owner?.role === 'AGENT' ? 'BY AGENT' : 'BY OWNER'}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPriceINR(property.price)}</Text>
          {property.listingType === 'RENT' && (
            <Text style={styles.rentPeriod}>/month</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>

        {/* Location */}
        <View style={styles.locationRow}>
          <MapPin size={13} color="#64748b" />
          <Text style={styles.locationText} numberOfLines={1}>
            {property.locality}, {property.city}
          </Text>
        </View>

        {/* Specs Highlights */}
        <View style={styles.specsRow}>
          <Text style={styles.specItem}>
            {property.bedrooms ? `${property.bedrooms} Beds` : property.propertyType}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.specItem}>
            {property.bathrooms ? `${property.bathrooms} Baths` : '1 Bath'}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.specItem}>
            {property.area} {property.areaUnit || 'sq ft'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 190,
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  featuredText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    left: 95,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: {
    color: '#0f172a',
    fontSize: 10,
    fontWeight: '700',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsRow: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  listingTag: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  listingText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  listerTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  listerOwner: {
    backgroundColor: '#059669', // Emerald
  },
  listerAgent: {
    backgroundColor: '#2563eb', // Blue
  },
  listerText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  content: {
    padding: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  rentPeriod: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  specItem: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  dot: {
    marginHorizontal: 6,
    color: '#94a3b8',
    fontSize: 12,
  },
});
