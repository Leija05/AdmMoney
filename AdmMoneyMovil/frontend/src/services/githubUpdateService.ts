import { Platform, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { APP_CONFIG } from '../config/appConfig';

export interface GitHubReleaseAsset {
  id: number;
  name: string;
  size: number;
  browser_download_url: string;
  content_type: string;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: GitHubReleaseAsset[];
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  apkUrl: string | null;
  apkSize: number | null; // bytes
  htmlUrl: string;
  isRateLimited?: boolean;
}

/**
 * Normaliza y compara dos versiones semánticas (ej: '1.2.0' vs '1.0.0' o 'v2.1' vs 'v2.0').
 * Devuelve > 0 si remote > local, < 0 si remote < local, 0 si son iguales.
 */
export function compareVersions(remote: string, local: string): number {
  const cleanRemote = remote.replace(/^[vV]/, '').trim();
  const cleanLocal = local.replace(/^[vV]/, '').trim();

  const rParts = cleanRemote.split('.').map((p) => parseInt(p, 10) || 0);
  const lParts = cleanLocal.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(rParts.length, lParts.length);
  for (let i = 0; i < maxLen; i++) {
    const r = rParts[i] || 0;
    const l = lParts[i] || 0;
    if (r > l) return 1;
    if (r < l) return -1;
  }
  return 0;
}

/**
 * Formatea bytes a MB o KB legibles.
 */
export function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return 'Tamaño desconocido';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

class GitHubUpdateService {
  private downloadResumable: FileSystem.DownloadResumable | null = null;

  /**
   * Consulta el último release público en el repositorio de GitHub.
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    const currentVersion = APP_CONFIG.APP_VERSION;

    try {
      const response = await fetch(APP_CONFIG.GITHUB_RELEASES_URL, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'AdmMoney-Mobile-App',
        },
      });

      if (response.status === 404) {
        // No hay releases creados aún en el repo
        return {
          hasUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          releaseName: 'Sin publicaciones aún',
          releaseNotes: 'No se encontraron releases en GitHub para este repositorio.',
          publishedAt: new Date().toISOString(),
          apkUrl: null,
          apkSize: null,
          htmlUrl: `https://github.com/${APP_CONFIG.GITHUB_OWNER}/${APP_CONFIG.GITHUB_REPO}/releases`,
        };
      }

      if (response.status === 403) {
        // Rate limit de la API no autenticada de GitHub
        return {
          hasUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          releaseName: 'Límite de consultas',
          releaseNotes: 'Se ha alcanzado temporalmente el límite de consultas de GitHub. Intenta más tarde.',
          publishedAt: new Date().toISOString(),
          apkUrl: null,
          apkSize: null,
          htmlUrl: `https://github.com/${APP_CONFIG.GITHUB_OWNER}/${APP_CONFIG.GITHUB_REPO}/releases`,
          isRateLimited: true,
        };
      }

      if (!response.ok) {
        throw new Error(`Error de GitHub API: ${response.status}`);
      }

      const release: GitHubRelease = await response.json();
      const latestVersion = (release.tag_name || '').replace(/^[vV]/, '');

      // Buscar asset APK en la lista de archivos adjuntos del release
      const apkAsset = release.assets?.find(
        (a) => a.name.toLowerCase().endsWith('.apk')
      );

      const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

      return {
        hasUpdate,
        currentVersion,
        latestVersion: release.tag_name || currentVersion,
        releaseName: release.name || `Versión ${release.tag_name}`,
        releaseNotes: release.body || 'Sin notas de la versión especificadas.',
        publishedAt: release.published_at || new Date().toISOString(),
        apkUrl: apkAsset ? apkAsset.browser_download_url : null,
        apkSize: apkAsset ? apkAsset.size : null,
        htmlUrl: release.html_url || `https://github.com/${APP_CONFIG.GITHUB_OWNER}/${APP_CONFIG.GITHUB_REPO}/releases`,
      };
    } catch (error: any) {
      console.warn('Error al consultar GitHub Releases:', error);
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        releaseName: 'Error de conexión',
        releaseNotes: 'No se pudo conectar con GitHub para verificar actualizaciones.',
        publishedAt: new Date().toISOString(),
        apkUrl: null,
        apkSize: null,
        htmlUrl: `https://github.com/${APP_CONFIG.GITHUB_OWNER}/${APP_CONFIG.GITHUB_REPO}/releases`,
      };
    }
  }

  /**
   * Descarga el APK desde GitHub Releases y lanza el instalador nativo de Android.
   */
  async downloadAndInstallApk(
    apkUrl: string,
    onProgress?: (progress: number, bytesDownloaded: number, totalBytes: number) => void
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      // En Web, simplemente abrimos el enlace de descarga
      await Linking.openURL(apkUrl);
      return true;
    }

    try {
      const targetFileName = 'admmoney_update.apk';
      const fileUri = `${FileSystem.cacheDirectory}${targetFileName}`;

      // Si existía un archivo de descarga previo, eliminarlo
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }

      // Iniciar descarga con seguimiento de progreso
      this.downloadResumable = FileSystem.createDownloadResumable(
        apkUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const total = downloadProgress.totalBytesExpectedToWrite;
          const written = downloadProgress.totalBytesWritten;
          const pct = total > 0 ? Math.min(100, Math.round((written / total) * 100)) : 0;
          if (onProgress) {
            onProgress(pct, written, total);
          }
        }
      );

      const result = await this.downloadResumable.downloadAsync();
      if (!result || !result.uri) {
        throw new Error('La descarga del archivo no produjo un resultado válido');
      }

      // Proceder con la instalación nativa en Android
      if (Platform.OS === 'android') {
        try {
          // Intentar usar expo-intent-launcher de forma dinámica
          const IntentLauncher = require('expo-intent-launcher');
          const contentUri = await FileSystem.getContentUriAsync(result.uri);

          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: 'application/vnd.android.package-archive',
          });
          return true;
        } catch (intentErr) {
          console.warn('Fallo al lanzar intent nativo, abriendo con Linking:', intentErr);
          // Fallback seguro: abrir con Linking
          await Linking.openURL(result.uri);
          return true;
        }
      } else {
        // En iOS o cualquier otra plataforma
        await Linking.openURL(apkUrl);
        return true;
      }
    } catch (error: any) {
      console.error('Error durante la descarga/instalación del APK:', error);
      // Fallback final: abrir la URL directa en el navegador
      await Linking.openURL(apkUrl);
      throw error;
    }
  }

  /**
   * Cancela la descarga si está en progreso.
   */
  async cancelDownload(): Promise<void> {
    if (this.downloadResumable) {
      try {
        await this.downloadResumable.cancelAsync();
      } catch {}
      this.downloadResumable = null;
    }
  }
}

export const githubUpdateService = new GitHubUpdateService();
