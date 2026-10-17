import { useState, useEffect, useCallback } from 'react';
import { CustomerProfile, CustomerAddress, CustomerAuthSession } from '../types';
import { CustomerAuthApi } from '../services/customerAuthApi';
import { auth, googleProvider } from '../services/firebase';
import {
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

const STORAGE_KEY = 'amazingdeal_customer_session';

export function useCustomerAuth() {
  const [session, setSession] = useState<CustomerAuthSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync session changes to localStorage
  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const refreshAddresses = useCallback(async () => {
    if (!session?.token) return;
    try {
      const addrs = await CustomerAuthApi.getAddresses(session.token);
      setSession((prev) => (prev ? { ...prev, addresses: addrs } : null));
    } catch (e) {
      console.warn('Failed to refresh addresses:', e);
    }
  }, [session?.token]);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const newSession = await CustomerAuthApi.verifyWithBackend({
        firebaseUid: user.uid,
        idToken,
        fullName: user.displayName || 'Google Shopper',
        email: user.email || undefined,
        phone: user.phoneNumber || undefined,
        avatarUrl: user.photoURL || undefined,
        authProvider: 'FIREBASE_GOOGLE',
      });

      setSession(newSession);
      return newSession;
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      // Friendly message for cancelled popup or other errors
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else {
        setError(err.message || 'Google sign-in failed');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (
    email: string,
    pass: string,
    isSignUp: boolean,
    fullName?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      let userCredential;

      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        if (fullName) {
          await updateProfile(userCredential.user, { displayName: fullName });
        }
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, pass);
      }

      const user = userCredential.user;
      const idToken = await user.getIdToken();

      const newSession = await CustomerAuthApi.verifyWithBackend({
        firebaseUid: user.uid,
        idToken,
        fullName: fullName || user.displayName || email.split('@')[0],
        email: user.email || email,
        avatarUrl: user.photoURL || undefined,
        authProvider: 'FIREBASE_EMAIL',
      });

      setSession(newSession);
      return newSession;
    } catch (err: any) {
      console.error('Email auth error:', err);
      let msg = err.message || 'Authentication failed';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Incorrect email or password.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setSession(null);
  };

  const saveAddress = async (address: CustomerAddress) => {
    if (!session?.token) throw new Error('Customer not authenticated');
    const saved = await CustomerAuthApi.saveAddress(session.token, address);
    await refreshAddresses();
    return saved;
  };

  const deleteAddress = async (addressId: string) => {
    if (!session?.token) throw new Error('Customer not authenticated');
    await CustomerAuthApi.deleteAddress(session.token, addressId);
    await refreshAddresses();
  };

  return {
    customer: session?.customer || null,
    token: session?.token || null,
    addresses: session?.addresses || [],
    isLoggedIn: !!session?.token,
    loading,
    error,
    loginWithGoogle,
    loginWithEmail,
    logout,
    refreshAddresses,
    saveAddress,
    deleteAddress,
  };
}
