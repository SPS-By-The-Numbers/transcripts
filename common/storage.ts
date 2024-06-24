import { Stream } from "stream";
import { arrayBuffer } from 'node:stream/consumers';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'node:stream/promises';

import type { Bucket } from '@google-cloud/storage';

export interface StorageAccessor {
  readBytes(path: string) : Promise<ArrayBuffer>;
  writeBytes(path: string, data: string) : Promise<unknown>;

  // Returns uncompressed bytes from an path using lzma.
  readBytesLzma(path: string) : Promise<ArrayBuffer>;
  writeBytesLzma(path: string, data: string) : Promise<unknown>;

  readBytesGzip(path: string) : Promise<ArrayBuffer>;
  writeBytesGzip(path: string, data: string) : Promise<unknown>;
}

type CloudStorageAccessorOptions = {
  bucket: Bucket;
  makeLzmaDecompressor?: (() => object);
  makeLzmaCompressor?: (() => object);
};

// Implements the StorageAccessor API using the Google Cloud storage
// client API.  It specifically does NOT provide an implementation
// of lzma as finding a small, robust library for lzma that works
// in both the browser and cloud function envrionment is hard.
//
// The browser envrionment does not need to decode archived whisperx
// files so adding the lzma library in is just bloat. This is slightly
// ugly but it works out as an okay compromise.
export class CloudStorageAccessor implements StorageAccessor {
  readonly bucket : Bucket;
  readonly makeLzmaDecompressor?: (() => object);
  readonly makeLzmaCompressor?: (() => object);

  constructor(options : CloudStorageAccessorOptions) {
    this.bucket = options.bucket;
    this.makeLzmaDecompressor = options.makeLzmaDecompressor;
    this.makeLzmaCompressor = options.makeLzmaCompressor;
  }

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
    if (!this.makeLzmaDecompressor) {
      throw "No LZMA 4 u";
    }
    return this.readBytesWithFilter(path, this.makeLzmaDecompressor());
  }

  writeBytesLzma(path: string, data: string) : Promise<unknown> {
    if (!this.makeLzmaCompressor) {
      throw "No LZMA 4 u";
    }
    return this.writeBytesWithFilter(path, data, this.makeLzmaCompressor(), {});
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
