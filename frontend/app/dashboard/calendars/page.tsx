"use client"

import { useState } from 'react';
import { useConnections } from '@/hooks/use-connections';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ColorPicker } from '@/components/ui/color-picker';
import { Plus, Trash2, Calendar as CalendarIcon, Palette } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export default function CalendarsPage() {
  const { connections, loading, refetch, deleteConnection } = useConnections();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null);
  const [connectionToEdit, setConnectionToEdit] = useState<{ id: string; color: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');
  const [updatingColor, setUpdatingColor] = useState(false);

  const handleConnect = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      window.location.href = `${apiUrl}/auth/google/init?user_id=${user.id}`;
    }
  };

  const handleDeleteClick = (id: string) => {
    setConnectionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!connectionToDelete) return;

    try {
      await deleteConnection(connectionToDelete);
      toast.success('Calendar disconnected successfully');
      setDeleteDialogOpen(false);
      setConnectionToDelete(null);
      await refetch();
    } catch (error: any) {
      toast.error('Failed to disconnect calendar', {
        description: error.message || 'An unexpected error occurred',
      });
    }
  };

  const handleColorClick = (id: string, currentColor: string) => {
    setConnectionToEdit({ id, color: currentColor });
    setSelectedColor(currentColor);
    setColorDialogOpen(true);
  };

  const handleColorUpdate = async () => {
    if (!connectionToEdit) return;

    setUpdatingColor(true);
    try {
      await api.connections.updateColor(connectionToEdit.id, selectedColor);
      toast.success('Calendar color updated successfully');
      setColorDialogOpen(false);
      setConnectionToEdit(null);
      await refetch();
    } catch (error: any) {
      toast.error('Failed to update color', {
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setUpdatingColor(false);
    }
  };

  if (loading) {
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-10" />
                </div>
              </CardHeader>
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
            <h1 className="text-4xl font-bold tracking-tight">Connected Calendars</h1>
            <p className="text-muted-foreground text-lg">
              Manage your Google Calendar connections and colors
            </p>
          </div>
          <Button onClick={handleConnect} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Calendar
          </Button>
        </div>

        {connections.length === 0 ? (
          <Card className="border-dashed shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-20 px-6">
              <div className="p-6 rounded-2xl bg-primary/10 mb-6">
                <CalendarIcon className="h-16 w-16 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No calendars connected</h3>
              <p className="text-base text-muted-foreground mb-8 max-w-md text-center">
                Connect your first calendar to get started with syncing
              </p>
              <Button onClick={handleConnect} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Connect Calendar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {connections.map((connection) => (
              <Card key={connection.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <button
                        onClick={() => handleColorClick(connection.id, connection.color_tag)}
                        className="relative group flex-shrink-0"
                        aria-label="Change calendar color"
                      >
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md transition-all group-hover:scale-105 group-hover:shadow-lg"
                          style={{ backgroundColor: connection.color_tag }}
                        >
                          <CalendarIcon className="h-7 w-7 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-background shadow-sm flex items-center justify-center">
                          <Palette className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg leading-tight truncate">
                          {connection.provider_account_id}
                        </CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {connection.calendar_prefix}
                            </Badge>
                            <Badge variant={connection.is_active ? "default" : "secondary"} className="text-xs">
                              {connection.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(connection.id)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                {connection.calendars && connection.calendars.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="space-y-3 pt-4 border-t">
                      <p className="text-sm font-semibold text-muted-foreground">Calendars:</p>
                      <div className="grid gap-2.5">
                        {connection.calendars.map((calendar) => (
                          <div
                            key={calendar.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div 
                                className="p-1.5 rounded-md flex-shrink-0"
                                style={{ backgroundColor: connection.color_tag + '20' }}
                              >
                                <CalendarIcon 
                                  className="h-4 w-4" 
                                  style={{ color: connection.color_tag }}
                                />
                              </div>
                              <span className="text-sm font-medium truncate">{calendar.calendar_name}</span>
                            </div>
                            {calendar.is_primary && (
                              <Badge variant="default" className="text-xs flex-shrink-0">Primary</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Calendar</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect this calendar? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Calendar Color</DialogTitle>
            <DialogDescription>
              Choose a color for this calendar. Synced events will use this color in other calendars.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setColorDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleColorUpdate} disabled={updatingColor}>
              {updatingColor ? 'Updating...' : 'Save Color'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
