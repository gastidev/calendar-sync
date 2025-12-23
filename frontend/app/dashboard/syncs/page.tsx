"use client"

import { useSyncs } from '@/hooks/use-syncs';
import { useConnections } from '@/hooks/use-connections';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, RefreshCw, Trash2, Settings, Link2, ArrowLeftRight, ArrowRight, ArrowLeft, Play, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SyncsPage() {
  const { syncs, loading, toggleSync, deleteSync, triggerSync, refetch } = useSyncs();
  const { connections, loading: loadingConnections } = useConnections();
  const [triggering, setTriggering] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [syncToDelete, setSyncToDelete] = useState<string | null>(null);
  const router = useRouter();

  const getCalendarName = (calendarId: string) => {
    for (const conn of connections) {
      const calendar = conn.calendars?.find(c => c.id === calendarId);
      if (calendar) {
        return `${calendar.calendar_name} (${conn.provider_account_id})`;
      }
    }
    return 'Unknown Calendar';
  };

  const getCalendarColor = (calendarId: string) => {
    for (const conn of connections) {
      const calendar = conn.calendars?.find(c => c.id === calendarId);
      if (calendar) {
        return conn.color_tag || '#3B82F6';
      }
    }
    return '#3B82F6';
  };

  const handleToggle = async (syncId: string, currentStatus: boolean) => {
    try {
      await toggleSync(syncId, !currentStatus);
      toast.success(currentStatus ? 'Sync paused' : 'Sync resumed');
      await refetch();
    } catch (error: any) {
      toast.error('Failed to toggle sync', {
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const getSyncDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'source_to_target':
        return <ArrowRight className="h-5 w-5 text-white" />;
      case 'target_to_source':
        return <ArrowLeft className="h-5 w-5 text-white" />;
      default:
        return <ArrowLeftRight className="h-5 w-5 text-white" />;
    }
  };

  const getSyncDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'source_to_target':
        return 'One-Way Sync (Source → Target)';
      case 'target_to_source':
        return 'One-Way Sync (Target → Source)';
      default:
        return 'Bidirectional Sync';
    }
  };

  const handleDeleteClick = (syncId: string) => {
    setSyncToDelete(syncId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!syncToDelete) return;

    try {
      await deleteSync(syncToDelete);
      toast.success('Sync deleted successfully');
      setDeleteDialogOpen(false);
      setSyncToDelete(null);
      await refetch();
    } catch (error: any) {
      toast.error('Failed to delete sync', {
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const handleTrigger = async (syncId: string) => {
    setTriggering(syncId);
    try {
      await triggerSync(syncId);
      toast.success('Sync triggered successfully');
      await refetch();
    } catch (error: any) {
      toast.error('Failed to trigger sync', {
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setTriggering(null);
    }
  };

  if (loading || loadingConnections) {
    return (
      <div className="space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Calendar Syncs</h1>
            <p className="text-muted-foreground text-lg">
              Manage sync relationships between your calendars
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard/syncs/create')} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create Sync
          </Button>
        </div>

        {syncs.length === 0 ? (
          <Card className="border-dashed shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-20 px-6">
              <div className="p-6 rounded-2xl bg-primary/10 mb-6">
                <Link2 className="h-16 w-16 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No syncs configured</h3>
              <p className="text-base text-muted-foreground mb-8 max-w-md text-center">
                Create your first sync to keep calendars in sync automatically
              </p>
              <Button onClick={() => router.push('/dashboard/syncs/create')} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Sync
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {syncs.map((sync) => (
              <Card key={sync.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2.5 rounded-lg shadow-sm"
                          style={{ backgroundColor: getCalendarColor(sync.source_calendar_id) }}
                        >
                          {getSyncDirectionIcon(sync.sync_direction)}
                        </div>
                        <CardTitle className="text-lg leading-tight">{getSyncDirectionLabel(sync.sync_direction)}</CardTitle>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getCalendarColor(sync.source_calendar_id) }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">Source</p>
                            <p className="text-sm font-medium truncate">{getCalendarName(sync.source_calendar_id)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getCalendarColor(sync.target_calendar_id) }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">Target</p>
                            <p className="text-sm font-medium truncate">{getCalendarName(sync.target_calendar_id)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center pt-1">
                      <Switch
                        checked={sync.is_active}
                        onCheckedChange={() => handleToggle(sync.id, sync.is_active)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant={sync.is_active ? "default" : "secondary"} className="text-xs">
                        {sync.is_active ? 'Active' : 'Paused'}
                      </Badge>
                      {sync.last_synced_at && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(sync.last_synced_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTrigger(sync.id)}
                        disabled={triggering === sync.id}
                      >
                        {triggering === sync.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">Sync Now</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/syncs/${sync.id}/settings`)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(sync.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sync</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sync? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
