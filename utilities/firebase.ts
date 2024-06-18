import { initializeApp } from "firebase/app";
import { getDatabase, getStorage, listAll, ref } from "firebase/database";
import * as Storage from "firebase/storage";
import * as Transcript from 'common/transcript';

const firebaseConfig = {
  apiKey: "AIzaSyD30a3gVbP-7PgTvTqCjW4xx-GlLMBQ5Ns",
  authDomain: "sps-by-the-numbers.firebaseapp.com",
  databaseURL: "https://sps-by-the-numbers-default-rtdb.firebaseio.com",
  projectId: "sps-by-the-numbers",
  storageBucket: "sps-by-the-numbers.appspot.com",
  messagingSenderId: "319988578351",
  appId: "1:319988578351:web:1caaadd0171003126deeda",
  measurementId: "G-WKM5FTSSLL"
};

export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const dbPublicRoot = ref(database, '/transcripts/public');
export const dbPrivateRoot = ref(database, '/transcripts/private');

class FirebaseStorageAccessor extends Transcript.StorageAccessor {
  listFilesByPrefix(prefix: string) : Promise<string[]> {
    const storage = Storage.getStorage(app);
    return (async () => {
      const result = await Storage.listAll(Storage.ref(storage, prefix));
      return result.items.map(r => r.fullPath);
    })();
  }

  getBytes(path: string) : Promise<Buffer> {
    const storage = Storage.getStorage(app);
    return Storage.getBytes(Storage.ref(storage, path));
  }

  createWriteStream(path: string) : Writeable {
//    return getStream(ref(storage, path));
  }
}

export const firebaseStorageAccessor = new FirebaseStorageAccessor();

