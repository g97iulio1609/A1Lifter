import { 
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  User,
  onAuthStateChanged,
  getIdTokenResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export interface UserRole {
  role: 'admin' | 'organizer' | 'judge' | 'athlete';
  permissions: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole['role'];
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}

export class FirebaseAuthService {
  private static instance: FirebaseAuthService;
  private currentUser: User | null = null;
  private userProfile: UserProfile | null = null;

  private constructor() {
    // Listen to auth state changes
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        await this.loadUserProfile(user.uid);
      } else {
        this.userProfile = null;
      }
    });
  }

  public static getInstance(): FirebaseAuthService {
    if (!FirebaseAuthService.instance) {
      FirebaseAuthService.instance = new FirebaseAuthService();
    }
    return FirebaseAuthService.instance;
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login time
      await this.updateLastLogin(user.uid);
      
      // Load and return user profile
      const profile = await this.loadUserProfile(user.uid);
      return profile;
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error('Errore durante il login. Verifica le credenziali.');
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.userProfile = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Errore durante il logout.');
    }
  }

  /**
   * Create new user account
   */
  async createUser(
    email: string, 
    password: string, 
    displayName: string,
    role: UserRole['role'] = 'athlete'
  ): Promise<UserProfile> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, { displayName });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName,
        role,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      this.userProfile = userProfile;

      return userProfile;
    } catch (error) {
      console.error('Create user error:', error);
      throw new Error('Errore durante la creazione dell\'account.');
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error('Errore durante il reset della password.');
    }
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): UserProfile | null {
    return this.userProfile;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole['role']): boolean {
    return this.userProfile?.role === role || this.userProfile?.role === 'admin';
  }

  /**
   * Get user's custom claims (roles)
   */
  async getUserClaims(): Promise<Record<string, unknown> | null> {
    if (!this.currentUser) return null;
    
    try {
      const idTokenResult = await getIdTokenResult(this.currentUser);
      return idTokenResult.claims;
    } catch (error) {
      console.error('Error getting user claims:', error);
      return null;
    }
  }

  /**
   * Load user profile from Firestore
   */
  private async loadUserProfile(uid: string): Promise<UserProfile> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        this.userProfile = {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate() || new Date()
        } as UserProfile;
      } else {
        // Create default profile if doesn't exist
        this.userProfile = {
          uid,
          email: this.currentUser?.email || '',
          displayName: this.currentUser?.displayName || '',
          role: 'athlete',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isActive: true
        };
        
        await setDoc(doc(db, 'users', uid), this.userProfile);
      }
      
      return this.userProfile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw new Error('Errore nel caricamento del profilo utente.');
    }
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(uid: string): Promise<void> {
    try {
      await setDoc(
        doc(db, 'users', uid), 
        { lastLoginAt: new Date() }, 
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }
}

export const authService = FirebaseAuthService.getInstance();