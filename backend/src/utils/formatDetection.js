/**
 * Uproszczony moduł do wykrywania formatu scenariusza
 */

class FormatDetection {
  detect(content) {
    // Konwertuj Buffer na string jeśli potrzeba
    const textContent = Buffer.isBuffer(content) ? 
      content.toString('utf-8', 0, Math.min(content.length, 100)) : 
      content;

    // Sprawdź charakterystyczne cechy formatów
    if (this.isFountain(textContent)) {
      return 'fountain';
    }
    
    if (this.isFDX(textContent)) {
      return 'fdx';
    }
    
    if (this.isPDF(content)) {
      return 'pdf';
    }
    
    return 'text';
  }

  isFountain(content) {
    // Fountain ma charakterystyczne znaczniki
    const fountainMarkers = [
      /^(INT|EXT|INT\/EXT|EXT\/INT)/m,
      /^[A-Z\s]+$/m,
      /^\s{2}/m
    ];

    return fountainMarkers.every(marker => marker.test(content));
  }

  isFDX(content) {
    // FDX to format XML
    return content.includes('<?xml') && 
           content.includes('<FinalDraft') &&
           content.includes('<Content>');
  }

  isPDF(content) {
    // PDF ma charakterystyczny nagłówek
    if (Buffer.isBuffer(content)) {
      return content.slice(0, 5).toString('utf-8') === '%PDF-';
    }
    return content.startsWith('%PDF-');
  }
}

export const formatDetection = new FormatDetection(); 