import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, radii, spacing, gradients } from '../../theme';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';
import {
  UpdateCheckResult,
  githubUpdateService,
} from '../../services/githubUpdateService';
import { GitHubUpdateModal } from './GitHubUpdateModal';

export const GitHubUpdateCard: React.FC = () => {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  const [isChecking, setIsChecking] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);

  const handleCheckUpdates = async () => {
    try {
      setIsChecking(true);
      setLastCheckMessage(null);

      const result = await githubUpdateService.checkForUpdates();
      setUpdateResult(result);

      if (result.hasUpdate) {
        setIsModalOpen(true);
      } else if (result.isRateLimited) {
        setLastCheckMessage('Límite de peticiones de GitHub temporalmente alcanzado. Vuelve a intentar en unos minutos.');
      } else {
        setLastCheckMessage(`¡Tu aplicación está al día! La versión v${APP_CONFIG.APP_VERSION} es la más reciente.`);
      }
    } catch (err: any) {
      setLastCheckMessage('No se pudo conectar con GitHub. Revisa tu conexión a internet.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <DoubleBezelCard
        style={[
          styles.container,
          { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.75)' },
        ]}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' },
            ]}
          >
            <Ionicons name="logo-github" size={24} color={isDark ? '#F8FAFC' : '#0F172A'} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.textMain }]}>
                Actualizaciones desde GitHub
              </Text>
              <View style={[styles.versionBadge, { backgroundColor: colors.brandBg }]}>
                <Text style={[styles.versionBadgeText, { color: colors.brand }]}>
                  v{APP_CONFIG.APP_VERSION}
                </Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {APP_CONFIG.GITHUB_OWNER}/{APP_CONFIG.GITHUB_REPO}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Instala las nuevas versiones directamente desde el repositorio oficial sin tener que transferir archivos APK por WhatsApp ni cables.
        </Text>

        {/* Status Message */}
        {lastCheckMessage && (
          <View
            style={[
              styles.statusBox,
              {
                backgroundColor: updateResult?.hasUpdate
                  ? 'rgba(2, 132, 199, 0.12)'
                  : isDark
                  ? 'rgba(5, 150, 105, 0.12)'
                  : '#D1FAE5',
                borderColor: updateResult?.hasUpdate
                  ? colors.brand
                  : '#10B981',
              },
            ]}
          >
            <Ionicons
              name={updateResult?.hasUpdate ? 'cloud-download-outline' : 'checkmark-circle-outline'}
              size={18}
              color={updateResult?.hasUpdate ? colors.brand : '#059669'}
            />
            <Text
              style={[
                styles.statusText,
                { color: updateResult?.hasUpdate ? colors.brand : '#059669' },
              ]}
            >
              {lastCheckMessage}
            </Text>
          </View>
        )}

        {/* Buttons Row */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[
              styles.checkBtn,
              { borderColor: isDark ? '#334155' : '#CBD5E1' },
            ]}
            onPress={handleCheckUpdates}
            disabled={isChecking}
            activeOpacity={0.7}
          >
            {isChecking ? (
              <>
                <ActivityIndicator size="small" color={colors.brand} style={{ marginRight: 8 }} />
                <Text style={[styles.checkBtnText, { color: colors.textMain }]}>
                  Consultando GitHub...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="refresh-outline" size={17} color={colors.textMain} style={{ marginRight: 8 }} />
                <Text style={[styles.checkBtnText, { color: colors.textMain }]}>
                  Buscar Actualizaciones
                </Text>
              </>
            )}
          </TouchableOpacity>

          {updateResult?.hasUpdate && (
            <TouchableOpacity
              style={styles.updateNowBtn}
              onPress={() => setIsModalOpen(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.updateNowGradient}
              >
                <Ionicons name="sparkles" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.updateNowText}>Ver Novedades ({updateResult.latestVersion})</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </DoubleBezelCard>

      {/* Modal de Actualización */}
      <GitHubUpdateModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        updateInfo={updateResult}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    padding: spacing.md + 2,
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  versionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  description: {
    fontSize: 12,
    lineHeight: 16.5,
    marginBottom: spacing.sm + 2,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  checkBtn: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  checkBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  updateNowBtn: {
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  updateNowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  updateNowText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
