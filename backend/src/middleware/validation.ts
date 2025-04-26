import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const fileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  size: z.number().max(10 * 1024 * 1024), // max 10MB
  buffer: z.instanceof(Buffer).optional(),
  path: z.string().optional(),
  destination: z.string().optional(),
  filename: z.string().optional(),
});

const uploadRequestSchema = z.object({
  script: fileSchema,
  type: z.enum(['pdf', 'txt']).optional().default('pdf'),
});

export const validateUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Brak pliku w żądaniu',
      });
    }

    const validatedData = uploadRequestSchema.parse({
      script: req.file,
      type: req.body.type || 'pdf',
    });

    // Przekazujemy dalej zwalidowane dane
    req.body.validatedData = validatedData;
    next();
  } catch (error: unknown) {
    console.error('Błąd walidacji:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowe dane wejściowe',
        errors: error.errors,
      });
    }
    next(error);
  }
}; 