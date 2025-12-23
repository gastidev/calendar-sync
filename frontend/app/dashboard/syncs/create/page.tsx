"use client"

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useConnections } from '@/hooks/use-connections';
import { useSyncs } from '@/hooks/use-syncs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const createSyncSchema = z.object({
  sourceCalendarId: z.string().min(1, 'Please select a source calendar'),
  targetCalendarId: z.string().min(1, 'Please select a target calendar'),
}).refine((data) => data.sourceCalendarId !== data.targetCalendarId, {
  message: 'Source and target calendars must be different',
  path: ['targetCalendarId'],
});

type CreateSyncFormValues = z.infer<typeof createSyncSchema>;

export default function CreateSyncPage() {
  const { connections, loading } = useConnections();
  const { createSync } = useSyncs();
  const router = useRouter();

  const allCalendars = connections.flatMap(conn =>
    (conn.calendars || []).map(cal => ({
      ...cal,
      displayName: `${cal.calendar_name} (${conn.provider_account_id})`,
      connectionPrefix: conn.calendar_prefix,
      color: conn.color_tag,
      connectionId: conn.id,
    }))
  );

  const form = useForm<CreateSyncFormValues>({
    resolver: zodResolver(createSyncSchema),
    defaultValues: {
      sourceCalendarId: '',
      targetCalendarId: '',
    },
  });

  const getCalendarColor = (calendarId: string) => {
    const calendar = allCalendars.find(cal => cal.id === calendarId);
    return calendar?.color || '#3B82F6';
  };

  const onSubmit = async (values: CreateSyncFormValues) => {
    try {
      await createSync(values.sourceCalendarId, values.targetCalendarId);
      toast.success('Sync created successfully');
      router.push('/dashboard/syncs');
    } catch (err: any) {
      toast.error('Failed to create sync', {
        description: err.message || 'An unexpected error occurred',
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="space-y-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Create New Sync</h1>
          <p className="text-muted-foreground text-lg">
            Create a bidirectional sync between two calendars
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Sync Configuration</CardTitle>
          <CardDescription>
            Select the source and target calendars for synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="sourceCalendarId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Source Calendar</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a calendar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allCalendars.map((cal) => (
                          <SelectItem key={cal.id} value={cal.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: cal.color }}
                              />
                              <span>{cal.displayName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Events from this calendar will be synced to the target
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetCalendarId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Target Calendar</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!form.watch('sourceCalendarId')}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a calendar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allCalendars
                          .filter(cal => cal.id !== form.watch('sourceCalendarId'))
                          .map((cal) => (
                            <SelectItem key={cal.id} value={cal.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: cal.color }}
                                />
                                <span>{cal.displayName}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Events will be created and synced to this calendar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('sourceCalendarId') && form.watch('targetCalendarId') && (
                <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
                  <p className="text-sm font-semibold">Preview:</p>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCalendarColor(form.watch('sourceCalendarId')) }}
                      />
                      <span className="font-medium">Source</span>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCalendarColor(form.watch('targetCalendarId')) }}
                      />
                      <span className="font-medium">Target</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={form.formState.isSubmitting} size="lg">
                  {form.formState.isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Sync'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
