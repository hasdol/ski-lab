import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    signOut
} from 'firebase/auth';
import { auth } from './config';
/**
 * Oppdater brukerprofil med gitt data.
 * @param {User} user - Firebase brukerobjekt.
 * @param {Object} updateData - Data som skal oppdateres (f.eks. displayName, photoURL).
 */

const registerWithEmailAndPassword = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        return userCredential;
    } catch (error) {
        console.error('Registration Error:', error.message);
        throw error;
    }
};

const loginWithEmailAndPassword = async (email, password) => {
    try {
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Login Error:', error.message);
        throw error;
    }
};


// Send password reset email
const sendPasswordReset = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error('Password Reset Error:', error.message);
        throw error;
    }
};

const signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Sign Out Error:', error.message);
        throw error;
    }
};



// Export only the used functions
export {
    registerWithEmailAndPassword,
    loginWithEmailAndPassword,
    sendPasswordReset,
    signOutUser
};
