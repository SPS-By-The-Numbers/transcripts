import * as lzma from 'lzma-native';
import { Stream } from "stream";
import { arrayBuffer } from 'node:stream/consumers';
import { createGzip, createGunzip } from 'zlib';
import { getStorage } from 'firebase-admin/storage';
import { pipeline } from 'node:stream/promises';

import type { StorageAccessor } from "../../../common/storage.js";

// Implements the StorageAccessor API using the Firebase Admin SDK
// and Google Cloud Storage API. Unlike the client API, the Firebase
// Admin SDK API's storage bucket can be used interchangably with the
// Google Cloud Storage API which is greate because the GCS API is
// more featureful.
//
// Excluding the LZMA piece, this implementation could completely be
// resused by the react side with anonymous access to the GCS bucket.
// However, doing this also means the firebase emulator overrides
// do not automatically work requiring us to instead infer the
// emulator bucket name and pass it in. This is a less robust Fake
// infrastructure. Instead, the web client which only needs read
// access implements its own FirebaseWebClientStorageAccessor which
// minimally implements the APIs actually used on the react side.
//
// This class should be considered the full featured implementation.
export class FirebaseAdminStorageAccessor implements StorageAccessor {
  readonly bucket = getStorage().bucket();

  readBytes(path: string) : Promise<ArrayBuffer> {
    return (async () => {
      return (await this.bucket.file(path).download())[0];
    })();
  }

  writeBytes(path: string, data: string, fileOptions: object = {}) : Promise<unknown> {
    const file = this.bucket.file(path);
    const passthroughStream = new Stream.PassThrough();
    passthroughStream.write(data);
    passthroughStream.end();
    return pipeline(passthroughStream, file.createWriteStream(fileOptions));
  }

  // Returns uncompressed bytes from an path using lzma.
  readBytesLzma(path: string) : Promise<ArrayBuffer> {
    return this.readBytesWithFilter(path, lzma.createDecompressor());
  }

  writeBytesLzma(path: string, data: string) : Promise<unknown> {
    return this.writeBytesWithFilter(path, data, lzma.createCompressor({preset: lzma.PRESET_EXTREME}), {});
  }

  readBytesGzip(path: string) : Promise<ArrayBuffer> {
    return this.readBytesWithFilter(path, createGunzip());
  }

  writeBytesGzip(path: string, data: string) : Promise<unknown> {
    return this.writeBytesWithFilter(path, data,
        createGzip({level: 9}), {metadata: {contentEncoding: "gzip"}});
  }

  async writeBytesWithFilter(path: string, data: string, filter: any, fileOptions: object = {}) {
    const file = this.bucket.file(path);
    const passthroughStream = new Stream.PassThrough();
    passthroughStream.write(data);
    passthroughStream.end();
    await pipeline(passthroughStream, filter, file.createWriteStream(fileOptions));
  }

  async readBytesWithFilter(path: string, filter: any) {
    return await arrayBuffer(this.bucket.file(path).createReadStream().pipe(filter));
  }
}

let storageAccessor : FirebaseAdminStorageAccessor | null = null;

export function getStorageAccessor() : StorageAccessor {
  if (!storageAccessor) {
    storageAccessor = new FirebaseAdminStorageAccessor();
  }

  return storageAccessor;
}
