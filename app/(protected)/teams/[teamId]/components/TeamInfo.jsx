'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addTeamTimelineEntry, deleteTeamTimelineEntry } from '@/lib/firebase/teamFunctions';
import { useTeamTimeline } from '@/hooks/useTeamTimeline';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/common/Spinner/Spinner';

export default function TeamInfo({ teamId, canPost }) {
  const { user } = useAuth();
  const { entries, loading, error } = useTeamTimeline(teamId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!canPost || !user) return;
    if (!title.trim() && !content.trim()) return;
    setPosting(true);
    try {
      await addTeamTimelineEntry(teamId, { title, content, createdBy: user.uid });
      setTitle('');
      setContent('');
    } catch (e) {
      console.error('Post failed:', e);
      alert(e.message || 'Failed to post.');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canPost) return;
    if (!confirm('Delete this entry?')) return;
    try {
      await deleteTeamTimelineEntry(teamId, id);
    } catch (e) {
      console.error('Delete failed:', e);
      alert(e.message || 'Failed to delete.');
    }
  };

  return (
    <div className="space-y-4">
      {canPost && (
        <div className="bg-white shadow rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">New timeline entry</h3>
          <Input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            type="textarea"
            placeholder='Write your update'
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handlePost} variant="primary" loading={posting}>
              Post
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Timeline</h3>
        {loading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : error ? (
          <div className="text-red-600 text-sm">Failed to load timeline.</div>
        ) : entries.length === 0 ? (
          <div className="text-gray-500 text-sm italic">No entries yet.</div>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => {
              const createdAt =
                e.createdAt?.toDate ? e.createdAt.toDate() : null;
              return (
                <li key={e.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {e.title || 'Update'}
                      </div>
                      {createdAt && (
                        <div className="text-xs text-gray-500">
                          {createdAt.toLocaleString()}
                        </div>
                      )}
                    </div>
                    {canPost && (
                      <Button
                        variant="danger"
                        className="text-xs px-3 py-1"
                        onClick={() => handleDelete(e.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                  {e.content && (
                    <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">
                      {e.content}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}