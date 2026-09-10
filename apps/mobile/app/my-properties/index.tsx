import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Building,
} from 'lucide-react-native';
import { mobileApi, resolveImageUrl } from '../../services/api';
import { useStore } from '../../store/useStore';
import { formatPriceINR } from '@real-estate/shared';

export default function MyPropertiesScreen() {
  const router = useRouter();
  const { user } = useStore();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMyProperties = async () => {
    try {
      setLoading(true);
      const res = await mobileApi('/properties/my/listings');
      setProperties(res.data || []);
    } catch (err: any) {
      console.log('Error fetching my properties:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    } else {
      fetchMyProperties();
    }
  }, [user]);

  if (!user) return null;

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyProperties();
  };

  const handleDelete = (propertyId: string, propertyTitle: string) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to delete "${propertyTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(propertyId);
              await mobileApi(`/properties/${propertyId}`, {
                method: 'DELETE',
              });
              setProperties((prev) => prev.filter((p) => p.id !== propertyId));
              Alert.alert('Deleted', 'Property listing deleted successfully.');
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message || 'Could not delete property.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const renderStatusBadge = (status: string, rejectionReason?: string) => {
    switch (status) {
      case 'LIVE':
        return (
          <View style={[styles.statusBadge, styles.statusLive]}>
            <CheckCircle size={12} color="#16a34a" />
            <Text style={[styles.statusText, { color: '#16a34a' }]}>Published Live</Text>
          </View>
        );
      case 'PENDING_REVIEW':
        return (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Clock size={12} color="#d97706" />
            <Text style={[styles.statusText, { color: '#d97706' }]}>Super Admin Review Pending</Text>
          </View>
        );
      case 'REJECTED':
        return (
          <View style={[styles.statusBadge, styles.statusRejected]}>
            <AlertCircle size={12} color="#dc2626" />
            <Text style={[styles.statusText, { color: '#dc2626' }]}>Changes Requested</Text>
          </View>
        );
      case 'DRAFT':
      default:
        return (
          <View style={[styles.statusBadge, styles.statusDraft]}>
            <FileText size={12} color="#64748b" />
            <Text style={[styles.statusText, { color: '#64748b' }]}>Draft</Text>
          </View>
        );
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your listings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>My Properties ({properties.length})</Text>
          <Text style={styles.headerSubtitle}>Manage, edit, and track your property listings</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/post-property')}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.addBtnText}>Post New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {properties.length === 0 ? (
          <View style={styles.emptyCard}>
            <Building size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Properties Listed Yet</Text>
            <Text style={styles.emptySub}>
              Post your apartment, villa, commercial space, or plot to connect with verified buyers.
            </Text>
            <TouchableOpacity
              style={styles.emptyPostBtn}
              onPress={() => router.push('/post-property')}
            >
              <Plus size={18} color="#ffffff" />
              <Text style={styles.emptyPostBtnText}>Post Property for Free</Text>
            </TouchableOpacity>
          </View>
        ) : (
          properties.map((prop) => {
            const thumbnail =
              prop.images && prop.images[0]?.url
                ? prop.images[0].url
                : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80';

            const isBusy = deletingId === prop.id;

            return (
              <View key={prop.id} style={styles.propertyCard}>
                <View style={styles.cardHeader}>
                  <Image source={{ uri: resolveImageUrl(thumbnail) }} style={styles.thumbnail} />
                  <View style={styles.cardDetails}>
                    {renderStatusBadge(prop.status, prop.rejectionReason)}
                    <Text style={styles.propertyPrice}>
                      {formatPriceINR(Number(prop.price || 0))}
                    </Text>
                    <Text style={styles.propertyTitle} numberOfLines={2}>
                      {prop.title}
                    </Text>
                    <Text style={styles.propertyLoc} numberOfLines={1}>
                      {prop.locality}, {prop.city}
                    </Text>
                    <Text style={styles.propertyMeta}>
                      {prop.listingType} • {prop.propertyType} • {prop.area} Sq Ft
                    </Text>
                  </View>
                </View>

                {/* Rejection notice if status is REJECTED */}
                {prop.status === 'REJECTED' && prop.rejectionReason && (
                  <View style={styles.rejectionNotice}>
                    <Text style={styles.rejectionTitle}>Admin Feedback:</Text>
                    <Text style={styles.rejectionText}>{prop.rejectionReason}</Text>
                  </View>
                )}

                {/* Actions Toolbar */}
                <View style={styles.actionRow}>
                  {/* View Details */}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/property/${prop.id}`)}
                  >
                    <ExternalLink size={15} color="#2563eb" />
                    <Text style={[styles.actionBtnText, { color: '#2563eb' }]}>View</Text>
                  </TouchableOpacity>

                  {/* Edit Property */}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/edit-property/${prop.id}`)}
                  >
                    <Edit3 size={15} color="#0f172a" />
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>

                  {/* Delete Property */}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(prop.id, prop.title)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color="#dc2626" />
                    ) : (
                      <>
                        <Trash2 size={15} color="#dc2626" />
                        <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Delete</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollList: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  emptyPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyPostBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  propertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 95,
    height: 95,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  propertyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    lineHeight: 18,
    marginTop: 2,
  },
  propertyLoc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  propertyMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  statusLive: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  statusPending: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  statusRejected: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  statusDraft: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rejectionNotice: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  rejectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
  },
  rejectionText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 2,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 12,
    paddingTop: 10,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    gap: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  deleteBtn: {
    backgroundColor: '#fff1f2',
    borderColor: '#ffe4e6',
  },
});
