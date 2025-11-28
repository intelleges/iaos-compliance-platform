/**
 * Enhanced Auto-Save Hook with Visual Feedback
 * Provides save status, last saved timestamp, offline detection, and retry logic
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

export interface AutoSaveState {
  status: SaveStatus;
  lastSaved: Date | null;
  error: Error | null;
  queuedChanges: number;
}

export interface UseEnhancedAutoSaveOptions {
  onSave: (data: any) => Promise<void>;
  delay?: number; // Debounce delay in ms (default: 500)
  onError?: (error: Error) => void;
  localStorageKey?: string; // Key for localStorage backup
}

export function useEnhancedAutoSave({
  onSave,
  delay = 500,
  onError,
  localStorageKey,
}: UseEnhancedAutoSaveOptions) {
  const [state, setState] = useState<AutoSaveState>({
    status: 'idle',
    lastSaved: null,
    error: null,
    queuedChanges: 0,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveInProgressRef = useRef(false);
  const queueRef = useRef<any[]>([]);
  const isOnlineRef = useRef(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      setState(prev => ({ ...prev, status: 'idle' }));
      // Process queued changes
      if (queueRef.current.length > 0) {
        processQueue();
      }
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      setState(prev => ({ ...prev, status: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process queued changes when coming back online
  const processQueue = useCallback(async () => {
    if (queueRef.current.length === 0 || saveInProgressRef.current) {
      return;
    }

    const data = queueRef.current[queueRef.current.length - 1]; // Get latest
    queueRef.current = []; // Clear queue

    try {
      saveInProgressRef.current = true;
      setState(prev => ({ ...prev, status: 'saving', queuedChanges: 0 }));
      
      await onSave(data);
      
      setState(prev => ({
        ...prev,
        status: 'saved',
        lastSaved: new Date(),
        error: null,
      }));

      // Clear localStorage backup after successful save
      if (localStorageKey) {
        localStorage.removeItem(localStorageKey);
      }

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setState(prev => prev.status === 'saved' ? { ...prev, status: 'idle' } : prev);
      }, 2000);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Save failed');
      setState(prev => ({
        ...prev,
        status: 'error',
        error: err,
      }));
      onError?.(err);
    } finally {
      saveInProgressRef.current = false;
    }
  }, [onSave, onError, localStorageKey]);

  // Debounced save function
  const save = useCallback(
    (data: any) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Save to localStorage as backup
      if (localStorageKey) {
        try {
          localStorage.setItem(localStorageKey, JSON.stringify({
            data,
            timestamp: Date.now(),
          }));
        } catch (error) {
          console.warn('Failed to save to localStorage:', error);
        }
      }

      // If offline, queue the change
      if (!isOnlineRef.current) {
        queueRef.current.push(data);
        setState(prev => ({
          ...prev,
          status: 'offline',
          queuedChanges: queueRef.current.length,
        }));
        return;
      }

      // Set new timeout for online save
      timeoutRef.current = setTimeout(async () => {
        if (saveInProgressRef.current) {
          return; // Skip if save already in progress
        }

        try {
          saveInProgressRef.current = true;
          setState(prev => ({ ...prev, status: 'saving' }));
          
          await onSave(data);
          
          setState(prev => ({
            ...prev,
            status: 'saved',
            lastSaved: new Date(),
            error: null,
          }));

          // Clear localStorage backup after successful save
          if (localStorageKey) {
            localStorage.removeItem(localStorageKey);
          }

          // Reset to idle after 2 seconds
          setTimeout(() => {
            setState(prev => prev.status === 'saved' ? { ...prev, status: 'idle' } : prev);
          }, 2000);
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Save failed');
          setState(prev => ({
            ...prev,
            status: 'error',
            error: err,
          }));
          onError?.(err);
        } finally {
          saveInProgressRef.current = false;
        }
      }, delay);
    },
    [onSave, delay, onError, localStorageKey]
  );

  // Manual retry function
  const retry = useCallback(() => {
    if (queueRef.current.length > 0) {
      processQueue();
    } else {
      setState(prev => ({ ...prev, status: 'idle', error: null }));
    }
  }, [processQueue]);

  // Get localStorage backup
  const getBackup = useCallback((): any | null => {
    if (!localStorageKey) return null;
    
    try {
      const backup = localStorage.getItem(localStorageKey);
      if (backup) {
        const parsed = JSON.parse(backup);
        return parsed.data;
      }
    } catch (error) {
      console.warn('Failed to retrieve localStorage backup:', error);
    }
    return null;
  }, [localStorageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    save,
    retry,
    getBackup,
    ...state,
  };
}
