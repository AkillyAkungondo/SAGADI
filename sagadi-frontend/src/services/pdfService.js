import jsPDF from 'jspdf';
import 'jspdf-autotable';

class PDFService {
  async gerarRelatorioFindings(findings, titulo = 'Relatório de Findings', options = {}) {
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Título
      pdf.setFontSize(18);
      pdf.text(titulo, 14, 20);
      
      // Data e período
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);
      
      if (options.periodo) {
        pdf.text(`Período: ${options.periodo}`, 14, 35);
      }

      // Estatísticas
      const total = findings.length;
      const abertos = findings.filter(f => f.status !== 'encerrado').length;
      const encerrados = findings.filter(f => f.status === 'encerrado').length;
      const atrasados = findings.filter(f => 
        f.status !== 'encerrado' && 
        f.data_vencimento && 
        new Date(f.data_vencimento) < new Date()
      ).length;
      
      pdf.setFontSize(12);
      pdf.text(`Total de Findings: ${total}`, 14, 45);
      pdf.text(`Abertos: ${abertos}`, 14, 52);
      pdf.text(`Encerrados: ${encerrados}`, 14, 59);
      pdf.text(`Atrasados: ${atrasados}`, 14, 66);

      // Tabela de findings
      const headers = [['Nº Processo', 'Aeródromo', 'Área', 'Status', 'Prioridade', 'Data Inspeção', 'Inspetor']];
      const data = findings.map(f => [
        f.numero_processo || '-',
        f.aerodromo?.codigo_oaci || '-',
        f.area_inspecao?.codigo || '-',
        this.traduzirStatus(f.status),
        this.traduzirPrioridade(f.prioridade),
        f.data_inspecao ? new Date(f.data_inspecao).toLocaleDateString() : '-',
        f.inspetor?.nome_completo || '-'
      ]);

      pdf.autoTable({
        head: headers,
        body: data,
        startY: 75,
        theme: 'striped',
        headStyles: { fillColor: [25, 118, 210] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 },
          6: { cellWidth: 40 }
        }
      });

      // Adicionar rodapé com numeração de páginas
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(
          `Página ${i} de ${pageCount}`,
          pdf.internal.pageSize.getWidth() - 30,
          pdf.internal.pageSize.getHeight() - 10
        );
      }

      return pdf;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw error;
    }
  }

  async downloadRelatorioFindings(findings, nomeArquivo = 'relatorio-findings', options = {}) {
    try {
      const pdf = await this.gerarRelatorioFindings(findings, options.titulo, options);
      pdf.save(`${nomeArquivo}-${new Date().toISOString().split('T')[0]}.pdf`);
      return true;
    } catch (error) {
      console.error('Erro ao fazer download do PDF:', error);
      throw error;
    }
  }

  async gerarPDFFinding(finding, elementRef) {
    try {
      // Esta função precisa ser implementada com html2canvas
      // Por enquanto, vamos usar uma versão simplificada
      console.log('Gerando PDF do finding...');
      return null;
    } catch (error) {
      console.error('Erro ao gerar PDF do finding:', error);
      throw error;
    }
  }

  async exportarParaExcel(findings) {
    try {
      // Criar CSV com formatação melhorada
      const headers = [
        'Nº Processo',
        'Aeródromo',
        'Área',
        'Status',
        'Prioridade',
        'Nível',
        'Data Inspeção',
        'Inspetor',
        'Data Vencimento',
        'Descrição'
      ];

      const data = findings.map(f => [
        f.numero_processo || '-',
        `${f.aerodromo?.codigo_oaci || '-'} - ${f.aerodromo?.nome || '-'}`,
        `${f.area_inspecao?.codigo || '-'} - ${f.area_inspecao?.nome || '-'}`,
        this.traduzirStatus(f.status),
        this.traduzirPrioridade(f.prioridade),
        f.finding_level || '-',
        f.data_inspecao ? new Date(f.data_inspecao).toLocaleDateString() : '-',
        f.inspetor?.nome_completo || '-',
        f.data_vencimento ? new Date(f.data_vencimento).toLocaleDateString() : '-',
        f.finding_descricao?.replace(/[;\n]/g, ' ') || '-'
      ]);

      const csvContent = [
        headers.join(';'),
        ...data.map(row => row.join(';'))
      ].join('\n');

      const blob = new Blob(["\uFEFF" + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `findings_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      throw error;
    }
  }

  traduzirStatus(status) {
    const statusMap = {
      'rascunho': 'Rascunho',
      'parte1_concluida': 'Aguardando Operador',
      'aguarda_parte2': 'Aguardando Parte 2',
      'parte2_concluida': 'Aguardando Avaliação',
      'aguarda_avaliacao': 'Aguardando Avaliação',
      'em_correcao': 'Em Correção',
      'encerrado': 'Encerrado'
    };
    return statusMap[status] || status || '-';
  }

  traduzirPrioridade(prioridade) {
    const prioridadeMap = {
      'baixa': 'Baixa',
      'media': 'Média',
      'alta': 'Alta',
      'critica': 'Crítica'
    };
    return prioridadeMap[prioridade] || prioridade || '-';
  }
}

export default new PDFService();