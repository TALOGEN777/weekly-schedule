import { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (label: string) => void;
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
      onSave(label);
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
          <Input
            id="room-name"
            type="text"
            placeholder="e.g. Room 32 (Line A)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
          />
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
              <Button type="submit">{buttonText}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
