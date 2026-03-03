import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2, Download } from 'lucide-react';

interface BackupFile {
  name: string;
  created_at: string;
}

interface BackupListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (data: { rows: any[]; scheduleData: Record<string, any> }) => void;
}

export function BackupListModal({ isOpen, onClose, onRestore }: BackupListModalProps) {
  const [files, setFiles] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) loadFiles();
  }, [isOpen]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('schedule-backups')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      setFiles((data || []).filter(f => f.name.endsWith('.json')));
    } catch (err) {
      console.error('Failed to list backups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (fileName: string) => {
    setRestoring(fileName);
    try {
      const { data, error } = await supabase.storage
        .from('schedule-backups')
        .download(fileName);
      if (error) throw error;
      const text = await data.text();
      const parsed = JSON.parse(text);
      onRestore(parsed);
      onClose();
    } catch (err) {
      console.error('Failed to restore backup:', err);
      alert('Failed to restore backup.');
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!window.confirm(`Delete backup "${fileName}"?`)) return;
    try {
      await supabase.storage.from('schedule-backups').remove([fileName]);
      setFiles(prev => prev.filter(f => f.name !== fileName));
    } catch (err) {
      console.error('Failed to delete backup:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Restore from Backup</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : files.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No backups found.</p>
          ) : (
            files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
              >
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(file.created_at)}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRestore(file.name)}
                    disabled={restoring === file.name}
                  >
                    {restoring === file.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(file.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
