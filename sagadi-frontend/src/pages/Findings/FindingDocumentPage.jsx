import React, { useState, useEffect, useRef } from 'react';
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
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';

export const FindingDocumentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const documentRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finding, setFinding] = useState(null);

  useEffect(() => {
    carregarFinding();
  }, [id]);

  const carregarFinding = async () => {
    try {
      setLoading(true);
      const data = await FindingsService.buscarPorId(id);
      setFinding(data);
    } catch (error) {
      console.error('Erro ao carregar finding:', error);
      setError('Erro ao carregar detalhes do finding');
    } finally {
      setLoading(false);
    }
  };

 const handlePrint = () => {
  // Abrir a página de impressão em uma nova janela
  const printWindow = window.open(`/findings/${id}/documento/print`, '_blank');
  if (!printWindow) {
    alert('Pop-up bloqueado. Permita pop-ups para imprimir.');
    return;
  }
};

  if (loading) {
    return (
      <Layout title="Documento de Inspeção">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !finding) {
    return (
      <Layout title="Documento de Inspeção">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error || 'Finding não encontrado'}</Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/findings')}
            sx={{ mt: 2 }}
          >
            Voltar para Lista
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={`Documento - ${finding.numero_processo}`}>
      {/* Barra de Ações */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/findings/${id}`)}
        >
          Voltar para Detalhe
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Imprimir">
            <IconButton onClick={handlePrint} color="primary">
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Guardar como PDF">
            <IconButton onClick={handlePrint} color="primary">
              <PdfIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Documento Principal - referência para impressão */}
      <Paper 
        ref={documentRef}
        sx={{ 
          p: 4, 
          maxWidth: '210mm',
          mx: 'auto',
          bgcolor: 'white',
          boxShadow: 3,
        }}
      >
        {/* Cabeçalho do Documento */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            RECORD OF AERODROME INSPECTION FINDINGS
          </Typography>
          <Typography variant="subtitle1">
            {finding.numero_processo}
          </Typography>
        </Box>

        {/* PARTE 1 - Inspetor */}
        <Box sx={{ mb: 4 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: '#f5f5f5',
              borderLeft: '4px solid #1976d2',
              mb: 2
            }}
          >
            <Typography variant="h6" color="primary">
              PARTE 1: To be completed by the Aerodrome inspector
            </Typography>
          </Paper>

          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">
                  Aerodrome
                </Typography>
                <Typography variant="body1">
                  {finding.aerodromo?.codigo_oaci} - {finding.aerodromo?.nome}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">
                  Finding Number
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {finding.numero_processo}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">
                  Area of inspection
                </Typography>
                <Typography variant="body1">
                  {finding.area_inspecao?.codigo} - {finding.area_inspecao?.nome}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">
                  Date
                </Typography>
                <Typography variant="body1">
                  {new Date(finding.data_inspecao).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">
                  Name of the Inspector
                </Typography>
                <Typography variant="body1">
                  {finding.inspetor?.nome_completo}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">
                  Finding Level
                </Typography>
                <Typography variant="body1">
                  {finding.finding_level}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">
                  REFERENCE DOCUMENT
                </Typography>
                <Card variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: '#fafafa' }}>
                  <Typography variant="body2">
                    {finding.reference_document || 'Não especificado'}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">
                  FINDING
                </Typography>
                <Card variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: '#fafafa' }}>
                  <Typography variant="body2">
                    {finding.finding_descricao}
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* PARTE 2 - Operador */}
        <Box sx={{ mb: 4 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: '#f5f5f5',
              borderLeft: '4px solid #ff9800',
              mb: 2
            }}
          >
            <Typography variant="h6" color="warning.main">
              PARTE 2: To be completed by the Aerodrome Operator
            </Typography>
          </Paper>

          <Box sx={{ p: 2 }}>
            {finding.observacoes_operador ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">
                    OBSERVATIONS and REMARKS
                  </Typography>
                  <Card variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: '#fafafa' }}>
                    <Typography variant="body2">
                      {finding.observacoes_operador}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">
                    ROOT CAUSE (S)
                  </Typography>
                  <Card variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: '#fafafa' }}>
                    <Typography variant="body2">
                      {finding.root_causes}
                    </Typography>
                  </Card>
                </Grid>
                {finding.acoes_corretivas && finding.acoes_corretivas.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      PROPOSED CORRECTIVE ACTION(S)
                    </Typography>
                    <TableContainer component={Card} variant="outlined" sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Ação</TableCell>
                            <TableCell>Office Action</TableCell>
                            <TableCell>Evidência</TableCell>
                            <TableCell>Início</TableCell>
                            <TableCell>Fim</TableCell>
                            <TableCell>Progresso</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {finding.acoes_corretivas.map((acao, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{acao.acao}</TableCell>
                              <TableCell>{acao.office_action}</TableCell>
                              <TableCell>{acao.evidence_ref}</TableCell>
                              <TableCell>{acao.start_date ? new Date(acao.start_date).toLocaleDateString() : ''}</TableCell>
                              <TableCell>{acao.due_date ? new Date(acao.due_date).toLocaleDateString() : ''}</TableCell>
                              <TableCell>{acao.progress}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                O operador ainda não respondeu a este finding.
              </Typography>
            )}
          </Box>
        </Box>

        {/* PARTE 3 - IACM Follow-up */}
        <Box sx={{ mb: 4 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: '#f5f5f5',
              borderLeft: '4px solid #4caf50',
              mb: 2
            }}
          >
            <Typography variant="h6" color="success.main">
              PARTE 3: To be completed by the IACM
            </Typography>
          </Paper>

          <Box sx={{ p: 2 }}>
            {finding.comments_cap ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">
                    COMMENTS ON THE CAP
                  </Typography>
                  <Card variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: '#fafafa' }}>
                    <Typography variant="body2">
                      {finding.comments_cap}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">
                    EVALUATION OF ACTIONS
                  </Typography>
                  <Card variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: '#fafafa' }}>
                    <Typography variant="body2">
                      {finding.evaluation_actions}
                    </Typography>
                  </Card>
                </Grid>
                {finding.progress_documented && finding.progress_documented.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      PROGRESS DOCUMENTED
                    </Typography>
                    <TableContainer component={Card} variant="outlined" sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Review Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {finding.progress_documented.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.descricao}</TableCell>
                              <TableCell>{item.review_date ? new Date(item.review_date).toLocaleDateString() : ''}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">
                    Date of Application
                  </Typography>
                  <Typography variant="body1">
                    {finding.data_aplicacao_acoes ? new Date(finding.data_aplicacao_acoes).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">
                    Resolved Satisfactorily
                  </Typography>
                  <Typography variant="body1">
                    {finding.resolved_satisfactorily ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                {finding.inspector_assinatura && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      IACM Inspector's Name and Signature
                    </Typography>
                    <Typography variant="body1">
                      {finding.inspector_assinatura.nome_completo}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(finding.data_assinatura).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                Ainda não foi avaliado.
              </Typography>
            )}
          </Box>
        </Box>

        {/* Rodapé do Documento */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" color="textSecondary">
            Documento gerado pelo SAGADI - Sistema de Análise, Gestão e Arquivo Digital de Inspeções
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block">
            IACM - Instituto de Aviação Civil de Moçambique
          </Typography>
        </Box>
      </Paper>
    </Layout>
  );
};