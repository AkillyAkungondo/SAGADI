import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { UsersService } from '../../services/users';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [direcoes, setDirecoes] = useState([]);
  
  // Estados para paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para diálogo
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    senha: '',
    perfil_id: '',
    direcao_id: '',
    cargo: '',
    telefone: '',
    ativo: true
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [usersData, perfisData, direcoesData] = await Promise.all([
        UsersService.listar(),
        UsersService.getPerfis(),
        UsersService.getDirecoes()
      ]);
      
      setUsers(usersData || []);
      setPerfis(perfisData || []);
      setDirecoes(direcoesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar lista de utilizadores');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nome_completo: user.nome_completo || '',
        email: user.email || '',
        senha: '',
        perfil_id: user.perfil_id || '',
        direcao_id: user.direcao_id || '',
        cargo: user.cargo || '',
        telefone: user.telefone || '',
        ativo: user.ativo !== undefined ? user.ativo : true
      });
    } else {
      setEditingUser(null);
      setFormData({
        nome_completo: '',
        email: '',
        senha: '',
        perfil_id: '',
        direcao_id: '',
        cargo: '',
        telefone: '',
        ativo: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      if (editingUser) {
        await UsersService.atualizar(editingUser.id, formData);
      } else {
        await UsersService.criar(formData);
      }
      
      await carregarDados();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar utilizador:', error);
      setError(error.response?.data?.error || 'Erro ao salvar utilizador');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAtivo = async (user) => {
    try {
      await UsersService.atualizar(user.id, { ativo: !user.ativo });
      await carregarDados();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      setError('Erro ao alterar status do utilizador');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Tem certeza que deseja desativar o utilizador ${user.nome_completo}?`)) {
      return;
    }
    
    try {
      await UsersService.deletar(user.id);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao desativar utilizador:', error);
      setError('Erro ao desativar utilizador');
    }
  };

  const getPerfilNome = (perfilId) => {
    const perfil = perfis.find(p => p.id === perfilId);
    return perfil?.nome || 'Desconhecido';
  };

  const getDirecaoNome = (direcaoId) => {
    const direcao = direcoes.find(d => d.id === direcaoId);
    return direcao?.sigla || 'N/A';
  };

  const filteredUsers = users.filter(user => 
    user.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getPerfilNome(user.perfil_id)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading && users.length === 0) {
    return (
      <Layout title="Gestão de Utilizadores">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Gestão de Utilizadores">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Utilizadores
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Utilizador
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Barra de Pesquisa */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <TextField
              fullWidth
              size="small"
              placeholder="Pesquisar por nome, email ou perfil..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item>
            <Tooltip title="Recarregar">
              <IconButton onClick={carregarDados}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela de Utilizadores */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Perfil</TableCell>
              <TableCell>Direção</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary" sx={{ py: 2 }}>
                    Nenhum utilizador encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.nome_completo}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getPerfilNome(user.perfil_id)} 
                      size="small"
                      color={user.perfil_id === 1 ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{getDirecaoNome(user.direcao_id)}</TableCell>
                  <TableCell>{user.cargo || '-'}</TableCell>
                  <TableCell>{user.telefone || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.ativo ? 'Ativo' : 'Inativo'}
                      color={user.ativo ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(user)}
                        disabled={user.id === currentUser?.id}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={user.ativo ? 'Desativar' : 'Ativar'}>
                      <IconButton
                        size="small"
                        color={user.ativo ? 'error' : 'success'}
                        onClick={() => handleToggleAtivo(user)}
                        disabled={user.id === currentUser?.id}
                      >
                        {user.ativo ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Desativar Permanentemente">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(user)}
                        disabled={user.id === currentUser?.id}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página"
        />
      </TableContainer>

      {/* Diálogo de Criar/Editar Utilizador */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              required
              name="nome_completo"
              label="Nome Completo"
              value={formData.nome_completo}
              onChange={handleChange}
            />
            
            <TextField
              fullWidth
              required
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            
            {!editingUser && (
              <TextField
                fullWidth
                required
                name="senha"
                label="Senha"
                type="password"
                value={formData.senha}
                onChange={handleChange}
                helperText="Mínimo 6 caracteres"
              />
            )}
            
            <FormControl fullWidth required>
              <InputLabel>Perfil</InputLabel>
              <Select
                name="perfil_id"
                value={formData.perfil_id}
                label="Perfil"
                onChange={handleChange}
              >
                {perfis.map(perfil => (
                  <MenuItem key={perfil.id} value={perfil.id}>
                    {perfil.nome} - {perfil.descricao}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Direção</InputLabel>
              <Select
                name="direcao_id"
                value={formData.direcao_id}
                label="Direção"
                onChange={handleChange}
              >
                <MenuItem value="">Nenhuma</MenuItem>
                {direcoes.map(direcao => (
                  <MenuItem key={direcao.id} value={direcao.id}>
                    {direcao.sigla} - {direcao.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              name="cargo"
              label="Cargo"
              value={formData.cargo}
              onChange={handleChange}
            />
            
            <TextField
              fullWidth
              name="telefone"
              label="Telefone"
              value={formData.telefone}
              onChange={handleChange}
            />
            
            {editingUser && (
              <FormControlLabel
                control={
                  <Switch
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleChange}
                  />
                }
                label="Ativo"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};