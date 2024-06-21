import * as Constants from 'config/constants';
import * as lzma from 'lzma-native';
import { CloudStorageAccessor } from 'common/storage';

export function getLzmaCloudStorageAccessor() {
  return new CloudStorageAccessor({
    keyfile: Constants.PRIVILEGED_STORAGE_KEY_FILE,
    makeLzmaCompressor: () => lzma.createCompressor({preset: lzma.PRESET_EXTREME}),
    makeLzmaDecompressor: lzma.createDecompressor,
  });
}

