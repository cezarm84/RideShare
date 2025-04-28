/**
 * WebSocket service for real-time messaging
 */

import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/constants';

// WebSocket connection status
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// WebSocket service class
class WebSocketService {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private subscribedChannels: Set<number> = new Set();
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;

  // Initialize the WebSocket connection
  public connect(token: string): void {
    if (this.socket) {
      this.disconnect();
    }

    this.token = token;
    // Use a direct WebSocket URL to the backend
    // The WebSocket endpoint is at /api/v1/messaging/ws on the backend server
    const wsUrl = `ws://localhost:8000/api/v1/messaging/ws?token=${token}`;
    console.log('Connecting to WebSocket URL:', wsUrl);

    try {
      this.updateStatus(ConnectionStatus.CONNECTING);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.updateStatus(ConnectionStatus.ERROR);
      this.scheduleReconnect();
    }
  }

  // Disconnect the WebSocket
  public disconnect(): void {
    this.clearTimers();

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;

      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }

      this.socket = null;
    }

    this.updateStatus(ConnectionStatus.DISCONNECTED);
    this.subscribedChannels.clear();
  }

  // Subscribe to a channel
  public subscribeToChannel(channelId: number): void {
    if (!this.isConnected()) {
      console.warn('Cannot subscribe to channel: WebSocket not connected');
      // Try to reconnect if we have a token
      if (this.token) {
        console.log('Attempting to reconnect WebSocket...');
        this.connect(this.token);
      }
      // Queue the subscription to be processed once connected
      this.subscribedChannels.add(channelId);
      return;
    }

    if (this.subscribedChannels.has(channelId)) {
      console.log(`Already subscribed to channel ${channelId}`);
      return; // Already subscribed
    }

    try {
      console.log(`Subscribing to channel ${channelId}`);
      this.socket!.send(JSON.stringify({
        type: 'join_conversation',
        conversation_id: channelId
      }));

      this.subscribedChannels.add(channelId);
      console.log(`Successfully subscribed to channel ${channelId}`);
    } catch (error) {
      console.error(`Error subscribing to channel ${channelId}:`, error);
    }
  }

  // Unsubscribe from a channel
  public unsubscribeFromChannel(channelId: number): void {
    if (!this.isConnected()) {
      return;
    }

    if (!this.subscribedChannels.has(channelId)) {
      return; // Not subscribed
    }

    this.socket!.send(JSON.stringify({
      type: 'leave_conversation',
      conversation_id: channelId
    }));

    this.subscribedChannels.delete(channelId);
  }

  // Add a message listener
  public addMessageListener(type: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)!.add(callback);

    // Return a function to remove the listener
    return () => {
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        typeListeners.delete(callback);
        if (typeListeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  // Add a status listener
  public addStatusListener(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);

    // Immediately call with current status
    callback(this.status);

    // Return a function to remove the listener
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  // Get current connection status
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  // Check if connected
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  // Handle WebSocket open event
  private handleOpen(): void {
    console.log('WebSocket connected successfully');
    this.updateStatus(ConnectionStatus.CONNECTED);
    this.reconnectAttempts = 0;

    // Start ping interval to keep connection alive
    this.startPingInterval();

    // Log subscribed channels
    console.log(`Resubscribing to ${this.subscribedChannels.size} channels:`, [...this.subscribedChannels]);

    // Resubscribe to channels
    this.resubscribeToChannels();
  }

  // Handle WebSocket message event
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;

      // Handle different message types
      if (message.type === 'pong') {
        // Ping response, do nothing
        return;
      }

      // Notify listeners
      const typeListeners = this.listeners.get(message.type);
      if (typeListeners) {
        typeListeners.forEach(callback => {
          try {
            callback(message);
          } catch (error) {
            console.error(`Error in message listener for type ${message.type}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Handle WebSocket close event
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);

    this.socket = null;
    this.updateStatus(ConnectionStatus.DISCONNECTED);

    // Try to reconnect if not a normal closure
    if (event.code !== 1000 && event.code !== 1001) {
      this.scheduleReconnect();
    }
  }

  // Handle WebSocket error event
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.updateStatus(ConnectionStatus.ERROR);
  }

  // Start ping interval to keep connection alive
  private startPingInterval(): void {
    this.clearTimers();

    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.socket!.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  // Schedule reconnect attempt
  private scheduleReconnect(): void {
    this.clearTimers();

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  // Clear all timers
  private clearTimers(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // Resubscribe to all channels
  private resubscribeToChannels(): void {
    if (!this.isConnected()) {
      console.warn('Cannot resubscribe to channels: WebSocket not connected');
      return;
    }

    // Create a copy to avoid modification during iteration
    const channels = [...this.subscribedChannels];

    if (channels.length === 0) {
      console.log('No channels to resubscribe to');
      return;
    }

    console.log(`Resubscribing to ${channels.length} channels`);

    // We don't clear the set here to avoid losing subscriptions if there's an error
    // Instead, we'll add them again when we successfully subscribe

    for (const channelId of channels) {
      try {
        console.log(`Sending subscription request for channel ${channelId}`);
        this.socket!.send(JSON.stringify({
          type: 'join_conversation',
          conversation_id: channelId
        }));
      } catch (error) {
        console.error(`Error resubscribing to channel ${channelId}:`, error);
      }
    }
  }

  // Update connection status and notify listeners
  private updateStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService();

// React hook for using the WebSocket service
export function useWebSocket() {
  const { token } = useAuth();

  // Connect when token is available
  useEffect(() => {
    if (token) {
      websocketService.connect(token);

      return () => {
        websocketService.disconnect();
      };
    }
  }, [token]);

  return websocketService;
}

export default websocketService;
