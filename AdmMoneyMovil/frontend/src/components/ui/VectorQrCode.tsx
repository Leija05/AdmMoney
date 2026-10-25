import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import QRCode from 'qrcode';
import { Ionicons } from '@expo/vector-icons';

interface VectorQrCodeProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export const VectorQrCode: React.FC<VectorQrCodeProps> = ({
  value,
  size = 180,
  color = '#0B132B',
  backgroundColor = 'transparent',
  errorCorrectionLevel = 'M',
}) => {
  const qrData = useMemo(() => {
    if (!value || !value.trim()) return null;
    try {
      const qr = QRCode.create(value.trim(), { errorCorrectionLevel });
      const modules = qr.modules;
      const count = modules.size;
      const data = modules.data;

      // Construir SVG path compacto con todos los cuadrados negros
      let path = '';
      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (data[row * count + col]) {
            path += `M${col},${row}h1v1h-1z `;
          }
        }
      }

      return { count, path };
    } catch (err) {
      console.warn('Error generating QR code:', err);
      return null;
    }
  }, [value, errorCorrectionLevel]);

  if (!value || !value.trim() || !qrData) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {
            width: size,
            height: size,
            backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : 'rgba(0,0,0,0.04)',
          },
        ]}
      >
        <Ionicons name="qr-code-outline" size={size * 0.35} color="rgba(148, 163, 184, 0.7)" />
        <Text style={styles.emptyText}>Ingresa un número para generar el QR</Text>
      </View>
    );
  }

  const { count, path } = qrData;

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${count} ${count}`}>
        {backgroundColor && backgroundColor !== 'transparent' ? (
          <Rect x="0" y="0" width={count} height={count} fill={backgroundColor} />
        ) : null}
        <Path d={path} fill={color} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(148, 163, 184, 0.4)',
    padding: 12,
  },
  emptyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
});
