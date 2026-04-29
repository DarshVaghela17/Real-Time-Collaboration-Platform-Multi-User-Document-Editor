import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { documentAPI } from '../utils/api';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [redirectLoading, setRedirectLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      console.log('Login successful, opening editor...');

      setRedirectLoading(true);
      // Get user's documents
      try {
        const response = await documentAPI.getAll();
        console.log('Documents response:', response.data);

        // Handle different response formats
        let documents = [];
        if (Array.isArray(response.data)) {
          documents = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          documents = response.data.data;
        }

        if (documents.length > 0) {
          // Redirect to first document
          console.log('Opening first document:', documents[0]._id);
          setTimeout(() => navigate(`/editor/${documents[0]._id}`), 100);
        } else {
          // Create new document and open it
          console.log('No documents found, creating new one...');
          const newDoc = await documentAPI.create('Untitled Document', '');
          const docId = newDoc.data._id || newDoc.data.data?._id;
          console.log('New document created:', docId);
          setTimeout(() => navigate(`/editor/${docId}`), 100);
        }
      } catch (docErr) {
        console.error('Error getting documents:', docErr);
        // If document fetch fails, go to dashboard as fallback
        setTimeout(() => navigate('/dashboard'), 100);
      }
    } catch (err) {
      console.error('Login error:', err);
      setRedirectLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
            Login
          </Typography>

          {error && (
            <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              disabled={isLoading || redirectLoading}
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              disabled={isLoading || redirectLoading}
              required
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              disabled={isLoading || redirectLoading || !email || !password}
              sx={{ mt: 3 }}
            >
              {isLoading || redirectLoading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </form>

          {redirectLoading && (
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
              Opening editor...
            </Typography>
          )}

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link href="/register" underline="hover">
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
