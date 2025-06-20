
export const getPdfPageCount = async (file: File): Promise<number> => {
  try {
    // Create a simple PDF reader using ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to string to search for page count
    const pdfString = Array.from(uint8Array)
      .map(byte => String.fromCharCode(byte))
      .join('');
    
    // Look for the /Count entry which indicates number of pages
    const countMatch = pdfString.match(/\/Count\s+(\d+)/);
    if (countMatch) {
      return parseInt(countMatch[1]);
    }
    
    // Fallback: count page objects
    const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g);
    if (pageMatches) {
      return pageMatches.length;
    }
    
    // If we can't determine, return a reasonable default
    return 50;
  } catch (error) {
    console.error('Error reading PDF page count:', error);
    return 50; // Fallback
  }
};

export const extractTextFromPdf = async (file: File, pageNumber?: number): Promise<string> => {
  try {
    // For now, return a placeholder - in a real app, you'd use a proper PDF parser
    return `Content from ${file.name} ${pageNumber ? `page ${pageNumber}` : ''}`;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  }
};
