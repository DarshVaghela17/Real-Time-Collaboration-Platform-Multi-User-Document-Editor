import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Theme state
  const [darkMode, setDarkMode] = useState(user?.theme === 'dark');

  // Delete account dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    if (!email.includes('@')) {
      setProfileError('Please enter a valid email address');
      return;
    }

    try {
      setProfileLoading(true);
      // TODO: Integrate with actual API
      // await userAPI.updateProfile({ name, email });
      console.log('Profile updated:', { name, email });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    try {
      setPasswordLoading(true);
      // TODO: Integrate with actual API
      // await authAPI.changePassword({ currentPassword, newPassword });
      console.log('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
    // TODO: Integrate with theme provider in App.tsx
    console.log('Theme changed to:', !darkMode ? 'dark' : 'light');
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      // TODO: Integrate with actual API
      // await userAPI.deleteAccount();
      console.log('Account deletion initiated');
      setOpenDeleteDialog(false);
      logout();
      navigate('/login');
    } catch (err: any) {
      console.error('Failed to delete account:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2 }}>
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Container maxWidth="sm" sx={{ py: 4 }}>
        {/* Profile Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Update your personal information
            </Typography>

            {profileError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setProfileError(null)}>
                {profileError}
              </Alert>
            )}

            {profileSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Profile updated successfully!
              </Alert>
            )}

            <form onSubmit={handleUpdateProfile}>
              <TextField
                fullWidth
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                disabled={profileLoading}
                required
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                disabled={profileLoading}
                required
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                disabled={profileLoading}
              >
                {profileLoading ? <CircularProgress size={24} /> : 'Update Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Divider sx={{ my: 3 }} />

        {/* Password Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Update your password to keep your account secure
            </Typography>

            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError(null)}>
                {passwordError}
              </Alert>
            )}

            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Password changed successfully!
              </Alert>
            )}

            <form onSubmit={handleChangePassword}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                margin="normal"
                disabled={passwordLoading}
                required
              />
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
                disabled={passwordLoading}
                required
                helperText="Minimum 6 characters"
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                disabled={passwordLoading}
                required
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                disabled={passwordLoading}
              >
                {passwordLoading ? <CircularProgress size={24} /> : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Divider sx={{ my: 3 }} />

        {/* Preferences Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Preferences
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={handleThemeToggle}
                />
              }
              label="Dark Mode"
              sx={{ display: 'block', my: 2 }}
            />
          </CardContent>
        </Card>

        <Divider sx={{ my: 3 }} />

        {/* Danger Zone */}
        <Card sx={{ mb: 3, backgroundColor: '#fff5f5' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#c92a2a' }}>
              Danger Zone
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Permanently delete your account and all associated data
            </Typography>

            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => setOpenDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outlined"
          fullWidth
          size="large"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          sx={{ py: 1.5 }}
        >
          Logout
        </Button>
      </Container>

      {/* Delete Account Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Account?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            This action cannot be undone. All your documents and data will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
