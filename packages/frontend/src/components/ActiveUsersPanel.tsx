import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import { ActiveUser } from '../types';

interface ActiveUsersPanelProps {
  users: ActiveUser[];
  currentUserId?: string;
}

/**
 * ActiveUsersPanel - Shows a list of users currently viewing/editing the document
 * Displays presence indicators with user names and last activity times
 */
const ActiveUsersPanel: React.FC<ActiveUsersPanelProps> = ({ users, currentUserId }) => {
  if (!users || users.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">No other users editing</Typography>
      </Box>
    );
  }

  const formatLastActivity = (lastActivity: string): string => {
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 10) return 'Now';
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1m ago';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1h ago';
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  const sortedUsers = [...users].sort((a, b) => {
    // Put current user at the bottom
    if (a.id === currentUserId) return 1;
    if (b.id === currentUserId) return -1;
    // Sort by most recent activity
    return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Active Users ({users.length})
        </Typography>
      </Box>

      <Divider />

      {/* User List */}
      <List sx={{ flex: 1, overflow: 'auto' }} disablePadding>
        {sortedUsers.map((user) => (
          <ListItem
            key={user.id}
            sx={{
              py: 1.5,
              px: 2,
              borderBottom: '1px solid #eee',
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: user.color,
                mr: 1.5,
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {user.name}
                  {user.id === currentUserId && (
                    <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                      (You)
                    </Typography>
                  )}
                </Typography>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {formatLastActivity(user.lastActivity)}
                  </Typography>
                  {user.status === 'editing' && (
                    <Chip
                      label="Editing"
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 'auto',
                        '& .MuiChip-label': { px: 0.75, py: 0.25, fontSize: '0.7rem' },
                      }}
                    />
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      {/* Footer Stats */}
      <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderTop: '1px solid #eee' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          {users.length} user{users.length !== 1 ? 's' : ''} online
        </Typography>
      </Box>
    </Box>
  );
};

export default ActiveUsersPanel;
