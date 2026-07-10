'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Send, Reply, Pin, Trash2, Smile, MoreHorizontal, X,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth, getInitials } from '@/lib/auth-context';
import { cn, timeAgo } from '@/lib/utils';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface CommentsProps {
  entityType: string;
  entityId: string;
}

interface Comment {
  id: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_name: string | null;
  content: string;
  parent_id: string | null;
  is_pinned: boolean;
  reactions: Record<string, string[]> | null;
  created_at: string;
  updated_at: string;
}

const QUICK_TEMPLATES = [
  'Approved',
  'Pending Review',
  'Need Revision',
  'Vendor Assigned',
  'Printing Started',
  'Installation Completed',
  'Budget Approved',
  'Invoice Pending',
  'Creative Approved',
  'Waiting for Vendor',
  'Photos Uploaded',
  'Need Follow Up',
  'Event Completed',
  'Leads Updated',
  'Admissions Updated',
];

const EMOJI_REACTIONS = ['👍', '❤️', '🎉', '🔥', '👀'];

function getInitialsFor(name: string | null | undefined): string {
  if (!name) return '?';
  return getInitials(name);
}

export function Comments({ entityType, entityId }: CommentsProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [activeEmojiFor, setActiveEmojiFor] = useState<string | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load comments');
      setComments([]);
    } else {
      setComments((data || []) as Comment[]);
    }
    setLoading(false);
  }, [entityType, entityId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Close emoji popover when clicking outside
  useEffect(() => {
    if (!activeEmojiFor) return;
    const handler = () => setActiveEmojiFor(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [activeEmojiFor]);

  // Close action menu when clicking outside
  useEffect(() => {
    if (!openMenuFor) return;
    const handler = () => setOpenMenuFor(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [openMenuFor]);

  const handlePost = async () => {
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    if (!user) {
      toast.error('You must be signed in to comment');
      return;
    }
    setPosting(true);
    const { error } = await supabase.from('comments').insert({
      entity_type: entityType,
      entity_id: entityId,
      user_id: user.id,
      user_name: profile?.full_name || user.email,
      content: newComment.trim(),
      parent_id: null,
      is_pinned: false,
      reactions: {},
    });

    if (error) {
      toast.error('Failed to post comment');
    } else {
      toast.success('Comment posted');
      setNewComment('');
      fetchComments();
    }
    setPosting(false);
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    if (!user) {
      toast.error('You must be signed in to reply');
      return;
    }
    const { error } = await supabase.from('comments').insert({
      entity_type: entityType,
      entity_id: entityId,
      user_id: user.id,
      user_name: profile?.full_name || user.email,
      content: replyContent.trim(),
      parent_id: parentId,
      is_pinned: false,
      reactions: {},
    });

    if (error) {
      toast.error('Failed to post reply');
    } else {
      toast.success('Reply posted');
      setReplyContent('');
      setReplyingTo(null);
      fetchComments();
    }
  };

  const handleReaction = async (comment: Comment, emoji: string) => {
    if (!user) {
      toast.error('You must be signed in to react');
      return;
    }
    const current = comment.reactions || {};
    const users = current[emoji] || [];
    const hasReacted = users.includes(user.id);

    const updated: Record<string, string[]> = { ...current };
    if (hasReacted) {
      updated[emoji] = users.filter((id) => id !== user.id);
      if (updated[emoji].length === 0) delete updated[emoji];
    } else {
      updated[emoji] = [...users, user.id];
    }

    const { error } = await supabase
      .from('comments')
      .update({ reactions: updated })
      .eq('id', comment.id);

    if (error) {
      toast.error('Failed to update reaction');
    } else {
      fetchComments();
    }
    setActiveEmojiFor(null);
  };

  const handleTogglePin = async (comment: Comment) => {
    const { error } = await supabase
      .from('comments')
      .update({ is_pinned: !comment.is_pinned })
      .eq('id', comment.id);

    if (error) {
      toast.error('Failed to toggle pin');
    } else {
      toast.success(comment.is_pinned ? 'Comment unpinned' : 'Comment pinned');
      fetchComments();
    }
    setOpenMenuFor(null);
  };

  const handleDelete = async (comment: Comment) => {
    const { error } = await supabase.from('comments').delete().eq('id', comment.id);
    if (error) {
      toast.error('Failed to delete comment');
    } else {
      toast.success('Comment deleted');
      fetchComments();
    }
    setOpenMenuFor(null);
  };

  const canDelete = (comment: Comment) => {
    if (!user) return false;
    return comment.user_id === user.id || profile?.role === 'super_admin';
  };

  // Split into pinned and regular, then build reply trees
  const pinnedComments = comments.filter((c) => c.is_pinned && !c.parent_id);
  const regularComments = comments.filter((c) => !c.is_pinned && !c.parent_id);
  const repliesFor = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId);

  const renderComment = (comment: Comment, isReply = false) => {
    const reactions = comment.reactions || {};
    return (
      <div
        key={comment.id}
        className={cn(
          'flex gap-3',
          isReply && 'ml-11'
        )}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs">
            {getInitialsFor(comment.user_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              {comment.user_name || 'Unknown'}
            </span>
            <span className="text-xs text-muted-foreground">
              {timeAgo(comment.created_at)}
            </span>
            {comment.is_pinned && (
              <Pin className="h-3 w-3 text-warning" />
            )}
          </div>

          <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Reactions */}
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            {Object.entries(reactions).map(([emoji, users]) => {
              if (!users || users.length === 0) return null;
              const hasReacted = user ? users.includes(user.id) : false;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReaction(comment, emoji)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                    hasReacted
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  <span>{emoji}</span>
                  <span className="font-medium">{users.length}</span>
                </button>
              );
            })}

            {/* Emoji picker toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveEmojiFor(activeEmojiFor === comment.id ? null : comment.id);
                }}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Add reaction"
              >
                <Smile className="h-4 w-4" />
              </button>
              {activeEmojiFor === comment.id && (
                <div
                  className="absolute left-0 top-7 z-10 flex gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  {EMOJI_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReaction(comment, emoji)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-base hover:bg-muted transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action row */}
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setReplyingTo(replyingTo === comment.id ? null : comment.id);
                setReplyContent('');
              }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuFor(openMenuFor === comment.id ? null : comment.id);
                }}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
              {openMenuFor === comment.id && (
                <div
                  className="absolute left-0 top-7 z-10 w-36 rounded-lg border border-border bg-popover p-1 shadow-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleTogglePin(comment)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <Pin className="h-3.5 w-3.5" />
                    {comment.is_pinned ? 'Unpin' : 'Pin'}
                  </button>
                  {canDelete(comment) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reply input */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleReply(comment.id);
                }}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={() => handleReply(comment.id)}
                disabled={!replyContent.trim()}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Replies */}
          {repliesFor(comment.id).length > 0 && (
            <div className="mt-3 space-y-3">
              {repliesFor(comment.id).map((reply) =>
                renderComment(reply, true)
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Quick templates */}
      <div className="mb-3">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Quick Comment Templates
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TEMPLATES.map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => setNewComment(template)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                newComment === template
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {template}
            </button>
          ))}
        </div>
      </div>

      {/* New comment input */}
      <div className="mb-4 flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[44px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handlePost();
            }
          }}
        />
        <Button onClick={handlePost} disabled={posting || !newComment.trim()}>
          <Send className="h-4 w-4 mr-1" />
          Post
        </Button>
      </div>

      {/* Comments list */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-full rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-2 text-3xl">💬</div>
            <p className="text-sm font-medium text-foreground">No comments yet</p>
            <p className="text-xs text-muted-foreground">
              Start the conversation by posting a comment above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pinned comments */}
            {pinnedComments.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-warning">
                  <Pin className="h-3 w-3" />
                  Pinned
                </div>
                {pinnedComments.map((c) => renderComment(c))}
                {pinnedComments.length > 0 && regularComments.length > 0 && (
                  <div className="border-t border-border pt-2" />
                )}
              </div>
            )}

            {/* Regular comments */}
            {regularComments.map((c) => renderComment(c))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default Comments;
