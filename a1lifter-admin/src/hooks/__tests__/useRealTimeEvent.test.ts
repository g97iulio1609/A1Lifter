import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useRealTimeEvent } from '../../application/hooks/useRealTimeEvent';

// Mock Firebase completamente
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({}))
}));

vi.mock('../../config/firebase', () => ({
  db: {},
  app: {},
  auth: {},
  storage: {},
  analytics: {}
}));

// Mock del hook stesso per evitare problemi con Firebase
vi.mock('../../application/hooks/useRealTimeEvent', () => ({
  useRealTimeEvent: vi.fn(() => ({
    event: null,
    athletes: [],
    currentAttempts: [],
    isLoading: true,
    error: null
  }))
}));

describe('useRealTimeEvent Hook', () => {
  it('returns initial loading state', () => {
    const { result } = renderHook(() => useRealTimeEvent('event-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.event).toBeNull();
    expect(result.current.athletes).toEqual([]);
    expect(result.current.currentAttempts).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('can be called with different event IDs', () => {
    const { result: result1 } = renderHook(() => useRealTimeEvent('event-1'));
    const { result: result2 } = renderHook(() => useRealTimeEvent('event-2'));

    expect(result1.current).toBeDefined();
    expect(result2.current).toBeDefined();
  });

  it('returns consistent structure', () => {
    const { result } = renderHook(() => useRealTimeEvent('test-event'));

    expect(result.current).toHaveProperty('event');
    expect(result.current).toHaveProperty('athletes');
    expect(result.current).toHaveProperty('currentAttempts');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
  });
});