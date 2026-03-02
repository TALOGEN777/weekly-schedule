import { Plus, Clock, Users, Box, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScheduleEntry {
  process: string;
  batch: string;
  day?: string;
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
  roomLabel?: string;
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
  roomLabel,
}: ScheduleCellProps) => {
  // Empty Cell
  if (!data) {
    const isComments = roomLabel === 'Comments';
    return (
      <div
        onClick={onClick}
        onDrop={(e) => onDrop(e, rowId, dateStr)}
        onDragOver={onDragOver}
        onDragEnter={(e) => onDragEnter(e, rowId, dateStr)}
        onDragLeave={onDragLeave}
        className={cn(
          'h-full p-2 border-r border-b border-border cursor-pointer transition-colors',
          isComments ? 'min-h-[60px]' : 'min-h-[140px]',
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

  // Comments Cell
  if (roomLabel === 'Comments') {
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
          'h-full min-h-[60px] p-2 border-r border-b border-border cursor-grab active:cursor-grabbing transition-all relative group',
          isDragOver
            ? 'bg-schedule-dragover ring-2 ring-primary ring-inset'
            : 'bg-card hover:bg-schedule-hover'
        )}
      >
        <div className="flex w-full h-full text-sm text-foreground items-center justify-center text-center whitespace-pre-wrap break-words">
          {data.process}
        </div>
      </div>
    );
  }

  const isCocoon = data.process?.toLowerCase().includes('cocoon');
  const processLower = data.process?.toLowerCase() || '';

  const getProcessColors = () => {
    if (isCocoon) return { bg: 'bg-schedule-cocoon', fg: 'text-schedule-cocoon-foreground', cellBg: 'bg-schedule-cocoon hover:bg-schedule-cocoon/80' };
    if (processLower.includes('cd19-1xx') || processLower.includes('cd19 1xx')) return { bg: 'bg-schedule-cd19-1xx', fg: 'text-schedule-cd19-1xx-foreground', cellBg: 'bg-schedule-cd19-1xx/30 hover:bg-schedule-cd19-1xx/40' };
    if (processLower.includes('cd19')) return { bg: 'bg-schedule-cd19', fg: 'text-schedule-cd19-foreground', cellBg: 'bg-schedule-cd19/30 hover:bg-schedule-cd19/40' };
    if (processLower.includes('cd22')) return { bg: 'bg-schedule-cd22', fg: 'text-schedule-cd22-foreground', cellBg: 'bg-schedule-cd22/30 hover:bg-schedule-cd22/40' };
    if (processLower.includes('cd7')) return { bg: 'bg-schedule-cd7', fg: 'text-schedule-cd7-foreground', cellBg: 'bg-schedule-cd7/30 hover:bg-schedule-cd7/40' };
    return { bg: 'bg-schedule-process', fg: 'text-schedule-process-foreground', cellBg: 'bg-card hover:bg-schedule-hover' };
  };

  const colors = getProcessColors();

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
          : colors.cellBg
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
                colors.bg, colors.fg
              )}
            >
              {data.process || 'N/A'}
            </span>
          </div>
          <div className="text-xs font-semibold">
            {data.day && <span>{data.day}</span>}
            {data.day && data.batch && <span className="mx-1 text-muted-foreground">•</span>}
            {data.batch && <span>{data.batch}</span>}
          </div>

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
              <div className="flex items-center justify-center text-[10px] leading-none bg-schedule-incubator text-schedule-incubator-foreground px-1.5 py-1 min-h-[22px] rounded border border-schedule-incubator-border whitespace-nowrap">
                <Box className="w-3 h-3 mr-1 shrink-0" strokeWidth={2.5} />
                <span>Inc #{data.incubator}</span>
              </div>
            )}

            {data.hood && (
              <div className="flex items-center justify-center text-[10px] leading-none bg-schedule-hood text-schedule-hood-foreground px-1.5 py-1 min-h-[22px] rounded border border-schedule-hood-border whitespace-nowrap">
                <FlaskConical className="w-3 h-3 mr-1 shrink-0" strokeWidth={2.5} />
                <span>BSC #{data.hood}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
