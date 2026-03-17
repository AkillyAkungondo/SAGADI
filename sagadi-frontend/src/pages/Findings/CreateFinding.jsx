import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { FindingsService } from '../../services/findings';
import { AerodromosService } from '../../services/aerodromos';
import { AreasInspecaoService } from '../../services/areasInspecao';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

export const CreateFinding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [loadingDados, setLoadingDados] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [aerodromos, setAerodromos] = useState([]);
  const [areas, setAreas] = useState([]);
  
  const [formData, setFormData] = useState({
    aerodromo_id: '',
    area_inspecao_id: '',
    data_inspecao: new Date().toISOString().split('T')[0],
    finding_level: '',
    reference_document: '',
    finding_descricao: ''
  });

  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [gerandoNumero, setGerandoNumero] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (formData.aerodromo_id && formData.area_inspecao_id) {
      gerarNumeroProcesso();
    }
  }, [formData.aerodromo_id, formData.area_inspecao_id]);

  const carregarDados = async () => {
    try {
      const [aerodromosData, areasData] = await Promise.all([
        AerodromosService.listar(),
        AreasInspecaoService.listar()
      ]);
      
      setAerodromos(aerodromosData);
      setAreas(areasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados necessários.');
    } finally {
      setLoadingDados(false);
    }
  };

  const gerarNumeroProcesso = async () => {
    setGerandoNumero(true);
    try {
      const data = await FindingsService.gerarNumero({
        aerodromo_id: formData.aerodromo_id,
        area_inspecao_id: formData.area_inspecao_id
      });
      setNumeroProcesso(data.numero_processo);
    } catch (error) {
      console.error('Erro ao gerar número:', error);
    } finally {
      setGerandoNumero(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await FindingsService.criarParte1({
        ...formData,
        numero_processo: numeroProcesso
      });
      
      setSuccess('Finding criado com sucesso!');
      setTimeout(() => {
        navigate('/findings');
      }, 2000);
    } catch (error) {
      console.error('Erro ao criar finding:', error);
      setError(error.response?.data?.error || 'Erro ao criar finding');
    } finally {
      setLoading(false);
    }
  };

  if (loadingDados) {
    return (
      <Layout title="Novo Finding">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Novo Finding">
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/findings')}
        >
          Voltar para Lista
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Criar Novo Finding - Parte 1 (Inspetor)
        </Typography>
        
        <Stepper activeStep={0} sx={{ my: 4 }}>
          <Step>
            <StepLabel>Parte 1 - Inspeção</StepLabel>
          </Step>
          <Step>
            <StepLabel>Parte 2 - Resposta</StepLabel>
          </Step>
          <Step>
            <StepLabel>Parte 3 - Avaliação</StepLabel>
          </Step>
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Aeródromo</InputLabel>
                <Select
                  name="aerodromo_id"
                  value={formData.aerodromo_id}
                  label="Aeródromo"
                  onChange={handleChange}
                >
                  {aerodromos.map(aero => (
                    <MenuItem key={aero.id} value={aero.id}>
                      {aero.codigo_oaci} - {aero.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Área de Inspeção</InputLabel>
                <Select
                  name="area_inspecao_id"
                  value={formData.area_inspecao_id}
                  label="Área de Inspeção"
                  onChange={handleChange}
                >
                  {areas.map(area => (
                    <MenuItem key={area.id} value={area.id}>
                      {area.codigo} - {area.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número do Processo"
                value={numeroProcesso || 'Selecione aeródromo e área'}
                InputProps={{
                  readOnly: true,
                  endAdornment: gerandoNumero && <CircularProgress size={20} />
                }}
                helperText="Gerado automaticamente"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="date"
                name="data_inspecao"
                label="Data da Inspeção"
                value={formData.data_inspecao}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Nível do Finding</InputLabel>
                <Select
                  name="finding_level"
                  value={formData.finding_level}
                  label="Nível do Finding"
                  onChange={handleChange}
                >
                  <MenuItem value={1}>Nível 1 - Baixo</MenuItem>
                  <MenuItem value={2}>Nível 2 - Médio</MenuItem>
                  <MenuItem value={3}>Nível 3 - Alto</MenuItem>
                </Select>
                <FormHelperText>
                  Nível 1: Baixo | Nível 2: Médio | Nível 3: Alto
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                name="reference_document"
                label="Documento de Referência"
                value={formData.reference_document}
                onChange={handleChange}
                helperText="Ex: Anexo 14 - Volume I, Capítulo 3"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={4}
                name="finding_descricao"
                label="Descrição do Finding"
                value={formData.finding_descricao}
                onChange={handleChange}
                placeholder="Descreva detalhadamente a não conformidade encontrada..."
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/findings')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !numeroProcesso}
                >
                  {loading ? <CircularProgress size={24} /> : 'Criar Finding'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Layout>
  );
};