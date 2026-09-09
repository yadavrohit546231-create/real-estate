import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Bell, CheckCheck } from 'lucide-react-native';
import { mobileApi } from '../../services/api';
import { useStore } from '../../store/useStore';
import { formatDate } from '@real-estate/shared';

export default function NotificationsScreen() {
  const { user } = useStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await mobileApi('/notifications');
      setNotifications(res.data?.notifications || []);
    } catch (err) {
      console.log('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await mobileApi('/notifications/read-all', { method: 'PATCH' });
      fetchNotifications();
    } catch (err) {
      console.log(err);
    }
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Bell size={48} color="#cbd5e1" />
        <Text style={styles.title}>Stay Updated</Text>
        <Text style={styles.subtitle}>Sign in to view listing approvals, lead alerts and visit updates.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notifications.length > 0 && (
        <View style={styles.topActionRow}>
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <CheckCheck size={16} color="#2563eb" />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Bell size={48} color="#cbd5e1" />
          <Text style={styles.title}>All Caught Up!</Text>
          <Text style={styles.subtitle}>You have no new notifications right now.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.notifItem, !item.isRead && styles.notifUnread]}>
              <View style={styles.notifHeader}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <Text style={styles.notifMessage}>{item.message}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  title: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginTop: 14 },
  subtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6 },
  topActionRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'flex-end' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  markAllText: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  notifItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  notifUnread: { backgroundColor: '#f0fdf4' },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  notifDate: { fontSize: 11, color: '#94a3b8' },
  notifMessage: { fontSize: 13, color: '#475569', lineHeight: 18 },
});
