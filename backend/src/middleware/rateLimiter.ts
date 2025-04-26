import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // limit 100 żądań na IP w oknie czasowym
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Zbyt wiele żądań z tego adresu IP, spróbuj ponownie później',
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 godzina
  max: 10, // limit 10 uploadów na IP w oknie czasowym
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Zbyt wiele uploadów z tego adresu IP, spróbuj ponownie później',
});

export const wsLimiter = {
  connections: new Map<string, number>(),
  windowMs: 60 * 1000, // 1 minuta
  max: 30, // limit 30 połączeń WebSocket na IP w oknie czasowym

  check(ip: string): boolean {
    const now = Date.now();
    const connections = this.connections.get(ip) || 0;

    if (connections >= this.max) {
      return false;
    }

    this.connections.set(ip, connections + 1);
    setTimeout(() => {
      const currentConnections = this.connections.get(ip) || 0;
      if (currentConnections > 0) {
        this.connections.set(ip, currentConnections - 1);
      }
    }, this.windowMs);

    return true;
  }
}; 