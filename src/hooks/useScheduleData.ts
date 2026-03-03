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
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRowsRef = useRef<string>('');
  const lastSavedEntriesRef = useRef<string>('');
  const weekDateStrsRef = useRef(weekDateStrs);
  const weekStartRef = useRef(weekStart);
  const dataLoadedRef = useRef(false);

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
    dataLoadedRef.current = false;
    loadData();
  }, [weekDateStrs.join(','), weekStart]);

  const loadData = async () => {
    setLoading(true);
    try {
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
      dataLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced save
  const scheduleSave = useCallback((newRows: ScheduleRow[], newData: ScheduleData) => {
    // Don't save if data hasn't been loaded yet
    if (!dataLoadedRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveAll(newRows, newData);
    }, 1000);
  }, []);

  const saveAll = async (currentRows: ScheduleRow[], currentData: ScheduleData) => {
    // Guard: don't save if data was never loaded
    if (!dataLoadedRef.current) return;

    const currentWeekDateStrs = weekDateStrsRef.current;
    const currentWeekStart = weekStartRef.current;
    setSaving(true);
    try {
      const rowsJson = JSON.stringify(currentRows);
      const dataJson = JSON.stringify(currentData);

      // Save rows if changed
      if (rowsJson !== lastSavedRowsRef.current) {
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
        // Build current entries for this week only
        const weekSet = new Set(currentWeekDateStrs);
        const currentEntries = Object.entries(currentData)
          .map(([key, entry]) => {
            const [rowId, ...dateParts] = key.split('_');
            const dateStr = dateParts.join('_');
            return { key, rowId, dateStr, entry };
          })
          .filter(e => weekSet.has(e.dateStr));

        // Build previous entries
        const prevData: ScheduleData = lastSavedEntriesRef.current ? JSON.parse(lastSavedEntriesRef.current) : {};
        const prevKeys = new Set(
          Object.keys(prevData).filter(k => {
            const [, ...dateParts] = k.split('_');
            return weekSet.has(dateParts.join('_'));
          })
        );

        // Upsert current entries
        if (currentEntries.length > 0) {
          const toUpsert = currentEntries.map(e => ({
            row_id: e.rowId,
            date_str: e.dateStr,
            process: e.entry.process || '',
            batch: e.entry.batch || '',
            day: e.entry.day || '',
            start_time: e.entry.startTime || '',
            end_time: e.entry.endTime || '',
            employees: e.entry.employees || '',
            incubator: e.entry.incubator || '',
            hood: e.entry.hood || '',
          }));

          // Delete existing entries for these specific row_id+date_str combos, then insert
          // This is safer than deleting ALL entries for the week
          for (const entry of toUpsert) {
            await supabase
              .from('schedule_entries')
              .delete()
              .eq('row_id', entry.row_id)
              .eq('date_str', entry.date_str);
          }

          const { error } = await supabase
            .from('schedule_entries')
            .insert(toUpsert);
          if (error) throw error;
        }

        // Delete entries that were removed (existed before but not now)
        const currentKeys = new Set(currentEntries.map(e => e.key));
        const removedKeys = [...prevKeys].filter(k => !currentKeys.has(k));
        for (const key of removedKeys) {
          const [rowId, ...dateParts] = key.split('_');
          const dateStr = dateParts.join('_');
          await supabase
            .from('schedule_entries')
            .delete()
            .eq('row_id', rowId)
            .eq('date_str', dateStr);
        }

        lastSavedEntriesRef.current = dataJson;
      }
    } catch (err) {
      console.error('Failed to save schedule data:', err);
    } finally {
      setSaving(false);
    }
  };

  // Manual save - force save current state immediately
  const manualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    // Force save by resetting last-saved refs
    setRows(currentRows => {
      setScheduleData(currentData => {
        lastSavedRowsRef.current = '';
        lastSavedEntriesRef.current = '';
        saveAll(currentRows, currentData);
        return currentData;
      });
      return currentRows;
    });
  }, []);

  // Wrapped setters that trigger save
  const updateRows = useCallback((updater: (prev: ScheduleRow[]) => ScheduleRow[]) => {
    setRows(prev => {
      const next = updater(prev);
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
    saving,
    setRows: updateRows,
    setScheduleData: updateScheduleData,
    reload: loadData,
    manualSave,
  };
}
