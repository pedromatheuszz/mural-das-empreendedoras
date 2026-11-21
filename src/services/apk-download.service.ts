import { Directory, DownloadTask, File, Paths } from 'expo-file-system';
import { startActivityAsync } from 'expo-intent-launcher';
import { Platform } from 'react-native';

import { preferences } from '@/lib/secure-storage';

import type { AppRelease } from './updates.service';

/**
 * Download do APK novo dentro do app, com progresso, velocidade e pausa, e instalação pelo
 * instalador do Android. O estado vive fora do React para o download continuar com a tela
 * fechada ("Segundo plano").
 */
export type ApkDownloadStatus = 'idle' | 'downloading' | 'paused' | 'done' | 'error';

export type ApkDownloadState = {
  status: ApkDownloadStatus;
  version: string | null;
  bytesWritten: number;
  /** -1 quando o servidor não informa o tamanho. */
  totalBytes: number;
  /** Bytes por segundo (média suavizada). */
  speed: number;
  error: string | null;
};

/** Baixar e instalar APK só faz sentido no Android; no iOS a atualização vai pelo link. */
export const canDownloadInApp = Platform.OS === 'android';

const APK_MIME = 'application/vnd.android.package-archive';
/** FLAG_GRANT_READ_URI_PERMISSION: o instalador pode ler o arquivo do app. */
const GRANT_READ_URI = 1;
const DOWNLOAD_ERROR = 'Não foi possível baixar a atualização. Verifique sua internet e tente novamente.';

const initialState: ApkDownloadState = {
  status: 'idle',
  version: null,
  bytesWritten: 0,
  totalBytes: -1,
  speed: 0,
  error: null,
};

/* ---------- Cálculos (puros, testados) ---------- */

/** Velocidade média suavizada a partir dos bytes recebidos ao longo do tempo. */
export function createSpeedMeter(now: () => number = Date.now) {
  let lastBytes = 0;
  let lastTime: number | null = null;
  let speed = 0;
  return {
    sample(bytes: number): number {
      const time = now();
      if (lastTime === null || bytes < lastBytes) {
        lastTime = time;
        lastBytes = bytes;
        return speed;
      }
      const seconds = (time - lastTime) / 1000;
      if (seconds < 0.25) return speed;
      const instant = (bytes - lastBytes) / seconds;
      speed = speed ? speed * 0.7 + instant * 0.3 : instant;
      lastTime = time;
      lastBytes = bytes;
      return speed;
    },
  };
}

export function progressPercent(bytesWritten: number, totalBytes: number): number {
  if (totalBytes <= 0) return 0;
  return Math.max(0, Math.min(100, Math.floor((bytesWritten / totalBytes) * 100)));
}

const decimal = (value: number, digits: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** 812 KB, 4,5 MB, 1,25 GB */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 ** 3) return `${decimal(bytes / 1024 ** 2, 1)} MB`;
  return `${decimal(bytes / 1024 ** 3, 2)} GB`;
}

/** Tempo restante: "8 s", "2 min 5 s", "1 h 3 min"; "--" sem estimativa. */
export function formatTimeLeft(bytesWritten: number, totalBytes: number, speed: number): string {
  if (totalBytes <= 0 || speed <= 0) return '--';
  const seconds = Math.max(1, Math.ceil((totalBytes - bytesWritten) / speed));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return seconds % 60 ? `${minutes} min ${seconds % 60} s` : `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/* ---------- Estado compartilhado ---------- */

let state = initialState;
const listeners = new Set<() => void>();
let task: DownloadTask | null = null;
let file: File | null = null;
let meter = createSpeedMeter();
let lastEmit = 0;

function setState(patch: Partial<ApkDownloadState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

const completedKey = (version: string) => `update-apk-complete-${version}`;

function updatesDirectory(): Directory {
  const directory = new Directory(Paths.cache, 'updates');
  if (!directory.exists) directory.create({ intermediates: true });
  return directory;
}

/** Apaga APKs de outras versões (economia de espaço). */
function removeOtherApks(keep: File) {
  for (const entry of updatesDirectory().list()) {
    if (entry instanceof File && entry.uri !== keep.uri) {
      try {
        entry.delete();
      } catch {
        // ignora
      }
    }
  }
}

function onProgress({ bytesWritten, totalBytes }: { bytesWritten: number; totalBytes: number }) {
  if (state.status !== 'downloading') return;
  const speed = meter.sample(bytesWritten);
  const time = Date.now();
  // Atualiza a tela no máximo ~5 vezes por segundo.
  if (time - lastEmit < 200 && bytesWritten < totalBytes) return;
  lastEmit = time;
  setState({ bytesWritten, totalBytes, speed });
}

async function run(operation: () => Promise<File | null>, version: string) {
  try {
    const result = await operation();
    if (!result) return; // pausado ou cancelado
    await preferences.setFlag(completedKey(version), true);
    setState({ status: 'done', bytesWritten: result.size, totalBytes: result.size, speed: 0, error: null });
  } catch {
    if (state.status === 'paused' || state.version !== version) return;
    setState({ status: 'error', speed: 0, error: DOWNLOAD_ERROR });
  }
}

export const apkDownload = {
  getState: (): ApkDownloadState => state,

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Começa (ou retoma) o download da versão publicada. Se o APK já foi baixado, vai direto para "instalar". */
  async start(release: AppRelease): Promise<void> {
    if (state.version === release.version && state.status === 'downloading') return;
    if (state.version === release.version && state.status === 'paused') return apkDownload.resume();

    const target = new File(updatesDirectory(), `mural-das-empreendedoras-${release.version}.apk`);
    file = target;
    if (target.exists && target.size > 0 && (await preferences.getFlag(completedKey(release.version)))) {
      setState({
        ...initialState,
        status: 'done',
        version: release.version,
        bytesWritten: target.size,
        totalBytes: target.size,
      });
      return;
    }
    if (target.exists) target.delete();
    removeOtherApks(target);

    meter = createSpeedMeter();
    setState({ ...initialState, status: 'downloading', version: release.version });
    task = new DownloadTask(release.download_url, target, { onProgress });
    const current = task;
    await run(() => current.downloadAsync(), release.version);
  },

  async pause(): Promise<void> {
    if (state.status !== 'downloading' || !task) return;
    setState({ status: 'paused', speed: 0 });
    try {
      await task.pauseAsync();
    } catch {
      // se terminou no mesmo instante, o resultado chega pelo run()
    }
  },

  async resume(): Promise<void> {
    if (state.status !== 'paused' || !task || !state.version) return;
    meter = createSpeedMeter();
    setState({ status: 'downloading', error: null });
    const current = task;
    await run(() => current.resumeAsync(), state.version);
  },

  /** Recomeça do zero depois de um erro. */
  async retry(release: AppRelease): Promise<void> {
    task?.cancel();
    task = null;
    setState(initialState);
    await apkDownload.start(release);
  },

  /** Abre o instalador do Android com o APK baixado. */
  async install(): Promise<void> {
    if (!file?.exists) {
      setState({ status: 'error', error: 'O arquivo da atualização não foi encontrado. Baixe novamente.' });
      return;
    }
    await startActivityAsync('android.intent.action.VIEW', {
      data: file.contentUri,
      type: APK_MIME,
      flags: GRANT_READ_URI,
    });
  },
};
