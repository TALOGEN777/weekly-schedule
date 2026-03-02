import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  ImageIcon,
  Pencil,
  Trash2,
  Menu,
  Loader2,
  Undo2,
  Redo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScheduleCell, type ScheduleEntry } from '@/components/schedule/ScheduleCell';
import { RowModal } from '@/components/schedule/RowModal';
import { EditModal } from '@/components/schedule/EditModal';
import {
  formatDate,
  getDaysOfWeek,
  formatDisplayDate,
  getDayName,
  getCurrentWeekStart,
} from '@/utils/dateUtils';
import { useScheduleData, type ScheduleRow, type ScheduleData } from '@/hooks/useScheduleData';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import domtoimage from 'dom-to-image';

interface ModalState {
  isOpen: boolean;
  rowId: string | null;
  dateStr: string | null;
}

interface RowModalState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  rowId: string | null;
  initialLabel: string;
}

interface DragOverCell {
  rowId: string;
  dateStr: string;
}

const Index = () => {
  const [currentDate, setCurrentDate] = useState<Date>(() => getCurrentWeekStart());
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    rowId: null,
    dateStr: null,
  });
  const [rowModalState, setRowModalState] = useState<RowModalState>({
    isOpen: false,
    mode: 'add',
    rowId: null,
    initialLabel: '',
  });
  const [dragOverCell, setDragOverCell] = useState<DragOverCell | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scheduleRef = useRef<HTMLDivElement>(null);

  // Derived state
  const weekDays = getDaysOfWeek(currentDate);
  const formattedWeekDays = weekDays.map((d) => ({
    fullDate: d,
    dateStr: formatDate(d),
    label: formatDisplayDate(d),
    dayName: getDayName(d),
  }));

  const weekDateStrs = formattedWeekDays.map((d) => d.dateStr);
  const weekStart = formattedWeekDays[0]?.dateStr || '';

  // Backend persistence hook
  const { rows, scheduleData, loading, setRows, setScheduleData } = useScheduleData(weekDateStrs, weekStart);

  // Undo/Redo
  interface ScheduleSnapshot { rows: ScheduleRow[]; data: ScheduleData; }
  const undoRedo = useUndoRedo<ScheduleSnapshot>({ rows: [], data: {} });
  const isUndoRedoAction = useRef(false);

  // Sync loaded data into undo history as initial state
  useEffect(() => {
    if (!loading) {
      undoRedo.reset({ rows, data: scheduleData });
    }
  }, [loading, weekStart]);

  // Track changes for undo/redo (when not triggered by undo/redo itself)
  useEffect(() => {
    if (loading) return;
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    undoRedo.pushState({ rows, data: scheduleData });
  }, [rows, scheduleData]);

  const handleUndo = () => {
    const prev = undoRedo.undo();
    if (prev) {
      isUndoRedoAction.current = true;
      setRows(() => prev.rows);
      setScheduleData(() => prev.data);
    }
  };

  const handleRedo = () => {
    const next = undoRedo.redo();
    if (next) {
      isUndoRedoAction.current = true;
      setRows(() => next.rows);
      setScheduleData(() => next.data);
    }
  };

  // Navigation
  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(getCurrentWeekStart());
  };

  // Row Management
  const handleOpenAddRow = () => {
    setRowModalState({
      isOpen: true,
      mode: 'add',
      rowId: null,
      initialLabel: '',
    });
    setMobileMenuOpen(false);
  };

  const handleOpenEditRow = (e: React.MouseEvent, row: ScheduleRow) => {
    e.stopPropagation();
    setRowModalState({
      isOpen: true,
      mode: 'edit',
      rowId: row.id,
      initialLabel: row.label,
    });
  };

  const handleSaveRow = (config: { label: string; prefilledDays?: string[] }) => {
    const { label, prefilledDays } = config;

    if (rowModalState.mode === 'add') {
      const rowId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newRow: ScheduleRow = {
        id: rowId,
        label: label,
        name: label,
      };
      setRows((prev) => [...prev, newRow]);

      if (prefilledDays && prefilledDays.length > 0) {
        setScheduleData((prev) => {
          const newData = { ...prev };

          prefilledDays.forEach((dayStr) => {
            const dayIndexMap: Record<string, number> = {
              'Day 0': 1,
              'Day 1': 2,
              'Day 2': 3,
              'Day 3': 4,
              'Day 6': 0,
              'Day 9': 3,
              'Day 10': 4,
            };

            const index = dayIndexMap[dayStr];
            if (index !== undefined && index >= 0 && index < formattedWeekDays.length) {
              const dateStrKey = formattedWeekDays[index].dateStr;

              let incubator = '';
              let hood = '';
              const is32 = label.includes('32');
              const is31 = label.includes('31');

              if (is32) {
                incubator = '07';
                hood = '06';
              } else if (is31) {
                incubator = '03';
                hood = '03';
              }

              let startTime = '08:00';
              let endTime = '14:00';
              if (dayStr === 'Day 1') {
                startTime = '09:00';
                endTime = '15:00';
              } else if (dayStr === 'Day 6') {
                startTime = '07:00';
                endTime = '10:00';
              } else if (dayStr === 'Day 9') {
                startTime = '08:00';
                endTime = '12:00';
              }

              newData[`${rowId}_${dateStrKey}`] = {
                process: 'CD19 CAR-T',
                batch: '',
                day: dayStr,
                startTime,
                endTime,
                employees: '',
                incubator,
                hood,
              };
            }
          });

          return newData;
        });
      }
    } else if (rowModalState.mode === 'edit' && rowModalState.rowId) {
      setRows((prev) =>
        prev.map((row) =>
          row.id === rowModalState.rowId ? { ...row, label: label, name: label } : row
        )
      );
    }
    setRowModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteRow = () => {
    const rowId = rowModalState.rowId;
    if (!rowId) return;

    if (
      window.confirm(
        'Are you absolutely sure you want to delete this line and all its scheduled events?'
      )
    ) {
      setRows((prev) => prev.filter((r) => r.id !== rowId));
      setScheduleData((prev) => {
        const newData = { ...prev };
        Object.keys(newData).forEach((key) => {
          if (key.startsWith(`${rowId}_`)) {
            delete newData[key];
          }
        });
        return newData;
      });
      setRowModalState((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Data Management
  const handleCellClick = (rowId: string, dateStr: string) => {
    setModalState({
      isOpen: true,
      rowId,
      dateStr,
    });
  };

  const handleSaveEntry = (data: ScheduleEntry) => {
    const { rowId, dateStr } = modalState;
    if (!rowId || !dateStr) return;

    setScheduleData((prev) => {
      const newData = { ...prev };
      const key = `${rowId}_${dateStr}`;
      newData[key] = data;

      Object.keys(newData).forEach((entryKey) => {
        if (entryKey.startsWith(`${rowId}_`) && entryKey !== key) {
          newData[entryKey] = {
            ...newData[entryKey],
            process: data.process,
            batch: data.batch,
            incubator: data.incubator,
            hood: data.hood,
          };
        }
      });

      return newData;
    });

    setModalState({ isOpen: false, rowId: null, dateStr: null });
  };

  const handleDeleteEntry = () => {
    const { rowId, dateStr } = modalState;
    if (!rowId || !dateStr) return;
    const key = `${rowId}_${dateStr}`;
    setScheduleData((prev) => {
      const newData = { ...prev };
      delete newData[key];
      return newData;
    });
    setModalState({ isOpen: false, rowId: null, dateStr: null });
  };

  // Drag and Drop Handlers
  const handleDragStart = useCallback((e: React.DragEvent, rowId: string, dateStr: string) => {
    const sourceData = { rowId, dateStr };
    e.dataTransfer.setData('application/json', JSON.stringify(sourceData));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, rowId: string, dateStr: string) => {
    e.preventDefault();
    setDragOverCell({ rowId, dateStr });
  }, []);

  const handleDragLeave = useCallback(() => {}, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetRowId: string, targetDateStr: string) => {
      e.preventDefault();
      setDragOverCell(null);

      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;

      try {
        const source = JSON.parse(dataStr);
        const sourceKey = `${source.rowId}_${source.dateStr}`;
        const targetKey = `${targetRowId}_${targetDateStr}`;

        const sourceData = scheduleData[sourceKey];

        if (sourceData) {
          setScheduleData((prev) => ({
            ...prev,
            [targetKey]: { ...sourceData },
          }));
        }
      } catch (err) {
        console.error('Drop failed', err);
      }
    },
    [scheduleData]
  );

  // Export JPG
  const handleExportJPG = async () => {
    const element = scheduleRef.current;
    if (!element) return;

    try {
      const scrollContainer = element.querySelector('.overflow-x-auto') as HTMLElement | null;
      const innerContent = element.querySelector('.min-w-\\[800px\\]') as HTMLElement | null;
      const contentWidth = innerContent ? innerContent.scrollWidth : (scrollContainer ? scrollContainer.scrollWidth : element.scrollWidth);

      // Temporarily remove overflow clipping so full content is captured
      const origOverflow = scrollContainer ? scrollContainer.style.overflow : '';
      const origWidth = element.style.width;
      const origMinWidth = element.style.minWidth;
      if (scrollContainer) {
        scrollContainer.style.overflow = 'visible';
      }
      element.style.width = `${contentWidth}px`;
      element.style.minWidth = `${contentWidth}px`;

      const dataUrl = await domtoimage.toJpeg(element, {
        bgcolor: '#ffffff',
        width: contentWidth * 4,
        height: element.scrollHeight * 4,
        style: {
          transform: 'scale(4)',
          transformOrigin: 'top left',
          width: `${contentWidth}px`,
          minWidth: `${contentWidth}px`,
        },
      });

      // Restore original styles
      if (scrollContainer) {
        scrollContainer.style.overflow = origOverflow;
      }
      element.style.width = origWidth;
      element.style.minWidth = origMinWidth;

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `production_schedule_${formatDate(currentDate)}.jpg`;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export image. Please try again.');
    }
    setMobileMenuOpen(false);
  };

  const getCellData = (rowId: string, dateStr: string): ScheduleEntry | null => {
    return scheduleData[`${rowId}_${dateStr}`] || null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      {/* Top Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 sm:p-2 rounded-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <h1 className="text-sm sm:text-xl font-bold text-card-foreground tracking-tight">
              Cleanroom Schedule
            </h1>
          </div>

          {/* Desktop controls */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={handleUndo} disabled={!undoRedo.canUndo} title="Undo">
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleRedo} disabled={!undoRedo.canRedo} title="Redo">
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="h-6 w-px bg-border"></div>
            <Button variant="outline" size="sm" onClick={handleExportJPG}>
              <ImageIcon className="w-4 h-4 mr-2 text-primary" />
              Export JPG
            </Button>
            <Button size="sm" onClick={handleOpenAddRow}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Line
            </Button>
            <div className="h-6 w-px bg-border"></div>
            <div className="flex items-center bg-secondary rounded-lg p-1">
              <button
                onClick={handlePrevWeek}
                className="p-1 hover:bg-card rounded-md shadow-sm transition-all text-muted-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-4 font-medium text-sm text-foreground min-w-[140px] text-center">
                Week of {formattedWeekDays[0]?.label}
              </div>
              <button
                onClick={handleNextWeek}
                className="p-1 hover:bg-card rounded-md shadow-sm transition-all text-muted-foreground"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleToday}
              className="text-sm text-primary font-medium hover:underline"
            >
              Jump to Today
            </button>
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-2">
            <div className="flex items-center bg-secondary rounded-lg p-0.5">
              <button
                onClick={handlePrevWeek}
                className="p-1 hover:bg-card rounded-md text-muted-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-2 font-medium text-xs text-foreground min-w-[80px] text-center">
                {formattedWeekDays[0]?.label}
              </div>
              <button
                onClick={handleNextWeek}
                className="p-1 hover:bg-card rounded-md text-muted-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-secondary rounded-md text-muted-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
           <div className="md:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleUndo} disabled={!undoRedo.canUndo} className="flex-1">
                <Undo2 className="w-4 h-4 mr-1" /> Undo
              </Button>
              <Button variant="outline" size="sm" onClick={handleRedo} disabled={!undoRedo.canRedo} className="flex-1">
                <Redo2 className="w-4 h-4 mr-1" /> Redo
              </Button>
            </div>
            <Button size="sm" onClick={handleOpenAddRow} className="w-full justify-start">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Line
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJPG} className="w-full justify-start">
              <ImageIcon className="w-4 h-4 mr-2 text-primary" />
              Export JPG
            </Button>
            <button
              onClick={() => { handleToday(); setMobileMenuOpen(false); }}
              className="text-sm text-primary font-medium hover:underline text-left py-1"
            >
              Jump to Today
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div
            id="schedule-grid-container"
            ref={scheduleRef}
            className="bg-card rounded-xl shadow-sm border border-border overflow-hidden min-h-[400px]"
          >
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Grid Header */}
                <div className="grid grid-cols-[180px_repeat(5,_1fr)] sm:grid-cols-[250px_repeat(5,_1fr)] bg-secondary border-b border-border">
                  <div className="p-2 sm:p-4 flex items-end font-semibold text-muted-foreground text-xs sm:text-sm border-r border-border">
                    Room / Day
                  </div>
                  {formattedWeekDays.map((day) => (
                    <div
                      key={day.dateStr}
                      className="p-2 sm:p-3 border-r border-border last:border-r-0 text-center"
                    >
                      <div className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5 sm:mb-1">
                        {day.dayName}
                      </div>
                      <div className="text-sm sm:text-lg font-bold text-foreground">{day.label}</div>
                    </div>
                  ))}
                </div>

                {/* Grid Body */}
                {rows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <div className="bg-secondary p-4 rounded-full mb-4">
                      <PlusCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No lines added yet</h3>
                    <p className="max-w-xs text-center mt-1">
                      Start by clicking the "Add Line" button to create rows for your schedule.
                    </p>
                    <Button
                      variant="ghost"
                      onClick={handleOpenAddRow}
                      className="mt-4 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      Add your first line
                    </Button>
                  </div>
                ) : (
                  <div>
                    {rows.map((row) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-[180px_repeat(5,_1fr)] sm:grid-cols-[250px_repeat(5,_1fr)] border-b border-border last:border-b-0 hover:bg-secondary/50"
                      >
                        {/* Row Label */}
                        <div className="p-2 sm:p-4 border-r border-border bg-secondary/50 font-bold text-lg sm:text-2xl text-foreground flex items-center group relative overflow-hidden">
                          <span className="flex-1 mr-6 sm:mr-8 truncate min-w-0" title={row.label}>
                            {row.label}
                          </span>

                          <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-secondary pl-2">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditRow(e, row)}
                              className="p-1.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-colors focus:opacity-100 focus:outline-none"
                              title="Edit Room Name"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRowModalState({
                                  isOpen: true,
                                  mode: 'edit',
                                  rowId: row.id,
                                  initialLabel: row.label,
                                });
                              }}
                              className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors focus:opacity-100 focus:outline-none"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Cells */}
                        {formattedWeekDays.map((day) => {
                          const data = getCellData(row.id, day.dateStr);
                          const isDragOver =
                            dragOverCell &&
                            dragOverCell.rowId === row.id &&
                            dragOverCell.dateStr === day.dateStr;

                          return (
                            <ScheduleCell
                              key={`${row.id}_${day.dateStr}`}
                              rowId={row.id}
                              dateStr={day.dateStr}
                              data={data}
                              onClick={() => handleCellClick(row.id, day.dateStr)}
                              onDragStart={handleDragStart}
                              onDrop={handleDrop}
                              onDragOver={handleDragOver}
                              onDragEnter={handleDragEnter}
                              onDragLeave={handleDragLeave}
                              isDragOver={!!isDragOver}
                              roomLabel={row.label}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <EditModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        initialData={
          modalState.rowId && modalState.dateStr
            ? getCellData(modalState.rowId, modalState.dateStr)
            : null
        }
        dateLabel={modalState.dateStr || ''}
        roomLabel={rows.find((r) => r.id === modalState.rowId)?.label || ''}
      />

      <RowModal
        isOpen={rowModalState.isOpen}
        onClose={() => setRowModalState((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleSaveRow}
        onDelete={handleDeleteRow}
        initialLabel={rowModalState.initialLabel}
        mode={rowModalState.mode}
      />
    </div>
  );
};

export default Index;
