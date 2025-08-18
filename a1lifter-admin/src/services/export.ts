import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Competition, CompetitionLeaderboard } from '@/types';

export const exportService = {
  // Export classifica in PDF
  exportLeaderboardToPDF(
    competition: Competition,
    leaderboard: CompetitionLeaderboard
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.text('CLASSIFICA UFFICIALE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(16);
    doc.text(competition.name, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setFontSize(12);
    doc.text(
      `${format(competition.date, 'dd MMMM yyyy', { locale: it })} - ${competition.location}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    yPosition += 15;

    // Tabelle per categoria
    leaderboard.categories.forEach((category) => {
      if (category.results.length === 0) return;

      // Header categoria
      doc.setFontSize(14);
      doc.text(category.categoryName, 20, yPosition);
      yPosition += 8;

      // Tabella risultati
      const tableData = category.results.map((result, index) => [
        (index + 1).toString(),
        result.athleteName,
        `${result.totalScore}kg`,
        result.wilksScore ? result.wilksScore.toFixed(2) : '-',
        result.ipfScore ? result.ipfScore.toFixed(2) : '-',
        result.dotsScore ? result.dotsScore.toFixed(2) : '-',
      ]);

      autoTable(doc, {
        head: [['Pos.', 'Atleta', 'Totale', 'Wilks', 'IPF', 'DOTS']],
        body: tableData,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

      // Nuova pagina se necessario
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
    });

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Pagina ${i} di ${pageCount} - Generato il ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        pageWidth / 2,
        285,
        { align: 'center' }
      );
    }

    // Download
    const fileName = `classifica_${competition.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(fileName);
  },

  // Export classifica in Excel
  exportLeaderboardToExcel(
    competition: Competition,
    leaderboard: CompetitionLeaderboard
  ): void {
    const workbook = XLSX.utils.book_new();

    // Foglio riepilogo
    const summaryData = [
      ['CLASSIFICA UFFICIALE'],
      [''],
      ['Competizione:', competition.name],
      ['Data:', format(competition.date, 'dd/MM/yyyy')],
      ['Luogo:', competition.location],
      ['Tipo:', competition.type],
      [''],
      ['Categorie:', leaderboard.categories.length.toString()],
      ['Totale atleti:', leaderboard.categories.reduce((sum, cat) => sum + cat.results.length, 0).toString()],
      [''],
      ['Generato il:', format(new Date(), 'dd/MM/yyyy HH:mm')],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Riepilogo');

    // Foglio per ogni categoria
    leaderboard.categories.forEach((category) => {
      if (category.results.length === 0) return;

      const categoryData = [
        [category.categoryName],
        [''],
        ['Pos.', 'Atleta', 'Totale (kg)', 'Wilks', 'IPF', 'DOTS', 'Tentativi Validi'],
      ];

      category.results.forEach((result, index) => {
        const validLifts = result.lifts.filter(lift => lift.valid).length;
        categoryData.push([
          (index + 1).toString(),
          result.athleteName,
          result.totalScore.toString(),
          result.wilksScore ? result.wilksScore.toFixed(2) : '-',
          result.ipfScore ? result.ipfScore.toFixed(2) : '-',
          result.dotsScore ? result.dotsScore.toFixed(2) : '-',
          validLifts.toString(),
        ]);
      });

      const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
      
      // Styling
      categorySheet['!cols'] = [
        { wch: 5 },   // Pos
        { wch: 25 },  // Atleta
        { wch: 12 },  // Totale
        { wch: 10 },  // Wilks
        { wch: 10 },  // IPF
        { wch: 10 },  // DOTS
        { wch: 15 },  // Tentativi
      ];

      const sheetName = category.categoryName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, categorySheet, sheetName);
    });

    // Foglio dettagli tentativi
    const detailsData = [
      ['DETTAGLI TENTATIVI'],
      [''],
      ['Atleta', 'Categoria', 'Disciplina', 'Tentativo', 'Peso (kg)', 'Valido'],
    ];

    leaderboard.categories.forEach((category) => {
      category.results.forEach((result) => {
        result.lifts.forEach((lift) => {
          detailsData.push([
            result.athleteName,
            category.categoryName,
            lift.discipline,
            lift.attempt.toString(),
            lift.weight.toString(),
            lift.valid ? 'SÌ' : 'NO',
          ]);
        });
      });
    });

    const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);
    detailsSheet['!cols'] = [
      { wch: 25 },  // Atleta
      { wch: 20 },  // Categoria
      { wch: 15 },  // Disciplina
      { wch: 10 },  // Tentativo
      { wch: 10 },  // Peso
      { wch: 10 },  // Valido
    ];
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Dettagli Tentativi');

    // Download
    const fileName = `classifica_${competition.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  // Export lista atleti in CSV
  exportAthletesToCSV(athletes: Array<{ name: string; email: string; gender: string; birthDate: Date; weightClass: string; federation: string }>): void {
    const csvData = [
      ['Nome', 'Email', 'Genere', 'Data Nascita', 'Categoria Peso', 'Federazione'],
      ...athletes.map(athlete => [
        athlete.name,
        athlete.email,
        athlete.gender,
        format(athlete.birthDate, 'dd/MM/yyyy'),
        athlete.weightClass,
        athlete.federation,
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Atleti');
    
    const fileName = `atleti_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    XLSX.writeFile(workbook, fileName, { bookType: 'csv' });
  },

  // Export report competizione completo
  exportCompetitionReport(
    competition: Competition,
    leaderboard: CompetitionLeaderboard,
    stats: { totalResults?: number; totalAttempts?: number; validAttempts?: number; topScore?: number; averageScore?: number }
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Copertina
    doc.setFontSize(24);
    doc.text('REPORT COMPETIZIONE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(18);
    doc.text(competition.name, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    doc.setFontSize(14);
    doc.text(
      `${format(competition.date, 'dd MMMM yyyy', { locale: it })}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    yPosition += 8;

    doc.text(competition.location, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 30;

    // Statistiche generali
    doc.setFontSize(16);
    doc.text('STATISTICHE GENERALI', 20, yPosition);
    yPosition += 15;

    const statsData = [
      ['Totale atleti partecipanti', stats.totalResults?.toString() || '0'],
      ['Totale tentativi', stats.totalAttempts?.toString() || '0'],
      ['Tentativi validi', stats.validAttempts?.toString() || '0'],
      ['Percentuale successo', stats.totalAttempts ? `${Math.round(((stats.validAttempts ?? 0) / stats.totalAttempts) * 100)}%` : '0%'],
      ['Punteggio massimo', `${stats.topScore || 0}kg`],
      ['Punteggio medio', `${Math.round(stats.averageScore || 0)}kg`],
    ];

    autoTable(doc, {
      body: statsData,
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 12 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' },
      },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

    // Nuova pagina per classifiche
    doc.addPage();
    yPosition = 20;

    // Classifiche per categoria
    doc.setFontSize(16);
    doc.text('CLASSIFICHE PER CATEGORIA', 20, yPosition);
    yPosition += 15;

    leaderboard.categories.forEach((category) => {
      if (category.results.length === 0) return;

      doc.setFontSize(14);
      doc.text(category.categoryName, 20, yPosition);
      yPosition += 8;

      const tableData = category.results.slice(0, 10).map((result, index) => [
        (index + 1).toString(),
        result.athleteName,
        `${result.totalScore}kg`,
        result.wilksScore ? result.wilksScore.toFixed(2) : '-',
      ]);

      autoTable(doc, {
        head: [['Pos.', 'Atleta', 'Totale', 'Wilks']],
        body: tableData,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
    });

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Report generato il ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Pagina ${i} di ${pageCount}`,
        pageWidth / 2,
        285,
        { align: 'center' }
      );
    }

    // Download
    const fileName = `report_${competition.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(fileName);
  },
};