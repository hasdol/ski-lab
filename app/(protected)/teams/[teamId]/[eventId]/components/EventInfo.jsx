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
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-500 tracking-wide uppercase">Post</div>
              <h3 className="font-semibold text-gray-900">New event update</h3>
              <p className="text-sm text-gray-600">Keep participants informed with quick notes.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm text-gray-600">{showComposer ? 'Hide' : 'Show'}</span>
              <Toggle enabled={showComposer} setEnabled={setShowComposer} label="Toggle new event info entry" />
            </div>
          </div>

          {showComposer && (
            <div className="mt-5 pt-5 border-t border-black/5 space-y-4">
              <Input
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="space-y-2">
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
              <div className="flex items-center justify-end gap-2">
                <Button
                  onClick={handlePost}
                  variant="primary"
                  loading={posting}
                  disabled={!title.trim() && !content.trim()}
                >
                  Post update
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card padded={false} className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-500 tracking-wide uppercase">Info</div>
            <h3 className="font-semibold text-gray-900">Event updates</h3>
            <p className="text-sm text-gray-600">Announcements and notes for this event.</p>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm">Failed to load info.</div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl bg-white/50 ring-1 ring-black/5 p-6 text-center">
            <div className="text-sm text-gray-700 font-medium">No updates yet</div>
            <div className="text-sm text-gray-600 mt-1">
              {canPost ? 'Post the first update to share event details.' : 'Check back later for event announcements.'}
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {entries.map((e) => {
              const createdAt = e.createdAt?.toDate ? e.createdAt.toDate() : null;
              const isEditing = editingId === e.id;
              const displayTitle = (isEditing ? editTitle : e.title) || '';
              return (
                <li
                  key={e.id}
                  className="rounded-2xl bg-white/60 ring-1 ring-black/5 p-4 transition-colors hover:bg-white/70"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <Input
                          type="text"
                          placeholder="Title (optional)"
                          value={editTitle}
                          onChange={(ev) => setEditTitle(ev.target.value)}
                        />
                      ) : (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <div className="font-semibold text-gray-900 break-words">
                            {displayTitle.trim() ? displayTitle : 'Update'}
                          </div>
                          {createdAt && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {formatDate(createdAt, true)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {canPost && (
                      <div className="flex gap-2 shrink-0">
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
                              disabled={!editTitle.trim() && !editContent.trim()}
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
                    <div className="mt-3 space-y-3">
                      <Input
                        type="textarea"
                        placeholder="Write your update"
                        value={editContent}
                        onChange={(ev) => setEditContent(ev.target.value)}
                        rows={10}
                        className="min-h-40"
                      />
                      <div className="text-xs text-gray-500">Supports Markdown.</div>
                    </div>
                  ) : (
                    e.content && (
                      <div className="mt-3 pt-3 border-t border-black/5">
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
