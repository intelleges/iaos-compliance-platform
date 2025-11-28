import { EventEmitter } from 'events';
import type { FCMSEvents, FCMSEventType } from './types';

/**
 * Typed Event Bus for Intelleges FCMS
 * Based on INT.DOC.11 - Event & Webhook Architecture
 * 
 * Usage:
 * ```ts
 * // Emit an event
 * eventBus.emit('assignment.submitted', {
 *   assignmentId: 123,
 *   touchpointId: 456,
 *   // ... other fields
 * });
 * 
 * // Listen to an event
 * eventBus.on('assignment.submitted', async (data) => {
 *   console.log('Assignment submitted:', data.assignmentId);
 * });
 * ```
 */
class FCMSEventBus extends EventEmitter {
  /**
   * Emit a typed event
   */
  emit<K extends FCMSEventType>(
    event: K,
    data: FCMSEvents[K]
  ): boolean {
    return super.emit(event, data);
  }

  /**
   * Listen to a typed event
   */
  on<K extends FCMSEventType>(
    event: K,
    listener: (data: FCMSEvents[K]) => void | Promise<void>
  ): this {
    return super.on(event, listener);
  }

  /**
   * Listen to a typed event once
   */
  once<K extends FCMSEventType>(
    event: K,
    listener: (data: FCMSEvents[K]) => void | Promise<void>
  ): this {
    return super.once(event, listener);
  }

  /**
   * Remove a typed event listener
   */
  off<K extends FCMSEventType>(
    event: K,
    listener: (data: FCMSEvents[K]) => void | Promise<void>
  ): this {
    return super.off(event, listener);
  }
}

// Singleton instance
export const eventBus = new FCMSEventBus();

// Increase max listeners to avoid warnings in production
eventBus.setMaxListeners(50);

// Log all events in development
if (process.env.NODE_ENV !== 'production') {
  const originalEmit = eventBus.emit.bind(eventBus);
  eventBus.emit = function <K extends FCMSEventType>(
    event: K,
    data: FCMSEvents[K]
  ): boolean {
    console.log(`[EventBus] ${event}:`, JSON.stringify(data, null, 2));
    return originalEmit(event, data);
  };
}

// Error handling for async event handlers
// Use native EventEmitter error event (not typed)
(eventBus as EventEmitter).on('error', (error) => {
  console.error('[EventBus] Unhandled error in event handler:', error);
});
