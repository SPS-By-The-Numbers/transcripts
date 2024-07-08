import * as Constants from 'config/constants';
import * as Transcript from 'common/transcript';
import { getDatabase, ref } from "firebase/database";
import { initializeApp } from "firebase/app";

import type { StorageAccessor } from "common/storage";

export const firebaseApp = initializeApp(Constants.FIREBASE_CLIENT_CONFIG);

export const database = getDatabase(firebaseApp);
export const dbPublicRoot = ref(database, '/transcripts/public');
export const dbPrivateRoot = ref(database, '/transcripts/private');
