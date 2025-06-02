'use client'
import React, { useState } from 'react';
import useContactForm from '@/hooks/useContactForm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const Contact = () => {
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
      <div className="p-3 md:w-1/2 mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 my-6">
          Contact
        </h1>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            type="text"
            name="subject"
            placeholder='Subject'
            onChange={(e) => setSubject(e.target.value)}
            value={subject}
            maxLength={100}
            required
          />

          <Input
            label='Message'
            type="textarea"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Message'
            required
          />

          <div>
            <Button
              type="submit"
              loading={loading}
              variant="primary">
              Submit
            </Button>
          </div>

        </form>
        {status && <div>{status}</div>}
      </div>
    </>
  );
};

export default Contact;
