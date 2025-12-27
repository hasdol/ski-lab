'use client'
import React, { useState } from 'react';
import useContactForm from '@/hooks/useContactForm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { RiMessage2Line, RiMailLine } from 'react-icons/ri';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/layout/PageHeader'; // Add this import

const CONTACT_EMAIL = 'contact.skilab@gmail.com'; // TODO: update if your email is different
const INSTAGRAM_URL = 'https://www.instagram.com/skilab_com/';

const Contact = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('support');
  const { submitContactForm, status, loading } = useContactForm();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await submitContactForm(email, subject, message, category);
      // Reset only if user isn't logged in (preserve email if logged in)
      if (!user) setEmail('');
      setSubject('');
      setMessage('');
      setCategory('support');
    } catch (error) {
      // Error state handled in hook
    }
  };

  return (
    <div className="p-4 max-w-4xl w-full self-center">
      <PageHeader
        icon={<RiMessage2Line className="text-blue-600 text-2xl" />}
        title="Contact"
        subtitle={<span>Send us a message</span>}
        actions={null}
      />

      {/* NEW: Direct contact options */}
      <div className="bg-white shadow rounded-lg p-6 mb-6 space-y-2 text-sm text-gray-700">
        <div>
          Prefer email?{' '}
          <a className="text-blue-600 underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </div>
        <div>
          Follow updates on Instagram:{' '}
          <a
            className="text-blue-600 underline"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            @skilab_com
          </a>
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
          type="select"
          name="category"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { label: 'Support', value: 'support' },
            { label: 'Feature request', value: 'feature' },
            { label: 'Billing', value: 'billing' },
            { label: 'Other', value: 'other' },
          ]}
          required
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
        <div
          className={`mt-4 p-3 rounded-lg ${
            status.includes('Success')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {status}
        </div>
      )}
    </div>
  );
};

export default Contact;