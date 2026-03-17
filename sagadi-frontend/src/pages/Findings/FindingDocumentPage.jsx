import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout/Layout";
import { FindingsService } from "../../services/findings";
import { useAuth } from "../../context/AuthContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import pdfService from "../../services/pdfService";
import { notify } from "../../components/Common/Notification";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
} from "@mui/icons-material";

export const FindingDocumentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isInspetor, isOperador, isAdmin } = useAuth();
  const documentRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finding, setFinding] = useState(null);

  // Estados para controlo de edição e bloqueio
  const [editandoParte, setEditandoParte] = useState(null);
  const [partesBloqueadas, setPartesBloqueadas] = useState({
    parte1: false,
    parte2: false,
    parte3: false,
  });

  // Função para gerar PDF
  const gerarPDF = async () => {
    const element = documentRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        quality: 1,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const width = imgWidth * ratio;
      const height = imgHeight * ratio;

      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`finding-${finding.numero_processo}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  };

  // Estados para formulários de edição
  const [formDataParte1, setFormDataParte1] = useState({});
  const [formDataParte2, setFormDataParte2] = useState({
    observacoes_operador: "",
    root_causes: "",
    acoes_corretivas: [
      {
        acao: "",
        office_action: "",
        evidence_ref: "",
        start_date: "",
        due_date: "",
        progress: 0,
      },
    ],
  });
  const [formDataParte3, setFormDataParte3] = useState({
    comments_cap: "",
    evaluation_actions: "",
    data_aplicacao_acoes: "",
    resolved_satisfactorily: false,
    progress_documented: [{ descricao: "", review_date: "" }],
  });

  const handleDownloadPDF = async () => {
    try {
      notify.info("Gerando PDF...");
      await pdfService.downloadPDFFinding(finding, documentRef);
      notify.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      notify.error("Erro ao gerar PDF. Tente novamente.");
    }
  };

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    carregarFinding();
  }, [id]);

  useEffect(() => {
    if (finding) {
      // Definir bloqueios baseados no status
      setPartesBloqueadas({
        parte1:
          finding.parte_1_concluida_em !== null ||
          finding.status !== "rascunho",
        parte2:
          finding.parte_2_concluida_em !== null ||
          finding.status === "encerrado",
        parte3: finding.status === "encerrado",
      });

      // Carregar dados nos formulários
      setFormDataParte1({
        aerodromo_id: finding.aerodromo_id,
        area_inspecao_id: finding.area_inspecao_id,
        data_inspecao: finding.data_inspecao
          ? new Date(finding.data_inspecao).toISOString().split("T")[0]
          : "",
        finding_level: finding.finding_level,
        reference_document: finding.reference_document || "",
        finding_descricao: finding.finding_descricao || "",
      });

      setFormDataParte2({
        observacoes_operador: finding.observacoes_operador || "",
        root_causes: finding.root_causes || "",
        acoes_corretivas: finding.acoes_corretivas?.length
          ? finding.acoes_corretivas
          : [
              {
                acao: "",
                office_action: "",
                evidence_ref: "",
                start_date: "",
                due_date: "",
                progress: 0,
              },
            ],
      });

      setFormDataParte3({
        comments_cap: finding.comments_cap || "",
        evaluation_actions: finding.evaluation_actions || "",
        data_aplicacao_acoes: finding.data_aplicacao_acoes
          ? new Date(finding.data_aplicacao_acoes).toISOString().split("T")[0]
          : "",
        resolved_satisfactorily: finding.resolved_satisfactorily || false,
        progress_documented: finding.progress_documented?.length
          ? finding.progress_documented
          : [{ descricao: "", review_date: "" }],
      });
    }
  }, [finding]);

  const carregarFinding = async () => {
    try {
      setLoading(true);
      const data = await FindingsService.buscarPorId(id);
      setFinding(data);
    } catch (error) {
      console.error("Erro ao carregar finding:", error);
      setError("Erro ao carregar detalhes do finding");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGerarPDF = () => {
    // Implementar geração de PDF (pode usar biblioteca como jspdf)
    window.print(); // Por enquanto usa print
  };

  const podeEditarParte = (parte) => {
    if (!finding) return false;

    switch (parte) {
      case "parte1":
        return (isInspetor || isAdmin) && !partesBloqueadas.parte1;
      case "parte2":
        return (
          (isOperador || isAdmin) &&
          !partesBloqueadas.parte2 &&
          (finding.status === "parte1_concluida" ||
            finding.status === "aguarda_parte2")
        );
      case "parte3":
        return (
          (isInspetor || isAdmin) &&
          !partesBloqueadas.parte3 &&
          (finding.status === "parte2_concluida" ||
            finding.status === "aguarda_avaliacao")
        );
      default:
        return false;
    }
  };

  const handleEditarParte = (parte) => {
    setEditandoParte(parte);
  };

  const handleCancelarEdicao = () => {
    setEditandoParte(null);
    // Recarregar dados para descartar alterações
    carregarFinding();
  };

  const handleSalvarParte1 = async () => {
    setSubmitting(true);
    try {
      await FindingsService.criarParte1({
        ...formDataParte1,
        numero_processo: finding.numero_processo,
      });
      setEditandoParte(null);
      await carregarFinding();
    } catch (error) {
      console.error("Erro ao salvar Parte 1:", error);
      setError("Erro ao salvar alterações");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSalvarParte2 = async () => {
    setSubmitting(true);
    try {
      await FindingsService.updateParte2(id, formDataParte2);
      setEditandoParte(null);
      await carregarFinding();
    } catch (error) {
      console.error("Erro ao salvar Parte 2:", error);
      setError("Erro ao salvar alterações");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSalvarParte3 = async () => {
    setSubmitting(true);
    try {
      await FindingsService.updateParte3(id, formDataParte3);
      setEditandoParte(null);
      await carregarFinding();
    } catch (error) {
      console.error("Erro ao salvar Parte 3:", error);
      setError("Erro ao salvar alterações");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeParte1 = (e) => {
    const { name, value } = e.target;
    setFormDataParte1((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeParte2 = (e) => {
    const { name, value } = e.target;
    setFormDataParte2((prev) => ({ ...prev, [name]: value }));
  };

  const handleAcaoChange = (index, field, value) => {
    const novasAcoes = [...formDataParte2.acoes_corretivas];
    novasAcoes[index][field] = value;
    setFormDataParte2((prev) => ({ ...prev, acoes_corretivas: novasAcoes }));
  };

  const adicionarAcao = () => {
    if (formDataParte2.acoes_corretivas.length < 4) {
      setFormDataParte2((prev) => ({
        ...prev,
        acoes_corretivas: [
          ...prev.acoes_corretivas,
          {
            acao: "",
            office_action: "",
            evidence_ref: "",
            start_date: "",
            due_date: "",
            progress: 0,
          },
        ],
      }));
    }
  };

  const removerAcao = (index) => {
    if (formDataParte2.acoes_corretivas.length > 1) {
      const novasAcoes = formDataParte2.acoes_corretivas.filter(
        (_, i) => i !== index,
      );
      setFormDataParte2((prev) => ({ ...prev, acoes_corretivas: novasAcoes }));
    }
  };

  const handleChangeParte3 = (e) => {
    const { name, value, type, checked } = e.target;
    setFormDataParte3((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleProgressDocChange = (index, field, value) => {
    const novosProgress = [...formDataParte3.progress_documented];
    novosProgress[index][field] = value;
    setFormDataParte3((prev) => ({
      ...prev,
      progress_documented: novosProgress,
    }));
  };

  const adicionarProgressDoc = () => {
    if (formDataParte3.progress_documented.length < 4) {
      setFormDataParte3((prev) => ({
        ...prev,
        progress_documented: [
          ...prev.progress_documented,
          { descricao: "", review_date: "" },
        ],
      }));
    }
  };

  const removerProgressDoc = (index) => {
    if (formDataParte3.progress_documented.length > 1) {
      const novosProgress = formDataParte3.progress_documented.filter(
        (_, i) => i !== index,
      );
      setFormDataParte3((prev) => ({
        ...prev,
        progress_documented: novosProgress,
      }));
    }
  };

  const getStatusInfo = (status) => {
    const config = {
      rascunho: { cor: "default", icone: <PendingIcon />, texto: "Rascunho" },
      parte1_concluida: {
        cor: "info",
        icone: <CheckCircleIcon />,
        texto: "Parte 1 Concluída",
      },
      aguarda_parte2: {
        cor: "info",
        icone: <PendingIcon />,
        texto: "Aguardando Parte 2",
      },
      parte2_concluida: {
        cor: "warning",
        icone: <WarningIcon />,
        texto: "Aguardando Avaliação",
      },
      aguarda_avaliacao: {
        cor: "warning",
        icone: <WarningIcon />,
        texto: "Aguardando Avaliação",
      },
      em_correcao: { cor: "error", icone: <ErrorIcon />, texto: "Em Correção" },
      encerrado: {
        cor: "success",
        icone: <CheckCircleIcon />,
        texto: "Encerrado",
      },
    };
    return (
      config[status] || {
        cor: "default",
        icone: <PendingIcon />,
        texto: status,
      }
    );
  };

  if (loading) {
    return (
      <Layout title="Documento de Inspeção">
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !finding) {
    return (
      <Layout title="Documento de Inspeção">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error || "Finding não encontrado"}</Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/findings")}
            sx={{ mt: 2 }}
          >
            Voltar para Lista
          </Button>
        </Box>
      </Layout>
    );
  }

  const statusInfo = getStatusInfo(finding.status);

  return (
    <Layout title={`Documento - ${finding.numero_processo}`}>
      {/* Barra de Ações */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/findings/${id}`)}
        >
          Voltar para Detalhe
        </Button>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Imprimir">
            <IconButton onClick={handlePrint} color="primary">
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Gerar PDF">
            <IconButton onClick={handleGerarPDF} color="primary">
              <PdfIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton onClick={handleDownloadPDF} color="primary">
              <PdfIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Documento Principal */}
      <Paper
        ref={documentRef}
        sx={{
          p: 4,
          maxWidth: "210mm", // Largura A4
          mx: "auto",
          bgcolor: "white",
          boxShadow: 3,
          "@media print": {
            boxShadow: "none",
            p: 2,
          },
        }}
        className="documento-impressao"
      >
        {/* Cabeçalho do Documento */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            RECORD OF AERODROME INSPECTION FINDINGS
          </Typography>
          <Chip
            icon={statusInfo.icone}
            label={statusInfo.texto}
            color={statusInfo.cor}
            sx={{ mt: 1 }}
          />
        </Box>

        {/* PARTE 1 - Inspetor */}
        <Box sx={{ mb: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: "#f5f5f5",
              borderLeft: "4px solid",
              borderColor: partesBloqueadas.parte1
                ? "success.main"
                : "warning.main",
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" color="primary">
                PARTE 1: To be completed by the Aerodrome inspector
              </Typography>
              <Box>
                {partesBloqueadas.parte1 ? (
                  <Chip
                    icon={<LockIcon />}
                    label="Bloqueado"
                    size="small"
                    color="success"
                  />
                ) : (
                  <Chip
                    icon={<LockOpenIcon />}
                    label="Editável"
                    size="small"
                    color="warning"
                  />
                )}
                {podeEditarParte("parte1") && editandoParte !== "parte1" && (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditarParte("parte1")}
                    sx={{ ml: 1 }}
                  >
                    Editar
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>

          {editandoParte === "parte1" ? (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Aeródromo</InputLabel>
                    <Select
                      name="aerodromo_id"
                      value={formDataParte1.aerodromo_id || ""}
                      label="Aeródromo"
                      onChange={handleChangeParte1}
                    >
                      <MenuItem value={finding.aerodromo?.id}>
                        {finding.aerodromo?.codigo_oaci} -{" "}
                        {finding.aerodromo?.nome}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Finding Number"
                    value={finding.numero_processo}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Area of inspection</InputLabel>
                    <Select
                      name="area_inspecao_id"
                      value={formDataParte1.area_inspecao_id || ""}
                      label="Area of inspection"
                      onChange={handleChangeParte1}
                    >
                      <MenuItem value={finding.area_inspecao?.id}>
                        {finding.area_inspecao?.codigo} -{" "}
                        {finding.area_inspecao?.nome}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    name="data_inspecao"
                    label="Date"
                    value={formDataParte1.data_inspecao || ""}
                    onChange={handleChangeParte1}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Finding Level</InputLabel>
                    <Select
                      name="finding_level"
                      value={formDataParte1.finding_level || ""}
                      label="Finding Level"
                      onChange={handleChangeParte1}
                    >
                      <MenuItem value={1}>Level 1</MenuItem>
                      <MenuItem value={2}>Level 2</MenuItem>
                      <MenuItem value={3}>Level 3</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    name="reference_document"
                    label="REFERENCE DOCUMENT"
                    value={formDataParte1.reference_document || ""}
                    onChange={handleChangeParte1}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    name="finding_descricao"
                    label="FINDING"
                    value={formDataParte1.finding_descricao || ""}
                    onChange={handleChangeParte1}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  gap: 1,
                  justifyContent: "flex-end",
                }}
              >
                <Button size="small" onClick={handleCancelarEdicao}>
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSalvarParte1}
                  disabled={submitting}
                >
                  {submitting ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Salvar Parte 1"
                  )}
                </Button>
              </Box>
            </Box>
          ) : (
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
                    {finding.area_inspecao?.codigo} -{" "}
                    {finding.area_inspecao?.nome}
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
                  <Card
                    variant="outlined"
                    sx={{ p: 1, mt: 0.5, bgcolor: "#fafafa" }}
                  >
                    <Typography variant="body2">
                      {finding.reference_document || "Não especificado"}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">
                    FINDING
                  </Typography>
                  <Card
                    variant="outlined"
                    sx={{ p: 1, mt: 0.5, bgcolor: "#fafafa" }}
                  >
                    <Typography variant="body2">
                      {finding.finding_descricao}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>

        {/* PARTE 2 - Operador */}
        <Box sx={{ mb: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: "#f5f5f5",
              borderLeft: "4px solid",
              borderColor: partesBloqueadas.parte2
                ? "success.main"
                : "warning.main",
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" color="primary">
                PARTE 2: To be completed by the Aerodrome Operator
              </Typography>
              <Box>
                {partesBloqueadas.parte2 ? (
                  <Chip
                    icon={<LockIcon />}
                    label="Bloqueado"
                    size="small"
                    color="success"
                  />
                ) : (
                  <Chip
                    icon={<LockOpenIcon />}
                    label="Editável"
                    size="small"
                    color="warning"
                  />
                )}
                {podeEditarParte("parte2") && editandoParte !== "parte2" && (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditarParte("parte2")}
                    sx={{ ml: 1 }}
                  >
                    {finding.observacoes_operador ? "Editar" : "Responder"}
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>

          {editandoParte === "parte2" ? (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="observacoes_operador"
                    label="OBSERVATIONS and REMARKS - Aerodrome Operator"
                    value={formDataParte2.observacoes_operador}
                    onChange={handleChangeParte2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    name="root_causes"
                    label="ROOT CAUSE (S)"
                    value={formDataParte2.root_causes}
                    onChange={handleChangeParte2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    PROPOSED CORRECTIVE ACTION(S)
                  </Typography>
                  {formDataParte2.acoes_corretivas.map((acao, index) => (
                    <Card key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label={`Action ${index + 1}`}
                            value={acao.acao}
                            onChange={(e) =>
                              handleAcaoChange(index, "acao", e.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Office Action"
                            value={acao.office_action}
                            onChange={(e) =>
                              handleAcaoChange(
                                index,
                                "office_action",
                                e.target.value,
                              )
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Evidence Reference"
                            value={acao.evidence_ref}
                            onChange={(e) =>
                              handleAcaoChange(
                                index,
                                "evidence_ref",
                                e.target.value,
                              )
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={5}>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="Starting Date"
                            value={acao.start_date}
                            onChange={(e) =>
                              handleAcaoChange(
                                index,
                                "start_date",
                                e.target.value,
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={5}>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="Due Date"
                            value={acao.due_date}
                            onChange={(e) =>
                              handleAcaoChange(
                                index,
                                "due_date",
                                e.target.value,
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Progress %"
                            value={acao.progress}
                            onChange={(e) =>
                              handleAcaoChange(
                                index,
                                "progress",
                                e.target.value,
                              )
                            }
                            InputProps={{ inputProps: { min: 0, max: 100 } }}
                          />
                        </Grid>
                        {formDataParte2.acoes_corretivas.length > 1 && (
                          <Grid item xs={12}>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => removerAcao(index)}
                            >
                              Remover Ação
                            </Button>
                          </Grid>
                        )}
                      </Grid>
                    </Card>
                  ))}
                  {formDataParte2.acoes_corretivas.length < 4 && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={adicionarAcao}
                      sx={{ mt: 1 }}
                    >
                      Adicionar Ação
                    </Button>
                  )}
                </Grid>
              </Grid>
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  gap: 1,
                  justifyContent: "flex-end",
                }}
              >
                <Button size="small" onClick={handleCancelarEdicao}>
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSalvarParte2}
                  disabled={submitting}
                >
                  {submitting ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Salvar Parte 2"
                  )}
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              {finding.observacoes_operador || finding.root_causes ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      OBSERVATIONS and REMARKS - Aerodrome Operator
                    </Typography>
                    <Card
                      variant="outlined"
                      sx={{ p: 1, mt: 0.5, bgcolor: "#fafafa" }}
                    >
                      <Typography variant="body2">
                        {finding.observacoes_operador}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      ROOT CAUSE (S)
                    </Typography>
                    <Card
                      variant="outlined"
                      sx={{ p: 1, mt: 0.5, bgcolor: "#fafafa" }}
                    >
                      <Typography variant="body2">
                        {finding.root_causes}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      PROPOSED CORRECTIVE ACTION(S)
                    </Typography>
                    <TableContainer
                      component={Card}
                      variant="outlined"
                      sx={{ mt: 1 }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Ação</TableCell>
                            <TableCell>Office Action</TableCell>
                            <TableCell>Evidence</TableCell>
                            <TableCell>Start</TableCell>
                            <TableCell>Due</TableCell>
                            <TableCell>Progress</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {finding.acoes_corretivas?.map((acao, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{acao.acao}</TableCell>
                              <TableCell>{acao.office_action}</TableCell>
                              <TableCell>{acao.evidence_ref}</TableCell>
                              <TableCell>
                                {acao.start_date
                                  ? new Date(
                                      acao.start_date,
                                    ).toLocaleDateString()
                                  : ""}
                              </TableCell>
                              <TableCell>
                                {acao.due_date
                                  ? new Date(acao.due_date).toLocaleDateString()
                                  : ""}
                              </TableCell>
                              <TableCell>{acao.progress}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  {finding.operador_resposta && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">
                        Respondido por:{" "}
                        {finding.operador_resposta.nome_completo}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Alert severity="info">
                  O operador ainda não respondeu a este finding.
                </Alert>
              )}
            </Box>
          )}
        </Box>

        {/* PARTE 3 - IACM Follow-up */}
        <Box sx={{ mb: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: "#f5f5f5",
              borderLeft: "4px solid",
              borderColor: partesBloqueadas.parte3
                ? "success.main"
                : "warning.main",
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" color="primary">
                PARTE 3: To be completed by the IACM
              </Typography>
              <Box>
                {partesBloqueadas.parte3 ? (
                  <Chip
                    icon={<LockIcon />}
                    label="Bloqueado"
                    size="small"
                    color="success"
                  />
                ) : (
                  <Chip
                    icon={<LockOpenIcon />}
                    label="Editável"
                    size="small"
                    color="warning"
                  />
                )}
                {podeEditarParte("parte3") && editandoParte !== "parte3" && (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditarParte("parte3")}
                    sx={{ ml: 1 }}
                  >
                    {finding.comments_cap ? "Editar" : "Avaliar"}
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>

          {editandoParte === "parte3" ? (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="comments_cap"
                    label="COMMENTS ON THE CAP"
                    value={formDataParte3.comments_cap}
                    onChange={handleChangeParte3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    PROGRESS DOCUMENTED
                  </Typography>
                  {formDataParte3.progress_documented.map((item, index) => (
                    <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
                      <Grid item xs={12} md={8}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Descrição"
                          value={item.descricao}
                          onChange={(e) =>
                            handleProgressDocChange(
                              index,
                              "descricao",
                              e.target.value,
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          label="Review Date"
                          value={item.review_date}
                          onChange={(e) =>
                            handleProgressDocChange(
                              index,
                              "review_date",
                              e.target.value,
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      {formDataParte3.progress_documented.length > 1 && (
                        <Grid item xs={12} md={1}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removerProgressDoc(index)}
                          >
                            <ErrorIcon />
                          </IconButton>
                        </Grid>
                      )}
                    </Grid>
                  ))}
                  {formDataParte3.progress_documented.length < 4 && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={adicionarProgressDoc}
                      sx={{ mt: 1 }}
                    >
                      Adicionar Progresso
                    </Button>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    name="evaluation_actions"
                    label="EVALUATION OF CORRECTIVE ACTIONS PUT IN PLACE"
                    value={formDataParte3.evaluation_actions}
                    onChange={handleChangeParte3}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    name="data_aplicacao_acoes"
                    label="DATE(S) OF APPLICATION"
                    value={formDataParte3.data_aplicacao_acoes}
                    onChange={handleChangeParte3}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="resolved_satisfactorily"
                        checked={formDataParte3.resolved_satisfactorily}
                        onChange={handleChangeParte3}
                      />
                    }
                    label="This finding has been resolved satisfactorily"
                  />
                </Grid>
              </Grid>
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  gap: 1,
                  justifyContent: "flex-end",
                }}
              >
                <Button size="small" onClick={handleCancelarEdicao}>
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSalvarParte3}
                  disabled={submitting}
                >
                  {submitting ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Salvar Parte 3"
                  )}
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              {finding.comments_cap ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      COMMENTS ON THE CAP
                    </Typography>
                    <Card
                      variant="outlined"
                      sx={{ p: 1, mt: 0.5, bgcolor: "#fafafa" }}
                    >
                      <Typography variant="body2">
                        {finding.comments_cap}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      PROGRESS DOCUMENTED
                    </Typography>
                    <TableContainer
                      component={Card}
                      variant="outlined"
                      sx={{ mt: 1 }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Review Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {finding.progress_documented?.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.descricao}</TableCell>
                              <TableCell>
                                {item.review_date
                                  ? new Date(
                                      item.review_date,
                                    ).toLocaleDateString()
                                  : ""}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      EVALUATION OF CORRECTIVE ACTIONS
                    </Typography>
                    <Card
                      variant="outlined"
                      sx={{ p: 1, mt: 0.5, bgcolor: "#fafafa" }}
                    >
                      <Typography variant="body2">
                        {finding.evaluation_actions}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="textSecondary">
                      DATE(S) OF APPLICATION
                    </Typography>
                    <Typography variant="body1">
                      {finding.data_aplicacao_acoes
                        ? new Date(
                            finding.data_aplicacao_acoes,
                          ).toLocaleDateString()
                        : "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="textSecondary">
                      Resolved Satisfactorily
                    </Typography>
                    <Typography variant="body1">
                      {finding.resolved_satisfactorily ? "Yes" : "No"}
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
                <Alert severity="info">Ainda não foi avaliado.</Alert>
              )}
            </Box>
          )}
        </Box>

        {/* Rodapé do Documento */}
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" color="textSecondary">
            Documento gerado pelo SAGADI - Sistema de Análise, Gestão e Arquivo
            Digital de Inspeções
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block">
            IACM - Instituto de Aviação Civil de Moçambique
          </Typography>
        </Box>
      </Paper>

      {/* CSS para impressão */}
      <style type="text/css" media="print">{`
        @page {
          size: A4;
          margin: 2cm;
        }
        .documento-impressao {
          width: 100%;
          max-width: 100%;
          padding: 20px;
        }
        .no-print {
          display: none;
        }
      `}</style>
    </Layout>
  );
};
