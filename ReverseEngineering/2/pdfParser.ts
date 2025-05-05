import pdf from 'pdf-parse';
import { Logger } from 'pino';

// Basic Scene interface for splitting
export interface SceneSplit {
  sceneNumber: number;
  header: string; // e.g., "INT. COFFEE SHOP - DAY"
  content: string; // Text content of the scene
}

/**
 * Attempts to split screenplay text into scenes based on common header patterns.
 * This is a basic heuristic and might need refinement based on actual script formats.
 *
 * @param text Content extracted from the PDF.
 * @param logger Pino logger instance.
 * @returns An array of SceneSplit objects.
 */
export function splitTextIntoScenes(text: string, logger: Logger): SceneSplit[] {
  logger.debug('Attempting to split text into scenes...');
  const scenes: SceneSplit[] = [];
  // Regex to find potential scene headers (INT./EXT. followed by location)
  // Assumes headers are typically uppercase and at the start of a line, possibly with leading whitespace.
  // It captures the header line and looks for the next header or end of file.
  const sceneHeaderRegex = /^(?:\s*)((?:INT\.|EXT\.|INT\.\/EXT\.|EXT\.\/INT\.)[^\n]+)/gim;

  let match;
  let lastIndex = 0;
  let sceneNumber = 0;
  let firstHeaderFound = false;

  const cleanedText = text.replace(/\r\n/g, '\n'); // Normalize line endings

  while ((match = sceneHeaderRegex.exec(cleanedText)) !== null) {
    const header = match[1].trim();
    const startIndex = match.index;

    if (firstHeaderFound) {
      // Content is from the end of the previous header to the start of this one
      const previousSceneContent = cleanedText.substring(lastIndex, startIndex).trim();
      if (scenes.length > 0) {
        scenes[scenes.length - 1].content = previousSceneContent;
      }
    }

    // Add new scene placeholder
    sceneNumber++;
    scenes.push({
      sceneNumber,
      header,
      content: '', // Content will be added in the next iteration or after the loop
    });

    lastIndex = sceneHeaderRegex.lastIndex; // Update lastIndex to the end of the current header match
    firstHeaderFound = true;
  }

  // Add content for the last scene (from the last header to the end of the text)
  if (scenes.length > 0) {
    scenes[scenes.length - 1].content = cleanedText.substring(lastIndex).trim();
  }

  if (scenes.length === 0 && text.length > 0) {
      logger.warn('No scene headers found using regex. Treating the entire text as a single scene.');
      scenes.push({
          sceneNumber: 1,
          header: 'SCENE 1 (HEADER NOT FOUND)',
          content: text.trim(),
      });
  }

  logger.info(`Split text into ${scenes.length} potential scenes.`);
  return scenes;
}

/**
 * Parses a PDF buffer and splits its text content into scenes.
 *
 * @param pdfBuffer Buffer containing the PDF file content.
 * @param logger Pino logger instance.
 * @returns A promise resolving to an array of SceneSplit objects.
 */
export async function parsePdfAndSplitScenes(pdfBuffer: Buffer, logger: Logger): Promise<SceneSplit[]> {
  try {
    logger.info('Parsing PDF content...');
    const data = await pdf(pdfBuffer, {
      // pdf-parse options if needed
      max: -1, // Unlimited pages, though consider limits for large files
    });
    logger.info(`PDF parsed successfully. Extracted ${data.text.length} characters.`);

    if (!data.text || data.text.trim().length === 0) {
      logger.warn('PDF parsing resulted in empty text content.');
      return [];
    }

    return splitTextIntoScenes(data.text, logger);
  } catch (error) {
    logger.error({ error }, 'Failed to parse PDF');
    throw new Error('PDF parsing failed'); // Re-throw a simpler error
  }
} 