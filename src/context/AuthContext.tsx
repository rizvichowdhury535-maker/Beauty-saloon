import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
  STUDIO_ADMIN_EMAIL,
} from '../lib/firebase';
import { decryptNotesJson, encryptNotesJson } from '../lib/crypto';

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  location: string;
  skinType: string;
  preferredStyle: string;
  emailRemindersEnabled: boolean;
  whatsappRemindersEnabled: boolean;
  decryptedNotes: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  saveProfile: (updates: Partial<UserProfileData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = Boolean(
    user?.emailVerified && user?.email?.toLowerCase() === STUDIO_ADMIN_EMAIL
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const userPath = `users/${firebaseUser.uid}`;
      try {
        const ref = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const decryptedNotes = await decryptNotesJson(
            typeof data.encryptedNotes === 'string' ? data.encryptedNotes : '',
            firebaseUser.uid
          );
          setProfile({
            uid: firebaseUser.uid,
            displayName: String(data.displayName || firebaseUser.displayName || 'Studio Guest').slice(0, 100),
            email: String(data.email || firebaseUser.email || '').slice(0, 160),
            phone: String(data.phone || ''),
            location: String(data.location || 'Dhaka'),
            skinType: String(data.skinType || 'Combination'),
            preferredStyle: String(data.preferredStyle || 'Soft Glass-Skin Glam'),
            emailRemindersEnabled: Boolean(data.emailRemindersEnabled ?? true),
            whatsappRemindersEnabled: Boolean(data.whatsappRemindersEnabled ?? true),
            decryptedNotes,
          });
        } else {
          const initialName = (firebaseUser.displayName || 'Studio Client').slice(0, 100);
          const initialEmail = (firebaseUser.email || 'client@example.com').slice(0, 160);
          const payload = {
            uid: firebaseUser.uid,
            displayName: initialName,
            email: initialEmail,
            phone: '',
            location: 'Dhaka',
            skinType: 'Combination',
            preferredStyle: 'Soft Glass-Skin Glam',
            emailRemindersEnabled: true,
            whatsappRemindersEnabled: true,
            encryptedNotes: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(ref, payload);
          setProfile({
            uid: firebaseUser.uid,
            displayName: initialName,
            email: initialEmail,
            phone: '',
            location: 'Dhaka',
            skinType: 'Combination',
            preferredStyle: 'Soft Glass-Skin Glam',
            emailRemindersEnabled: true,
            whatsappRemindersEnabled: true,
            decryptedNotes: '',
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, userPath);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      return result.user;
    } catch (err) {
      console.error('Google sign-in error:', err);
      throw err;
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const saveProfile = async (updates: Partial<UserProfileData>) => {
    if (!user || !profile) return;
    const next: UserProfileData = {
      ...profile,
      ...updates,
    };
    const encryptedNotes = await encryptNotesJson(next.decryptedNotes || '', user.uid);
    const userPath = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: next.displayName.trim().slice(0, 100) || 'Studio Client',
        phone: next.phone.trim().slice(0, 32),
        location: next.location.trim().slice(0, 160),
        skinType: next.skinType.trim().slice(0, 64),
        preferredStyle: next.preferredStyle.trim().slice(0, 80),
        emailRemindersEnabled: Boolean(next.emailRemindersEnabled),
        whatsappRemindersEnabled: Boolean(next.whatsappRemindersEnabled),
        encryptedNotes: encryptedNotes.slice(0, 4096),
        updatedAt: serverTimestamp(),
      });
      setProfile(next);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, userPath);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        signInWithGoogle,
        signOutUser,
        saveProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
