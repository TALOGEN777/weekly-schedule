import { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface RowConfig {
  label: string;
  prefilledDays?: string[];
}

interface RowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: RowConfig) => void;
  onDelete: () => void;
  initialLabel?: string;
  mode?: 'add' | 'edit';
}

export const RowModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialLabel = '',
  mode = 'add',
}: RowModalProps) => {
  const [label, setLabel] = useState(initialLabel);

  useEffect(() => {
    setLabel(initialLabel);
  }, [initialLabel, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (label.trim()) {
      onSave({ label });
      setLabel('');
    }
  };

  const title = mode === 'add' ? 'Add New Line/Room' : 'Edit Line/Room Name';
  const buttonText = mode === 'add' ? 'Add Line' : 'Update Name';

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-border">
        <div className="bg-secondary px-6 py-4 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <Label htmlFor="room-name" className="text-sm font-medium mb-2 block">
            Room Name / Line Label
          </Label>
          {mode === 'add' ? (
            <div className="flex flex-col gap-2 mb-4">
              <Button
                type="button"
                variant={label === 'Room 32 (A)' ? 'default' : 'outline'}
                onClick={() => {
                  setLabel('Room 32');
                  onSave({ label: 'Room 32', prefilledDays: ['Day 0', 'Day 1', 'Day 2', 'Day 3'] });
                }}
                className="justify-start truncate"
              >
                Room 32 (A): Day 0, 1, 2, 3
              </Button>
              <Button
                type="button"
                variant={label === 'Room 32 (B)' ? 'default' : 'outline'}
                onClick={() => {
                  setLabel('Room 32');
                  onSave({ label: 'Room 32', prefilledDays: ['Day 6', 'Day 9', 'Day 10'] });
                }}
                className="justify-start truncate"
              >
                Room 32 (B): Day 6, 9, 10
              </Button>
              <Button
                type="button"
                variant={label === 'Room 31 (A)' ? 'default' : 'outline'}
                onClick={() => {
                  setLabel('Room 31');
                  onSave({ label: 'Room 31', prefilledDays: ['Day 0', 'Day 1', 'Day 2', 'Day 3'] });
                }}
                className="justify-start truncate"
              >
                Room 31 (A): Day 0, 1, 2, 3
              </Button>
              <Button
                type="button"
                variant={label === 'Room 31 (B)' ? 'default' : 'outline'}
                onClick={() => {
                  setLabel('Room 31');
                  onSave({ label: 'Room 31', prefilledDays: ['Day 6', 'Day 9', 'Day 10'] });
                }}
                className="justify-start truncate"
              >
                Room 31 (B): Day 6, 9, 10
              </Button>
              <Button
                type="button"
                variant={label === 'Process Development' ? 'default' : 'outline'}
                onClick={() => {
                  setLabel('Process Development');
                  onSave({ label: 'Process Development' });
                }}
                className="justify-start truncate mt-2"
              >
                Process Development
              </Button>
              <Button
                type="button"
                variant={label === 'Comments' ? 'default' : 'outline'}
                onClick={() => {
                  setLabel('Comments');
                  onSave({ label: 'Comments' });
                }}
                className="justify-start truncate"
              >
                Comments
              </Button>
            </div>
          ) : (
            <Input
              id="room-name"
              type="text"
              placeholder="e.g. Room 32 (Line A)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          )}
          <div
            className={`mt-6 flex ${mode === 'edit' ? 'justify-between' : 'justify-end'} gap-2`}
          >
            {mode === 'edit' && (
              <Button
                type="button"
                variant="outline"
                onClick={onDelete}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Line
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {mode === 'edit' && (
                <Button type="submit">{buttonText}</Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
