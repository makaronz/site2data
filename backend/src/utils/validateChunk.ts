import Ajv from 'ajv';

interface ParsedScene {
  sceneNumber: string;
  location: string;
  timeOfDay: string;
  characters: string[];
  dialogues: Array<{
    character: string;
    text: string;
  }>;
}

const schema = {
  type: 'object',
  properties: {
    sceneNumber: { type: 'string' },
    location: { type: 'string' },
    timeOfDay: { type: 'string' },
    characters: { 
      type: 'array',
      items: { type: 'string' }
    },
    dialogues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          character: { type: 'string' },
          text: { type: 'string' }
        },
        required: ['character', 'text']
      }
    }
  },
  required: ['sceneNumber', 'location', 'timeOfDay', 'characters', 'dialogues'],
  additionalProperties: false
};

const ajv = new Ajv();
const validate = ajv.compile(schema);

export function validateChunk(chunk: unknown): { 
  isValid: boolean; 
  errors: string[];
  parsed: ParsedScene | null;
} {
  const isValid = validate(chunk);
  return {
    isValid,
    errors: validate.errors?.map(e => `${e.instancePath} ${e.message}`) || [],
    parsed: isValid ? (chunk as unknown as ParsedScene) : null
  };
} 