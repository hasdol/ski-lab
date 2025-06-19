import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    signOut
} from 'firebase/auth';
import { auth } from './firebaseConfig';
/**
 * Oppdater brukerprofil med gitt data.
 * @param {User} user - Firebase brukerobjekt.
 * @param {Object} updateData - Data som skal oppdateres (f.eks. displayName, photoURL).
 *//**
 * Registrer ny bruker med e-post og passord.
 * @param {string} email - Brukerens e-postadresse.
 * @param {string} password - Brukerens passord.
 * @returns {Promise<UserCredential>} - En promise som løser seg med brukerens legitimasjon ved suksess.
 * @throws {Error} - Kaster en feil hvis registreringen mislykkes.
 */

const registerWithEmailAndPassword = async (email, password) => {
    if (!email || !password) {
        throw new Error('Email and password are required.');
    }
    // Optionally add regex email validation
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        return userCredential;
    } catch (error) {
        console.error('Registration Error:', error.message);
        throw error;
    }
};
/**
 * Logg inn bruker med e-post og passord.
 * @param {string} email - Brukerens e-postadresse.
 * @param {string} password - Brukerens passord.
 * @returns {Promise<UserCredential>} - En promise som løser seg med brukerens legitimasjon ved suksess.
 * @throws {Error} - Kaster en feil hvis innlogging mislykkes.
 */

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
/**
 * Logg ut den nåværende brukeren.
 * @returns {Promise<void>} - En promise som løser seg når brukeren er logget ut.
 * @throws {Error} - Kaster en feil hvis utlogging mislykkes.
 */

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
