import jsPDF from 'jspdf';
import 'jspdf-autotable';

class PDFService {
  async gerarRelatorioFindings(findings, titulo = 'Relatório de Findings', options = {}) {
    try {
      // Criar novo documento PDF
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Título principal
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, 14, 15);

      // Informações de data e período
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 14, 25);
      
      if (options.periodo) {
        doc.text(`Período: ${options.periodo}`, 14, 30);
      }

      // Estatísticas resumidas
      const total = findings.length || 0;
      const abertos = findings.filter(f => f && f.status !== 'encerrado').length || 0;
      const encerrados = findings.filter(f => f && f.status === 'encerrado').length || 0;
      const atrasados = findings.filter(f => 
        f && 
        f.status !== 'encerrado' && 
        f.data_vencimento && 
        new Date(f.data_vencimento) < new Date()
      ).length || 0;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Estatístico:', 14, 40);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de Findings: ${total}`, 14, 47);
      doc.text(`Abertos: ${abertos}`, 14, 54);
      doc.text(`Encerrados: ${encerrados}`, 14, 61);
      doc.text(`Atrasados: ${atrasados}`, 14, 68);

      // Preparar dados da tabela
      const headers = [['Nº Processo', 'Aeródromo', 'Área', 'Status', 'Prioridade', 'Data']];
      const dadosTabela = findings.map(f => {
        if (!f) return ['-', '-', '-', '-', '-', '-'];
        
        return [
          f.numero_processo || '-',
          f.aerodromo?.codigo_oaci || '-',
          f.area_inspecao?.codigo || '-',
          this.traduzirStatus(f.status) || '-',
          this.traduzirPrioridade(f.prioridade) || '-',
          f.data_inspecao ? new Date(f.data_inspecao).toLocaleDateString('pt-PT') : '-'
        ];
      });

      // Adicionar tabela
      doc.autoTable({
        head: headers,
        body: dadosTabela,
        startY: 75,
        theme: 'striped',
        headStyles: { 
          fillColor: [25, 118, 210],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 35 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 }
        },
        didDrawPage: (data) => {
          // Rodapé com número da página
          const pageCount = doc.internal.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(
              `Página ${i} de ${pageCount}`,
              doc.internal.pageSize.getWidth() - 30,
              doc.internal.pageSize.getHeight() - 10
            );
          }
        }
      });

      return doc;
    } catch (error) {
      console.error('Erro detalhado ao gerar PDF:', error);
      throw new Error(`Falha ao gerar PDF: ${error.message}`);
    }
  }

  async downloadRelatorioFindings(findings, nomeArquivo = 'relatorio-findings', options = {}) {
    try {
      if (!findings || !Array.isArray(findings)) {
        throw new Error('Dados inválidos para gerar relatório');
      }

      const doc = await this.gerarRelatorioFindings(findings, options.titulo, options);
      const dataAtual = new Date().toISOString().split('T')[0];
      doc.save(`${nomeArquivo}-${dataAtual}.pdf`);
      
      return true;
    } catch (error) {
      console.error('Erro ao fazer download do PDF:', error);
      throw error;
    }
  }

  traduzirStatus(status) {
    if (!status) return '-';
    
    const statusMap = {
      'rascunho': 'Rascunho',
      'parte1_concluida': 'Aguardando Operador',
      'aguarda_parte2': 'Aguardando Parte 2',
      'parte2_concluida': 'Aguardando Avaliação',
      'aguarda_avaliacao': 'Aguardando Avaliação',
      'em_correcao': 'Em Correção',
      'encerrado': 'Encerrado'
    };
    return statusMap[status] || status;
  }

  traduzirPrioridade(prioridade) {
    if (!prioridade) return '-';
    
    const prioridadeMap = {
      'baixa': 'Baixa',
      'media': 'Média',
      'alta': 'Alta',
      'critica': 'Crítica'
    };
    return prioridadeMap[prioridade] || prioridade;
  }

  // Método simplificado para exportar CSV (Excel)
  exportarParaExcel(findings) {
    try {
      if (!findings || !Array.isArray(findings)) {
        throw new Error('Dados inválidos para exportar');
      }

      const headers = [
        'Nº Processo',
        'Aeródromo',
        'Área',
        'Status',
        'Prioridade',
        'Nível',
        'Data Inspeção',
        'Inspetor',
        'Data Vencimento'
      ];

      const data = findings.map(f => {
        if (!f) return headers.map(() => '-');
        
        return [
          f.numero_processo || '-',
          f.aerodromo?.codigo_oaci || '-',
          f.area_inspecao?.codigo || '-',
          this.traduzirStatus(f.status),
          this.traduzirPrioridade(f.prioridade),
          f.finding_level || '-',
          f.data_inspecao ? new Date(f.data_inspecao).toLocaleDateString('pt-PT') : '-',
          f.inspetor?.nome_completo || '-',
          f.data_vencimento ? new Date(f.data_vencimento).toLocaleDateString('pt-PT') : '-'
        ];
      });

      const csvContent = [
        headers.join(';'),
        ...data.map(row => row.join(';'))
      ].join('\n');

      // Adicionar BOM para suporte a caracteres especiais
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
}

export default new PDFService();