import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

// User profile stored in Firestore
export interface UserProfile {
  uid: string
  email: string
  displayName: string
  phone?: string
  role: 'customer' | 'admin'
  createdAt: string
  // Account verification status
  isVerified: boolean      // Has verified via email link or password
  isGuest: boolean         // Created from checkout (not yet linked to Firebase Auth)
  // Order history
  orderNumbers?: string[]  // List of order numbers associated with this user
  // Saved addresses
  addresses?: {
    id: string
    address: string
    city: string
    state: string
    zip: string
    isDefault: boolean
  }[]
}

// Pending order data for account creation
export interface PendingOrderData {
  orderNumber: string
  name: string
  email: string
  phone?: string
  address: {
    address: string
    city: string
    state: string
    zip: string
  }
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  isAdmin: boolean
  // Auth methods
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  clearError: () => void
  // Email link auth for checkout
  sendEmailLink: (email: string, orderData: PendingOrderData) => Promise<void>
  completeEmailLinkSignIn: () => Promise<boolean>
  pendingEmailLink: boolean
  // Guest user creation for checkout
  createOrUpdateGuestUser: (orderData: PendingOrderData) => Promise<string>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Admin emails list (can be expanded later)
const ADMIN_EMAILS = ['admin@themidnightdough.com']

// Local storage keys for email link auth
const EMAIL_FOR_SIGNIN_KEY = 'emailForSignIn'
const PENDING_ORDER_KEY = 'pendingOrderData'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingEmailLink, setPendingEmailLink] = useState(false)

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile
      }
      return null
    } catch (err) {
      console.error('Error fetching user profile:', err)
      return null
    }
  }

  // Create user profile in Firestore (for verified Firebase Auth users)
  const createUserProfile = async (
    uid: string, 
    email: string, 
    displayName: string, 
    phone?: string,
    isGuest: boolean = false
  ): Promise<UserProfile> => {
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
    
    // Build profile object without undefined fields (Firestore doesn't accept undefined)
    const profile: UserProfile = {
      uid,
      email,
      displayName,
      role: isAdmin ? 'admin' : 'customer',
      createdAt: new Date().toISOString(),
      isVerified: !isGuest,  // Verified if created via Firebase Auth
      isGuest: isGuest,
      orderNumbers: [],
      addresses: []
    }
    
    // Only add phone if it's defined
    if (phone) {
      profile.phone = phone
    }
    
    await setDoc(doc(db, 'users', uid), profile)
    return profile
  }

  // Create or update a guest user from checkout (not linked to Firebase Auth yet)
  const createOrUpdateGuestUser = async (orderData: PendingOrderData): Promise<string> => {
    const email = orderData.email.toLowerCase()
    
    // Check if a user with this email already exists
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('email', '==', email))
    const snapshot = await getDocs(q)
    
    if (!snapshot.empty) {
      // User exists - add order to their history
      const existingUser = snapshot.docs[0]
      const userData = existingUser.data() as UserProfile
      
      // Update with new order and latest info
      await updateDoc(doc(db, 'users', existingUser.id), {
        orderNumbers: arrayUnion(orderData.orderNumber),
        // Update name/phone if provided (guest might have updated info)
        ...(orderData.name && { displayName: orderData.name }),
        ...(orderData.phone && { phone: orderData.phone }),
      })
      
      // Add/update address if not already saved
      if (orderData.address) {
        const addressExists = userData.addresses?.some(
          a => a.address === orderData.address.address && a.zip === orderData.address.zip
        )
        if (!addressExists) {
          await updateDoc(doc(db, 'users', existingUser.id), {
            addresses: arrayUnion({
              id: `addr-${Date.now()}`,
              address: orderData.address.address,
              city: orderData.address.city,
              state: orderData.address.state,
              zip: orderData.address.zip,
              isDefault: !userData.addresses?.length // Default if first address
            })
          })
        }
      }
      
      return existingUser.id
    }
    
    // Create new guest user
    const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const guestProfile: UserProfile = {
      uid: guestId,
      email,
      displayName: orderData.name,
      role: 'customer',
      createdAt: new Date().toISOString(),
      isVerified: false,
      isGuest: true,
      orderNumbers: [orderData.orderNumber],
      addresses: orderData.address ? [{
        id: `addr-${Date.now()}`,
        address: orderData.address.address,
        city: orderData.address.city,
        state: orderData.address.state,
        zip: orderData.address.zip,
        isDefault: true
      }] : []
    }
    
    if (orderData.phone) {
      guestProfile.phone = orderData.phone
    }
    
    await setDoc(doc(db, 'users', guestId), guestProfile)
    
    // Link order to guest user
    await updateDoc(doc(db, 'orders', orderData.orderNumber), {
      userId: guestId,
      userEmail: email
    })
    
    return guestId
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser.uid)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const profile = await fetchUserProfile(result.user.uid)
      
      // If no profile exists (shouldn't happen), create one
      if (!profile) {
        const newProfile = await createUserProfile(
          result.user.uid,
          email,
          result.user.displayName || email.split('@')[0]
        )
        setUserProfile(newProfile)
      } else {
        setUserProfile(profile)
      }
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      console.error('Login error:', firebaseError)
      switch (firebaseError.code) {
        case 'auth/invalid-email':
          setError('Invalid email address')
          break
        case 'auth/user-disabled':
          setError('This account has been disabled')
          break
        case 'auth/user-not-found':
          setError('No account found with this email')
          break
        case 'auth/wrong-password':
          setError('Incorrect password')
          break
        case 'auth/invalid-credential':
          setError('Invalid email or password')
          break
        default:
          setError('Failed to sign in. Please try again.')
      }
      throw err
    }
  }

  const register = async (email: string, password: string, name: string, phone?: string) => {
    setError(null)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update display name
      await updateProfile(result.user, { displayName: name })
      
      // Create user profile in Firestore
      const profile = await createUserProfile(result.user.uid, email, name, phone)
      setUserProfile(profile)
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      console.error('Registration error:', firebaseError)
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          setError('An account with this email already exists')
          break
        case 'auth/invalid-email':
          setError('Invalid email address')
          break
        case 'auth/weak-password':
          setError('Password should be at least 6 characters')
          break
        default:
          setError('Failed to create account. Please try again.')
      }
      throw err
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUserProfile(null)
    } catch (err) {
      console.error('Logout error:', err)
      setError('Failed to sign out')
      throw err
    }
  }

  const resetPassword = async (email: string) => {
    setError(null)
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      console.error('Password reset error:', firebaseError)
      switch (firebaseError.code) {
        case 'auth/user-not-found':
          setError('No account found with this email')
          break
        case 'auth/invalid-email':
          setError('Invalid email address')
          break
        default:
          setError('Failed to send reset email. Please try again.')
      }
      throw err
    }
  }

  // Send sign-in link to email (for checkout account creation)
  const sendEmailLink = async (email: string, orderData: PendingOrderData) => {
    setError(null)
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      }
      
      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      
      // Store email and order data in local storage for verification
      localStorage.setItem(EMAIL_FOR_SIGNIN_KEY, email)
      localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(orderData))
      setPendingEmailLink(true)
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      console.error('Email link error:', firebaseError)
      setError('Failed to send verification email. Please try again.')
      throw err
    }
  }

  // Complete sign-in with email link (called on /verify-email page)
  const completeEmailLinkSignIn = async (): Promise<boolean> => {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      return false
    }

    setError(null)
    try {
      const email = localStorage.getItem(EMAIL_FOR_SIGNIN_KEY)
      const orderDataStr = localStorage.getItem(PENDING_ORDER_KEY)
      
      if (!email) {
        setError('Email not found. Please try signing up again.')
        return false
      }

      const result = await signInWithEmailLink(auth, email, window.location.href)
      const orderData: PendingOrderData | null = orderDataStr ? JSON.parse(orderDataStr) : null
      
      // Check if there's an existing verified profile for this Firebase Auth user
      let profile = await fetchUserProfile(result.user.uid)
      
      // Check for existing guest profile with this email
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', email.toLowerCase()))
      const snapshot = await getDocs(q)
      const existingGuestDoc = snapshot.docs.find(d => (d.data() as UserProfile).isGuest)
      
      if (existingGuestDoc) {
        const guestData = existingGuestDoc.data() as UserProfile
        
        // Merge guest data into verified profile
        const mergedProfile: UserProfile = {
          uid: result.user.uid,
          email: email,
          displayName: guestData.displayName || orderData?.name || email.split('@')[0],
          role: guestData.role,
          createdAt: guestData.createdAt, // Keep original creation date
          isVerified: true,
          isGuest: false,
          orderNumbers: guestData.orderNumbers || [],
          addresses: guestData.addresses || [],
        }
        
        if (guestData.phone) {
          mergedProfile.phone = guestData.phone
        }
        
        // Add current order if not already included
        if (orderData?.orderNumber && !mergedProfile.orderNumbers?.includes(orderData.orderNumber)) {
          mergedProfile.orderNumbers = [...(mergedProfile.orderNumbers || []), orderData.orderNumber]
        }
        
        // Save the merged profile with the Firebase Auth UID
        await setDoc(doc(db, 'users', result.user.uid), mergedProfile)
        
        // Update all orders from guest profile to point to new UID
        for (const orderNum of guestData.orderNumbers || []) {
          try {
            await updateDoc(doc(db, 'orders', orderNum), {
              userId: result.user.uid
            })
          } catch (e) {
            console.warn(`Could not update order ${orderNum}:`, e)
          }
        }
        
        // Delete the old guest profile
        await deleteDoc(doc(db, 'users', existingGuestDoc.id))
        
        profile = mergedProfile
      } else if (!profile) {
        // No guest profile found, create new verified profile
        profile = await createUserProfile(
          result.user.uid,
          email,
          orderData?.name || email.split('@')[0],
          orderData?.phone
        )
        
        // Add address to profile
        if (orderData?.address) {
          await updateDoc(doc(db, 'users', result.user.uid), {
            addresses: arrayUnion({
              id: `addr-${Date.now()}`,
              address: orderData.address.address,
              city: orderData.address.city,
              state: orderData.address.state,
              zip: orderData.address.zip,
              isDefault: true
            })
          })
        }
        
        // Add order to profile
        if (orderData?.orderNumber) {
          await updateDoc(doc(db, 'users', result.user.uid), {
            orderNumbers: arrayUnion(orderData.orderNumber)
          })
          
          // Link order to user
          await updateDoc(doc(db, 'orders', orderData.orderNumber), {
            userId: result.user.uid
          })
        }
      }
      
      setUserProfile(profile)
      
      // Clean up local storage
      localStorage.removeItem(EMAIL_FOR_SIGNIN_KEY)
      localStorage.removeItem(PENDING_ORDER_KEY)
      setPendingEmailLink(false)
      
      return true
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      console.error('Email link sign-in error:', firebaseError)
      setError('Failed to verify email. The link may have expired.')
      return false
    }
  }

  const clearError = () => setError(null)

  const isAdmin = userProfile?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      error,
      isAdmin,
      login,
      register,
      logout,
      resetPassword,
      clearError,
      sendEmailLink,
      completeEmailLinkSignIn,
      pendingEmailLink,
      createOrUpdateGuestUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

