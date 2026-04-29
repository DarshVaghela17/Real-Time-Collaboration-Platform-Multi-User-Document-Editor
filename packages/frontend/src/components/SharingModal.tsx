import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { sharingAPI } from '../utils/api';

interface SharedUser {
  _id: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'commenter';
}

interface SharingModalProps {
  open: boolean;
  documentId: string;
  onClose: () => void;
}

const SharingModal: React.FC<SharingModalProps> = ({ open, documentId, onClose }) => {
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'viewer' | 'editor' | 'commenter'>('viewer');

  useEffect(() => {
    if (open) {
      loadSharedUsers();
    }
  }, [open, documentId]);

  const loadSharedUsers = async () => {
    try {
      setIsLoading(true);
      const response = await sharingAPI.getSharedWith(documentId);
      setSharedUsers(response.data);
    } catch (err) {
      console.error('Failed to load shared users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareDocument = async () => {
    if (!shareEmail.trim()) return;

    try {
      setIsLoading(true);
      const response = await sharingAPI.shareDocument(documentId, shareEmail, shareRole);
      setSharedUsers([...sharedUsers, response.data]);
      setShareEmail('');
      setShareRole('viewer');
    } catch (err) {
      console.error('Failed to share document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAccess = async (userId: string) => {
    if (confirm('Remove access for this user?')) {
      try {
        await sharingAPI.removeAccess(documentId, userId);
        setSharedUsers(sharedUsers.filter((u) => u._id !== userId));
      } catch (err) {
        console.error('Failed to remove access:', err);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Document</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Current Shared Users */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Shared with ({sharedUsers.length})
              </Typography>
              {sharedUsers.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  Not shared with anyone yet
                </Typography>
              ) : (
                <List dense>
                  {sharedUsers.map((user) => (
                    <ListItem
                      key={user._id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          color="error"
                          onClick={() => handleRemoveAccess(user._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={user.name}
                        secondary={`${user.email} • ${user.role}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Share with someone new
              </Typography>

              <TextField
                fullWidth
                label="Email address"
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                margin="normal"
                size="small"
                placeholder="user@example.com"
              />

              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value as any)}
                  label="Role"
                >
                  <MenuItem value="viewer">Viewer (read-only)</MenuItem>
                  <MenuItem value="commenter">Commenter</MenuItem>
                  <MenuItem value="editor">Editor</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {!isLoading && (
          <Button
            onClick={handleShareDocument}
            variant="contained"
            color="primary"
            disabled={!shareEmail.trim()}
          >
            Share
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SharingModal;
