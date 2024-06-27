export interface StorageAccessor {
  readBytes(path: string) : Promise<ArrayBuffer>;
  writeBytes(path: string, data: string) : Promise<unknown>;

  // Returns uncompressed bytes from an path using lzma.
  readBytesLzma(path: string) : Promise<ArrayBuffer>;
  writeBytesLzma(path: string, data: string) : Promise<unknown>;

  readBytesGzip(path: string) : Promise<ArrayBuffer>;
  writeBytesGzip(path: string, data: string) : Promise<unknown>;
}

