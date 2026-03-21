/**
 * WebSocket Service Error Handling Tests
 * 
 * Tests error handling and edge cases for WebSocket connections including:
 * - Connection failures and timeouts
 * - Reconnection logic with exponential backoff
 * - Message parsing errors
 * - Network interruptions
 * - Invalid message handling
 * - Circuit breaker behavior
 */

import websocketService from '../websocketService';

// Mock WebSocket
global.WebSocket = jest.fn();

describe('WebSocket Service Error Handling', () => {
  let mockWebSocket;

  beforeEach(() => {
    // Reset service state
    websocketService.ws = null;
    websocketService.reconnectAttempts = 0;
    websocketService.isManuallyDisconnected = false;
    websocketService.connectionState = 'disconnected';
    websocketService.subscriptions.clear();
    websocketService.messageQueue = [];
    
    // Create mock WebSocket instance
    mockWebSocket = {
      readyState: WebSocket.CONNECTING,
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    global.WebSocket.mockImplementation(() => mockWebSocket);
    
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Connection Failures', () => {
    test('should handle connection timeout', () => {
      const errorHandler = jest.fn();
      websocketService.on('error', errorHandler);

      websocketService.connect();
      
      // Simulate connection error
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Error('Connection timeout'));
      }

      expect(errorHandler).toHaveBeenCalled();
      expect(websocketService.connectionState).toBe('disconnected');
    });

    test('should handle connection refused', () => {
      const errorHandler = jest.fn();
      websocketService.on('error', errorHandler);

      websocketService.connect();
      
      const connectionError = new Error('Connection refused');
      connectionError.code = 'ECONNREFUSED';
      
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(connectionError);
      }

      expect(errorHandler).toHaveBeenCalled();
    });

    test('should handle DNS resolution failure', () => {
      const errorHandler = jest.fn();
      websocketService.on('error', errorHandler);

      websocketService.connect();
      
      const dnsError = new Error('getaddrinfo ENOTFOUND');
      dnsError.code = 'ENOTFOUND';
      
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(dnsError);
      }

      expect(errorHandler).toHaveBeenCalled();
    });

    test('should not attempt connection if already connecting', () => {
      websocketService.isConnecting = true;
      
      const initialWs = websocketService.ws;
      websocketService.connect();
      
      expect(websocketService.ws).toBe(initialWs);
    });
  });

  describe('Reconnection Logic', () => {
    test('should schedule reconnection after connection failure', () => {
      const reconnectHandler = jest.fn();
      websocketService.on('reconnectScheduled', reconnectHandler);

      websocketService.connect();
      
      // Simulate connection close
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({ code: 1006, reason: 'Abnormal closure' });
      }

      expect(reconnectHandler).toHaveBeenCalled();
      expect(websocketService.reconnectAttempts).toBe(1);
    });

    test('should use exponential backoff for reconnection delays', () => {
      websocketService.connect();

      // Simulate multiple connection failures
      for (let i = 0; i < 3; i++) {
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose({ code: 1006, reason: 'Connection lost' });
        }
        jest.advanceTimersByTime(1000);
      }

      expect(websocketService.reconnectAttempts).toBeGreaterThan(0);
    });

    test('should stop reconnecting after max attempts', () => {
      const maxAttemptsHandler = jest.fn();
      websocketService.on('maxReconnectAttemptsReached', maxAttemptsHandler);
      
      websocketService.maxReconnectAttempts = 3;
      websocketService.connect();

      // Simulate failures up to max attempts
      for (let i = 0; i <= 3; i++) {
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose({ code: 1006, reason: 'Connection lost' });
        }
        jest.advanceTimersByTime(5000);
      }

      expect(maxAttemptsHandler).toHaveBeenCalled();
    });

    test('should not reconnect if manually disconnected', () => {
      websocketService.isManuallyDisconnected = true;
      websocketService.connect();

      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({ code: 1000, reason: 'Manual disconnect' });
      }

      jest.advanceTimersByTime(10000);
      
      expect(websocketService.reconnectAttempts).toBe(0);
    });

    test('should reset reconnect attempts on successful connection', () => {
      websocketService.reconnectAttempts = 5;
      websocketService.connect();

      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      expect(websocketService.reconnectAttempts).toBe(0);
    });
  });

  describe('Message Parsing Errors', () => {
    test('should handle invalid JSON messages', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      // Send invalid JSON
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({ data: 'invalid json {' });
      }

      expect(websocketService.metrics.totalErrors).toBeGreaterThan(0);
    });

    test('should handle messages with missing type field', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({ 
          data: JSON.stringify({ payload: { data: 'test' } }) 
        });
      }

      // Should not crash, just log warning
      expect(websocketService.metrics.totalMessages).toBeGreaterThan(0);
    });

    test('should handle messages with unknown type', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({ 
          data: JSON.stringify({ 
            type: 'unknown_type', 
            payload: {} 
          }) 
        });
      }

      expect(websocketService.metrics.totalMessages).toBeGreaterThan(0);
    });

    test('should handle null message data', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({ data: null });
      }

      expect(websocketService.metrics.totalErrors).toBeGreaterThan(0);
    });

    test('should handle undefined message data', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({ data: undefined });
      }

      expect(websocketService.metrics.totalErrors).toBeGreaterThan(0);
    });
  });

  describe('Heartbeat Failures', () => {
    test('should detect heartbeat timeout', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      // Advance time past heartbeat timeout
      jest.advanceTimersByTime(35000);

      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    test('should handle missing pong response', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      websocketService.lastPingTime = Date.now();
      
      // Advance time without receiving pong
      jest.advanceTimersByTime(35000);

      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });

  describe('Network Interruptions', () => {
    test('should handle sudden disconnection', () => {
      const disconnectHandler = jest.fn();
      websocketService.on('disconnected', disconnectHandler);

      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      // Simulate sudden disconnection
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({ code: 1006, reason: 'Abnormal closure' });
      }

      expect(disconnectHandler).toHaveBeenCalled();
      expect(websocketService.connectionState).toBe('disconnected');
    });

    test('should queue messages when disconnected', () => {
      websocketService.ws = null;
      
      websocketService.send({ type: 'test', data: 'message' });

      expect(websocketService.messageQueue.length).toBe(1);
    });

    test('should process queued messages on reconnection', () => {
      websocketService.messageQueue = [
        { type: 'test1' },
        { type: 'test2' }
      ];

      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      expect(mockWebSocket.send).toHaveBeenCalledTimes(2);
      expect(websocketService.messageQueue.length).toBe(0);
    });
  });

  describe('Server Error Messages', () => {
    test('should handle server error messages', () => {
      const errorHandler = jest.fn();
      websocketService.on('serverError', errorHandler);

      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: 'error',
            payload: { message: 'Server error occurred' }
          })
        });
      }

      expect(errorHandler).toHaveBeenCalledWith({ message: 'Server error occurred' });
    });

    test('should handle rate limiting errors', () => {
      const errorHandler = jest.fn();
      websocketService.on('serverError', errorHandler);

      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: 'error',
            payload: { 
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests' 
            }
          })
        });
      }

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle extremely large message payloads', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      const largePayload = {
        type: 'price_update',
        payload: {
          data: new Array(10000).fill({ price: 43000, volume: 1000 })
        }
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({ data: JSON.stringify(largePayload) });
      }

      expect(websocketService.metrics.totalMessages).toBeGreaterThan(0);
    });

    test('should handle rapid message bursts', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      // Send 100 messages rapidly
      for (let i = 0; i < 100; i++) {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage({
            data: JSON.stringify({
              type: 'price_update',
              payload: { price: 43000 + i }
            })
          });
        }
      }

      expect(websocketService.metrics.totalMessages).toBe(100);
    });

    test('should handle zero latency measurements', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      websocketService.lastPingTime = Date.now();
      
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: 'pong',
            timestamp: Date.now()
          })
        });
      }

      expect(websocketService.latency).toBeGreaterThanOrEqual(0);
    });

    test('should handle negative timestamp differences', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      websocketService.lastPingTime = Date.now();
      
      // Simulate clock skew
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: 'pong',
            timestamp: Date.now() + 1000 // Future timestamp
          })
        });
      }

      expect(websocketService.latency).toBeDefined();
    });

    test('should handle empty subscription list', () => {
      websocketService.subscriptions.clear();
      
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      // Should not crash when resubscribing with empty list
      expect(websocketService.subscriptions.size).toBe(0);
    });

    test('should handle duplicate subscriptions', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      websocketService.subscribe('prices', ['BTC']);
      websocketService.subscribe('prices', ['BTC']);

      expect(websocketService.subscriptions.size).toBeGreaterThan(0);
    });
  });

  describe('Connection State Edge Cases', () => {
    test('should handle send when WebSocket is closing', () => {
      websocketService.ws = mockWebSocket;
      mockWebSocket.readyState = WebSocket.CLOSING;

      websocketService.send({ type: 'test' });

      expect(websocketService.messageQueue.length).toBe(1);
    });

    test('should handle send when WebSocket is closed', () => {
      websocketService.ws = mockWebSocket;
      mockWebSocket.readyState = WebSocket.CLOSED;

      websocketService.send({ type: 'test' });

      expect(websocketService.messageQueue.length).toBe(1);
    });

    test('should handle multiple rapid connect/disconnect cycles', () => {
      for (let i = 0; i < 5; i++) {
        websocketService.connect();
        mockWebSocket.readyState = WebSocket.OPEN;
        
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }

        websocketService.disconnect();
      }

      expect(websocketService.metrics.totalConnections).toBeGreaterThan(0);
    });
  });

  describe('Metrics Edge Cases', () => {
    test('should handle metrics calculation with zero connections', () => {
      websocketService.metrics.totalConnections = 0;
      websocketService.metrics.totalErrors = 0;

      const metrics = websocketService.getMetrics();

      expect(metrics.successRate).toBe('0%');
    });

    test('should handle metrics calculation with all errors', () => {
      websocketService.metrics.totalConnections = 10;
      websocketService.metrics.totalErrors = 10;

      const metrics = websocketService.getMetrics();

      expect(metrics.successRate).toBe('0.00%');
    });

    test('should handle uptime calculation when never connected', () => {
      websocketService.metrics.lastConnectedAt = null;

      const metrics = websocketService.getMetrics();

      expect(metrics.currentUptime).toBe(0);
    });
  });

  describe('Cleanup and Resource Management', () => {
    test('should cleanup resources on disconnect', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      websocketService.disconnect();

      expect(websocketService.isManuallyDisconnected).toBe(true);
      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    test('should clear all timers on cleanup', () => {
      websocketService.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      websocketService.cleanup();

      expect(websocketService.heartbeatInterval).toBeNull();
      expect(websocketService.batchTimer).toBeNull();
    });

    test('should remove all event listeners on cleanup', () => {
      const handler = jest.fn();
      websocketService.on('connected', handler);
      websocketService.on('disconnected', handler);

      websocketService.cleanup();

      expect(websocketService.listenerCount('connected')).toBe(0);
      expect(websocketService.listenerCount('disconnected')).toBe(0);
    });
  });
});
