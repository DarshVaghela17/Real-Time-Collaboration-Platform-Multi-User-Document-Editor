import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import {
  Reply as ReplyIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  parentId: string | null;
  isResolved: boolean;
  replies?: Comment[];
  createdAt: Date;
}

interface CommentSectionProps {
  documentId: string;
  currentUserId: string;
  token: string;
}

export const CommentSection = ({
  documentId,
  currentUserId,
  token,
}: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { socket } = useSocket();

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [documentId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('comment-added', (_comment: Comment) => {
      fetchComments(); // Refresh comments
    });

    socket.on('comment-resolved', (_comment: Comment) => {
      fetchComments(); // Refresh comments
    });

    return () => {
      socket.off('comment-added');
      socket.off('comment-resolved');
    };
  }, [socket]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/documents/${documentId}/comments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments(response.data.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      if (socket) {
        socket.emit('new-comment', {
          documentId,
          content: newComment,
        });
      } else {
        await axios.post(
          `http://localhost:5000/api/documents/${documentId}/comments`,
          { content: newComment },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        fetchComments();
      }

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      if (socket) {
        socket.emit('new-comment', {
          documentId,
          content: replyContent,
          parentId,
        });
      } else {
        await axios.post(
          `http://localhost:5000/api/documents/${documentId}/comments`,
          { content: replyContent, parentId },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        fetchComments();
      }

      setReplyContent('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      if (socket) {
        socket.emit('resolve-comment', { commentId });
      } else {
        await axios.put(
          `http://localhost:5000/api/comments/${commentId}/resolve`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        fetchComments();
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment and all replies?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const renderComment = (comment: Comment, depth: number = 0) => (
    <Card
      key={comment.id}
      sx={{
        p: 2,
        mb: 1,
        ml: depth * 4,
        opacity: comment.isResolved ? 0.6 : 1,
        backgroundColor: comment.isResolved ? '#f5f5f5' : 'white',
      }}
    >
      <Stack spacing={1}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="subtitle2">{comment.userName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(comment.createdAt).toLocaleString()}
            </Typography>
            {comment.isResolved && (
              <Chip label="Resolved" size="small" color="success" />
            )}
          </Box>

          {/* Actions */}
          <Box>
            <IconButton
              size="small"
              onClick={() => setReplyTo(comment.id)}
              disabled={comment.isResolved}
            >
              <ReplyIcon fontSize="small" />
            </IconButton>

            <IconButton size="small" onClick={() => handleResolve(comment.id)}>
              <CheckCircleIcon
                fontSize="small"
                color={comment.isResolved ? 'success' : 'disabled'}
              />
            </IconButton>

            {comment.userId === currentUserId && (
              <IconButton size="small" onClick={() => handleDelete(comment.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Content */}
        <Typography variant="body2">{comment.content}</Typography>

        {/* Reply input */}
        {replyTo === comment.id && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply(comment.id);
                }
              }}
            />
            <Button size="small" onClick={() => handleReply(comment.id)}>
              Reply
            </Button>
            <Button size="small" onClick={() => setReplyTo(null)}>
              Cancel
            </Button>
          </Box>
        )}
      </Stack>

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {comment.replies.map((reply) => renderComment(reply, depth + 1))}
        </Box>
      )}
    </Card>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Comments ({comments.length})
      </Typography>

      {/* New comment input */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAddComment();
            }
          }}
        />
        <Button variant="contained" onClick={handleAddComment}>
          Comment
        </Button>
      </Box>

      {/* Comments list */}
      {comments.map((comment) => renderComment(comment))}
    </Box>
  );
};