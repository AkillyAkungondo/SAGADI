import React, { useState } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

export const PerfilPage = () => {
  const { user, alterarSenha } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [senhaData, setSenhaData] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  });

  const handleSenhaChange = (e) => {
    const { name, value } = e.target;
    setSenhaData(prev => ({ ...prev, [name]: value }));
  };

  const handleAlterarSenha = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (senhaData.nova_senha !== senhaData.confirmar_senha) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (senhaData.nova_senha.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    try {
      await alterarSenha(senhaData.senha_atual, senhaData.nova_senha);
      setSuccess('Senha alterada com sucesso!');
      setSenhaData({ senha_atual: '', nova_senha: '', confirmar_senha: '' });
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Meu Perfil">
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: '#1F4E79' }}>
                {user?.nome_completo?.charAt(0) || 'U'}
              </Avatar>
              <Typography variant="h5" gutterBottom>{user?.nome_completo}</Typography>
              <Chip label={user?.perfil?.nome} color="primary" sx={{ mb: 2 }} />
              <Divider sx={{ my: 2 }} />
              <List dense>
                <ListItem><EmailIcon sx={{ mr: 2 }} /><ListItemText primary="Email" secondary={user?.email} /></ListItem>
                <ListItem><BadgeIcon sx={{ mr: 2 }} /><ListItemText primary="Cargo" secondary={user?.cargo || '-'} /></ListItem>
                <ListItem><PhoneIcon sx={{ mr: 2 }} /><ListItemText primary="Telefone" secondary={user?.telefone || '-'} /></ListItem>
                <ListItem><BusinessIcon sx={{ mr: 2 }} /><ListItemText primary="Direção" secondary={user?.direcao?.nome || '-'} /></ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
              <Tab icon={<SecurityIcon />} label="Alterar Senha" />
              <Tab icon={<HistoryIcon />} label="Histórico de Ações" />
            </Tabs>

            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>Alterar Senha</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                <Box component="form" onSubmit={handleAlterarSenha}>
                  <TextField fullWidth type="password" name="senha_atual" label="Senha Atual" value={senhaData.senha_atual} onChange={handleSenhaChange} required sx={{ mb: 2 }} />
                  <TextField fullWidth type="password" name="nova_senha" label="Nova Senha" value={senhaData.nova_senha} onChange={handleSenhaChange} required helperText="Mínimo 6 caracteres" sx={{ mb: 2 }} />
                  <TextField fullWidth type="password" name="confirmar_senha" label="Confirmar Nova Senha" value={senhaData.confirmar_senha} onChange={handleSenhaChange} required sx={{ mb: 3 }} />
                  <Button type="submit" variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Alterar Senha'}</Button>
                </Box>
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>Histórico de Ações</Typography>
                <Alert severity="info">Funcionalidade em desenvolvimento. Em breve poderá ver todo o histórico das suas ações no sistema.</Alert>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};