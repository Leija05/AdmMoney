import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, radii, spacing, gradients } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import {
  UpdateCheckResult,
  githubUpdateService,
  formatBytes,
} from '../../services/githubUpdateService';

interface GitHubUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  updateInfo: UpdateCheckResult | null;
}

export const GitHubUpdateModal: React.FC<GitHubUpdateModalProps> = ({
  visible,
  onClose,
  updateInfo,
}) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!updateInfo) return null;

  const handleStartUpdate = async () => {
    if (!updateInfo.apkUrl) {
      Alert.alert(
        'Abrir en GitHub',
        'Este release no contiene un archivo .apk precompilado adjunto. Te redirigiremos a GitHub para descargarlo manualmente.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a GitHub', onPress: () => Linking.openURL(updateInfo.htmlUrl) },
        ]
      );
      return;
    }

    try {
      setIsDownloading(true);
      setErrorMessage(null);
      setDownloadProgress(0);
      setIsCompleted(false);

      await githubUpdateService.downloadAndInstallApk(
        updateInfo.apkUrl,
        (progress, written, total) => {
          setDownloadProgress(progress);
          setDownloadedBytes(written);
          setTotalBytes(total);
        }
      );

      setIsCompleted(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocurrió un error al descargar la actualización.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenReleasePage = () => {
    Linking.openURL(updateInfo.htmlUrl);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isDownloading) onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.backdrop} />

        <DoubleBezelCard
          style={[
            styles.modalCard,
            { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)' },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Ionicons name="logo-github" size={28} color={isDark ? '#F8FAFC' : '#0F172A'} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={[styles.title, { color: colors.textMain }]}>
                  Actualización Disponible
                </Text>
                <View style={[styles.newBadge, { backgroundColor: colors.brand }]}>
                  <Text style={styles.newBadgeText}>{updateInfo.latestVersion}</Text>
                </View>
              </View>
              <Text style={[styles.subTitle, { color: colors.textMuted }]}>
                {updateInfo.releaseName || `Versión ${updateInfo.latestVersion}`}
              </Text>
            </View>

            {!isDownloading && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Info Banner */}
          <View
            style={[
              styles.infoBanner,
              {
                backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : '#E0F2FE',
                borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : '#BAE6FD',
              },
            ]}
          >
            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: colors.textDim }]}>Versión Actual</Text>
              <Text style={[styles.infoVal, { color: colors.textMain }]}>
                v{updateInfo.currentVersion}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.brand} />
            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: colors.textDim }]}>Nueva Versión</Text>
              <Text style={[styles.infoVal, { color: colors.brand }]}>
                {updateInfo.latestVersion}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: colors.textDim }]}>Tamaño APK</Text>
              <Text style={[styles.infoVal, { color: colors.textMain }]}>
                {formatBytes(updateInfo.apkSize)}
              </Text>
            </View>
          </View>

          {/* Release Notes */}
          <Text style={[styles.sectionLabel, { color: colors.textMain }]}>
            Novedades y Mejoras:
          </Text>
          <ScrollView
            style={[
              styles.notesBox,
              {
                backgroundColor: isDark ? '#0B132B' : '#F8FAFC',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
            contentContainerStyle={styles.notesContent}
            showsVerticalScrollIndicator
          >
            <Text style={[styles.notesText, { color: colors.textMain }]}>
              {updateInfo.releaseNotes || 'Mejoras continuas de rendimiento, diseño y estabilidad.'}
            </Text>
          </ScrollView>

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Progress Section */}
          {isDownloading && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.textMain }]}>
                  Descargando archivo APK desde GitHub...
                </Text>
                <Text style={[styles.progressPct, { color: colors.brand }]}>
                  {downloadProgress}%
                </Text>
              </View>

              <View
                style={[
                  styles.progressBarBg,
                  { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
                ]}
              >
                <LinearGradient
                  colors={[colors.brand, '#38BDF8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${downloadProgress}%` }]}
                />
              </View>

              <View style={styles.progressBytesRow}>
                <Text style={[styles.progressBytesText, { color: colors.textMuted }]}>
                  {formatBytes(downloadedBytes)} / {formatBytes(totalBytes || updateInfo.apkSize)}
                </Text>
                <ActivityIndicator size="small" color={colors.brand} />
              </View>
            </View>
          )}

          {/* Success message */}
          {isCompleted && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text style={styles.successText}>
                Descarga finalizada. El instalador de Android se ha iniciado.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {!isDownloading && (
              <TouchableOpacity
                style={[
                  styles.secondaryBtn,
                  { borderColor: isDark ? '#334155' : '#CBD5E1' },
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.textMuted }]}>
                  Más Tarde
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { opacity: isDownloading ? 0.7 : 1 },
                !isDownloading && { flex: 1 },
              ]}
              onPress={handleStartUpdate}
              disabled={isDownloading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {isDownloading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>Descargando...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>
                      {isCompleted ? 'Volver a Instalar' : 'Actualizar Ahora'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* GitHub link note */}
          <TouchableOpacity
            style={styles.githubLinkRow}
            onPress={handleOpenReleasePage}
            activeOpacity={0.6}
          >
            <Ionicons name="open-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.githubLinkText, { color: colors.textMuted }]}>
              Ver notas completas en GitHub (Leija05/AdmMoney)
            </Text>
          </TouchableOpacity>
        </DoubleBezelCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  infoCol: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesBox: {
    maxHeight: 140,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  notesContent: {
    paddingBottom: 4,
  },
  notesText: {
    fontSize: 12,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    gap: 6,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11.5,
    flex: 1,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBytesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBytesText: {
    fontSize: 10.5,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 8,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
    gap: 8,
  },
  successText: {
    color: '#059669',
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  githubLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 5,
  },
  githubLinkText: {
    fontSize: 10.5,
    textDecorationLine: 'underline',
  },
});
