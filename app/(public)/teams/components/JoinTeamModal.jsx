'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine } from 'react-icons/ri';

export default function JoinTeamModal({ isOpen, onClose, onJoinSuccess, preFilledCode }) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCode(preFilledCode || '');
      setError('');
      setMessage('');
    }
  }, [isOpen, preFilledCode]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (!user) {
      setError('You need to be signed in to join a team');
      setIsLoading(false);
      return;
    }

    try {
      const functions = getFunctions();
      const joinTeamByCode = httpsCallable(functions, 'joinTeamByCode');
      const result = await joinTeamByCode({ code });

      if (result.data.pending) {
        setMessage('Join request sent! Your request is pending approval.');
      } else {
        setMessage('Successfully joined the team!');
      }
      setCode('');
      // Delay closing the modal by 5 seconds for the user to read the message
      setTimeout(() => {
        onJoinSuccess(result.data);
      }, 5000);
    } catch (err) {
      console.error('Join team error:', err);
      setError(err.message || 'Failed to join team. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-xl w-full max-w-md shadow-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4">
              <h2 className="text-xl font-semibold">Join a Team</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              <p className="text-gray-600 mb-4">
                Enter the team code provided by your coach or team admin
              </p>

              <form onSubmit={handleJoin} className="space-y-4">
                <Input
                  type="text"
                  name="teamCode"
                  placeholder="Enter team code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  disabled={loading}
                />

                {error && (
                  <div className="bg-red-100 text-red-600 p-2 rounded-lg text-sm mt-1">{error}</div>
                )}
                {message && (
                  <div className="bg-green-100 text-green-600 p-2 rounded-lg text-sm mt-1">{message}</div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                  >
                    Join Team
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}