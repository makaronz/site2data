import * as trpc from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';

// Created for each request
export const createContext = ({ req, res }: trpcExpress.CreateExpressContextOptions) => {
  // TODO: Add context based on request, e.g., user authentication
  // const user = getUserFromHeader(req.headers.authorization);
  // return { user };
  return {}; // No context for now
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>; 