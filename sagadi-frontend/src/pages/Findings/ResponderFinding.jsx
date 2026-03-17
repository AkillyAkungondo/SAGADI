import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { FindingsService } from '../../services/findings';
import { useAuth } from '../../context/AuthContext';
import { notify } from '../../components/Common/Notification';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  FormHelperText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

export const ResponderFinding = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isOperador } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [finding, setFinding] = useState(null);
  
  const [formData, setFormData] = useState({
    observacoes_operador: '',
    root_causes: '',
    acoes_corretivas: [
      { acao: '', office_action: '', evidence_ref: '', start_date: '', due_date: '', progress: 0 }
    ]
  });

  useEffect(() => {
    // Verificar se é operador
    if (!isOperador) {
      notify.error('Apenas operadores podem responder a findings');
      navigate('/findings');
      return;
    }
    
    carregarFinding();
  }, [id]);

  const carregarFinding = async () => {
    try {
      setLoading(true);
      const data = await FindingsService.buscarPorId(id);
      setFinding(data);
      
      // Verificar se pode responder
      if (data.status !== 'parte1_concluida' && data.status !== 'aguarda_parte2') {
        notify.error('Este finding não está disponível para resposta');
        navigate(`/findings/${id}`);
        return;
      }
      
      // Se já existir resposta, carregar dados
      if (data.observacoes_operador) {
        setFormData({
          observacoes_operador: data.observacoes_operador || '',
          root_causes: data.root_causes || '',
          acoes_corretivas: data.acoes_corretivas?.length ? 
            data.acoes_corretivas : 
            [{ acao: '', office_action: '', evidence_ref: '', start_date: '', due_date: '', progress: 0 }]
        });
      }
    } catch (error) {
      console.error('Erro ao carregar finding:', error);
      setError('Erro ao carregar dados do finding');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAcaoChange = (index, field, value) => {
    const novasAcoes = [...formData.acoes_corretivas];
    novasAcoes[index][field] = value;
    setFormData(prev => ({ ...prev, acoes_corretivas: novasAcoes }));
  };

  const adicionarAcao = () => {
    if (formData.acoes_corretivas.length < 4) {
      setFormData(prev => ({
        ...prev,
        acoes_corretivas: [
          ...prev.acoes_corretivas,
          { acao: '', office_action: '', evidence_ref: '', start_date: '', due_date: '', progress: 0 }
        ]
      }));
    } else {
      notify.warning('Máximo de 4 ações corretivas permitidas');
    }
  };

  const removerAcao = (index) => {
    if (formData.acoes_corretivas.length > 1) {
      const novasAcoes = formData.acoes_corretivas.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, acoes_corretivas: novasAcoes }));
    }
  };

  const handleProgressChange = (index, value) => {
    const progress = parseInt(value) || 0;
    if (progress >= 0 && progress <= 100) {
      handleAcaoChange(index, 'progress', progress);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validações básicas
    if (!formData.observacoes_operador.trim()) {
      setError('Observações são obrigatórias');
      setSubmitting(false);
      return;
    }

    if (!formData.root_causes.trim()) {
      setError('Root cause(s) é obrigatório');
      setSubmitting(false);
      return;
    }

    // Validar se pelo menos uma ação tem descrição
    const temAcaoValida = formData.acoes_corretivas.some(acao => acao.acao.trim() !== '');
    if (!temAcaoValida) {
      setError('Pelo menos uma ação corretiva deve ser preenchida');
      setSubmitting(false);
      return;
    }

    try {
      await FindingsService.updateParte2(id, formData);
      notify.success('Resposta enviada com sucesso!');
      navigate(`/findings/${id}`);
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      setError(error.response?.data?.error || 'Erro ao enviar resposta');
      notify.error('Erro ao enviar resposta');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Responder Finding">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error && !finding) {
    return (
      <Layout title="Responder Finding">
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/findings')}
            variant="contained"
          >
            Voltar para Lista
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={`Responder: ${finding?.numero_processo}`}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/findings/${id}`)}
        >
          Voltar para Detalhe
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom color="primary">
          Responder ao Finding - Parte 2
        </Typography>
        <Typography variant="subtitle1" gutterBottom color="textSecondary">
          Finding: {finding?.numero_processo} | Aeródromo: {finding?.aerodromo?.codigo_oaci} - {finding?.aerodromo?.nome}
        </Typography>
        
        <Divider sx={{ my: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Informações do Finding (read-only) */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Descrição do Finding:
                    </Typography>
                    <Typography variant="body2">
                      {finding?.finding_descricao}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Observações do Operador
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                name="observacoes_operador"
                value={formData.observacoes_operador}
                onChange={handleChange}
                required
                placeholder="Descreva as observações e comentários sobre o finding..."
                variant="outlined"
              />
              <FormHelperText>Campo obrigatório</FormHelperText>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Root Cause(s)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="root_causes"
                value={formData.root_causes}
                onChange={handleChange}
                required
                placeholder="Identifique a(s) causa(s) raiz do problema..."
                variant="outlined"
              />
              <FormHelperText>Campo obrigatório</FormHelperText>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Ações Corretivas Propostas
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Máximo de 4 ações. Preencha pelo menos uma ação.
              </Typography>
              
              {formData.acoes_corretivas.map((acao, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 3, p: 2, position: 'relative' }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Ação Corretiva {index + 1}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Descrição da Ação"
                        value={acao.acao}
                        onChange={(e) => handleAcaoChange(index, 'acao', e.target.value)}
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Office Action"
                        value={acao.office_action}
                        onChange={(e) => handleAcaoChange(index, 'office_action', e.target.value)}
                        placeholder="Ex: OS-2024-001"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Evidence Reference"
                        value={acao.evidence_ref}
                        onChange={(e) => handleAcaoChange(index, 'evidence_ref', e.target.value)}
                        placeholder="Ex: doc-001.pdf"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Data Início"
                        value={acao.start_date}
                        onChange={(e) => handleAcaoChange(index, 'start_date', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Data Fim"
                        value={acao.due_date}
                        onChange={(e) => handleAcaoChange(index, 'due_date', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Progresso %"
                        value={acao.progress}
                        onChange={(e) => handleProgressChange(index, e.target.value)}
                        InputProps={{ inputProps: { min: 0, max: 100 } }}
                      />
                    </Grid>
                  </Grid>

                  {formData.acoes_corretivas.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removerAcao(index)}
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Card>
              ))}

              {formData.acoes_corretivas.length < 4 && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={adicionarAcao}
                  sx={{ mt: 1 }}
                >
                  Adicionar Ação
                </Button>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/findings/${id}`)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={submitting}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Enviar Resposta'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Layout>
  );
};