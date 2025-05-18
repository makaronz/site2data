import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { scriptAnalysisService } from '../services/scriptAnalysis';
import { WebSocketMessage, WebSocketAuthPayload } from 'shared-types';
import { validationSchemas, validateAuthToken } from '../middleware/validation';

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, { 
    authenticated: boolean, 
    sessionId?: string,
    tokenExpiresAt?: number 
  }> = new Map();
  
  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/script-analysis' });
    
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection');
      this.clients.set(ws, { authenticated: false });
      
      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message) as WebSocketMessage;
          
          // Handle authentication
          if (data.type === 'AUTH') {
            try {
              // Validate authentication payload using Zod schema
              const authPayload = validationSchemas.websocketAuth.parse(data as unknown as WebSocketAuthPayload);
              
              // Validate token against token store or auth service
              const tokenValidation = validateAuthToken(authPayload.token);
              
              if (tokenValidation.valid) {
                this.clients.set(ws, { 
                  authenticated: true, 
                  sessionId: authPayload.sessionId,
                  tokenExpiresAt: tokenValidation.expiresAt
                });
                
                ws.send(JSON.stringify({
                  type: 'PROGRESS',
                  message: 'Authentication successful',
                  expiresAt: tokenValidation.expiresAt
                }));
                return;
              } else {
                ws.send(JSON.stringify({
                  type: 'ERROR',
                  message: `Authentication failed: ${tokenValidation.error || 'Invalid token'}`,
                  expired: tokenValidation.expired
                }));
                ws.close();
                return;
              }
            } catch (validationError) {
              // Include detailed validation error information
              const errorMessage = validationError instanceof Error 
                ? validationError.message 
                : 'Schema validation failed';
                
              ws.send(JSON.stringify({
                type: 'ERROR',
                message: `Invalid authentication data: ${errorMessage}`,
                code: 'VALIDATION_ERROR'
              }));
              ws.close();
              return;
            }
          }
          
          // Check authentication for all other message types
          const clientInfo = this.clients.get(ws);
          if (!clientInfo || !clientInfo.authenticated) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              message: 'Not authenticated',
              code: 'AUTHENTICATION_REQUIRED'
            }));
            ws.close();
            return;
          }
          
          // Check token expiration if available
          if (clientInfo.tokenExpiresAt && clientInfo.tokenExpiresAt < Date.now()) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              message: 'Authentication token has expired',
              code: 'TOKEN_EXPIRED',
              expired: true
            }));
            ws.close();
            return;
          }
          
          if (data.type === 'ANALYZE_SCRIPT') {
            // Send initial progress update
            ws.send(JSON.stringify({
              type: 'PROGRESS',
              message: 'Starting analysis...',
              stage: 'initialization',
              progress: 0
            }));
            
            try {
              // Integrate with actual script analysis service
              const result = await scriptAnalysisService.analyzeScript(data.script);
              
              // Send result back to client
              ws.send(JSON.stringify({
                type: 'ANALYSIS_RESULT',
                result
              }));
            } catch (error) {
              console.error('Error during script analysis:', error);
              ws.send(JSON.stringify({
                type: 'ERROR',
                message: error instanceof Error ? error.message : 'Unknown error during analysis',
                code: 'ANALYSIS_ERROR'
              }));
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Error processing request: Invalid message format',
            code: 'INVALID_MESSAGE'
          }));
        }
      });
      
      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
    
    // Periodically check for expired tokens
    setInterval(() => {
      const now = Date.now();
      this.clients.forEach((clientInfo, client) => {
        if (clientInfo.authenticated && 
            clientInfo.tokenExpiresAt && 
            clientInfo.tokenExpiresAt < now) {
          client.send(JSON.stringify({
            type: 'ERROR',
            message: 'Authentication token has expired',
            code: 'TOKEN_EXPIRED',
            expired: true
          }));
          client.close();
        }
      });
    }, 60000); // Check every minute
  }
  
  public broadcast(message: string): void {
    this.clients.forEach((clientInfo, client) => {
      if (client.readyState === WebSocket.OPEN && clientInfo.authenticated) {
        client.send(message);
      }
    });
  }
  
  public broadcastToSession(sessionId: string, message: string): void {
    this.clients.forEach((clientInfo, client) => {
      if (
        client.readyState === WebSocket.OPEN && 
        clientInfo.authenticated && 
        clientInfo.sessionId === sessionId
      ) {
        client.send(message);
      }
    });
  }
}
