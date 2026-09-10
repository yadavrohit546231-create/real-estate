import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import {
  MessageSquare,
  Phone,
  Mail,
  User,
  Building2,
  Briefcase,
  Home,
  ShieldCheck,
  Calendar,
  MessageCircle,
  Tag,
} from 'lucide-react-native';
import { mobileApi } from '../../services/api';
import { formatDate } from '@real-estate/shared';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';

export default function LeadsScreen() {
  const router = useRouter();
  const { user } = useStore();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await mobileApi('/leads');
      setLeads(res.data || []);
    } catch (err) {
      console.log('Error loading leads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    } else {
      fetchLeads();
    }
  }, [user]);

  if (!user) return null;

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  const getRoleConfig = (role?: string) => {
    switch (role) {
      case 'AGENT':
        return {
          label: 'Real Estate Agent',
          badgeBg: '#f5f3ff',
          badgeBorder: '#ddd6fe',
          textColor: '#7c3aed',
          Icon: Briefcase,
        };
      case 'BUILDER':
        return {
          label: 'Builder / Developer',
          badgeBg: '#fff7ed',
          badgeBorder: '#fed7aa',
          textColor: '#c2410c',
          Icon: Building2,
        };
      case 'OWNER':
        return {
          label: 'Property Owner',
          badgeBg: '#f0fdf4',
          badgeBorder: '#bbf7d0',
          textColor: '#15803d',
          Icon: Home,
        };
      case 'BUYER':
      default:
        return {
          label: 'Buyer / Investor',
          badgeBg: '#eff6ff',
          badgeBorder: '#bfdbfe',
          textColor: '#1d4ed8',
          Icon: User,
        };
    }
  };

  const handleOpenWhatsApp = (phone: string, propertyTitle?: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(
      `Hello! I received your enquiry regarding property "${propertyTitle || ''}". How can I assist you?`
    );
    Linking.openURL(`whatsapp://send?phone=${formattedPhone}&text=${text}`).catch(() => {
      Linking.openURL(`https://wa.me/${formattedPhone}?text=${text}`);
    });
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : leads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageSquare size={48} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No inquiries received yet</Text>
          <Text style={styles.emptySubtitle}>
            When buyers, agents, or builders enquire about your properties, their details and status will appear here in real time.
          </Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const role = item.inquirerRole || item.buyer?.role || item.role;
            const roleConfig = getRoleConfig(role);
            const RoleIcon = roleConfig.Icon;
            const accountStatus = item.inquirerStatus || item.buyer?.status || 'ACTIVE';

            return (
              <View style={styles.leadCard}>
                {/* Header: User Info & Time */}
                <View style={styles.cardHeader}>
                  <View style={styles.userInitialCircle}>
                    <Text style={styles.userInitialText}>
                      {(item.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.buyerName}>{item.name}</Text>
                    {item.createdAt && (
                      <Text style={styles.leadDate}>{formatDate(item.createdAt)}</Text>
                    )}
                  </View>

                  <View style={styles.sourceTag}>
                    <Text style={styles.sourceText}>{item.source || 'ENQUIRY'}</Text>
                  </View>
                </View>

                {/* Inquirer Role & Status Row */}
                <View style={styles.roleStatusRow}>
                  {/* User Role Tag */}
                  <View
                    style={[
                      styles.roleBadge,
                      {
                        backgroundColor: roleConfig.badgeBg,
                        borderColor: roleConfig.badgeBorder,
                      },
                    ]}
                  >
                    <RoleIcon size={12} color={roleConfig.textColor} />
                    <Text style={[styles.roleBadgeText, { color: roleConfig.textColor }]}>
                      {roleConfig.label}
                    </Text>
                  </View>

                  {/* Account Status Tag */}
                  <View style={styles.statusBadge}>
                    <ShieldCheck size={11} color="#16a34a" />
                    <Text style={styles.statusBadgeText}>
                      {accountStatus === 'ACTIVE' ? 'Active User' : accountStatus}
                    </Text>
                  </View>
                </View>

                {/* Property Context */}
                <View style={styles.propertyRefBox}>
                  <Text style={styles.propLabel}>Enquired For:</Text>
                  <Text style={styles.propTitle} numberOfLines={1}>
                    {item.property?.title || 'Property Listing'}
                  </Text>
                  {(item.property?.locality || item.property?.city) && (
                    <Text style={styles.propLocation}>
                      {[item.property?.locality, item.property?.city].filter(Boolean).join(', ')}
                    </Text>
                  )}
                </View>

                {/* Message Content */}
                {item.message ? (
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageBox}>"{item.message}"</Text>
                  </View>
                ) : null}

                {/* Contact Action Buttons */}
                <View style={styles.actionsRow}>
                  {item.phone ? (
                    <TouchableOpacity
                      style={styles.actionCall}
                      onPress={() => Linking.openURL(`tel:${item.phone}`)}
                      activeOpacity={0.7}
                    >
                      <Phone size={13} color="#2563eb" />
                      <Text style={styles.actionCallText}>Call</Text>
                    </TouchableOpacity>
                  ) : null}

                  {item.phone ? (
                    <TouchableOpacity
                      style={styles.actionWhatsApp}
                      onPress={() => handleOpenWhatsApp(item.phone, item.property?.title)}
                      activeOpacity={0.7}
                    >
                      <MessageCircle size={13} color="#15803d" />
                      <Text style={styles.actionWhatsAppText}>WhatsApp</Text>
                    </TouchableOpacity>
                  ) : null}

                  {item.email ? (
                    <TouchableOpacity
                      style={styles.actionMail}
                      onPress={() => Linking.openURL(`mailto:${item.email}`)}
                      activeOpacity={0.7}
                    >
                      <Mail size={13} color="#475569" />
                      <Text style={styles.actionMailText}>Email</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 14 },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  leadCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
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
    alignItems: 'center',
    marginBottom: 10,
  },
  userInitialCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitialText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
  },
  buyerName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  leadDate: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  sourceTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sourceText: { fontSize: 10, fontWeight: '700', color: '#475569', textTransform: 'uppercase' },
  roleStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d',
  },
  propertyRefBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  propLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  propTitle: { fontSize: 13, color: '#0f172a', fontWeight: '700' },
  propLocation: { fontSize: 11, color: '#64748b', marginTop: 2 },
  messageContainer: {
    marginBottom: 12,
  },
  messageBox: {
    backgroundColor: '#fbfcfe',
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    fontStyle: 'italic',
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionCallText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  actionWhatsApp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionWhatsAppText: { fontSize: 12, fontWeight: '700', color: '#15803d' },
  actionMail: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionMailText: { fontSize: 12, fontWeight: '600', color: '#475569' },
});
