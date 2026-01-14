import { useEffect, useState } from 'react';
import { X, Trash2, Save, Users, Box, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ScheduleEntry } from './ScheduleCell';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ScheduleEntry) => void;
  onDelete: () => void;
  initialData: ScheduleEntry | null;
  dateLabel: string;
  roomLabel: string;
}

const defaultFormData: ScheduleEntry = {
  process: '',
  batch: '',
  startTime: '08:00',
  endTime: '12:00',
  employees: '',
  incubator: '',
  hood: '',
};

export const EditModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  dateLabel,
  roomLabel,
}: EditModalProps) => {
  const [formData, setFormData] = useState<ScheduleEntry>(defaultFormData);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-border">
        <div className="bg-secondary px-6 py-4 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Edit Schedule</h3>
            <p className="text-sm text-muted-foreground">
              {roomLabel} • {dateLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="process" className="text-xs mb-1 block">
                Process Name
              </Label>
              <Input
                id="process"
                name="process"
                type="text"
                placeholder="e.g. Manual"
                value={formData.process}
                onChange={handleChange}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="batch" className="text-xs mb-1 block">
                Batch Number
              </Label>
              <Input
                id="batch"
                name="batch"
                type="text"
                placeholder="2502..."
                className="font-mono"
                value={formData.batch}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime" className="text-xs mb-1 block">
                Start Time
              </Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="endTime" className="text-xs mb-1 block">
                End Time
              </Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="employees" className="text-xs mb-1 block">
              Employees (Names)
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                id="employees"
                name="employees"
                type="text"
                placeholder="Dutchi/Moria"
                className="pl-9"
                value={formData.employees}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="incubator" className="text-xs mb-1 block">
                Incubator #
              </Label>
              <div className="relative">
                <Box className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  id="incubator"
                  name="incubator"
                  type="text"
                  placeholder="20"
                  className="pl-9"
                  value={formData.incubator}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="hood" className="text-xs mb-1 block">
                BSC / Hood #
              </Label>
              <div className="relative">
                <FlaskConical className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  id="hood"
                  name="hood"
                  type="text"
                  placeholder="05"
                  className="pl-9"
                  value={formData.hood}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border mt-2">
            {initialData ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            ) : (
              <div></div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Save Entry
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
