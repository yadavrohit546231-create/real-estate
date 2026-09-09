import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { MessageSquare, Phone, Mail, ChevronRight } from 'lucide-react-native';
import { mobileApi } from '../../services/api';
import { formatDate } from '@real-estate/shared';

export default function LeadsScreen() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await mobileApi('/leads');
      setLeads(res.data || []);
    } catch (err) {
      console.log('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : leads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageSquare size={48} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No leads received yet</Text>
          <Text style={styles.emptySubtitle}>
            When buyers enquire about your properties, their contact info and requirements will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.leadCard}>
              <View style={styles.headerRow}>
                <Text style={styles.buyerName}>{item.name}</Text>
                <View style={styles.sourceTag}>
                  <Text style={styles.sourceText}>{item.source}</Text>
                </View>
              </View>

              <Text style={styles.propTitle} numberOfLines={1}>
                For: {item.property?.title || 'Property'}
              </Text>

              {item.message && (
                <Text style={styles.messageBox}>"{item.message}"</Text>
              )}

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionCall}
                  onPress={() => Linking.openURL(`tel:${item.phone}`)}
                >
                  <Phone size={14} color="#2563eb" />
                  <Text style={styles.actionCallText}>{item.phone}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionMail}
                  onPress={() => Linking.openURL(`mailto:${item.email}`)}
                >
                  <Mail size={14} color="#64748b" />
                  <Text style={styles.actionMailText}>{item.email}</Text>
                </TouchableOpacity>
              </View>
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
  leadCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buyerName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  sourceTag: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sourceText: { fontSize: 11, fontWeight: '700', color: '#2563eb' },
  propTitle: { fontSize: 13, color: '#475569', marginTop: 4, fontWeight: '500' },
  messageBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    fontStyle: 'italic',
    fontSize: 12,
    color: '#334155',
    marginVertical: 10,
  },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionCall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionCallText: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  actionMail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionMailText: { fontSize: 12, fontWeight: '500', color: '#475569' },
});
