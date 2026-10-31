// TypeScript declarations for modular Firebase v11 subpaths

declare module "firebase/app" {
  export interface FirebaseOptions {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    [key: string]: any;
  }

  export interface FirebaseApp {
    name: string;
    options: FirebaseOptions;
  }

  export function initializeApp(options: FirebaseOptions, name?: string): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function getApp(name?: string): FirebaseApp;
}

declare module "firebase/auth" {
  export interface UserInfo {
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    providerId: string;
    uid: string;
  }

  export interface UserMetadata {
    creationTime?: string;
    lastSignInTime?: string;
  }

  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    providerData: UserInfo[];
    metadata: UserMetadata;
    reload(): Promise<void>;
  }

  export interface UserCredential {
    user: User;
    providerId: string | null;
    operationType: string;
  }

  export interface AdditionalUserInfo {
    username?: string | null;
    isNewUser?: boolean;
    profile?: Record<string, any> | null;
    providerId?: string;
  }

  export interface OAuthCredential {
    accessToken?: string;
    idToken?: string;
    providerId: string;
    signInMethod: string;
  }

  export class AuthProvider {
    providerId: string;
  }

  export class GoogleAuthProvider extends AuthProvider {
    static PROVIDER_ID: string;
    addScope(scope: string): this;
    setCustomParameters(params: Record<string, any>): this;
    static credential(idToken?: string, accessToken?: string): OAuthCredential;
    static credentialFromResult(userCredential: UserCredential): OAuthCredential | null;
  }

  export class GithubAuthProvider extends AuthProvider {
    static PROVIDER_ID: string;
    addScope(scope: string): this;
    setCustomParameters(params: Record<string, any>): this;
    static credential(token: string): OAuthCredential;
    static credentialFromResult(userCredential: UserCredential): OAuthCredential | null;
  }

  export interface Auth {
    currentUser: User | null;
  }

  export function getAuth(app?: any): Auth;
  export function signInWithPopup(auth: Auth, provider: AuthProvider): Promise<UserCredential>;
  export function linkWithPopup(user: User, provider: AuthProvider): Promise<UserCredential>;
  export function getAdditionalUserInfo(userCredential: UserCredential): AdditionalUserInfo | null;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signOut(auth: Auth): Promise<void>;
  export function sendEmailVerification(user: User): Promise<void>;
  export function sendPasswordResetEmail(auth: Auth, email: string): Promise<void>;
  export function updateProfile(user: User, profile: { displayName?: string | null; photoURL?: string | null }): Promise<void>;
  export function onAuthStateChanged(auth: Auth, nextOrObserver: (user: User | null) => void): () => void;
}
