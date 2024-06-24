import * as lzma from 'lzma-native';
import { CloudStorageAccessor } from 'common/storage';
import { getStorage } from 'firebase-admin/storage';

let lzmaStorageAccessor : CloudStorageAccessor | null = null;

export function getLzmaStorageAccessor() : CloudStorageAccessor {
  if (!lzmaStorageAccessor) {
    lzmaStorageAccessor = new CloudStorageAccessor({
        bucket: getStorage().bucket(),
        makeLzmaCompressor: () => lzma.createCompressor({preset: lzma.PRESET_EXTREME}),
        makeLzmaDecompressor: lzma.createDecompressor,
      });
  }

  return lzmaStorageAccessor;
}
