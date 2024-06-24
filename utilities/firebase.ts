import { initializeApp } from "firebase/app";
import { getDatabase, ref } from "firebase/database";
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
export const storage = getStorage(app);
