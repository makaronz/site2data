import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv();

export interface ParsedScene {
  sceneNumber: number;
  location: string;
  timeOfDay: string;
  characters: string[];
  dialogues: string[];
}

const schema: JSONSchemaType<ParsedScene> = {
  type: 'object',
  properties: {
    sceneNumber: { type: 'integer' },
    location: { type: 'string' },
    timeOfDay: { type: 'string' },
    characters: { type: 'array', items: { type: 'string' } },
    dialogues: { type: 'array', items: { type: 'string' } },
  },
  required: ['sceneNumber', 'location', 'timeOfDay', 'characters', 'dialogues'],
  additionalProperties: false,
};

const validate = ajv.compile(schema);

export const validateChunk = (data: any): { valid: boolean; errors?: string[] } => {
  const valid = validate(data);
  if (valid) {
    return { valid: true };
  } else {
    return {
      valid: false,
      errors: validate.errors?.map(e => `${e.instancePath} ${e.message}`) || [],
    };
  }
}; 