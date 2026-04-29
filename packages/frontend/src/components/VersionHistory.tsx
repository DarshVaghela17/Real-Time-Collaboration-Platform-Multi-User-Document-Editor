import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { versionAPI } from '../utils/api';

interface Version {
  _id: string;
  content: string;
  createdAt: string;
  savedBy: {
    name: string;
  };
}

interface VersionHistoryProps {
  open: boolean;
  documentId: string;
  onClose: () => void;
  onRestore: (content: string) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  open,
  documentId,
  onClose,
  onRestore,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  useEffect(() => {
    if (open) {
      loadVersionHistory();
    }
  }, [open, documentId]);

  const loadVersionHistory = async () => {
    try {
      setIsLoading(true);
      const response = await versionAPI.getHistory(documentId);
      setVersions(response.data);
    } catch (err) {
      console.error('Failed to load version history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreVersion = async (version: Version) => {
    if (confirm('Restore this version? Current changes will be lost.')) {
      try {
        await versionAPI.restore(documentId, version._id);
        onRestore(version.content);
        onClose();
      } catch (err) {
        console.error('Failed to restore version:', err);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Version History</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : versions.length === 0 ? (
          <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
            No version history available
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Version List */}
            <Box sx={{ flex: '0 0 40%', borderRight: 1, borderColor: 'divider', pr: 2 }}>
              <List>
                {versions.map((version, index) => (
                  <ListItem
                    button
                    key={version._id}
                    selected={selectedVersion?._id === version._id}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <ListItemText
                      primary={`Version ${index + 1}`}
                      secondary={new Date(version.createdAt).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Version Preview */}
            <Box sx={{ flex: '1', overflow: 'auto' }}>
              {selectedVersion ? (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Saved by: {selectedVersion.savedBy.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                    {new Date(selectedVersion.createdAt).toLocaleString()}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      p: 2,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1,
                      maxHeight: 300,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedVersion.content || '(empty document)'}
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<RestoreIcon />}
                    onClick={() => handleRestoreVersion(selectedVersion)}
                    sx={{ mt: 2 }}
                  >
                    Restore This Version
                  </Button>
                </>
              ) : (
                <Typography variant="body2" color="textSecondary" align="center">
                  Select a version to preview
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionHistory;
