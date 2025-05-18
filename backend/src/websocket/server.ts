import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { scriptAnalysisService } from '../services/scriptAnalysis';
import { WebSocketMessage, WebSocketAuthPayload } from 'shared-types';
import { validationSchemas } from '../middleware/validation';

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, { authenticated: boolean, sessionId?: string }> = new Map();
  
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
              
              if (this.validateToken(authPayload.token)) {
                this.clients.set(ws, { 
                  authenticated: true, 
                  sessionId: authPayload.sessionId 
                });
                
                ws.send(JSON.stringify({
                  type: 'PROGRESS',
                  message: 'Authentication successful'
                }));
                return;
              } else {
                ws.send(JSON.stringify({
                  type: 'ERROR',
                  message: 'Authentication failed'
                }));
                ws.close();
                return;
              }
            } catch (validationError) {
              ws.send(JSON.stringify({
                type: 'ERROR',
                message: 'Invalid authentication data'
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
              message: 'Not authenticated'
            }));
            ws.close();
            return;
          }
          
          if (data.type === 'ANALYZE_SCRIPT') {
            // Send initial progress update
            ws.send(JSON.stringify({
              type: 'PROGRESS',
              message: 'Starting analysis...'
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
                message: error instanceof Error ? error.message : 'Unknown error during analysis'
              }));
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Error processing request'
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
  }
  
  private validateToken(token: string): boolean {
    // In a real implementation, this would validate against a token store
    // For now, we'll accept any non-empty token
    return !!token && token.length > 10;
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
