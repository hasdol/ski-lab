// src/app/teams/components/PublicTeamsList.jsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { motion } from 'framer-motion';
import { RiTeamLine } from 'react-icons/ri';
import { useAuth } from '@/context/AuthContext';

const PublicTeamsList = ({ teams, loading, error, hasMore, onLoadMore, onRefresh, onJoin }) => {
  const { user } = useAuth();

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">
          Failed to load teams. Please try again.
        </p>
        <Button onClick={onRefresh} variant="primary">Retry</Button>
      </div>
    );
  }

  if (!loading && teams.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <RiTeamLine className="text-gray-500 text-2xl" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Public Teams Yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          There are no public teams available at the moment.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4 my-4">
        {teams.map((team) => {
          const isJoined = team.members?.includes(user?.uid);
          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white shadow rounded-lg p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {team.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  onClick={() => !isJoined && onJoin && onJoin(team)}
                  variant="secondary"
                  className="text-sm px-3 py-1.5"
                >
                  Join
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
      {loading && (
        <div className="flex justify-center py-4">
          <Spinner size="md" />
        </div>
      )}
      {!loading && hasMore && (
        <div className="flex justify-center mt-4">
          <Button onClick={onLoadMore} variant="primary" className="px-6 py-2">
            Load More Teams
          </Button>
        </div>
      )}
    </>
  );
};

export default PublicTeamsList;