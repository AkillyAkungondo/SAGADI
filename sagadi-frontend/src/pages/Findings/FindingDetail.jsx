import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { FindingsService } from '../../services/findings';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

export const FindingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isInspetor, isOperador, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finding, setFinding] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const [openResposta, setOpenResposta] = useState(false);
  const [openAvaliacao, setOpenAvaliacao] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);

  const [respostaData, setRespostaData] = useState({
    observacoes_operador: "",
    root_causes: "",
    acoes_corretivas: [
      { acao: "", office_action: "", evidence_ref: "", start_date: "", due_date: "", progress: 0 },
    ],
  });

  const [avaliacaoData, setAvaliacaoData] = useState({
    comments_cap: "",
    evaluation_actions: "",
    data_aplicacao_acoes: "",
    resolved_satisfactorily: false,
    progress_documented: [{ descricao: "", review_date: "" }],
  });

  const [uploadFile, setUploadFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    carregarFinding();
  }, [id]);

  useEffect(() => {
    if (finding && new URLSearchParams(location.search).get('avaliar') === 'true') {
      setOpenAvaliacao(true);
    }
  }, [finding, location.search]);

  const carregarFinding = async () => {
    try {
      setLoading(true);
      const data = await FindingsService.buscarPorId(id);
      setFinding(data);

      if (data.observacoes_operador) {
        setRespostaData({
          observacoes_operador: data.observacoes_operador || "",
          root_causes: data.root_causes || "",
          acoes_corretivas: data.acoes_corretivas?.length ? data.acoes_corretivas : [{ acao: "", office_action: "", evidence_ref: "", start_date: "", due_date: "", progress: 0 }],
        });
      }

      if (data.comments_cap) {
        setAvaliacaoData({
          comments_cap: data.comments_cap || "",
          evaluation_actions: data.evaluation_actions || "",
          data_aplicacao_acoes: data.data_aplicacao_acoes ? new Date(data.data_aplicacao_acoes).toISOString().split("T")[0] : "",
          resolved_satisfactorily: data.resolved_satisfactorily || false,
          progress_documented: data.progress_documented?.length ? data.progress_documented : [{ descricao: "", review_date: "" }],
        });
      }
    } catch (error) {
      console.error("Erro ao carregar finding:", error);
      setError("Erro ao carregar detalhes do finding");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  const getStatusChip = (status) => {
    const statusConfig = {
      rascunho: { color: "default", icon: <PendingIcon />, label: "Rascunho" },
      parte1_concluida: { color: "info", icon: <CheckCircleIcon />, label: "Aguardando Operador" },
      aguarda_parte2: { color: "info", icon: <PendingIcon />, label: "Aguardando Parte 2" },
      parte2_concluida: { color: "warning", icon: <WarningIcon />, label: "Aguardando Avaliação" },
      aguarda_avaliacao: { color: "warning", icon: <WarningIcon />, label: "Aguardando Avaliação" },
      em_correcao: { color: "error", icon: <ErrorIcon />, label: "Em Correção" },
      encerrado: { color: "success", icon: <CheckCircleIcon />, label: "Encerrado" },
    };
    const config = statusConfig[status] || { color: "default", icon: <PendingIcon />, label: status };
    return <Chip icon={config.icon} label={config.label} color={config.color} size="small" />;
  };

  const getStepFromStatus = (status) => {
    switch (status) {
      case "rascunho":
      case "parte1_concluida": return 1;
      case "aguarda_parte2":
      case "parte2_concluida": return 2;
      case "aguarda_avaliacao":
      case "em_correcao": return 2;
      case "encerrado": return 3;
      default: return 0;
    }
  };

  const podeResponder = () => {
    return (isOperador || isAdmin) && (finding?.status === "parte1_concluida" || finding?.status === "aguarda_parte2");
  };

  const podeAvaliar = () => {
    return (isInspetor || isAdmin) && (finding?.status === "parte2_concluida" || finding?.status === "aguarda_avaliacao");
  };

  const handleRespostaChange = (e) => {
    const { name, value } = e.target;
    setRespostaData(prev => ({ ...prev, [name]: value }));
  };

  const handleAcaoChange = (index, field, value) => {
    const novasAcoes = [...respostaData.acoes_corretivas];
    novasAcoes[index][field] = value;
    setRespostaData(prev => ({ ...prev, acoes_corretivas: novasAcoes }));
  };

  const adicionarAcao = () => {
    if (respostaData.acoes_corretivas.length < 4) {
      setRespostaData(prev => ({
        ...prev,
        acoes_corretivas: [...prev.acoes_corretivas, { acao: "", office_action: "", evidence_ref: "", start_date: "", due_date: "", progress: 0 }]
      }));
    }
  };

  const removerAcao = (index) => {
    if (respostaData.acoes_corretivas.length > 1) {
      const novasAcoes = respostaData.acoes_corretivas.filter((_, i) => i !== index);
      setRespostaData(prev => ({ ...prev, acoes_corretivas: novasAcoes }));
    }
  };

  const handleProgressChange = (index, value) => {
    const progress = parseInt(value) || 0;
    if (progress >= 0 && progress <= 100) handleAcaoChange(index, "progress", progress);
  };

  const handleSubmitResposta = async () => {
    setSubmitting(true);
    try {
      await FindingsService.updateParte2(id, respostaData);
      setOpenResposta(false);
      await carregarFinding();
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);
      setError("Erro ao enviar resposta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvaliacaoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAvaliacaoData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleProgressDocChange = (index, field, value) => {
    const novosProgress = [...avaliacaoData.progress_documented];
    novosProgress[index][field] = value;
    setAvaliacaoData(prev => ({ ...prev, progress_documented: novosProgress }));
  };

  const adicionarProgressDoc = () => {
    if (avaliacaoData.progress_documented.length < 4) {
      setAvaliacaoData(prev => ({
        ...prev,
        progress_documented: [...prev.progress_documented, { descricao: "", review_date: "" }]
      }));
    }
  };

  const removerProgressDoc = (index) => {
    if (avaliacaoData.progress_documented.length > 1) {
      const novosProgress = avaliacaoData.progress_documented.filter((_, i) => i !== index);
      setAvaliacaoData(prev => ({ ...prev, progress_documented: novosProgress }));
    }
  };

  const handleSubmitAvaliacao = async () => {
    setSubmitting(true);
    try {
      await FindingsService.updateParte3(id, avaliacaoData);
      setOpenAvaliacao(false);
      await carregarFinding();
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      setError("Erro ao enviar avaliação");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => setUploadFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setSubmitting(true);
    try {
      await FindingsService.uploadAnexo(id, uploadFile);
      setOpenUpload(false);
      setUploadFile(null);
      await carregarFinding();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setError("Erro ao fazer upload do ficheiro");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Detalhe do Finding">
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !finding) {
    return (
      <Layout title="Detalhe do Finding">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error || "Finding não encontrado"}</Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/findings")} sx={{ mt: 2 }}>Voltar para Lista</Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={`Finding ${finding.numero_processo}`}>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/findings")}>Voltar para Lista</Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Ver Documento Oficial">
            <IconButton onClick={() => navigate(`/findings/${id}/documento`)} color="primary"><DescriptionIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Upload de Anexo">
            <IconButton onClick={() => setOpenUpload(true)} color="primary"><AttachFileIcon /></IconButton>
          </Tooltip>
          {podeResponder() && (
            <Button variant="contained" startIcon={<SendIcon />} onClick={() => setOpenResposta(true)}>Responder</Button>
          )}
          {podeAvaliar() && (
            <Button variant="contained" color="warning" startIcon={<AssignmentIcon />} onClick={() => setOpenAvaliacao(true)}>Avaliar</Button>
          )}
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={getStepFromStatus(finding.status)} alternativeLabel>
          <Step><StepLabel>Parte 1 - Inspeção</StepLabel></Step>
          <Step><StepLabel>Parte 2 - Resposta</StepLabel></Step>
          <Step><StepLabel>Parte 3 - Avaliação</StepLabel></Step>
        </Stepper>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><Typography variant="caption" color="textSecondary">Número do Processo</Typography><Typography variant="body1" fontWeight="bold">{finding.numero_processo}</Typography></Grid>
          <Grid item xs={12} md={2}><Typography variant="caption" color="textSecondary">Status</Typography><Box sx={{ mt: 0.5 }}>{getStatusChip(finding.status)}</Box></Grid>
          <Grid item xs={12} md={2}><Typography variant="caption" color="textSecondary">Prioridade</Typography><Typography variant="body1">{finding.prioridade?.toUpperCase()}</Typography></Grid>
          <Grid item xs={12} md={2}><Typography variant="caption" color="textSecondary">Data de Vencimento</Typography><Typography variant="body1" color={finding.data_vencimento && new Date(finding.data_vencimento) < new Date() ? "error" : "inherit"}>{finding.data_vencimento ? new Date(finding.data_vencimento).toLocaleDateString() : "N/A"}</Typography></Grid>
          <Grid item xs={12} md={3}><Typography variant="caption" color="textSecondary">Inspetor Responsável</Typography><Typography variant="body1">{finding.inspetor?.nome_completo}</Typography></Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Parte 1 - Inspeção" />
          <Tab label="Parte 2 - Resposta" disabled={!finding.parte_2_concluida_em && finding.status === "parte1_concluida"} />
          <Tab label="Parte 3 - Avaliação" disabled={finding.status !== "encerrado" && !finding.comments_cap} />
          <Tab label="Anexos" />
        </Tabs>

        {/* Parte 1 */}
        {tabValue === 0 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}><Typography variant="caption" color="textSecondary">Aeródromo</Typography><Typography variant="body1">{finding.aerodromo?.codigo_oaci} - {finding.aerodromo?.nome}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography variant="caption" color="textSecondary">Área de Inspeção</Typography><Typography variant="body1">{finding.area_inspecao?.codigo} - {finding.area_inspecao?.nome}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography variant="caption" color="textSecondary">Data da Inspeção</Typography><Typography variant="body1">{new Date(finding.data_inspecao).toLocaleDateString()}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography variant="caption" color="textSecondary">Nível do Finding</Typography><Typography variant="body1">{finding.finding_level} - {finding.finding_level === 1 ? "Baixo" : finding.finding_level === 2 ? "Médio" : "Alto"}</Typography></Grid>
              <Grid item xs={12}><Typography variant="caption" color="textSecondary">Documento de Referência</Typography><Typography variant="body1">{finding.reference_document || "Não especificado"}</Typography></Grid>
              <Grid item xs={12}><Typography variant="caption" color="textSecondary">Descrição do Finding</Typography><Card variant="outlined" sx={{ mt: 1, p: 2, bgcolor: "#fafafa" }}><Typography variant="body1">{finding.finding_descricao}</Typography></Card></Grid>
              {finding.parte_1_concluida_em && <Grid item xs={12}><Typography variant="caption" color="textSecondary">Concluída em: {new Date(finding.parte_1_concluida_em).toLocaleString()}</Typography></Grid>}
            </Grid>
          </Box>
        )}

        {/* Parte 2 */}
        {tabValue === 1 && (
          <Box>
            {finding.observacoes_operador || finding.root_causes ? (
              <Grid container spacing={3}>
                <Grid item xs={12}><Typography variant="caption" color="textSecondary">Observações do Operador</Typography><Card variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}><Typography variant="body1">{finding.observacoes_operador}</Typography></Card></Grid>
                <Grid item xs={12}><Typography variant="caption" color="textSecondary">Root Causes</Typography><Card variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}><Typography variant="body1">{finding.root_causes}</Typography></Card></Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Ações Corretivas Propostas</Typography>
                  <TableContainer component={Card} variant="outlined">
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Ação Corretiva</TableCell><TableCell>Office Action</TableCell><TableCell>Evidência</TableCell><TableCell>Data Início</TableCell><TableCell>Data Fim</TableCell><TableCell>Progresso</TableCell></TableRow></TableHead>
                      <TableBody>
                        {finding.acoes_corretivas?.map((acao, index) => (
                          <TableRow key={index}>
                            <TableCell>{acao.acao}</TableCell>
                            <TableCell>{acao.office_action}</TableCell>
                            <TableCell>{acao.evidence_ref}</TableCell>
                            <TableCell>{acao.start_date ? new Date(acao.start_date).toLocaleDateString() : ""}</TableCell>
                            <TableCell>{acao.due_date ? new Date(acao.due_date).toLocaleDateString() : ""}</TableCell>
                            <TableCell><Box sx={{ display: "flex", alignItems: "center" }}><LinearProgress variant="determinate" value={acao.progress || 0} sx={{ width: 60, mr: 1 }} />{acao.progress || 0}%</Box></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                {finding.operador_resposta && <Grid item xs={12}><Typography variant="caption" color="textSecondary">Respondido por: {finding.operador_resposta.nome_completo} em {new Date(finding.parte_2_concluida_em).toLocaleString()}</Typography></Grid>}
              </Grid>
            ) : (
              <Alert severity="info">O operador ainda não respondeu a este finding.</Alert>
            )}
          </Box>
        )}

        {/* Parte 3 */}
        {tabValue === 2 && (
          <Box>
            {finding.comments_cap || finding.evaluation_actions ? (
              <Grid container spacing={3}>
                <Grid item xs={12}><Typography variant="caption" color="textSecondary">Comments on CAP</Typography><Card variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}><Typography variant="body1">{finding.comments_cap || "Não especificado"}</Typography></Card></Grid>
                <Grid item xs={12}><Typography variant="caption" color="textSecondary">Evaluation of Actions</Typography><Card variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}><Typography variant="body1">{finding.evaluation_actions || "Não especificado"}</Typography></Card></Grid>
                {finding.progress_documented?.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Progress Documented</Typography>
                    <TableContainer component={Card} variant="outlined">
                      <Table size="small"><TableHead><TableRow><TableCell>Descrição</TableCell><TableCell>Data de Revisão</TableCell></TableRow></TableHead>
                      <TableBody>
                        {finding.progress_documented.map((item, idx) => (
                          <TableRow key={idx}><TableCell>{item.descricao || '-'}</TableCell><TableCell>{item.review_date ? new Date(item.review_date).toLocaleDateString() : '-'}</TableCell></TableRow>
                        ))}
                      </TableBody></Table>
                    </TableContainer>
                  </Grid>
                )}
                <Grid item xs={12} md={6}><Typography variant="caption" color="textSecondary">Data de Aplicação</Typography><Typography variant="body1">{finding.data_aplicacao_acoes ? new Date(finding.data_aplicacao_acoes).toLocaleDateString() : 'Não definida'}</Typography></Grid>
                <Grid item xs={12} md={6}><Typography variant="caption" color="textSecondary">Resolvido Satisfatoriamente</Typography><Typography variant="body1">{finding.resolved_satisfactorily ? 'Sim' : 'Não'}</Typography></Grid>
                {finding.inspector_assinatura && (
                  <Grid item xs={12}><Typography variant="caption" color="textSecondary">Assinado por</Typography><Typography variant="body1">{finding.inspector_assinatura.nome_completo}</Typography><Typography variant="caption" color="textSecondary">{finding.data_assinatura ? new Date(finding.data_assinatura).toLocaleString() : ''}</Typography></Grid>
                )}
              </Grid>
            ) : (
              <Alert severity="info">Ainda não foi avaliado.</Alert>
            )}
          </Box>
        )}

        {/* Anexos */}
        {tabValue === 3 && (
          <Box>
            {finding.anexos?.length > 0 ? (
              <TableContainer component={Card} variant="outlined">
                <Table size="small">
                  <TableHead><TableRow><TableCell>Nome do Ficheiro</TableCell><TableCell>Tipo</TableCell><TableCell>Tamanho</TableCell><TableCell>Data Upload</TableCell><TableCell>Upload por</TableCell><TableCell align="right">Ações</TableCell></TableRow></TableHead>
                  <TableBody>
                    {finding.anexos.map(anexo => (
                      <TableRow key={anexo.id}>
                        <TableCell>{anexo.nome_original}</TableCell>
                        <TableCell>{anexo.tipo}</TableCell>
                        <TableCell>{(anexo.tamanho / 1024).toFixed(2)} KB</TableCell>
                        <TableCell>{new Date(anexo.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{anexo.uploaded_por?.nome_completo}</TableCell>
                        <TableCell align="right"><Tooltip title="Download"><IconButton size="small"><DownloadIcon fontSize="small" /></IconButton></Tooltip></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">Nenhum anexo para este finding.</Alert>
            )}
          </Box>
        )}
      </Paper>

      {/* Diálogos (mantidos) */}
      <Dialog open={openResposta} onClose={() => setOpenResposta(false)} maxWidth="md" fullWidth>
        <DialogTitle>Responder ao Finding</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField fullWidth multiline rows={3} name="observacoes_operador" label="Observações e Comentários" value={respostaData.observacoes_operador} onChange={handleRespostaChange} />
            <TextField fullWidth multiline rows={2} name="root_causes" label="Root Cause(s)" value={respostaData.root_causes} onChange={handleRespostaChange} />
            <Typography variant="h6">Ações Corretivas</Typography>
            {respostaData.acoes_corretivas.map((acao, index) => (
              <Card key={index} variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}><TextField fullWidth size="small" label="Ação Corretiva" value={acao.acao} onChange={(e) => handleAcaoChange(index, 'acao', e.target.value)} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Office Action" value={acao.office_action} onChange={(e) => handleAcaoChange(index, 'office_action', e.target.value)} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Evidence Reference" value={acao.evidence_ref} onChange={(e) => handleAcaoChange(index, 'evidence_ref', e.target.value)} /></Grid>
                  <Grid item xs={12} md={5}><TextField fullWidth size="small" type="date" label="Data Início" value={acao.start_date} onChange={(e) => handleAcaoChange(index, 'start_date', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                  <Grid item xs={12} md={5}><TextField fullWidth size="small" type="date" label="Data Fim" value={acao.due_date} onChange={(e) => handleAcaoChange(index, 'due_date', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth size="small" type="number" label="Progresso (%)" value={acao.progress} onChange={(e) => handleProgressChange(index, e.target.value)} InputProps={{ inputProps: { min: 0, max: 100 } }} /></Grid>
                  {respostaData.acoes_corretivas.length > 1 && <Grid item xs={12}><Button size="small" color="error" onClick={() => removerAcao(index)}>Remover Ação</Button></Grid>}
                </Grid>
              </Card>
            ))}
            {respostaData.acoes_corretivas.length < 4 && <Button variant="outlined" onClick={adicionarAcao} startIcon={<AddIcon />}>Adicionar Ação</Button>}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenResposta(false)}>Cancelar</Button><Button onClick={handleSubmitResposta} variant="contained" disabled={submitting}>{submitting ? <CircularProgress size={24} /> : "Enviar Resposta"}</Button></DialogActions>
      </Dialog>

      <Dialog open={openAvaliacao} onClose={() => setOpenAvaliacao(false)} maxWidth="md" fullWidth>
        <DialogTitle>Avaliar Finding</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField fullWidth multiline rows={3} name="comments_cap" label="Comments on CAP" value={avaliacaoData.comments_cap} onChange={handleAvaliacaoChange} />
            <TextField fullWidth multiline rows={3} name="evaluation_actions" label="Evaluation of Actions" value={avaliacaoData.evaluation_actions} onChange={handleAvaliacaoChange} />
            <Typography variant="h6">Progress Documented</Typography>
            {avaliacaoData.progress_documented.map((item, index) => (
              <Grid container spacing={2} key={index}>
                <Grid item xs={12} md={8}><TextField fullWidth size="small" label="Descrição" value={item.descricao} onChange={(e) => handleProgressDocChange(index, 'descricao', e.target.value)} /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth size="small" type="date" label="Data Revisão" value={item.review_date} onChange={(e) => handleProgressDocChange(index, 'review_date', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                {avaliacaoData.progress_documented.length > 1 && <Grid item xs={12} md={1}><IconButton color="error" onClick={() => removerProgressDoc(index)}><DeleteIcon /></IconButton></Grid>}
              </Grid>
            ))}
            {avaliacaoData.progress_documented.length < 4 && <Button variant="outlined" onClick={adicionarProgressDoc} startIcon={<AddIcon />}>Adicionar Progresso</Button>}
            <TextField fullWidth type="date" name="data_aplicacao_acoes" label="Data de Aplicação" value={avaliacaoData.data_aplicacao_acoes} onChange={handleAvaliacaoChange} InputLabelProps={{ shrink: true }} />
            <FormControlLabel control={<Checkbox name="resolved_satisfactorily" checked={avaliacaoData.resolved_satisfactorily} onChange={handleAvaliacaoChange} />} label="Resolvido Satisfatoriamente" />
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenAvaliacao(false)}>Cancelar</Button><Button onClick={handleSubmitAvaliacao} variant="contained" color="warning" disabled={submitting}>{submitting ? <CircularProgress size={24} /> : "Finalizar Avaliação"}</Button></DialogActions>
      </Dialog>

      <Dialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload de Anexo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Button variant="outlined" component="label" fullWidth sx={{ height: 100, borderStyle: 'dashed' }}>
              <input type="file" hidden onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <AttachFileIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                <Typography variant="caption" color="textSecondary">{uploadFile ? uploadFile.name : "Clique para selecionar um ficheiro"}</Typography>
                <Typography variant="caption" color="textSecondary">(PDF, JPG, PNG até 10MB)</Typography>
              </Box>
            </Button>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenUpload(false)}>Cancelar</Button><Button onClick={handleUpload} variant="contained" disabled={!uploadFile || submitting}>{submitting ? <CircularProgress size={24} /> : "Fazer Upload"}</Button></DialogActions>
      </Dialog>
    </Layout>
  );
};