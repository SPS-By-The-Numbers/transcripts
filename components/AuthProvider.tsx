'use client'

import { firebaseApp } from 'utilities/client/firebase'
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider } from "firebase/auth"

import { createContext, useContext, useState, useMemo } from 'react'

const firebaseAuth = getAuth(firebaseApp);
const googleAuthProvider = new GoogleAuthProvider();

type AuthStateType = {
  user?: object;
  credential?: object;
};

type AuthProviderParams = {
  children: React.ReactNode;
};

// Pattern from https://stackoverflow.com/a/74174425
const AuthContext = createContext<AuthContextState | undefined>(undefined);

// Pattern from https://kentcdodds.com/blog/how-to-use-react-context-effectively
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('Missing <AuthProvider>')
  }

  return context;
}

class AuthContextState {
  readonly authState: AuthStateType;
  readonly setAuthState:(x: AuthStateType) => void;

  constructor(
      authState: AuthStateType,
      setAuthState: (x: AuthStateType) => void) {
    this.authState = authState;
    this.setAuthState = setAuthState;
  }

  user() {
    return this.authState.user;
  }

  async signIn() {
    try {
      const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);

      // The signed-in user info.
      const user = result.user;
      this.setAuthState({user, credential});

      // IdP data available using getAdditionalUserInfo(result)
      // ...

    } catch (error) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData?.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.error("Signin failed", errorCode, errorMessage, email, credential);
    }
  }

  async signOut() {
    try {
      const result = await signOut(firebaseAuth);
      this.setAuthState({});

    } catch (error) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData?.email;
      console.error("Signout failed", errorCode, errorMessage, email);
    }
  }
};

export default function AnnotationsProvider({children}: AuthProviderParams) {
  const [authState, setAuthState] = useState<AuthStateType>({});

  const value = useMemo(
    () => new AuthContextState(authState, setAuthState),
    [authState]
  );
 
  return (
    <AuthContext.Provider value={value}>
      {useMemo(() => (
        <>
          {children}
        </>
      ), [children])}
    </AuthContext.Provider>
  )
}
