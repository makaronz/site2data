"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const WebSocket = __importStar(require("ws"));
const clients_1 = require("./clients");
const router_1 = __importDefault(require("./router"));
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Use router for API routes
app.use(router_1.default);
// Create HTTP server
const server = (0, http_1.createServer)(app);
// Create WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws/script-analysis' });
// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    ws.on('message', (message) => {
        console.log('Received message:', message);
        // Handle incoming messages
    });
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
});
// Initialize clients and start server
async function startServer() {
    try {
        await (0, clients_1.initClients)();
        // Fixed: Removed host string parameter to match TypeScript type definition
        server.listen(Number(PORT), () => {
            console.log(`API Gateway listening at http://0.0.0.0:${PORT}`);
            console.log(`WebSocket server listening at ws://0.0.0.0:${PORT}/ws/script-analysis`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map