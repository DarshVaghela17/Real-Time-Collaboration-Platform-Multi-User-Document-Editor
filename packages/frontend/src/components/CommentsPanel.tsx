import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { commentAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  _id?: string;
  id?: string;
  content: string;
  author?: {
    _id: string;
    name: string;
  };
  userId?: string;
  userName?: string;
  createdAt: string;
  resolved?: boolean;
  isResolved?: boolean;
  replies?: Comment[];
}

interface CommentsPanelProps {
  documentId: string;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ documentId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const { user } = useAuth();

  // Normalize comment data from different API formats
  const normalizeComment = (data: any, index?: number): Comment => {
    const id = data._id || data.id || `comment-${Date.now()}-${index || Math.random()}`;
    return {
      _id: id,
      content: data.content,
      author: data.author || {
        _id: data.userId || '',
        name: data.userName || 'Unknown User',
      },
      createdAt: data.createdAt,
      resolved: data.resolved || data.isResolved || false,
      replies: data.replies?.map((reply: any, idx: number) => normalizeComment(reply, idx)),
    };
  };

  useEffect(() => {
    loadComments();
  }, [documentId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const response = await commentAPI.getAll(documentId);

      // Handle different response formats
      let commentsData = [];
      if (Array.isArray(response.data)) {
        commentsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        commentsData = response.data.data;
      } else if (response.data?.comments && Array.isArray(response.data.comments)) {
        commentsData = response.data.comments;
      }

      // Normalize all comments
      const normalizedComments = commentsData.map((c: any, idx: number) => normalizeComment(c, idx));
      setComments(normalizedComments);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await commentAPI.create(documentId, newComment, 0, 0);
      const newCommentData = response.data?.data || response.data;
      const normalizedComment = normalizeComment(newCommentData);
      setComments([...comments, normalizedComment]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm('Delete this comment?')) {
      try {
        await commentAPI.delete(documentId, commentId);
        setComments(comments.filter((c) => c._id !== commentId));
      } catch (err) {
        console.error('Failed to delete comment:', err);
      }
    }
  };

  const handleEditComment = async (commentId: string) => {
    try {
      const response = await commentAPI.update(documentId, commentId, editContent);
      const updatedCommentData = response.data?.data || response.data;
      const normalizedComment = normalizeComment(updatedCommentData);
      setComments(comments.map((c) => (c._id === commentId ? normalizedComment : c)));
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      console.error('Failed to edit comment:', err);
    }
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Comments
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <>
          {/* Comment List */}
          <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
            {comments.length === 0 ? (
              <Typography variant="body2" color="textSecondary" align="center">
                No comments yet
              </Typography>
            ) : (
              comments.map((comment) => (
                <Paper
                  key={comment._id}
                  sx={{
                    p: 2,
                    mb: 1,
                    backgroundColor: comment.resolved ? '#f0f0f0' : 'white',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {comment.author.name}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {comment.content}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    {user?.id === comment.author._id && (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingId(comment._id);
                            setEditContent(comment.content);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Paper>
              ))
            )}
          </Box>

          {/* Add Comment Form */}
          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              variant="outlined"
              size="small"
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              sx={{ mt: 1 }}
            >
              Post Comment
            </Button>
          </Box>
        </>
      )}

      {/* Edit Comment Dialog */}
      <Dialog open={editingId !== null} onClose={() => setEditingId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            variant="outlined"
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingId(null)}>Cancel</Button>
          <Button
            onClick={() => handleEditComment(editingId!)}
            variant="contained"
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommentsPanel;
