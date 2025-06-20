
import jsPDF from 'jspdf';

export interface PDFContent {
  title: string;
  content: any[];
  type: 'keypoints' | 'questions';
}

export const downloadPDF = async ({ title, content, type }: PDFContent) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = margin;

  // Add title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin, yPosition);
  yPosition += lineHeight * 2;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  if (type === 'keypoints') {
    content.forEach((analysis, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }

      // Page header
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Page ${analysis.page} - Key Points`, margin, yPosition);
      yPosition += lineHeight;

      // TNPSC Relevance
      pdf.setFont('helvetica', 'bold');
      pdf.text('TNPSC Relevance:', margin, yPosition);
      yPosition += lineHeight;
      
      pdf.setFont('helvetica', 'normal');
      const relevanceLines = pdf.splitTextToSize(analysis.tnpscRelevance, pageWidth - 2 * margin);
      pdf.text(relevanceLines, margin, yPosition);
      yPosition += relevanceLines.length * lineHeight + 5;

      // Key Points
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Study Points:', margin, yPosition);
      yPosition += lineHeight;

      pdf.setFont('helvetica', 'normal');
      analysis.keyPoints.forEach((point: string, pointIndex: number) => {
        const pointLines = pdf.splitTextToSize(`${pointIndex + 1}. ${point}`, pageWidth - 2 * margin - 10);
        pdf.text(pointLines, margin + 10, yPosition);
        yPosition += pointLines.length * lineHeight + 2;
      });

      // Summary
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary:', margin, yPosition);
      yPosition += lineHeight;

      pdf.setFont('helvetica', 'normal');
      const summaryLines = pdf.splitTextToSize(analysis.summary, pageWidth - 2 * margin);
      pdf.text(summaryLines, margin, yPosition);
      yPosition += summaryLines.length * lineHeight + 15;
    });
  } else if (type === 'questions') {
    content.forEach((question, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }

      // Question number and difficulty
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Question ${index + 1} (${question.difficulty.toUpperCase()})`, margin, yPosition);
      yPosition += lineHeight;

      // Question text
      pdf.setFont('helvetica', 'normal');
      const questionLines = pdf.splitTextToSize(question.question, pageWidth - 2 * margin);
      pdf.text(questionLines, margin, yPosition);
      yPosition += questionLines.length * lineHeight + 5;

      // Options (if MCQ)
      if (question.options && question.options.length > 0) {
        question.options.forEach((option: string, optIndex: number) => {
          const optionText = `${String.fromCharCode(65 + optIndex)}. ${option}`;
          const optionLines = pdf.splitTextToSize(optionText, pageWidth - 2 * margin - 10);
          pdf.text(optionLines, margin + 10, yPosition);
          yPosition += optionLines.length * lineHeight + 2;
        });
      }

      // Answer
      if (question.answer) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Answer:', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(question.answer, margin + 30, yPosition);
        yPosition += lineHeight;
      }

      yPosition += 10; // Space between questions
    });
  }

  // Save the PDF
  const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
  pdf.save(fileName);
};
