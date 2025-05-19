import { describe, it, expect } from 'vitest';
import {
  fileUploadSchema,
  apiKeySchema,
  paginationSchema,
  idSchema,
  scriptAnalysisSchema,
  completeScriptAnalysisSchema,
  ScriptFileType
} from '../../../packages/shared-types';

describe('Validation Schemas', () => {
  describe('fileUploadSchema', () => {
    it('should validate a valid file upload request', () => {
      const validRequest = {
        type: ScriptFileType.PDF,
        model: 'gpt-4'
      };
      
      const result = fileUploadSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
    
    it('should validate a request without optional model', () => {
      const validRequest = {
        type: ScriptFileType.TXT
      };
      
      const result = fileUploadSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
    
    it('should reject a request with invalid file type', () => {
      const invalidRequest = {
        type: 'doc' // Invalid type
      };
      
      const result = fileUploadSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });
  
  describe('apiKeySchema', () => {
    it('should validate a valid API key', () => {
      const validKey = {
        key: '12345678901234567890123456789012' // 32 chars
      };
      
      const result = apiKeySchema.safeParse(validKey);
      expect(result.success).toBe(true);
    });
    
    it('should reject a key that is too short', () => {
      const invalidKey = {
        key: '123456' // Too short
      };
      
      const result = apiKeySchema.safeParse(invalidKey);
      expect(result.success).toBe(false);
    });
    
    it('should reject a key that is too long', () => {
      const invalidKey = {
        key: '1'.repeat(65) // Too long
      };
      
      const result = apiKeySchema.safeParse(invalidKey);
      expect(result.success).toBe(false);
    });
  });
  
  describe('paginationSchema', () => {
    it('should validate valid pagination parameters', () => {
      const validParams = {
        page: 2,
        limit: 50
      };
      
      const result = paginationSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });
    
    it('should apply default values when parameters are missing', () => {
      const result = paginationSchema.parse({});
      expect(result).toEqual({
        page: 1,
        limit: 20
      });
    });
    
    it('should coerce string values to numbers', () => {
      const stringParams = {
        page: '3',
        limit: '30'
      };
      
      const result = paginationSchema.parse(stringParams);
      expect(result).toEqual({
        page: 3,
        limit: 30
      });
    });
    
    it('should reject invalid pagination values', () => {
      const invalidParams = {
        page: 0, // Invalid: must be positive
        limit: 150 // Invalid: exceeds max
      };
      
      const result = paginationSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });
  
  describe('idSchema', () => {
    it('should validate a valid UUID', () => {
      const validId = {
        id: '123e4567-e89b-12d3-a456-426614174000'
      };
      
      const result = idSchema.safeParse(validId);
      expect(result.success).toBe(true);
    });
    
    it('should reject an invalid UUID format', () => {
      const invalidId = {
        id: '123-456-789' // Invalid UUID format
      };
      
      const result = idSchema.safeParse(invalidId);
      expect(result.success).toBe(false);
    });
  });
  
  describe('scriptAnalysisSchema', () => {
    it('should validate a valid script analysis', () => {
      const validAnalysis = {
        title: 'Test Script',
        genre: ['Drama', 'Thriller'],
        logline: 'A test script about testing',
        themes: ['Redemption', 'Justice'],
        tone: 'Dark and moody',
        setting: {
          time_period: 'Present day',
          primary_locations: ['New York', 'Los Angeles']
        },
        estimated_budget_tier: 'medium',
        estimated_runtime_minutes: 120,
        target_audience: ['Adults 18-49', 'Drama fans'],
        content_rating: 'PG-13',
        production_challenges: ['Night scenes', 'Crowd scenes']
      };
      
      const result = scriptAnalysisSchema.safeParse(validAnalysis);
      expect(result.success).toBe(true);
    });
    
    it('should reject an analysis with invalid budget tier', () => {
      const invalidAnalysis = {
        title: 'Test Script',
        genre: ['Drama', 'Thriller'],
        logline: 'A test script about testing',
        themes: ['Redemption', 'Justice'],
        tone: 'Dark and moody',
        setting: {
          time_period: 'Present day',
          primary_locations: ['New York', 'Los Angeles']
        },
        estimated_budget_tier: 'ultra-high', // Invalid tier
        estimated_runtime_minutes: 120,
        target_audience: ['Adults 18-49', 'Drama fans'],
        content_rating: 'PG-13',
        production_challenges: ['Night scenes', 'Crowd scenes']
      };
      
      const result = scriptAnalysisSchema.safeParse(invalidAnalysis);
      expect(result.success).toBe(false);
    });
  });
  
  describe('completeScriptAnalysisSchema', () => {
    it('should validate a complete script analysis', () => {
      const validCompleteAnalysis = {
        analysis: {
          title: 'Test Script',
          genre: ['Drama', 'Thriller'],
          logline: 'A test script about testing',
          themes: ['Redemption', 'Justice'],
          tone: 'Dark and moody',
          setting: {
            time_period: 'Present day',
            primary_locations: ['New York', 'Los Angeles']
          },
          estimated_budget_tier: 'medium',
          estimated_runtime_minutes: 120,
          target_audience: ['Adults 18-49', 'Drama fans'],
          content_rating: 'PG-13',
          production_challenges: ['Night scenes', 'Crowd scenes']
        },
        locations: {
          locations: ['New York apartment', 'LA beach house']
        },
        roles: {
          roles: [
            { character: 'John', role: 'protagonist' },
            { character: 'Mary', role: 'supporting' }
          ]
        },
        props: {
          global_props: ['Gun', 'Laptop'],
          scene_props: {
            'Scene 1': ['Coffee cup', 'Newspaper']
          }
        },
        vehicles: {
          global_vehicles: ['Red sports car', 'Police cruiser'],
          scene_vehicles: {
            'Scene 5': ['Taxi', 'Ambulance']
          }
        },
        weapons: {
          global_weapons: ['Handgun', 'Knife'],
          scene_weapons: {
            'Scene 10': ['Rifle', 'Grenade']
          }
        },
        fx: {
          special_effects: ['Explosion', 'Rain']
        },
        difficult_scenes: {
          difficult_scenes: [
            {
              scene: 'Scene 12',
              challenge: 'Complex stunt work',
              suggestions: ['Use stunt double', 'Break into smaller shots']
            }
          ]
        },
        permits_needed: {
          permits_needed: [
            {
              type: 'Street closure',
              reason: 'Car chase scene',
              scenes: ['Scene 8', 'Scene 9']
            }
          ]
        },
        special_gear: {
          special_gear: [
            {
              gear: 'Drone camera',
              purpose: 'Aerial shots',
              scenes: ['Scene 1', 'Scene 15']
            }
          ]
        },
        lighting_schemes: {
          lighting: [
            {
              scene: 'Scene 3',
              scheme: 'Low-key lighting',
              equipment: ['Fresnel lights', 'Flags']
            }
          ]
        },
        cast_skills: {
          special_skills: [
            {
              skill: 'Horseback riding',
              characters: ['John', 'Mary'],
              scenes: ['Scene 7']
            }
          ]
        },
        production_risks: {
          risks: [
            {
              risk: 'Water scene safety',
              severity: 'high',
              mitigation: 'Professional safety divers on set',
              scenes: ['Scene 14']
            }
          ]
        }
      };
      
      const result = completeScriptAnalysisSchema.safeParse(validCompleteAnalysis);
      expect(result.success).toBe(true);
    });
  });
});
