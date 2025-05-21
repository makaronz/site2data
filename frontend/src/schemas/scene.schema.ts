import { z } from 'zod';

export const SceneSchema = z.object({
  _id: z.string(), // MongoDB ObjectId
  jobId: z.string(),
  sceneNumber: z.number().int().positive(),
  pageNumber: z.number().int().positive().optional(),
  setting: z.string().optional(), // e.g., INT. OFFICE - DAY
  summary: z.string().optional(),
  content: z.string(), // Raw text content of the scene
  characters: z.array(z.string()).optional(), // IDs or names of characters in the scene
  locations: z.array(z.string()).optional(), // IDs or names of locations
  props: z.array(z.string()).optional(), // IDs or names of props
  sentiment: z.string().optional(),
  mood: z.string().optional(),
  // ... other scene-specific analysis fields
});
export type Scene = z.infer<typeof SceneSchema>; 