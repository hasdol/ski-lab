'use client'
import React, { useState } from 'react';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { addContactFormSubmission } from '@/lib/firebase/firestoreFunctions';

const Contact = () => {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');
    try {
      // Use the function from firestoreFunctions.js
      const docId = await addContactFormSubmission(subject, message, user.uid);
      console.log("Document written with ID: ", docId);
      setStatus('Success!');
      setSubject('');
      setMessage('');
      // Additional UI updates can be handled here
    } catch (error) {
      console.error("Error adding document: ", error);
      setStatus('Error sending message: ' + error.message);
      // You can show error messages to the user as needed
    }
  };

  return (
    <>
      <Head>
        <title>Ski-Lab: Contact</title>
        <meta name="description" content="Contact and get in touch with the website creator" />
      </Head>
      <div className="p-4 animate-fade-down animate-duration-300">
        <form className="flex flex-col my-5" onSubmit={handleSubmit}>
          <label htmlFor="subject" className="font-semibold mb-1">
            {t('subject')}
          </label>
          <input
            type="text"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('subject')}
            className="bg-container text-inputtxt border rounded p-2 mb-4"
            maxLength={100}
            required
          />
          <label htmlFor="message" className="font-semibold mb-1">
            {t('message')}
          </label>
          <textarea
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="5"
            placeholder={t('message')}
            className="bg-container text-inputtxt border rounded p-2 mb-4"
            maxLength={500}
            required
          ></textarea>
          <input
            type="submit"
            value={t('submit')}
            className="bg-btn text-btntxt hover:opacity-90 cursor-pointer py-3 px-5 rounded w-fit"
          />
        </form>
        {status && <div>{status}</div>}
      </div>
    </>
  );
};

export default Contact;
