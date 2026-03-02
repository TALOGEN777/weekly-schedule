import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ScheduleEntry } from '@/components/schedule/ScheduleCell';

export interface ScheduleRow {
  id: string;
  label: string;
  name: string;
}

export interface ScheduleData {
  [key: string]: ScheduleEntry;
}

export function useScheduleData(weekDateStrs: string[], weekStart: string) {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRowsRef = useRef<string>('');
  const lastSavedEntriesRef = useRef<string>('');
  const weekDateStrsRef = useRef(weekDateStrs);
  const weekStartRef = useRef(weekStart);

  // Keep refs in sync
  useEffect(() => {
    weekDateStrsRef.current = weekDateStrs;
    weekStartRef.current = weekStart;
  }, [weekDateStrs.join(','), weekStart]);

  // Load data when week changes
  useEffect(() => {
    // Cancel any pending save from the previous week
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    loadData();
  }, [weekDateStrs.join(','), weekStart]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load rows for this specific week
      const { data: rowsData, error: rowsError } = await supabase
        .from('schedule_rows')
        .select('*')
        .eq('week_start', weekStart)
        .order('sort_order', { ascending: true });

      if (rowsError) throw rowsError;

      const loadedRows: ScheduleRow[] = (rowsData || []).map((r) => ({
        id: r.id,
        label: r.label,
        name: r.label,
      }));

      // Load entries for current week's dates
      const { data: entriesData, error: entriesError } = await supabase
        .from('schedule_entries')
        .select('*')
        .in('date_str', weekDateStrs);

      if (entriesError) throw entriesError;

      const loadedData: ScheduleData = {};
      (entriesData || []).forEach((e) => {
        loadedData[`${e.row_id}_${e.date_str}`] = {
          process: e.process,
          batch: e.batch,
          day: e.day,
          startTime: e.start_time,
          endTime: e.end_time,
          employees: e.employees,
          incubator: e.incubator,
          hood: e.hood,
        };
      });

      setRows(loadedRows);
      setScheduleData(loadedData);
      lastSavedRowsRef.current = JSON.stringify(loadedRows);
      lastSavedEntriesRef.current = JSON.stringify(loadedData);
    } catch (err) {
      console.error('Failed to load schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced save
  const scheduleSave = useCallback((newRows: ScheduleRow[], newData: ScheduleData) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveAll(newRows, newData);
    }, 500);
  }, []);

  const saveAll = async (currentRows: ScheduleRow[], currentData: ScheduleData) => {
    const currentWeekDateStrs = weekDateStrsRef.current;
    const currentWeekStart = weekStartRef.current;
    try {
      const rowsJson = JSON.stringify(currentRows);
      const dataJson = JSON.stringify(currentData);

      // Save rows if changed
      if (rowsJson !== lastSavedRowsRef.current) {
        // Upsert all rows
        const rowsToUpsert = currentRows.map((r, i) => ({
          id: r.id,
          label: r.label,
          sort_order: i,
          week_start: currentWeekStart,
        }));

        if (rowsToUpsert.length > 0) {
          const { error } = await supabase
            .from('schedule_rows')
            .upsert(rowsToUpsert, { onConflict: 'id' });
          if (error) throw error;
        }

        // Delete rows that were removed
        const prevRows: ScheduleRow[] = lastSavedRowsRef.current ? JSON.parse(lastSavedRowsRef.current) : [];
        const currentIds = new Set(currentRows.map(r => r.id));
        const deletedIds = prevRows.filter(r => !currentIds.has(r.id)).map(r => r.id);
        if (deletedIds.length > 0) {
          const { error } = await supabase
            .from('schedule_rows')
            .delete()
            .in('id', deletedIds);
          if (error) throw error;
        }

        lastSavedRowsRef.current = rowsJson;
      }

      // Save entries if changed
      if (dataJson !== lastSavedEntriesRef.current) {
        // Build entries to upsert
        const entriesToUpsert = Object.entries(currentData).map(([key, entry]) => {
          const [rowId, ...dateParts] = key.split('_');
          const dateStr = dateParts.join('_'); // rejoin in case date has underscores
          return {
            row_id: rowId,
            date_str: dateStr,
            process: entry.process || '',
            batch: entry.batch || '',
            day: entry.day || '',
            start_time: entry.startTime || '',
            end_time: entry.endTime || '',
            employees: entry.employees || '',
            incubator: entry.incubator || '',
            hood: entry.hood || '',
          };
        });

        // Delete entries for this week first, then insert fresh
        if (currentWeekDateStrs.length > 0) {
          await supabase
            .from('schedule_entries')
            .delete()
            .in('date_str', currentWeekDateStrs);
        }

        if (entriesToUpsert.length > 0) {
          // Filter to only entries in the current week
          const weekSet = new Set(currentWeekDateStrs);
          const filtered = entriesToUpsert.filter(e => weekSet.has(e.date_str));
          if (filtered.length > 0) {
            const { error } = await supabase
              .from('schedule_entries')
              .insert(filtered);
            if (error) throw error;
          }
        }

        lastSavedEntriesRef.current = dataJson;
      }
    } catch (err) {
      console.error('Failed to save schedule data:', err);
    }
  };

  // Wrapped setters that trigger save
  const updateRows = useCallback((updater: (prev: ScheduleRow[]) => ScheduleRow[]) => {
    setRows(prev => {
      const next = updater(prev);
      // Need to get current scheduleData too
      setScheduleData(currentData => {
        scheduleSave(next, currentData);
        return currentData;
      });
      return next;
    });
  }, [scheduleSave]);

  const updateScheduleData = useCallback((updater: (prev: ScheduleData) => ScheduleData) => {
    setScheduleData(prev => {
      const next = updater(prev);
      setRows(currentRows => {
        scheduleSave(currentRows, next);
        return currentRows;
      });
      return next;
    });
  }, [scheduleSave]);

  return {
    rows,
    scheduleData,
    loading,
    setRows: updateRows,
    setScheduleData: updateScheduleData,
    reload: loadData,
  };
}
