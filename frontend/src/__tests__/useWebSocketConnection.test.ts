import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useWebSocketConnection } from '../hooks/useWebSocketConnection';

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  
  url: string;
  readyState: number = 1;
  onopen: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  
  constructor(url: string) {
    this.url = url;
  }
  
  send = vi.fn();
  close = vi.fn();
  ping = vi.fn();
}

// Setup global WebSocket mock
global.WebSocket = MockWebSocket as any;

describe('useWebSocketConnection', () => {
  let mockWs: MockWebSocket;
  
  beforeEach(() => {
    vi.useFakeTimers();
    mockWs = new MockWebSocket('ws://localhost:8080');
    vi.spyOn(global, 'WebSocket').mockImplementation(() => mockWs);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });
  
  it('should connect to WebSocket on mount when autoConnect is true', () => {
    renderHook(() => useWebSocketConnection('ws://localhost:8080'));
    
    expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8080', undefined);
  });
  
  it('should not connect to WebSocket on mount when autoConnect is false', () => {
    renderHook(() => useWebSocketConnection('ws://localhost:8080', { autoConnect: false }));
    
    expect(global.WebSocket).not.toHaveBeenCalled();
  });
  
  it('should call onOpen callback when connection is established', () => {
    const onOpen = vi.fn();
    renderHook(() => useWebSocketConnection('ws://localhost:8080', { onOpen }));
    
    // Simulate WebSocket open event
    act(() => {
      mockWs.onopen && mockWs.onopen({} as Event);
    });
    
    expect(onOpen).toHaveBeenCalled();
  });
  
  it('should call onMessage callback when message is received', () => {
    const onMessage = vi.fn();
    renderHook(() => useWebSocketConnection('ws://localhost:8080', { onMessage }));
    
    // Simulate WebSocket message event
    const messageEvent = { data: JSON.stringify({ type: 'test' }) };
    act(() => {
      mockWs.onmessage && mockWs.onmessage(messageEvent as MessageEvent);
    });
    
    expect(onMessage).toHaveBeenCalledWith(messageEvent);
  });
  
  it('should call onClose callback when connection is closed', () => {
    const onClose = vi.fn();
    renderHook(() => useWebSocketConnection('ws://localhost:8080', { onClose }));
    
    // Simulate WebSocket close event
    const closeEvent = { wasClean: true, code: 1000 };
    act(() => {
      mockWs.onclose && mockWs.onclose(closeEvent as CloseEvent);
    });
    
    expect(onClose).toHaveBeenCalledWith(closeEvent);
  });
  
  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();
    renderHook(() => useWebSocketConnection('ws://localhost:8080', { onError }));
    
    // Simulate WebSocket error event
    act(() => {
      mockWs.onerror && mockWs.onerror({} as Event);
    });
    
    expect(onError).toHaveBeenCalled();
  });
  
  it('should attempt reconnection when connection is closed unexpectedly', () => {
    renderHook(() => useWebSocketConnection('ws://localhost:8080', { 
      reconnectInterval: 1000,
      maxReconnectAttempts: 3
    }));
    
    // Clear initial connection
    vi.clearAllMocks();
    
    // Simulate unexpected close
    act(() => {
      mockWs.onclose && mockWs.onclose({ wasClean: false } as CloseEvent);
    });
    
    // Fast-forward past reconnect interval
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    
    // Should have attempted to reconnect
    expect(global.WebSocket).toHaveBeenCalledTimes(1);
  });
  
  it('should not attempt reconnection when connection is closed cleanly', () => {
    renderHook(() => useWebSocketConnection('ws://localhost:8080'));
    
    // Clear initial connection
    vi.clearAllMocks();
    
    // Simulate clean close
    act(() => {
      mockWs.onclose && mockWs.onclose({ wasClean: true } as CloseEvent);
    });
    
    // Fast-forward past potential reconnect interval
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    // Should not have attempted to reconnect
    expect(global.WebSocket).not.toHaveBeenCalled();
  });
  
  it('should send authentication token when provided', () => {
    renderHook(() => useWebSocketConnection('ws://localhost:8080', { 
      authToken: 'test-token'
    }));
    
    // Simulate connection open
    act(() => {
      mockWs.onopen && mockWs.onopen({} as Event);
    });
    
    // Should have sent auth message
    expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
      type: 'AUTH',
      token: 'test-token'
    }));
  });
  
  it('should disconnect WebSocket on unmount', () => {
    const { unmount } = renderHook(() => useWebSocketConnection('ws://localhost:8080'));
    
    unmount();
    
    expect(mockWs.close).toHaveBeenCalled();
  });
  
  it('should return correct connection status and methods', () => {
    const { result } = renderHook(() => useWebSocketConnection('ws://localhost:8080'));
    
    expect(result.current.socket).toBe(mockWs);
    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
    expect(typeof result.current.send).toBe('function');
  });
  
  it('should successfully send data when connection is open', () => {
    const { result } = renderHook(() => useWebSocketConnection('ws://localhost:8080'));
    
    // Set readyState to OPEN
    mockWs.readyState = MockWebSocket.OPEN;
    
    const data = JSON.stringify({ type: 'TEST' });
    const success = result.current.send(data);
    
    expect(success).toBe(true);
    expect(mockWs.send).toHaveBeenCalledWith(data);
  });
  
  it('should fail to send data when connection is not open', () => {
    const { result } = renderHook(() => useWebSocketConnection('ws://localhost:8080'));
    
    // Set readyState to CLOSED
    mockWs.readyState = MockWebSocket.CLOSED;
    
    const data = JSON.stringify({ type: 'TEST' });
    const success = result.current.send(data);
    
    expect(success).toBe(false);
    expect(mockWs.send).not.toHaveBeenCalled();
  });
});
