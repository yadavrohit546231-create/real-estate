import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { useToastStore } from '../services/toast';

export function GlobalToast() {
  const currentToast = useToastStore((state) => state.currentToast);
  const hide = useToastStore((state) => state.hide);
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentToast) {
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: insets.top > 0 ? insets.top + 8 : 16,
          useNativeDriver: true,
          damping: 15,
          stiffness: 150,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 3.2 seconds
      timerRef.current = setTimeout(() => {
        dismissToast();
      }, 3200);
    } else {
      dismissToast();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentToast]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hide();
    });
  };

  if (!currentToast) return null;

  const isSuccess = currentToast.type === 'success';
  const isError = currentToast.type === 'error';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={dismissToast}
        style={[
          styles.toastCard,
          isSuccess && styles.successCard,
          isError && styles.errorCard,
        ]}
      >
        <View style={styles.iconWrap}>
          {isSuccess ? (
            <CheckCircle2 size={20} color="#ffffff" />
          ) : isError ? (
            <AlertCircle size={20} color="#ffffff" />
          ) : (
            <Info size={20} color="#ffffff" />
          )}
        </View>

        <Text style={styles.messageText} numberOfLines={3}>
          {currentToast.message}
        </Text>

        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={dismissToast}
          style={styles.closeBtn}
        >
          <X size={16} color="rgba(255, 255, 255, 0.8)" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  successCard: {
    backgroundColor: '#059669', // Emerald 600
    borderColor: '#34d399',
  },
  errorCard: {
    backgroundColor: '#dc2626', // Red 600
    borderColor: '#f87171',
  },
  iconWrap: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  closeBtn: {
    marginLeft: 10,
    padding: 2,
  },
});
