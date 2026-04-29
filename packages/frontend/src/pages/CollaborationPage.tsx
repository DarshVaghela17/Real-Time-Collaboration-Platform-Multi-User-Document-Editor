import React, { useState } from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tab,
  Tabs,
  LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimelineIcon from '@mui/icons-material/Timeline';
import PeopleIcon from '@mui/icons-material/People';
import MessageIcon from '@mui/icons-material/Message';
import ShareIcon from '@mui/icons-material/Share';
import GroupsIcon from '@mui/icons-material/Groups';
import EditIcon from '@mui/icons-material/Edit';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloudDoneIcon from '@mui/icons-material/CloudDone';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`collab-tabpanel-${index}`}
      aria-labelledby={`collab-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
};

const CollaborationPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [openInfoDialog, setOpenInfoDialog] = useState<string | null>(null);

  const features = [
    {
      id: 'presence',
      name: 'Active Users Panel',
      status: 'active' as const,
      percentage: 100,
      description: 'See who is currently viewing or editing documents',
      icon: <PeopleIcon />,
      enabled: true,
      details:
        'Shows real-time presence of all users viewing the same document. Color-coded user indicators help you identify teammates at a glance.',
      usage: 'Open any document → Editor sidebar → "Active Users" tab',
    },
    {
      id: 'comments',
      name: 'Threaded Comments',
      status: 'active' as const,
      percentage: 100,
      description: 'Leave and reply to comments, mention teammates',
      icon: <MessageIcon />,
      enabled: true,
      details:
        'Asynchronous collaboration through threaded comments. Mention teammates with @, resolve discussions, and keep feedback organized.',
      usage: 'Open any document → Editor sidebar → "Comments" tab → Add comment',
    },
    {
      id: 'sharing',
      name: 'Document Sharing',
      status: 'active' as const,
      percentage: 100,
      description: 'Share with specific roles (Viewer, Commenter, Editor)',
      icon: <ShareIcon />,
      enabled: true,
      details:
        'Fine-grained permission control. Share as Viewer (read-only), Commenter (comments only), or Editor (full access).',
      usage: 'Open any document → "Share" button → Enter email + select role',
    },
    {
      id: 'notifications',
      name: 'Notifications',
      status: 'active' as const,
      percentage: 100,
      description: 'Get notified when docs are shared, mentioned, or edited',
      icon: <NotificationsIcon />,
      enabled: true,
      details:
        'Stay informed of all collaboration activities. Get notifications for shares, mentions in comments, and document changes.',
      usage: 'Click notification bell on dashboard or go to /notifications',
    },
    {
      id: 'autosave',
      name: 'Auto-Save',
      status: 'active' as const,
      percentage: 100,
      description: 'Changes auto-saved every 2 seconds',
      icon: <CloudDoneIcon />,
      enabled: true,
      details:
        'No need to manually save. All changes are automatically saved to the backend every 2 seconds with debouncing.',
      usage: 'Edit any document → changes saved automatically in background',
    },
    {
      id: 'live-sync',
      name: 'Live Real-Time Sync',
      status: 'coming' as const,
      percentage: 0,
      description: 'See changes from others instantly (CRDT-based)',
      icon: <TimelineIcon />,
      enabled: false,
      details:
        'Using Yjs CRDT (Conflict-free Replicated Data Type) for true peer-to-peer collaboration. Changes sync instantly with automatic conflict resolution.',
      usage: 'Install Yjs server, enable Collaboration extension (coming soon)',
    },
    {
      id: 'cursors',
      name: 'Live Cursors',
      status: 'coming' as const,
      percentage: 0,
      description: 'See where others are typing in real-time',
      icon: <GroupsIcon />,
      enabled: false,
      details:
        'Color-coded cursors and selections. See exactly where each teammate is working for better coordination.',
      usage: 'Requires Yjs server + CollaborationCursor extension',
    },
    {
      id: 'history',
      name: 'Edit History',
      status: 'coming' as const,
      percentage: 30,
      description: 'Track who made which changes and when',
      icon: <EditIcon />,
      enabled: false,
      details:
        'Full audit trail of all edits. See who changed what, when it was changed, and why (from commit messages).',
      usage: 'Coming in next release',
    },
  ];

  const activeFeatures = features.filter(f => f.status === 'active');
  const comingFeatures = features.filter(f => f.status === 'coming');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
            Collaboration Features
          </Typography>
          <Chip
            label={`${activeFeatures.length}/${features.length} Active`}
            color="primary"
            variant="outlined"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
          />
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {/* Quick Overview */}
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent sx={{ pb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  Real-Time Collaboration
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Work together on documents with {activeFeatures.length} active collaboration features
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {activeFeatures.length}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  features active
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(activeFeatures.length / features.length) * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#4caf50',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            aria-label="collaboration tabs"
          >
            <Tab label={`Active (${activeFeatures.length})`} id="collab-tab-0" aria-controls="collab-tabpanel-0" />
            <Tab label={`Coming Soon (${comingFeatures.length})`} id="collab-tab-1" aria-controls="collab-tabpanel-1" />
            <Tab label="How to Collaborate" id="collab-tab-2" aria-controls="collab-tabpanel-2" />
          </Tabs>
        </Box>

        {/* Active Features Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {activeFeatures.map((feature) => (
              <Grid item xs={12} sm={6} md={4} key={feature.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ color: '#4caf50', mr: 1 }}>
                        {feature.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">{feature.name}</Typography>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Active"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => setOpenInfoDialog(feature.id)}
                    >
                      Learn More
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Coming Soon Tab */}
        <TabPanel value={tabValue} index={1}>
          <Alert severity="info" sx={{ mb: 3 }}>
            These features are in development and will be available soon. Want them faster?{' '}
            <Button size="small" onClick={() => navigate('/collaboration/request')}>
              Request Early Access
            </Button>
          </Alert>
          <Grid container spacing={3}>
            {comingFeatures.map((feature) => (
              <Grid item xs={12} sm={6} md={4} key={feature.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: 0.7,
                    transition: 'all 0.2s',
                    '&:hover': {
                      opacity: 1,
                      boxShadow: 2,
                    },
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ color: '#ffa726', mr: 1 }}>
                        {feature.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">{feature.name}</Typography>
                        <Chip
                          label={`${feature.percentage}% Complete`}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {feature.description}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={feature.percentage}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {feature.percentage}% complete
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => setOpenInfoDialog(feature.id)}
                    >
                      Learn More
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* How to Collaborate Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {/* Share Documents */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShareIcon /> Step 1: Share Documents
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>1.</ListItemIcon>
                      <ListItemText primary="Open a document" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>2.</ListItemIcon>
                      <ListItemText primary="Click 'Share' button in top bar" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>3.</ListItemIcon>
                      <ListItemText primary="Enter teammate's email" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>4.</ListItemIcon>
                      <ListItemText primary="Choose role (Viewer/Commenter/Editor)" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>5.</ListItemIcon>
                      <ListItemText primary="They get notification immediately" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* See Active Users */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon /> Step 2: See Who's Online
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>1.</ListItemIcon>
                      <ListItemText primary="Open a shared document" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>2.</ListItemIcon>
                      <ListItemText primary="Look at right sidebar 'Active Users' tab" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>3.</ListItemIcon>
                      <ListItemText primary="See all connected users with colors" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>4.</ListItemIcon>
                      <ListItemText primary="Color helps identify different people" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>5.</ListItemIcon>
                      <ListItemText primary="Updates in real-time as users join/leave" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Collaborate via Comments */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MessageIcon /> Step 3: Collaborate via Comments
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>1.</ListItemIcon>
                      <ListItemText primary="Open a document with others" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>2.</ListItemIcon>
                      <ListItemText primary="Click 'Comments' tab in sidebar" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>3.</ListItemIcon>
                      <ListItemText primary="Type your comment or feedback" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>4.</ListItemIcon>
                      <ListItemText primary="@ mention teammates to notify them" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>5.</ListItemIcon>
                      <ListItemText primary="They reply and conversation is tracked" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Stay Informed */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsIcon /> Step 4: Stay Informed
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>1.</ListItemIcon>
                      <ListItemText primary="Check notification bell on dashboard" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>2.</ListItemIcon>
                      <ListItemText primary="See all shares, mentions, and updates" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>3.</ListItemIcon>
                      <ListItemText primary="Click to go directly to document" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>4.</ListItemIcon>
                      <ListItemText primary="Mark as read to clear badge" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>5.</ListItemIcon>
                      <ListItemText primary="Archive old notifications" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Pro Tips */}
          <Card sx={{ mt: 3, background: '#f5f5f5' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                💡 Pro Tips for Better Collaboration
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Use Comments for feedback"
                    secondary="Keep conversations in document for context"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Share as Commenter for reviews"
                    secondary="They can suggest changes without overwriting"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Give Editor role to teammates"
                    secondary="They can make changes directly with auto-save"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Check Active Users before editing"
                    secondary="Avoid conflicts by knowing who's active"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Use dashboard search to find docs"
                    secondary="Filter by keywords to find shared docs quickly"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </TabPanel>
      </Container>

      {/* Feature Info Dialog */}
      {openInfoDialog && (
        <Dialog
          open={!!openInfoDialog}
          onClose={() => setOpenInfoDialog(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {features.find(f => f.id === openInfoDialog)?.name}
          </DialogTitle>
          <DialogContent>
            {features.find(f => f.id === openInfoDialog) && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {features.find(f => f.id === openInfoDialog)?.details}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  How to Use:
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {features.find(f => f.id === openInfoDialog)?.usage}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenInfoDialog(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default CollaborationPage;
