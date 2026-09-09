import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Calendar, Clock, Check, X } from 'lucide-react-native';
import { mobileApi } from '../../services/api';
import { formatDate } from '@real-estate/shared';

export default function SiteVisitsScreen() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const res = await mobileApi('/site-visits');
      setVisits(res.data || []);
    } catch (err) {
      console.log('Error loading visits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleStatusChange = async (visitId: string, action: 'accept' | 'reject') => {
    try {
      await mobileApi(`/site-visits/${visitId}/${action}`, { method: 'PATCH' });
      fetchVisits();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : visits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Calendar size={48} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No scheduled site visits</Text>
          <Text style={styles.emptySubtitle}>
            Buyer appointment requests for physical property inspections will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.visitCard}>
              <View style={styles.headerRow}>
                <Text style={styles.propTitle} numberOfLines={1}>
                  {item.property?.title || 'Property'}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'CONFIRMED'
                      ? styles.confirmed
                      : item.status === 'REJECTED'
                      ? styles.rejected
                      : styles.pending,
                  ]}
                >
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <Calendar size={14} color="#64748b" />
                <Text style={styles.timeText}>{formatDate(item.visitDate)}</Text>
                <Clock size={14} color="#64748b" style={{ marginLeft: 10 }} />
                <Text style={styles.timeText}>{item.timeSlot}</Text>
              </View>

              <Text style={styles.visitorText}>
                Visitor: {item.user?.name} • {item.user?.phone}
              </Text>

              {item.notes && <Text style={styles.notesText}>Notes: {item.notes}</Text>}

              {item.status === 'REQUESTED' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleStatusChange(item.id, 'reject')}
                  >
                    <X size={14} color="#e11d48" />
                    <Text style={styles.rejectText}>Decline</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleStatusChange(item.id, 'accept')}
                  >
                    <Check size={14} color="#ffffff" />
                    <Text style={styles.acceptText}>Confirm Visit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 14 },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6 },
  visitCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  propTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pending: { backgroundColor: '#fef3c7' },
  confirmed: { backgroundColor: '#dcfce7' },
  rejected: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 10, fontWeight: '700', color: '#1e293b' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  timeText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  visitorText: { fontSize: 12, color: '#334155', marginTop: 8, fontWeight: '600' },
  notesText: { fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 4 },
  actionButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  rejectText: { fontSize: 12, fontWeight: '600', color: '#e11d48' },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#16a34a',
  },
  acceptText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
});
