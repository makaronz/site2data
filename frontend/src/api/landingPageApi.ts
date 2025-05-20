import { createApi } from '../api/apiClient';

interface ValidateOpenAIKeyRequest {
  apiKey: string;
}

interface ValidateOpenAIKeyResponse {
  valid: boolean;
  message?: string;
}

interface UploadScriptRequest {
  file: File;
}

interface UploadScriptResponse {
  jobId: string;
  status: string;
}

export const apiService = createApi({
  endpoints: {
    validateOpenAIKey: {
      method: 'POST',
      path: '/validate-openai-key',
      request: {} as ValidateOpenAIKeyRequest,
      response: {} as ValidateOpenAIKeyResponse,
    },
    uploadScript: {
      method: 'POST',
      path: '/job',
      request: {} as UploadScriptRequest,
      response: {} as UploadScriptResponse,
      formData: true,
    },
  },
});

export const { validateOpenAIKey, uploadScript } = apiService;
