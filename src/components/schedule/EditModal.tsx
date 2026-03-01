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
  day: '',
  startTime: '08:00',
  endTime: '14:00',
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
        setFormData({ ...defaultFormData, ...initialData });
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
          {roomLabel === 'Comments' ? (
            <div>
              <Label htmlFor="process" className="text-xs mb-1 block">
                Free Text Comment
              </Label>
              <textarea
                id="process"
                name="process"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter comment..."
                value={formData.process}
                onChange={(e) => setFormData(prev => ({ ...prev, process: e.target.value }))}
                autoFocus
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="process" className="text-xs mb-1 block">
                    Process Name
                  </Label>
                  <div className="space-y-2">
                    <select
                      id="process-select"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={
                        ['CD19 CAR-T', 'CD22 CAR-T', 'CD19-1XX CAR-T', 'CD7 CAR-T', ''].includes(formData.process)
                          ? formData.process
                          : 'Other'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Other') {
                          setFormData((prev) => ({ ...prev, process: 'Other Process' }));
                        } else {
                          setFormData((prev) => ({ ...prev, process: val }));
                        }
                      }}
                    >
                      <option value="" disabled>Select process...</option>
                      <option value="CD19 CAR-T">CD19 CAR-T</option>
                      <option value="CD22 CAR-T">CD22 CAR-T</option>
                      <option value="CD19-1XX CAR-T">CD19-1XX CAR-T</option>
                      <option value="CD7 CAR-T">CD7 CAR-T</option>
                      <option value="Other">Other (manually write)</option>
                    </select>
                    {!['CD19 CAR-T', 'CD22 CAR-T', 'CD19-1XX CAR-T', 'CD7 CAR-T', ''].includes(formData.process) && (
                      <Input
                        id="process"
                        name="process"
                        type="text"
                        placeholder="Enter process name..."
                        value={formData.process === 'Other Process' ? '' : formData.process}
                        onChange={handleChange}
                        autoFocus
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="day" className="text-xs mb-1 block">
                      Day
                    </Label>
                    <div className="space-y-2">
                      <select
                        id="day-select"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={
                          ['Day 0', 'Day 1', 'Day 2', 'Day 3', 'Day 6', 'Day 9', 'Day 10', ''].includes(formData.day || '')
                            ? formData.day || ''
                            : 'Other'
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'Other') {
                            setFormData((prev) => ({ ...prev, day: 'Custom Day' }));
                          } else {
                            setFormData((prev) => ({ ...prev, day: val }));
                          }
                        }}
                      >
                        <option value="" disabled>Select day...</option>
                        <option value="Day 0">Day 0</option>
                        <option value="Day 1">Day 1</option>
                        <option value="Day 2">Day 2</option>
                        <option value="Day 3">Day 3</option>
                        <option value="Day 6">Day 6</option>
                        <option value="Day 9">Day 9</option>
                        <option value="Day 10">Day 10</option>
                        <option value="Other">Other...</option>
                      </select>
                      {!['Day 0', 'Day 1', 'Day 2', 'Day 3', 'Day 6', 'Day 9', 'Day 10', ''].includes(formData.day || '') && (
                        <Input
                          id="day"
                          name="day"
                          type="text"
                          placeholder="Enter day..."
                          value={formData.day === 'Custom Day' ? '' : formData.day}
                          onChange={handleChange}
                        />
                      )}
                    </div>
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
                      className="font-mono h-9"
                      value={formData.batch}
                      onChange={handleChange}
                    />
                  </div>
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
                <Label className="text-xs mb-1 block">Employees (Names)</Label>
                <div className="flex flex-wrap gap-2">
                  {['Fatima', 'Dutchy', 'Idan', 'Daniel', 'Tal'].map((emp) => {
                    const isSelected = formData.employees.includes(emp);
                    return (
                      <Button
                        key={emp}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          setFormData((prev) => {
                            let names = prev.employees.split('/').filter(n => n.trim() !== '');
                            if (isSelected) {
                              names = names.filter((n) => n !== emp);
                            } else {
                              names.push(emp);
                            }
                            return { ...prev, employees: names.join('/') };
                          });
                        }}
                      >
                        {emp}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incubator" className="text-xs mb-1 block">
                    Incubator #
                  </Label>
                  <div className="relative">
                    <Box className={`absolute left-3 top-2.5 w-4 h-4 text-muted-foreground ${roomLabel === 'Room 32' || roomLabel === 'Room 31' ? 'pointer-events-none' : ''}`} />
                    {roomLabel === 'Room 32' ? (
                      <select
                        id="incubator"
                        name="incubator"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent py-1 pl-9 pr-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        value={formData.incubator}
                        onChange={handleChange as any}
                      >
                        <option value="" disabled>Select...</option>
                        <option value="07">07</option>
                        <option value="08">08</option>
                        <option value="20">20</option>
                        <option value="21">21</option>
                      </select>
                    ) : roomLabel === 'Room 31' ? (
                      <select
                        id="incubator"
                        name="incubator"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent py-1 pl-9 pr-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        value={formData.incubator}
                        onChange={handleChange as any}
                      >
                        <option value="" disabled>Select...</option>
                        <option value="03">03</option>
                        <option value="04">04</option>
                        <option value="05">05</option>
                        <option value="06">06</option>
                      </select>
                    ) : (
                      <Input
                        id="incubator"
                        name="incubator"
                        type="text"
                        placeholder="Enter Incubator"
                        className="pl-9"
                        value={formData.incubator}
                        onChange={handleChange}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="hood" className="text-xs mb-1 block">
                    BSC / Hood #
                  </Label>
                  <div className="relative">
                    <FlaskConical className={`absolute left-3 top-2.5 w-4 h-4 text-muted-foreground ${roomLabel === 'Room 32' || roomLabel === 'Room 31' ? 'pointer-events-none' : ''}`} />
                    {roomLabel === 'Room 32' ? (
                      <select
                        id="hood"
                        name="hood"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent py-1 pl-9 pr-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        value={formData.hood}
                        onChange={handleChange as any}
                      >
                        <option value="" disabled>Select...</option>
                        <option value="05">05</option>
                        <option value="06">06</option>
                      </select>
                    ) : roomLabel === 'Room 31' ? (
                      <select
                        id="hood"
                        name="hood"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent py-1 pl-9 pr-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        value={formData.hood}
                        onChange={handleChange as any}
                      >
                        <option value="" disabled>Select...</option>
                        <option value="03">03</option>
                        <option value="04">04</option>
                      </select>
                    ) : (
                      <Input
                        id="hood"
                        name="hood"
                        type="text"
                        placeholder="Enter BSC"
                        className="pl-9"
                        value={formData.hood}
                        onChange={handleChange}
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

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
