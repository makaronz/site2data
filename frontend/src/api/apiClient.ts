import axios, { AxiosRequestConfig, Method } from 'axios';

interface ApiEndpoint<Req, Res> {
  method: Method;
  path: string;
  request: Req;
  response: Res;
  formData?: boolean;
}

interface ApiDefinition {
  endpoints: Record<string, ApiEndpoint<any, any>>;
}

export function createApi<T extends ApiDefinition>(apiDef: T) {
  const api = {} as {
    [K in keyof T['endpoints']]: (
      req: T['endpoints'][K]['request'],
      options?: AxiosRequestConfig
    ) => Promise<T['endpoints'][K]['response']>
  };

  for (const [key, endpoint] of Object.entries(apiDef.endpoints)) {
    api[key as keyof typeof api] = async (req: any, options: AxiosRequestConfig = {}) => {
      try {
        let config: AxiosRequestConfig = {
          method: endpoint.method,
          url: endpoint.path,
          ...options,
        };

        if (endpoint.formData) {
          const formData = new FormData();
          for (const [key, value] of Object.entries(req)) {
            formData.append(key, value);
          }
          config.data = formData;
          config.headers = {
            ...config.headers,
            'Content-Type': 'multipart/form-data',
          };
        } else {
          config.data = req;
          config.headers = {
            ...config.headers,
            'Content-Type': 'application/json',
          };
        }

        const response = await axios(config);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data?.message || error.message);
        }
        throw error;
      }
    };
  }

  return api;
}
