/**
 * Validation schemas and utilities
 * 
 * This file contains shared validation schemas used by both frontend and backend.
 */

import { z } from 'zod';

/**
 * Script file types
 */
export enum ScriptFileType {
  PDF = 'pdf',
  TXT = 'txt'
}

/**
 * File upload validation schema
 */
export const fileUploadSchema = z.object({
  type: z.nativeEnum(ScriptFileType),
  model: z.string().optional()
});

/**
 * API key validation schema
 */
export const apiKeySchema = z.object({
  key: z.string().min(32).max(64)
});

/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

/**
 * ID parameter schema
 */
export const idSchema = z.object({
  id: z.string().uuid()
});

/**
 * Script analysis result schema
 */
export const scriptAnalysisSchema = z.object({
  title: z.string(),
  genre: z.array(z.string()),
  logline: z.string(),
  themes: z.array(z.string()),
  tone: z.string(),
  setting: z.object({
    time_period: z.string(),
    primary_locations: z.array(z.string())
  }),
  estimated_budget_tier: z.enum(['low', 'medium', 'high', 'blockbuster']),
  estimated_runtime_minutes: z.number().int().positive(),
  target_audience: z.array(z.string()),
  content_rating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17']),
  production_challenges: z.array(z.string())
});

/**
 * Locations schema
 */
export const locationsSchema = z.object({
  locations: z.array(z.string())
});

/**
 * Roles schema
 */
export const rolesSchema = z.object({
  roles: z.array(z.object({
    character: z.string(),
    role: z.enum(['protagonist', 'antagonist', 'supporting', 'minor'])
  }))
});

/**
 * Props schema
 */
export const propsSchema = z.object({
  global_props: z.array(z.string()),
  scene_props: z.record(z.string(), z.array(z.string()))
});

/**
 * Vehicles schema
 */
export const vehiclesSchema = z.object({
  global_vehicles: z.array(z.string()),
  scene_vehicles: z.record(z.string(), z.array(z.string()))
});

/**
 * Weapons schema
 */
export const weaponsSchema = z.object({
  global_weapons: z.array(z.string()),
  scene_weapons: z.record(z.string(), z.array(z.string()))
});

/**
 * Special effects schema
 */
export const fxSchema = z.object({
  special_effects: z.array(z.string())
});

/**
 * Difficult scenes schema
 */
export const difficultScenesSchema = z.object({
  difficult_scenes: z.array(z.object({
    scene: z.string(),
    challenge: z.string(),
    suggestions: z.array(z.string())
  }))
});

/**
 * Permits needed schema
 */
export const permitsNeededSchema = z.object({
  permits_needed: z.array(z.object({
    type: z.string(),
    reason: z.string(),
    scenes: z.array(z.string())
  }))
});

/**
 * Special gear schema
 */
export const specialGearSchema = z.object({
  special_gear: z.array(z.object({
    gear: z.string(),
    purpose: z.string(),
    scenes: z.array(z.string())
  }))
});

/**
 * Lighting schemes schema
 */
export const lightingSchemesSchema = z.object({
  lighting: z.array(z.object({
    scene: z.string(),
    scheme: z.string(),
    equipment: z.array(z.string())
  }))
});

/**
 * Cast skills schema
 */
export const castSkillsSchema = z.object({
  special_skills: z.array(z.object({
    skill: z.string(),
    characters: z.array(z.string()),
    scenes: z.array(z.string())
  }))
});

/**
 * Production risks schema
 */
export const productionRisksSchema = z.object({
  risks: z.array(z.object({
    risk: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    mitigation: z.string(),
    scenes: z.array(z.string())
  }))
});

/**
 * Complete script analysis result schema
 */
export const completeScriptAnalysisSchema = z.object({
  analysis: scriptAnalysisSchema,
  locations: locationsSchema,
  roles: rolesSchema,
  props: propsSchema,
  vehicles: vehiclesSchema,
  weapons: weaponsSchema,
  fx: fxSchema,
  difficult_scenes: difficultScenesSchema,
  permits_needed: permitsNeededSchema,
  special_gear: specialGearSchema,
  lighting_schemes: lightingSchemesSchema,
  cast_skills: castSkillsSchema,
  production_risks: productionRisksSchema
});

/**
 * Types derived from schemas
 */
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type ApiKey = z.infer<typeof apiKeySchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type IdParam = z.infer<typeof idSchema>;
export type ScriptAnalysis = z.infer<typeof scriptAnalysisSchema>;
export type Locations = z.infer<typeof locationsSchema>;
export type Roles = z.infer<typeof rolesSchema>;
export type Props = z.infer<typeof propsSchema>;
export type Vehicles = z.infer<typeof vehiclesSchema>;
export type Weapons = z.infer<typeof weaponsSchema>;
export type FX = z.infer<typeof fxSchema>;
export type DifficultScenes = z.infer<typeof difficultScenesSchema>;
export type PermitsNeeded = z.infer<typeof permitsNeededSchema>;
export type SpecialGear = z.infer<typeof specialGearSchema>;
export type LightingSchemes = z.infer<typeof lightingSchemesSchema>;
export type CastSkills = z.infer<typeof castSkillsSchema>;
export type ProductionRisks = z.infer<typeof productionRisksSchema>;
export type CompleteScriptAnalysis = z.infer<typeof completeScriptAnalysisSchema>;
