'use client'
import React, { useState } from 'react';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import useContactForm from '@/hooks/useContactForm';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

const Contact = () => {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { submitContactForm, status, loading } = useContactForm();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await submitContactForm(subject, message);
      setSubject('');
      setMessage('');
    } catch (error) {
      // Error state is already handled in the hook.
    }
  };

  return (
    <>
      <Head>
        <title>Ski-Lab: Contact</title> 
        <meta name="description" content="Contact and get in touch with the website creator" />
      </Head>
      <div className="p-3 mx-auto animate-fade-up animate-duration-300">
      <h1 className="text-3xl font-bold text-gray-900 my-4">
          {t('contact')}
        </h1>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <Input
            type="text"
            name="subject"
            placeholder={t('subject')}
            onChange={(e) => setSubject(e.target.value)}
            value={subject}
            maxLength={100}
            required
          />

          <Input
            label={t('message')}
            type="textarea"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('message')}
            required
          />

          <div>
            <Button
              type="submit"
              loading={loading}
              variant="primary">
              {t('submit')}
            </Button>
          </div>

        </form>
        {status && <div>{status}</div>}
      </div>
    </>
  );
};

export default Contact;
