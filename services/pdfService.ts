import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDFReport = (session: any, records: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('Relatório de Validades', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`${session.loja} - ${session.period.toUpperCase()}`, pageWidth / 2, 30, { align: 'center' });

  // Info Section
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Operador: ${session.operatorName}`, 14, 45);
  doc.text(`Data de Finalização: ${new Date().toLocaleDateString('pt-PT')} ${new Date().toLocaleTimeString('pt-PT')}`, 14, 52);

  // Stats
  const expiredCount = records.filter((r: any) => r.status === 'expired').length;
  const warningCount = records.filter((r: any) => r.status === 'expiring_soon').length;
  const okCount = records.filter((r: any) => r.status === 'ok').length;

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 60, pageWidth - 14, 60);

  doc.setFontSize(11);
  doc.text(`Total Verificado: ${records.length}`, 14, 70);
  doc.setTextColor(220, 38, 38); // red-600
  doc.text(`Caducados: ${expiredCount}`, 70, 70);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text(`Atenção: ${warningCount}`, 120, 70);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`OK: ${okCount}`, 170, 70);

  // Table
  const tableData = records.map((r: any) => [
    r.nome_produto,
    new Date(r.data_validade).toLocaleDateString('pt-PT'),
    r.hora_registo || 'N/A',
    r.status === 'expired' ? 'CADUCADO' : r.status === 'expiring_soon' ? 'ATENÇÃO' : 'OK'
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['Produto', 'Validade', 'Hora', 'Estado']],
    body: tableData,
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      3: { fontStyle: 'bold' }
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 3) {
        const status = data.cell.raw;
        if (status === 'CADUCADO') data.cell.styles.textColor = [220, 38, 38];
        if (status === 'ATENÇÃO') data.cell.styles.textColor = [217, 119, 6];
        if (status === 'OK') data.cell.styles.textColor = [5, 150, 105];
      }
    }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} - Gerado por ValidaControl PWA`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const fileName = `Relatorio_${session.loja}_${session.period}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
