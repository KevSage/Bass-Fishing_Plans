import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';

interface BackButtonProps {
  onPress: () => void;
  label?: string;
}

/**
 * Back Button Component
 * Styled to match web app design with blur background
 */
export function BackButton({ onPress, label = 'Back' }: BackButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Back Arrow */}
      <View style={styles.arrow}>
        <View style={styles.arrowLine} />
        <View style={styles.arrowHead} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 6,
  },
  arrow: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowLine: {
    position: 'absolute',
    width: 10,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 1,
  },
  arrowHead: {
    position: 'absolute',
    left: 0,
    width: 6,
    height: 6,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    transform: [{ rotate: '45deg' }],
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
});
