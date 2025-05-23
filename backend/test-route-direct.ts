// Test bezpośredniego importu trasy scriptAnalysis
import express from 'express';
import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

console.log('Basic imports OK');

// Teraz spróbujmy zaimportować problematyczne zależności jedna po drugiej
import { WebSocketClient } from './src/types/websocket';
console.log('WebSocketClient OK');

import { scriptAnalysisService } from './src/services/scriptAnalysis';
console.log('scriptAnalysisService OK');

import { exportNodesCSV, exportEdgesCSV, exportGEXF } from './src/utils/graphExport';
console.log('graph exports OK');

import { z } from 'zod';
console.log('zod OK');

console.log('All imports successful!'); 