import { Plus, Clock, Users, Box, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScheduleEntry {
  process: string;
  batch: string;
  startTime: string;
  endTime: string;
  employees: string;
  incubator: string;
  hood: string;
}

interface ScheduleCellProps {
  data: ScheduleEntry | null;
  onClick: () => void;
  rowId: string;
  dateStr: string;
  onDragStart: (e: React.DragEvent, rowId: string, dateStr: string) => void;
  onDrop: (e: React.DragEvent, rowId: string, dateStr: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent, rowId: string, dateStr: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  isDragOver: boolean;
}

export const ScheduleCell = ({
  data,
  onClick,
  rowId,
  dateStr,
  onDragStart,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
  isDragOver,
}: ScheduleCellProps) => {
  // Empty Cell
  if (!data) {
    return (
      <div
        onClick={onClick}
        onDrop={(e) => onDrop(e, rowId, dateStr)}
        onDragOver={onDragOver}
        onDragEnter={(e) => onDragEnter(e, rowId, dateStr)}
        onDragLeave={onDragLeave}
        className={cn(
          'h-full min-h-[140px] p-2 border-r border-b border-border cursor-pointer transition-colors',
          isDragOver
            ? 'bg-schedule-dragover ring-2 ring-primary ring-inset'
            : 'bg-card hover:bg-schedule-hover'
        )}
      >
        <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100">
          <Plus className="text-primary w-6 h-6" />
        </div>
      </div>
    );
  }

  const isCocoon = data.process?.toLowerCase().includes('cocoon');

  // Occupied Cell
  return (
    <div
      draggable="true"
      onDragStart={(e) => onDragStart(e, rowId, dateStr)}
      onDrop={(e) => onDrop(e, rowId, dateStr)}
      onDragOver={onDragOver}
      onDragEnter={(e) => onDragEnter(e, rowId, dateStr)}
      onDragLeave={onDragLeave}
      onClick={onClick}
      className={cn(
        'h-full min-h-[140px] p-3 border-r border-b border-border cursor-grab active:cursor-grabbing transition-all relative group',
        isDragOver
          ? 'bg-schedule-dragover ring-2 ring-primary ring-inset'
          : isCocoon
          ? 'bg-schedule-cocoon hover:bg-schedule-cocoon/80'
          : 'bg-card hover:bg-schedule-hover'
      )}
    >
      {/* Centered Content */}
      <div className="flex flex-col gap-2 items-center text-center h-full">
        {/* Header: Process & Time */}
        <div className="flex flex-col items-center gap-1 w-full">
          <div>
            <span
              className={cn(
                'text-xs font-bold uppercase px-2 py-0.5 rounded-md',
                isCocoon
                  ? 'bg-schedule-cocoon text-schedule-cocoon-foreground'
                  : 'bg-schedule-process text-schedule-process-foreground'
              )}
            >
              {data.process || 'N/A'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground font-mono">{data.batch}</div>

          <div className="flex items-center text-xs text-muted-foreground font-medium mt-1">
            <Clock className="w-3 h-3 mr-1" />
            {data.startTime}-{data.endTime}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-border my-1 w-full"></div>

        {/* Details */}
        <div className="space-y-1 flex flex-col items-center w-full">
          {data.employees && (
            <div className="flex items-center justify-center text-xs text-foreground">
              <Users className="w-3 h-3 mr-1.5 text-muted-foreground shrink-0" />
              <span className="leading-tight">{data.employees}</span>
            </div>
          )}

          <div className="flex gap-2 flex-wrap justify-center mt-1">
            {data.incubator && (
              <div className="flex items-center text-[10px] bg-schedule-incubator text-schedule-incubator-foreground px-1.5 py-0.5 rounded border border-schedule-incubator-border">
                <Box className="w-3 h-3 mr-1" />
                Inc #{data.incubator}
              </div>
            )}

            {data.hood && (
              <div className="flex items-center text-[10px] bg-schedule-hood text-schedule-hood-foreground px-1.5 py-0.5 rounded border border-schedule-hood-border">
                <FlaskConical className="w-3 h-3 mr-1" />
                BSC #{data.hood}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
