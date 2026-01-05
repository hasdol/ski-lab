'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addEventInfoEntry, deleteEventInfoEntry, updateEventInfoEntry } from '@/lib/firebase/teamFunctions';
import { useEventInfo } from '@/hooks/useEventInfo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Spinner from '@/components/common/Spinner/Spinner';
import Card from '@/components/ui/Card';
import { formatDate } from '@/helpers/helpers';
import Markdown from '@/components/common/Markdown/Markdown';

export default function EventInfo({ teamId, eventId, canPost }) {
  const { user } = useAuth();
  const { entries, loading, error } = useEventInfo(teamId, eventId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const handlePost = async () => {
    if (!canPost || !user) return;
    if (!title.trim() && !content.trim()) return;
    setPosting(true);
    try {
      await addEventInfoEntry(teamId, eventId, { title, content, createdBy: user.uid });
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
      await deleteEventInfoEntry(teamId, eventId, id);
    } catch (e) {
      console.error('Delete failed:', e);
      alert(e.message || 'Failed to delete.');
    }
  };

  const beginEdit = (entry) => {
    setEditingId(entry.id);
    setEditTitle(entry.title || '');
    setEditContent(entry.content || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!canPost || !editingId) return;
    if (!editTitle.trim() && !editContent.trim()) return;

    setSavingEdit(true);
    try {
      await updateEventInfoEntry(teamId, eventId, editingId, { title: editTitle, content: editContent });
      cancelEdit();
    } catch (e) {
      console.error('Update failed:', e);
      alert(e.message || 'Failed to update.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {canPost && (
        <Card padded={false} className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 tracking-wide uppercase">Post</div>
              <h3 className="font-semibold text-gray-900">New update</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{showComposer ? 'Hide' : 'Show'}</span>
              <Toggle enabled={showComposer} setEnabled={setShowComposer} label="Toggle new info entry" />
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

      <Card padded={false} className="p-5">
        <div className="space-y-1 mb-4">
          <div className="text-xs font-semibold text-gray-500 tracking-wide uppercase">Info</div>
          <h3 className="font-semibold text-gray-900">Event updates</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm">Failed to load info.</div>
        ) : entries.length === 0 ? (
          <div className="text-gray-500 text-sm italic">No entries yet.</div>
        ) : (
          <ul className="space-y-4">
            {entries.map((e) => {
              const createdAt = e.createdAt?.toDate ? e.createdAt.toDate() : null;
              const isEditing = editingId === e.id;
              return (
                <li
                  key={e.id}
                  className="rounded-2xl bg-white/60 ring-1 ring-black/5 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      {isEditing ? (
                        <Input
                          type="text"
                          placeholder="Title (optional)"
                          value={editTitle}
                          onChange={(ev) => setEditTitle(ev.target.value)}
                        />
                      ) : (
                        <div className="font-semibold text-gray-900">{e.title || 'Update'}</div>
                      )}
                      {createdAt && <div className="text-xs text-gray-500">{formatDate(createdAt, true)}</div>}
                    </div>
                    {canPost && (
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="secondary"
                              className="text-xs px-3 py-1"
                              onClick={cancelEdit}
                              disabled={savingEdit}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              className="text-xs px-3 py-1"
                              onClick={saveEdit}
                              loading={savingEdit}
                            >
                              Save
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="secondary"
                              className="text-xs px-3 py-1"
                              onClick={() => beginEdit(e)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              className="text-xs px-3 py-1"
                              onClick={() => handleDelete(e.id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="mt-2">
                      <Input
                        type="textarea"
                        placeholder="Write your update"
                        value={editContent}
                        onChange={(ev) => setEditContent(ev.target.value)}
                        rows={10}
                        className="min-h-40"
                      />
                    </div>
                  ) : (
                    e.content && (
                      <div className="mt-2">
                        <Markdown>{e.content}</Markdown>
                      </div>
                    )
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
