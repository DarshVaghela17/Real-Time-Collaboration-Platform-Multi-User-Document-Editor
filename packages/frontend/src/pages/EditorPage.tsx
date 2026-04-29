import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Divider,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import HistoryIcon from '@mui/icons-material/History';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { documentAPI } from '../utils/api';
import CollaborativeEditor from '../components/CollaborativeEditor';
import CommentsPanel from '../components/CommentsPanel';
import SharingModal from '../components/SharingModal';
import VersionHistory from '../components/VersionHistory';
import ActiveUsersPanel from '../components/ActiveUsersPanel';

interface EditorDocument {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  permission?: 'viewer' | 'commenter' | 'editor' | 'owner';
  isFromUpload?: boolean;
}

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, activeUsers } = useSocket();

  const [document, setDocument] = useState<EditorDocument | null>(null);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState(0); // 0 = Comments, 1 = Active Users
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const response = await documentAPI.getOne(id);
      const doc = response.data.data?.document || response.data.data || response.data;
      setDocument(doc);
      setTitle(doc.title);

      // Check if current user is the owner
      // Owner can always edit, others can too by default
      // Only set read-only if explicitly not the owner and shared with viewer role
      const isOwner = doc.ownerId === user?.id || doc.owner === user?.id || doc.owner?._id === user?.id;
      
      // If not owner and has explicit viewer permission, set to read-only
      if (!isOwner && doc.permission === 'viewer') {
        setIsReadOnly(true);
        console.log('Document is read-only. Permission:', doc.permission);
      } else {
        setIsReadOnly(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDocument = async (content: string) => {
    if (!id) return;
    try {
      setIsSaving(true);
      const response = await documentAPI.update(id, title, content);
      const doc = response.data.data?.document || response.data.data || response.data;
      setDocument(doc);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!id || !title.trim()) return;
    try {
      await documentAPI.update(id, title, document?.content || '');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update title');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!document || !id) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography color="error">Document not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar>
          <Tooltip title="Back to Dashboard">
            <IconButton color="inherit" onClick={() => navigate('/dashboard')}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>

          <TextField
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            variant="standard"
            sx={{
              ml: 2,
              flex: 1,
              '& .MuiInput-input': {
                color: 'white',
                fontSize: '1.25rem',
                fontWeight: 500,
              },
            }}
            placeholder="Document Title"
            InputProps={{
              disableUnderline: false,
            }}
          />

          {isSaving && (
            <Typography variant="caption" sx={{ mr: 2, color: 'rgba(255,255,255,0.7)' }}>
              Saving...
            </Typography>
          )}

          {/* Collaboration Status */}
          <Tooltip title="Real-time collaboration status">
            <Chip
              icon={
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'lime',
                    marginRight: 4,
                  }}
                />
              }
              label="Live"
              size="small"
              variant="outlined"
              sx={{
                mr: 2,
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            />
          </Tooltip>

          <Tooltip title="Toggle Sidebar">
            <IconButton
              color={showSidebar ? 'secondary' : 'inherit'}
              onClick={() => setShowSidebar(!showSidebar)}
            >
              📋
            </IconButton>
          </Tooltip>

          <Tooltip title="Share">
            <IconButton color="inherit" onClick={() => setShowSharingModal(true)}>
              <ShareIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Version History">
            <IconButton color="inherit" onClick={() => setShowVersionHistory(true)}>
              <HistoryIcon />
            </IconButton>
          </Tooltip>

          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => {
              navigate('/dashboard');
              setAnchorEl(null);
            }}>
              Back to Dashboard
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Editor */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {isReadOnly && (
            <Alert severity="info" sx={{ mb: 2 }}>
              📖 You have read-only access to this document. Comments are enabled.
            </Alert>
          )}
          {document?.isFromUpload && (
            <Alert severity="info" sx={{ mb: 2 }}>
              📤 This document was uploaded from a file. The content has been extracted and is ready for editing.
            </Alert>
          )}
          {document?.isFromUpload && (!document?.content || document.content.trim().length === 0) && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️  The uploaded PDF appears to be a scanned image or contains no extractable text. No text content could be extracted. You can still add comments or manually type content.
            </Alert>
          )}
          <CollaborativeEditor
            documentId={id}
            socket={socket}
            userName={user?.name || 'User'}
            userColor={user?.color || '#3f51b5'}
            editable={!isReadOnly}
            onStateLoaded={() => {
              console.log('✅ Document synced and ready for editing');
            }}
          />
        </Box>

        {/* Comments Sidebar */}
        {showSidebar && (
          <>
            <Divider orientation="vertical" />
            <Drawer
              variant="permanent"
              anchor="right"
              sx={{
                width: 350,
                '& .MuiDrawer-paper': {
                  width: 350,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                },
              }}
            >
              {/* Sidebar Tabs */}
              <Tabs
                value={sidebarTab}
                onChange={(_, newValue) => setSidebarTab(newValue)}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Comments" id="sidebar-tab-0" aria-controls="sidebar-tabpanel-0" />
                <Tab label={`Active Users (${activeUsers.length})`} id="sidebar-tab-1" aria-controls="sidebar-tabpanel-1" />
              </Tabs>

              {/* Tab Content */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {sidebarTab === 0 && <CommentsPanel documentId={id} />}
                {sidebarTab === 1 && <ActiveUsersPanel users={activeUsers} currentUserId={user?.id} />}
              </Box>
            </Drawer>
          </>
        )}
      </Box>

      {/* Sharing Modal */}
      <SharingModal
        open={showSharingModal}
        documentId={id}
        onClose={() => setShowSharingModal(false)}
      />

      {/* Version History Modal */}
      <VersionHistory
        open={showVersionHistory}
        documentId={id}
        onClose={() => setShowVersionHistory(false)}
        onRestore={(content) => {
          setDocument({ ...document, content });
          handleSaveDocument(content);
        }}
      />
    </Box>
  );
};

export default EditorPage;
