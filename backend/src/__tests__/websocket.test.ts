import { describe, it, expect } from 'vitest';
import {
  websocketAuthSchema,
  analyzeScriptSchema,
  progressMessageSchema,
  analysisResultSchema,
  errorMessageSchema,
  WebSocketMessageType
} from '../../../packages/shared-types';

describe('WebSocket Message Schemas', () => {
  describe('websocketAuthSchema', () => {
    it('should validate a valid auth payload', () => {
      const validPayload = {
        type: WebSocketMessageType.AUTH,
        token: 'abcdefghijklmnopqrstuvwxyz123456',
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: Date.now()
      };
      
      const result = websocketAuthSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
    
    it('should reject an auth payload with invalid token format', () => {
      const invalidPayload = {
        type: WebSocketMessageType.AUTH,
        token: 'short',
        sessionId: '123e4567-e89b-12d3-a456-426614174000'
      };
      
      const result = websocketAuthSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
    
    it('should reject an auth payload with invalid characters in token', () => {
      const invalidPayload = {
        type: WebSocketMessageType.AUTH,
        token: 'abcdefghijklmnopqrstuvwxyz123456!@#',
        sessionId: '123e4567-e89b-12d3-a456-426614174000'
      };
      
      const result = websocketAuthSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });
  
  describe('analyzeScriptSchema', () => {
    it('should validate a valid script analysis request', () => {
      const validRequest = {
        type: WebSocketMessageType.ANALYZE_SCRIPT,
        script: {
          content: 'INT. LIVING ROOM - DAY\n\nJohn enters the room.',
          type: 'txt',
          filename: 'script.txt'
        }
      };
      
      const result = analyzeScriptSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
    
    it('should reject a request with empty script content', () => {
      const invalidRequest = {
        type: WebSocketMessageType.ANALYZE_SCRIPT,
        script: {
          content: '',
          type: 'txt'
        }
      };
      
      const result = analyzeScriptSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
    
    it('should reject a request with invalid script type', () => {
      const invalidRequest = {
        type: WebSocketMessageType.ANALYZE_SCRIPT,
        script: {
          content: 'INT. LIVING ROOM - DAY\n\nJohn enters the room.',
          type: 'doc' // Invalid type
        }
      };
      
      const result = analyzeScriptSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });
  
  describe('progressMessageSchema', () => {
    it('should validate a valid progress message', () => {
      const validMessage = {
        type: WebSocketMessageType.PROGRESS,
        message: 'Processing script',
        stage: 'character_analysis',
        progress: 45,
        analysisId: '12345',
        elapsedTime: 3500
      };
      
      const result = progressMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });
    
    it('should reject a progress message with invalid progress value', () => {
      const invalidMessage = {
        type: WebSocketMessageType.PROGRESS,
        message: 'Processing script',
        progress: 120 // Invalid: > 100
      };
      
      const result = progressMessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });
  });
  
  describe('analysisResultSchema', () => {
    it('should validate a valid analysis result message', () => {
      const validMessage = {
        type: WebSocketMessageType.ANALYSIS_RESULT,
        result: {
          title: 'Test Script',
          characters: ['John', 'Mary']
        },
        analysisId: '12345'
      };
      
      const result = analysisResultSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });
    
    it('should reject an analysis result message without analysisId', () => {
      const invalidMessage = {
        type: WebSocketMessageType.ANALYSIS_RESULT,
        result: {
          title: 'Test Script',
          characters: ['John', 'Mary']
        }
        // Missing analysisId
      };
      
      const result = analysisResultSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });
  });
  
  describe('errorMessageSchema', () => {
    it('should validate a valid error message', () => {
      const validMessage = {
        type: WebSocketMessageType.ERROR,
        message: 'Failed to analyze script',
        code: 'ANALYSIS_ERROR',
        details: 'Script format not recognized',
        analysisId: '12345'
      };
      
      const result = errorMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });
    
    it('should reject an error message without a message', () => {
      const invalidMessage = {
        type: WebSocketMessageType.ERROR,
        code: 'ANALYSIS_ERROR'
        // Missing message
      };
      
      const result = errorMessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });
  });
});
