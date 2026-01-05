'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addTeamInfoEntry, deleteTeamInfoEntry } from '@/lib/firebase/teamFunctions';
import { useTeamInfo } from '@/hooks/useTeamInfo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Spinner from '@/components/common/Spinner/Spinner';
import Card from '@/components/ui/Card';
import { formatDate } from '@/helpers/helpers';
import Markdown from '@/components/common/Markdown/Markdown';

export default function TeamInfo({ teamId, canPost }) {
  const { user } = useAuth();
  const { entries, loading, error } = useTeamInfo(teamId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  const handlePost = async () => {
    if (!canPost || !user) return;
    if (!title.trim() && !content.trim()) return;
    setPosting(true);
    try {
      await addTeamInfoEntry(teamId, { title, content, createdBy: user.uid });
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
      await deleteTeamInfoEntry(teamId, id);
    } catch (e) {
      console.error('Delete failed:', e);
      alert(e.message || 'Failed to delete.');
    }
  };

  return (
    <div className="space-y-4">
      {canPost && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-800">New info entry</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {showComposer ? 'Hide' : 'Show'}
              </span>
              <Toggle
                enabled={showComposer}
                setEnabled={setShowComposer}
                label="Toggle new info entry"
              />
            </div>
          </div>

          {showComposer && (
            <>
              <Input
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="space-y-1">
                <Input
                  type="textarea"
                  placeholder="Write your update"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="min-h-48"
                />
                <p className="text-xs text-gray-500">
                  Supports Markdown (e.g. <span className="font-mono"># Heading</span>, <span className="font-mono">## Subheading</span>, lists, links).
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={handlePost} variant="primary" loading={posting}>
                  Post
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      <Card>
        <h3 className="font-semibold text-gray-800 mb-3">Info</h3>
        {loading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : error ? (
          <div className="text-red-600 text-sm">Failed to load info.</div>
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
                          {formatDate(createdAt, true)}
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
                    <div className="mt-2">
                      <Markdown>{e.content}</Markdown>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}