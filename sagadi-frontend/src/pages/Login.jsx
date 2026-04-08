import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Assignment as AssignmentIcon } from '@mui/icons-material';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, senha);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper variant="outlined" sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <AssignmentIcon sx={{ fontSize: 60, color: '#1F4E79' }} />
          </Box>
          
          <Typography
            component="h1"
            variant="h5"
            align="center"
            fontWeight="bold"
            color="#1F4E79"
            gutterBottom
          >
            SAGADI
          </Typography>
          
          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Sistema de Análise, Gestão e Arquivo Digital de Inspeções
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              variant="outlined"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="senha"
              label="Senha"
              type="password"
              id="senha"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={loading}
              variant="outlined"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                bgcolor: '#1F4E79',
                '&:hover': { bgcolor: '#0D2B44' },
                fontWeight: 'bold',
                textTransform: 'none',
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Entrar'}
            </Button>

            <Typography
              variant="body2"
              align="center"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              IACM - Instituto de Aviação Civil de Moçambique
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};