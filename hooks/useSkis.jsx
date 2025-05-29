// src/hooks/useSkis.js
import { useState, useEffect } from 'react';
import { subscribeToUserSkis, addUserSkis, updateUserSki, deleteUserSki } from '@/lib/firebase/firestoreFunctions';
import { useAuth } from '@/context/AuthContext';
import { Timestamp } from 'firebase/firestore';

export const useSkis = () => {
  const [skis, setSkis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, userData } = useAuth();


  useEffect(() => {
    if (!user) {
      setSkis([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToUserSkis(
      user.uid, // Only the uid is needed now.
      (fetchedSkis) => {
        setSkis(fetchedSkis);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const addSki = async (skiData) => {
    if (!user) return;
    try {
      const planLimits = {
        free: 8,
        senior: 16,
        senior_pluss: 32,
        coach: 64,
        company: 5000,
      };
      const userPlan = userData?.plan || 'free';
      const maxTotalSkis = planLimits[userPlan];
      const totalSkis = (userData?.skiCount || 0) + (userData?.lockedSkisCount || 0);
      if (totalSkis >= maxTotalSkis) {
        alert(`You have reached the maximum number of skis in this plan`);
        return;
      }

      const newSkiData = {
        ...skiData,
        dateAdded: Timestamp.now()
      };

      if (newSkiData.grindDate && !(newSkiData.grindDate instanceof Timestamp)) {
        newSkiData.grindDate = Timestamp.fromDate(
          newSkiData.grindDate.toDate ? newSkiData.grindDate.toDate() : new Date(newSkiData.grindDate)
        );
      }

      if (newSkiData.grindHistory) {
        newSkiData.grindHistory = newSkiData.grindHistory.map(entry => ({
          ...entry,
          grindDate: entry.grindDate instanceof Timestamp
            ? entry.grindDate
            : Timestamp.fromDate(new Date(entry.grindDate)),
        }));
      }

      await addUserSkis(user.uid, newSkiData);
    } catch (error) {
      console.error("Error adding ski: ", error);
      setError(error);
    }
  };

  const updateSki = async (skiId, updatedSkiData) => {
    if (!user) return;
    try {
      if ('locked' in updatedSkiData) {
        delete updatedSkiData.locked;
      }
      const { dateAdded, id, ...dataToUpdate } = updatedSkiData;

      if (dataToUpdate.grindDate && !(dataToUpdate.grindDate instanceof Timestamp)) {
        dataToUpdate.grindDate = Timestamp.fromDate(new Date(dataToUpdate.grindDate));
      }

      if (dataToUpdate.grindHistory) {
        dataToUpdate.grindHistory = dataToUpdate.grindHistory.map(entry => ({
          ...entry,
          grindDate: entry.grindDate instanceof Timestamp
            ? entry.grindDate
            : Timestamp.fromDate(new Date(entry.grindDate)),
        }));
      }
      await updateUserSki(user.uid, skiId, dataToUpdate);
    } catch (error) {
      console.error("Error updating ski: ", error);
      setError(error);
    }
  };

  const deleteSki = async (skiId) => {
    if (!user) return;
    try {
      await deleteUserSki(user.uid, skiId);
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
