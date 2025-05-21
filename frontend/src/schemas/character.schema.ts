import { z } from 'zod';

export const CharacterSchema = z.object({
  _id: z.string(), // MongoDB ObjectId
  jobId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  dialogueCount: z.number().int().optional(),
  sceneCount: z.number().int().optional(),
  // ... other character-specific analysis fields like centrality, relationships, etc.
});
export type Character = z.infer<typeof CharacterSchema>; 