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
  // Improved regex to better handle variations and avoid empty captures from only whitespace lines.
  const sceneHeaderRegex = /^(?:\s*)((?:INT\.|EXT\.|I\/E\.|INT\.\/EXT\.|EXT\.\/INT\.)(?:[\t ]*[A-Z0-9\-\'\.,\/ ()]+)+)/gim;

  let match;
  let lastIndex = 0;
  let sceneNumber = 0;
  let firstHeaderFound = false;

  const cleanedText = text.replace(/\r\n/g, '\n'); // Normalize line endings

  while ((match = sceneHeaderRegex.exec(cleanedText)) !== null) {
    const header = match[1].trim();
    // Ensure the matched header is not just whitespace or a very short, unlikely header.
    if (header.length < 5) continue; 

    const startIndex = match.index;

    if (firstHeaderFound) {
      // Content is from the end of the previous header match to the start of this one
      const previousSceneContent = cleanedText.substring(lastIndex, startIndex).trim();
      if (scenes.length > 0 && previousSceneContent.length > 0) {
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
    const lastSceneContent = cleanedText.substring(lastIndex).trim();
    if (lastSceneContent.length > 0) {
        scenes[scenes.length - 1].content = lastSceneContent;
    } else if (scenes[scenes.length-1].content === '') {
        // If the last scene has no content and its content was not set by a previous iteration (empty script after last header)
        logger.warn({ sceneNumber: scenes[scenes.length-1].sceneNumber, header: scenes[scenes.length-1].header}, "Last scene found with no subsequent content.");
    }
  }

  if (scenes.length === 0 && text.trim().length > 0) {
      logger.warn('No scene headers found using regex. Treating the entire text as a single scene.');
      scenes.push({
          sceneNumber: 1,
          header: 'SCENE 1 (HEADER NOT FOUND)',
          content: text.trim(),
      });
  }

  // Filter out scenes that might have been created but ended up with no content
  const finalScenes = scenes.filter(scene => scene.content.trim().length > 0 || scene.header === 'SCENE 1 (HEADER NOT FOUND)');
  if (finalScenes.length !== scenes.length) {
    logger.info(`Filtered out ${scenes.length - finalScenes.length} scenes with no content.`);
  }

  logger.info(`Split text into ${finalScenes.length} potential scenes.`);
  return finalScenes;
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
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to parse PDF');
    // It's often better to throw the original error or a custom error with more context
    throw new Error(`PDF parsing failed: ${error.message}`); 
  }
} 