'use client'
import React, { useState } from 'react';
import useContactForm from '@/hooks/useContactForm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { RiMessage2Line, RiMailLine } from 'react-icons/ri';
import { useAuth } from '@/context/AuthContext';

const Contact = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { submitContactForm, status, loading } = useContactForm();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await submitContactForm(email, subject, message);
      // Reset only if user isn't logged in (preserve email if logged in)
      if (!user) setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      // Error state handled in hook
    }
  };

  return (
    <div className="p-4 max-w-4xl w-full self-center">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <RiMessage2Line className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact</h1>
          <p className="text-gray-600">Send us a message</p>
        </div>
      </div>

      <form className="bg-white shadow rounded-lg p-6 space-y-6" onSubmit={handleSubmit}>
        <Input
          type="email"
          name="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon={<RiMailLine className="text-gray-400" />}
        />

        <Input
          type="text"
          name="subject"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={100}
          required
        />

        <Input
          type="textarea"
          name="message"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
        />

        <div>
          <Button
            type="submit"
            loading={loading}
            variant="primary"
          >
            Submit
          </Button>
        </div>
      </form>
      {status && (
        <div className={`mt-4 p-3 rounded-lg ${status.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {status}
        </div>
      )}
    </div>
  );
};

export default Contact;