// useSkis.js
import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { db } from '@/lib/firebase/config';

export const useSkis = () => {
    const [skis, setSkis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user, userData } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        if (!user) {
            setSkis([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const skiCollectionRef = collection(db, `users/${user.uid}/skis`);

        // Construct the query based on user's subscription status
        let skisQuery;
        if (userData?.isPro) {
            // Pro users can see all skis
            skisQuery = query(skiCollectionRef, orderBy("serialNumber"));
        } else {
            // Free users can see only unlocked skis
            skisQuery = query(skiCollectionRef, where("locked", "==", false), orderBy("serialNumber"));
        }

        const unsubscribe = onSnapshot(skisQuery, (snapshot) => {
            const fetchedSkis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSkis(fetchedSkis);
            setLoading(false);
        }, (err) => {
            setError(err);
            setLoading(false);
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, [user, userData?.isPro]);

    const addSki = async (skiData) => {
        if (!user) return;
        try {
            // Optionally enforce a max total skis limit
            const maxTotalSkis = userData?.isPro ? 48 : 12;
            const totalSkis = (userData?.skiCount || 0) + (userData?.lockedSkisCount || 0);
            
            if (totalSkis >= maxTotalSkis) {
                alert(`${t('max_skis_alert')} (${maxTotalSkis}).`);
                return;
            }
    
            const newSkiData = {
                ...skiData,
                dateAdded: Timestamp.now()
            };
    
            // Ensure grindDate is a Timestamp
            if (newSkiData.grindDate && !(newSkiData.grindDate instanceof Timestamp)) {
                newSkiData.grindDate = Timestamp.fromDate(newSkiData.grindDate.toDate ? newSkiData.grindDate.toDate() : new Date(newSkiData.grindDate));
            }
    
            // Convert grindHistory grindDates to Timestamp
            if (newSkiData.grindHistory) {
                newSkiData.grindHistory = newSkiData.grindHistory.map(entry => ({
                    ...entry,
                    grindDate: entry.grindDate instanceof Timestamp ? entry.grindDate : Timestamp.fromDate(new Date(entry.grindDate)),
                }));
            }
    
            await addDoc(collection(db, `users/${user.uid}/skis`), newSkiData);
        } catch (error) {
            console.error("Error adding ski: ", error);
            setError(error);
        }
    };
    

    const updateSki = async (skiId, updatedSkiData) => {
        if (!user) return;
        try {
            // Prevent updating 'locked' field from the client
            if ('locked' in updatedSkiData) {
                delete updatedSkiData.locked;
            }
    
            // Exclude 'dateAdded' from being updated
            const { dateAdded, id, ...dataToUpdate } = updatedSkiData;
    
            // Ensure grindDate is a Timestamp
            if (dataToUpdate.grindDate && !(dataToUpdate.grindDate instanceof Timestamp)) {
                dataToUpdate.grindDate = Timestamp.fromDate(new Date(dataToUpdate.grindDate));
            }
    
            // Convert grindHistory grindDates to Timestamp
            if (dataToUpdate.grindHistory) {
                dataToUpdate.grindHistory = dataToUpdate.grindHistory.map(entry => ({
                    ...entry,
                    grindDate: entry.grindDate instanceof Timestamp ? entry.grindDate : Timestamp.fromDate(new Date(entry.grindDate)),
                }));
            }
    
            const skiDocRef = doc(db, `users/${user.uid}/skis`, skiId);
            await updateDoc(skiDocRef, dataToUpdate);
        } catch (error) {
            console.error("Error updating ski: ", error);
            setError(error);
        }
    };
    

    const deleteSki = async (skiId) => {
        if (!user) return;
        try {
            const skiDocRef = doc(db, `users/${user.uid}/skis`, skiId);
            await deleteDoc(skiDocRef);
        } catch (error) {
            console.error("Error deleting ski: ", error);
            setError(error);
        }
    };

    const updateSkisList = (newSkis) => {
        setSkis(newSkis);
    };

    return {
        skis,
        loading,
        error,
        addSki,
        updateSki,
        deleteSki,
        updateSkisList,
        totalSkis: (userData?.skiCount || 0) + (userData?.lockedSkisCount || 0),
        lockedSkisCount: userData?.lockedSkisCount || 0,
    };
};
