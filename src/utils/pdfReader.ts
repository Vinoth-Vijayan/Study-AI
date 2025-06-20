
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export const getPdfPageCount = async (file: File): Promise<number> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    return pdf.numPages;
  } catch (error) {
    console.error('Error reading PDF:', error);
    return 1; // Default to 1 if we can't read the PDF
  }
};

export const extractTextFromPdfPage = async (file: File, pageNumber: number): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    
    return textContent.items
      .map((item: any) => item.str)
      .join(' ');
  } catch (error) {
    console.error('Error extracting text from PDF page:', error);
    return '';
  }
};
