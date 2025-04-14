// src/hooks/useContactForm.js
import { useState } from 'react';
import { addContactFormSubmission } from '@/lib/firebase/firestoreFunctions';
import { useAuth } from '@/context/AuthContext';

const useContactForm = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitContactForm = async (subject, message) => {
    setLoading(true);
    setStatus('');
    setError(null);
    try {
      const docId = await addContactFormSubmission(subject, message, user.uid);
      setStatus('Success!');
      return docId;
    } catch (err) {
      console.error("Error adding document: ", err);
      setError(err);
      setStatus('Error sending message: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitContactForm, status, loading, error };
};

export default useContactForm;
