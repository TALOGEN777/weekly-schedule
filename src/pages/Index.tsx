import { useState, useCallback, useRef } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  ImageIcon,
  Pencil,
  Trash2,
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
  getStartOfWeek,
} from '@/utils/dateUtils';
import domtoimage from 'dom-to-image';

interface ScheduleRow {
  id: string;
  label: string;
  name: string;
}

interface ScheduleData {
  [key: string]: ScheduleEntry;
}

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
  // Initialize with current week based on system date
  const [currentDate, setCurrentDate] = useState<Date>(() => getCurrentWeekStart());
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [rows, setRows] = useState<ScheduleRow[]>([]);
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

  const scheduleRef = useRef<HTMLDivElement>(null);

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

      // If prefilled days are provided, automatically generate the schedule entries for this new line
      if (prefilledDays && prefilledDays.length > 0) {
        setScheduleData((prev) => {
          const newData = { ...prev };

          prefilledDays.forEach((dayStr) => {
            // Map the requested days to the specific days of the week in the 5-day view
            // formattedWeekDays indices: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday
            const dayIndexMap: Record<string, number> = {
              'Day 0': 1, // Monday
              'Day 1': 2, // Tuesday
              'Day 2': 3, // Wednesday
              'Day 3': 4, // Thursday
              'Day 6': 0, // Sunday
              'Day 9': 3, // Wednesday
              'Day 10': 4, // Thursday
            };

            const index = dayIndexMap[dayStr];
            if (index !== undefined && index >= 0 && index < formattedWeekDays.length) {
              const dateStrKey = formattedWeekDays[index].dateStr;

              // Depending on Room 32 or Room 31, the user's incubator/BSC choices differ
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

              // Time formatting
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

      // Update the explicitly edited cell with all data
      const key = `${rowId}_${dateStr}`;
      newData[key] = data;

      // Apply shared fields (process, batch, incubator, hood) to all other existing entries in this row
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

  const handleDragLeave = useCallback(() => {
    // Could add logic to only clear if leaving the cell completely
  }, []);

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
      const scrollContainer = element.querySelector('.overflow-x-auto');
      const contentWidth = scrollContainer ? scrollContainer.scrollWidth : element.scrollWidth;

      const dataUrl = await domtoimage.toJpeg(element, {
        bgcolor: '#ffffff',
        width: contentWidth * 4,
        height: element.scrollHeight * 4,
        style: {
          transform: 'scale(4)',
          transformOrigin: 'top left'
        }
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `production_schedule_${formatDate(currentDate)}.jpg`;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export image. Please try again.');
    }
  };

  // Derived state
  const weekDays = getDaysOfWeek(currentDate);
  const formattedWeekDays = weekDays.map((d) => ({
    fullDate: d,
    dateStr: formatDate(d),
    label: formatDisplayDate(d),
    dayName: getDayName(d),
  }));

  const getCellData = (rowId: string, dateStr: string): ScheduleEntry | null => {
    return scheduleData[`${rowId}_${dateStr}`] || null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      {/* Top Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-card-foreground tracking-tight">
              Cleanroom Production Schedule
            </h1>
          </div>

          <div className="flex items-center gap-4">
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
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          id="schedule-grid-container"
          ref={scheduleRef}
          className="bg-card rounded-xl shadow-sm border border-border overflow-hidden min-h-[400px]"
        >
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Grid Header */}
              <div className="grid grid-cols-[250px_repeat(5,_1fr)] bg-secondary border-b border-border">
                <div className="p-4 flex items-end font-semibold text-muted-foreground text-sm border-r border-border">
                  Room / Day
                </div>
                {formattedWeekDays.map((day) => (
                  <div
                    key={day.dateStr}
                    className="p-3 border-r border-border last:border-r-0 text-center"
                  >
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      {day.dayName}
                    </div>
                    <div className="text-lg font-bold text-foreground">{day.label}</div>
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
                      className="grid grid-cols-[250px_repeat(5,_1fr)] border-b border-border last:border-b-0 hover:bg-secondary/50"
                    >
                      {/* Row Label */}
                      <div className="p-4 border-r border-border bg-secondary/50 font-bold text-2xl text-foreground flex items-center group relative overflow-hidden">
                        <span className="flex-1 mr-8 truncate min-w-0" title={row.label}>{row.label}</span>

                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-secondary pl-2">
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
      </main>

      {/* Modals */}
      <EditModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        initialData={modalState.rowId && modalState.dateStr ? getCellData(modalState.rowId, modalState.dateStr) : null}
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
