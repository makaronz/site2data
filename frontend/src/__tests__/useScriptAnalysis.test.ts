import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useScriptAnalysis } from '../hooks/useScriptAnalysis';
import { useWebSocket } from '../contexts/WebSocketContext';

// Mock the WebSocketContext
vi.mock('../contexts/WebSocketContext', () => ({
  useWebSocket: vi.fn()
}));

describe('useScriptAnalysis', () => {
  const mockUseWebSocket = useWebSocket as jest.Mock;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Default mock implementation
    mockUseWebSocket.mockReturnValue({
      connected: true,
      sendMessage: vi.fn(),
      lastMessage: null,
      connectionStatus: 'connected',
      error: null
    });
  });
  
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useScriptAnalysis());
    
    expect(result.current.analyzing).toBe(false);
    expect(result.current.progress).toEqual({
      stage: 'uploading',
      progress: 0,
      message: 'Preparing analysis...'
    });
    expect(result.current.result).toBe(null);
    expect(result.current.connected).toBe(true);
    expect(result.current.connectionStatus).toBe('connected');
  });
  
  it('should handle analyzeScript when connected', () => {
    const mockSendMessage = vi.fn();
    mockUseWebSocket.mockReturnValue({
      connected: true,
      sendMessage: mockSendMessage,
      lastMessage: null,
      connectionStatus: 'connected',
      error: null
    });
    
    const { result } = renderHook(() => useScriptAnalysis());
    
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    act(() => {
      result.current.analyzeScript(mockFile);
    });
    
    expect(result.current.analyzing).toBe(true);
    expect(result.current.progress).toEqual({
      stage: 'uploading',
      progress: 0,
      message: 'Uploading script...'
    });
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'ANALYZE_SCRIPT',
      script: mockFile
    });
  });
  
  it('should not analyze script when disconnected', () => {
    const mockSendMessage = vi.fn();
    const mockOnError = vi.fn();
    mockUseWebSocket.mockReturnValue({
      connected: false,
      sendMessage: mockSendMessage,
      lastMessage: null,
      connectionStatus: 'disconnected',
      error: null
    });
    
    const { result } = renderHook(() => useScriptAnalysis({ onError: mockOnError }));
    
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    act(() => {
      result.current.analyzeScript(mockFile);
    });
    
    expect(result.current.analyzing).toBe(false);
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith('WebSocket not connected');
  });
  
  it('should handle PROGRESS message type', () => {
    const mockOnProgress = vi.fn();
    mockUseWebSocket.mockReturnValue({
      connected: true,
      sendMessage: vi.fn(),
      lastMessage: null,
      connectionStatus: 'connected',
      error: null
    });
    
    const { result, rerender } = renderHook(() => useScriptAnalysis({ onProgress: mockOnProgress }));
    
    // Set analyzing to true
    act(() => {
      result.current.analyzeScript(new File(['test'], 'test.txt'));
    });
    
    // Update the mock to return a PROGRESS message
    mockUseWebSocket.mockReturnValue({
      connected: true,
      sendMessage: vi.fn(),
      lastMessage: {
        type: 'PROGRESS',
        message: 'Processing file...'
      },
      connectionStatus: 'connected',
      error: null
    });
    
    // Re-render to trigger the useEffect
    rerender();
    
    expect(result.current.progress.message).toBe('Processing file...');
    expect(result.current.progress.stage).toBe('processing');
    expect(mockOnProgress).toHaveBeenCalled();
  });
  
  it('should handle ANALYSIS_RESULT message type', () => {
    const mockOnResult = vi.fn();
    mockUseWebSocket.mockReturnValue({
      connected: true,
      sendMessage: vi.fn(),
      lastMessage: null,
      connectionStatus: 'connected',
      error: null
    });
    
    const { result, rerender } = renderHook(() => useScriptAnalysis({ onResult: mockOnResult }));
    
    // Set analyzing to true
    act(() => {
      result.current.analyzeScript(new File(['test'], 'test.txt'));
    });
    
    const mockResult = {
      metadata: {
        title: 'Test Script',
        authors: ['Test Author'],
        detected_language: 'en',
        scene_count: 5,
        token_count: 1000,
        analysis_timestamp: new Date().toISOString()
      }
    };
    
    // Update the mock to return an ANALYSIS_RESULT message
    mockUseWebSocket.mockReturnValue({
      connected: true,
      sendMessage: vi.fn(),
      lastMessage: {
        type: 'ANALYSIS_RESULT',
        result: mockResult
      },
      connectionStatus: 'connected',
      error: null
    });
    
    // Re-render to trigger the useEffect
    rerender();
    
    expect(result.current.analyzing).toBe(false);
    expect(result.current.result).toEqual(mockResult);
    expect(result.current.progress).toEqual({
      stage: 'complete',
      progress: 100,
      message: 'Analysis complete'
    });
    expect(mockOnResult).toHaveBeenCalledWith(mockResult);
  });
  
  it('should handle ERROR message type', () => {
    const mockOnError = vi.fn();
    mockUseWebSocket.mockReturnValue({
      connected: true,
      sendMessage: vi.fn(),
      lastMessage: null,
      connectionStatus: 'connected',
      error: null
    });
    
    const { result, rerender } = renderHook(() => useScriptAnalysis({ onError: mockOnError }));
    
    // Set analyzing to true
    act(() => {
      result.current.analyzeScript(new File(['test'], 'test.txt'));
    });
    
    // Update the mock to return an ERROR message
    mockUseWebSocket.mockReturnValue({
      connected: true,
      sendMessage: vi.fn(),
      lastMessage: {
        type: 'ERROR',
        message: 'Analysis failed'
      },
      connectionStatus: 'connected',
      error: null
    });
    
    // Re-render to trigger the useEffect
    rerender();
    
    expect(result.current.analyzing).toBe(false);
    expect(result.current.progress).toEqual({
      stage: 'error',
      progress: 0,
      message: 'Analysis failed'
    });
    expect(mockOnError).toHaveBeenCalledWith('Analysis failed');
  });
});
