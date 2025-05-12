/**
 * Enhanced PDF parser using PDF.js to extract text from PDF files
 */

// Import from CDN for browser compatibility
declare const pdfjsLib: any;

// Initialize PDF.js - this will be called when the component mounts
export function initPDFJS() {
  // Set worker source (must be called before loading any PDFs)
  if (typeof window !== 'undefined' && !window.pdfjsLib) {
    const script = document.createElement('script');
    script.src = 'https://mozilla.github.io/pdf.js/build/pdf.mjs';
    script.type = 'module';
    script.onload = () => {
      const workerScript = document.createElement('script');
      workerScript.innerHTML = `
        import * as pdfjsLib from 'https://mozilla.github.io/pdf.js/build/pdf.mjs';
        window.pdfjsLib = pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.mjs';
      `;
      workerScript.type = 'module';
      document.head.appendChild(workerScript);
    };
    document.head.appendChild(script);
  }
}

/**
 * Extract text from a PDF file
 * @param file The PDF file object
 * @returns Promise resolving to the extracted text
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      if (!window.pdfjsLib) {
        reject(new Error('PDF.js is not initialized. Call initPDFJS first.'));
        return;
      }

      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer) {
          reject(new Error('Could not read file'));
          return;
        }

        try {
          const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const countPromises: Promise<string>[] = [];
          
          for (let i = 1; i <= pdf.numPages; i++) {
            countPromises.push(
              pdf.getPage(i).then((page: any) => {
                return page.getTextContent().then((text: any) => {
                  return text.items.map((s: any) => s.str).join(' ');
                });
              })
            );
          }
          
          const texts = await Promise.all(countPromises);
          resolve(texts.join('\n'));
        } catch (error) {
          console.error('Error parsing PDF:', error);
          reject(error);
        }
      };
      
      fileReader.onerror = (error) => {
        reject(error);
      };
      
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      reject(error);
    }
  });
}

// Add a typescript type declaration for the window object to include pdfjsLib
declare global {
  interface Window {
    pdfjsLib: any;
  }
}
