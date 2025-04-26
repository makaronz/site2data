import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { scriptAnalysisService } from '../services/scriptAnalysis';

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/script-analysis' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Nowe połączenie WebSocket');
      this.clients.add(ws);

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'ANALYZE_SCRIPT') {
            // Tutaj dodaj logikę analizy skryptu
            ws.send(JSON.stringify({
              type: 'PROGRESS',
              message: 'Rozpoczynam analizę...'
            }));

            // Symulacja analizy
            setTimeout(() => {
              ws.send(JSON.stringify({
                type: 'ANALYSIS_RESULT',
                result: {
                  metadata: { title: 'Przykładowy tytuł' },
                  scenes: [],
                  characters: [],
                  relationships: [],
                  topics: [],
                  clusters: [],
                  productionResources: [],
                  technicalStats: {},
                  budgetFlags: [],
                  extra: {}
                }
              }));
            }, 2000);
          }
        } catch (error) {
          console.error('Błąd przetwarzania wiadomości WebSocket:', error);
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Wystąpił błąd podczas przetwarzania żądania'
          }));
        }
      });

      ws.on('close', () => {
        console.log('Połączenie WebSocket zamknięte');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('Błąd WebSocket:', error);
        this.clients.delete(ws);
      });
    });
  }

  public broadcast(message: string) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
} 