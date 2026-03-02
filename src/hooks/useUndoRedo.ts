import { useState, useCallback, useRef } from 'react';

interface Snapshot<T> {
  data: T;
}

export function useUndoRedo<T>(initial: T) {
  const [history, setHistory] = useState<Snapshot<T>[]>([{ data: initial }]);
  const [index, setIndex] = useState(0);
  const skipNextPush = useRef(false);

  const current = history[index]?.data ?? initial;

  const pushState = useCallback((newData: T) => {
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    setHistory(prev => {
      const newHistory = prev.slice(0, index + 1);
      newHistory.push({ data: newData });
      // Keep max 50 states
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setIndex(prev => Math.min(prev + 1, 50 - 1));
  }, [index]);

  const undo = useCallback(() => {
    if (index > 0) {
      skipNextPush.current = true;
      setIndex(prev => prev - 1);
      return history[index - 1]?.data;
    }
    return undefined;
  }, [index, history]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      skipNextPush.current = true;
      setIndex(prev => prev + 1);
      return history[index + 1]?.data;
    }
    return undefined;
  }, [index, history]);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  const reset = useCallback((data: T) => {
    setHistory([{ data }]);
    setIndex(0);
  }, []);

  return { current, pushState, undo, redo, canUndo, canRedo, reset };
}
