import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { documentAPI } from '../utils/api';
import { SkeletonCard } from '../components';
import FileUploadZone from '../components/FileUploadZone';
import HandshakeIcon from '@mui/icons-material/Handshake';

interface Document {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [dialogTab, setDialogTab] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  // Debounced search effect
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await documentAPI.getAll();
      console.log('Dashboard - Full response:', response);
      console.log('Dashboard - response.data:', response.data);

      // Handle different response formats from backend
      // Backend returns: { success, data: { documents, count } }
      let docs = [];
      if (Array.isArray(response.data)) {
        docs = response.data;
      } else if (response.data?.data?.documents && Array.isArray(response.data.data.documents)) {
        docs = response.data.data.documents;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        docs = response.data.data;
      } else if (response.data?.documentList && Array.isArray(response.data.documentList)) {
        docs = response.data.documentList;
      } else {
        console.warn('Unexpected documents format:', response.data);
        docs = [];
      }

      console.log('Setting documents:', docs);
      setDocuments(docs);
      setError(null);
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError(err.response?.data?.message || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      loadDocuments();
      return;
    }

    try {
      setIsSearching(true);
      // TODO: Use searchAPI when available
      // const response = await searchAPI.search(searchQuery);
      // Filter locally for now
      const filtered = documents.filter(
        doc =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setDocuments(filtered);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      setError('Document title is required');
      return;
    }

    try {
      const response = await documentAPI.create(newDocTitle, '');
      console.log('Create document response:', response.data);

      // Handle backend response structure: { success, message, data: { document } }
      let newDoc = response.data.data?.document || response.data.data || response.data;

      setDocuments([newDoc, ...documents]);
      setNewDocTitle('');
      setOpenDialog(false);
      const docId = newDoc._id || newDoc.id;
      navigate(`/editor/${docId}`);
    } catch (err: any) {
      console.error('Create document error:', err);
      setError(err.response?.data?.message || 'Failed to create document');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await documentAPI.delete(id);
        setDocuments(documents.filter((doc) => doc._id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete document');
      }
    }
  };

  const handleUploadSuccess = (documentId: string, title: string) => {
    setOpenDialog(false);
    setNewDocTitle('');
    setDialogTab(0);
    // Navigate to editor
    navigate(`/editor/${documentId}`);
  };

  const handleUploadError = (err: string) => {
    setError(err);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            📝 Collaboration Platform
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => navigate('/notifications')}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={unreadCount} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <AccountCircleIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.name}</Typography>
            </MenuItem>
            <MenuItem onClick={() => { navigate('/settings'); setAnchorEl(null); }}>
              <SettingsIcon sx={{ mr: 1 }} /> Settings
            </MenuItem>
            <MenuItem onClick={() => { navigate('/collaboration'); setAnchorEl(null); }}>
              <HandshakeIcon sx={{ mr: 1 }} /> Collaboration Hub
            </MenuItem>
            <MenuItem onClick={() => { navigate('/notifications'); setAnchorEl(null); }}>
              <NotificationsIcon sx={{ mr: 1 }} /> Notifications
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2 }}>
          <Typography variant="h4" component="h1">
            My Documents
          </Typography>
          <TextField
            placeholder="Search documents..."
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            variant="outlined"
            sx={{ width: 250 }}
            disabled={isLoading || isSearching}
            InputProps={{
              style: { fontSize: '0.9rem' },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            New Document
          </Button>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Grid container spacing={2}>
            {[...Array(6)].map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <SkeletonCard />
              </Grid>
            ))}
          </Grid>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="textSecondary" gutterBottom>
                No documents yet
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
                sx={{ mt: 2 }}
              >
                Create Your First Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {documents.map((doc, index) => (
              <Grid item xs={12} sm={6} md={4} key={doc._id || doc.id || `doc-${index}`}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => navigate(`/editor/${doc._id}`)}
                >
                  <CardContent>
                    <Typography variant="h6" component="div" noWrap>
                      {doc.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" noWrap sx={{ mt: 1 }}>
                      {doc.content || 'No content'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                      Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/editor/${doc._id}`);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc._id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Create/Upload Document Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Tabs value={dialogTab} onChange={(e, newValue) => setDialogTab(newValue)}>
            <Tab label="Create Blank" />
            <Tab label="Upload File" />
          </Tabs>
        </DialogTitle>

        <DialogContent>
          {/* Tab 1: Create Blank */}
          {dialogTab === 0 && (
            <TextField
              autoFocus
              margin="dense"
              label="Document Title"
              fullWidth
              variant="outlined"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateDocument();
                }
              }}
              sx={{ mt: 2 }}
            />
          )}

          {/* Tab 2: Upload File */}
          {dialogTab === 1 && (
            <Box sx={{ mt: 2 }}>
              <FileUploadZone
                onUploadSuccess={handleUploadSuccess}
                onError={handleUploadError}
              />
            </Box>
          )}
        </DialogContent>

        {dialogTab === 0 && (
          <DialogActions>
            <Button onClick={() => { setOpenDialog(false); setNewDocTitle(''); }}>Cancel</Button>
            <Button onClick={handleCreateDocument} variant="contained" color="primary">
              Create
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default Dashboard;
