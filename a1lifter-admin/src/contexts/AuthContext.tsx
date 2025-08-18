/* eslint-disable react-refresh/only-export-components -- AuthProvider and useAuth are intentionally colocated to keep context + hook in one module; safe for Fast Refresh. */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User as FirebaseUser, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { judgeService } from '@/services/judges';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  hasPermission: (permission: keyof User['permissions']) => boolean;
  canJudgeCompetition: (competitionId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Cerca l'utente in Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            // Utente esistente con permessi
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              permissions: userData.permissions ?? judgeService.getDefaultAdminPermissions(),
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
            });
          } else {
            // Nuovo utente - crea con permessi admin di default
            const defaultUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: firebaseUser.displayName || firebaseUser.email!,
              role: 'admin',
              permissions: judgeService.getDefaultAdminPermissions(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await setDoc(userRef, defaultUser);
            setUser(defaultUser);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, 'users', userCredential.user.uid);
    const defaultUser: User = {
      id: userCredential.user.uid,
      email,
      name,
      role: 'admin',
      permissions: judgeService.getDefaultAdminPermissions(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await setDoc(userRef, defaultUser);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      const defaultUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || firebaseUser.email!,
        role: 'admin',
        permissions: judgeService.getDefaultAdminPermissions(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(userRef, defaultUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const hasPermission = (permission: keyof User['permissions']): boolean => {
    if (!user) return false;
    
    // Admin ha tutti i permessi
    if (user.role === 'admin') return true;
    
    return user.permissions[permission] as boolean;
  };

  const canJudgeCompetition = (competitionId: string): boolean => {
    if (!user || user.role !== 'judge') return false;
    
    return user.permissions.canJudgeCompetitions.includes(competitionId) ||
           user.permissions.canJudgeCompetitions.includes('*');
  };

  const value = {
    user,
    login,
    loginWithGoogle,
    register,
    logout,
    loading,
    hasPermission,
    canJudgeCompetition
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};