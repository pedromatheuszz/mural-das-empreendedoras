import { useSyncExternalStore } from 'react';

import { apkDownload, type ApkDownloadState } from '@/services/apk-download.service';

/** Estado do download da atualização (compartilhado por toda a app). */
export function useApkDownload(): ApkDownloadState {
  return useSyncExternalStore(apkDownload.subscribe, apkDownload.getState, apkDownload.getState);
}
