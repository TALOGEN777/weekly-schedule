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
import html2canvas from 'html2canvas';

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

  const handleSaveRow = (label: string) => {
    if (rowModalState.mode === 'add') {
      const newRow: ScheduleRow = {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: label,
        name: label,
      };
      setRows((prev) => [...prev, newRow]);
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
    const key = `${rowId}_${dateStr}`;
    setScheduleData((prev) => ({
      ...prev,
      [key]: data,
    }));
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

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        width: contentWidth,
        windowWidth: contentWidth,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('schedule-grid-container');
          if (clonedElement) {
            clonedElement.style.overflow = 'visible';
            clonedElement.style.width = 'fit-content';

            const innerScroll = clonedElement.querySelector('.overflow-x-auto') as HTMLElement;
            if (innerScroll) {
              innerScroll.style.overflow = 'visible';
              innerScroll.style.width = 'fit-content';
            }
          }
        },
      });

      const image = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = image;
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
              <div className="grid grid-cols-[150px_repeat(5,_1fr)] bg-secondary border-b border-border">
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
                      className="grid grid-cols-[150px_repeat(5,_1fr)] border-b border-border last:border-b-0 hover:bg-secondary/50"
                    >
                      {/* Row Label */}
                      <div className="p-4 border-r border-border bg-secondary/50 font-semibold text-sm text-foreground flex items-center group relative">
                        <span className="flex-1 mr-8">{row.label}</span>

                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-secondary pl-2">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditRow(e, row)}
                            className="p-1.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-colors focus:opacity-100 focus:outline-none"
                            title="Edit Room Name"
                          >
                            <Pencil className="w-3.5 h-3.5" />
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

        <div className="mt-4 text-xs text-muted-foreground text-center flex justify-center gap-4">
          <span>Tip: Drag and drop cards to copy them to other days.</span>
          <span>•</span>
          <span>Click "Export JPG" to save an image of the current week.</span>
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
