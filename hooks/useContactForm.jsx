// src/hooks/useContactForm.js
import { useState } from 'react';
import { addContactFormSubmission } from '@/lib/firebase/firestoreFunctions';
import { useAuth } from '@/context/AuthContext';

const useContactForm = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const submitContactForm = async (email, subject, message, category = 'support') => {
    setLoading(true);
    setStatus('');
    try {
      await addContactFormSubmission({
        email,
        subject,
        message,
        category,
        userId: user?.uid || null  // Include UID if logged in
      });
      setStatus('Success! Your message has been sent. We will get back to you soon.');
    } catch (err) {
      console.error("Submission error: ", err);
      setStatus('Error sending message: ' + (err.message || 'Please try again later'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitContactForm, status, loading };
};

export default useContactForm;