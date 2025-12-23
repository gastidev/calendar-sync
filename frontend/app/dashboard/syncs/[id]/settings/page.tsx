"use client"

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useConnections } from '@/hooks/use-connections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ArrowLeft, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

const settingsSchema = z.object({
  sync_direction: z.enum(['bidirectional', 'source_to_target', 'target_to_source']),
  source_to_target_privacy_mode: z.boolean(),
  target_to_source_privacy_mode: z.boolean(),
  source_to_target_placeholder_text: z.string().min(1, 'Placeholder text is required'),
  target_to_source_placeholder_text: z.string().min(1, 'Placeholder text is required'),
  source_to_target_event_filter_type: z.enum(['all', 'accepted_only']),
  target_to_source_event_filter_type: z.enum(['all', 'accepted_only']),
  source_to_target_prefix: z.string(),
  target_to_source_prefix: z.string(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SyncSettings {
  privacy_mode: boolean;
  placeholder_text: string;
  event_filter_type: 'all' | 'accepted_only';
  source_to_target_privacy_mode: boolean;
  target_to_source_privacy_mode: boolean;
  source_to_target_placeholder_text: string;
  target_to_source_placeholder_text: string;
  source_to_target_event_filter_type: 'all' | 'accepted_only';
  target_to_source_event_filter_type: 'all' | 'accepted_only';
  source_to_target_prefix: string;
  target_to_source_prefix: string;
}

interface Sync {
  id: string;
  source_calendar_id: string;
  target_calendar_id: string;
  sync_direction: 'bidirectional' | 'source_to_target' | 'target_to_source';
}

export default function SyncSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const syncId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [sourceCalendarName, setSourceCalendarName] = useState('Source');
  const [targetCalendarName, setTargetCalendarName] = useState('Target');
  const [sourceCalendarId, setSourceCalendarId] = useState<string>('');
  const [targetCalendarId, setTargetCalendarId] = useState<string>('');
  const { connections } = useConnections();

  const getCalendarName = (calendarId: string) => {
    for (const conn of connections) {
      const calendar = conn.calendars?.find(c => c.id === calendarId);
      if (calendar) {
        return calendar.calendar_name;
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

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      sync_direction: 'bidirectional',
      source_to_target_privacy_mode: false,
      target_to_source_privacy_mode: false,
      source_to_target_placeholder_text: 'Busy',
      target_to_source_placeholder_text: 'Busy',
      source_to_target_event_filter_type: 'all',
      target_to_source_event_filter_type: 'all',
      source_to_target_prefix: '',
      target_to_source_prefix: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [syncData, settingsData] = await Promise.all([
          api.syncs.getById(syncId),
          api.syncs.getSettings(syncId)
        ]);
        const sync = syncData.sync as Sync;
        const settings = settingsData.settings as SyncSettings;

        setSourceCalendarName(getCalendarName(sync.source_calendar_id));
        setTargetCalendarName(getCalendarName(sync.target_calendar_id));
        setSourceCalendarId(sync.source_calendar_id);
        setTargetCalendarId(sync.target_calendar_id);

        form.reset({
          sync_direction: sync.sync_direction,
          source_to_target_privacy_mode: settings.source_to_target_privacy_mode,
          target_to_source_privacy_mode: settings.target_to_source_privacy_mode,
          source_to_target_placeholder_text: settings.source_to_target_placeholder_text,
          target_to_source_placeholder_text: settings.target_to_source_placeholder_text,
          source_to_target_event_filter_type: settings.source_to_target_event_filter_type,
          target_to_source_event_filter_type: settings.target_to_source_event_filter_type,
          source_to_target_prefix: settings.source_to_target_prefix || '',
          target_to_source_prefix: settings.target_to_source_prefix || '',
        });
      } catch (err: any) {
        toast.error('Failed to load settings', {
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [syncId, form, connections]);

  const handleSyncDirectionChange = async (newDirection: 'bidirectional' | 'source_to_target' | 'target_to_source') => {
    try {
      await api.syncs.update(syncId, { syncDirection: newDirection });
      form.setValue('sync_direction', newDirection);
      toast.success('Sync direction updated');
    } catch (err: any) {
      toast.error('Failed to update sync direction', {
        description: err.message,
      });
    }
  };

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await api.syncs.updateSettings(syncId, {
        sourceToTargetPrivacyMode: values.source_to_target_privacy_mode,
        targetToSourcePrivacyMode: values.target_to_source_privacy_mode,
        sourceToTargetPlaceholderText: values.source_to_target_placeholder_text,
        targetToSourcePlaceholderText: values.target_to_source_placeholder_text,
        sourceToTargetEventFilterType: values.source_to_target_event_filter_type,
        targetToSourceEventFilterType: values.target_to_source_event_filter_type,
        sourceToTargetPrefix: values.source_to_target_prefix,
        targetToSourcePrefix: values.target_to_source_prefix,
      });
      toast.success('Settings saved successfully');
      router.push('/dashboard/syncs');
    } catch (err: any) {
      toast.error('Failed to save settings', {
        description: err.message || 'An unexpected error occurred',
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const syncDirection = form.watch('sync_direction');

  return (
    <div className="max-w-4xl mx-auto space-y-10">
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
          <h1 className="text-4xl font-bold tracking-tight">Sync Settings</h1>
          <p className="text-muted-foreground text-lg">
            Configure sync direction, privacy mode, and event filtering
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Sync Direction</CardTitle>
              <CardDescription>
                Choose how events should sync between calendars
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="sync_direction"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleSyncDirectionChange(value as typeof syncDirection);
                        }}
                        value={field.value}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="bidirectional" id="bidirectional" className="mt-1" />
                          <div className="space-y-1 leading-none flex-1">
                            <label
                              htmlFor="bidirectional"
                              className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                            >
                              <ArrowLeftRight className="h-4 w-4 text-primary" />
                              Bidirectional Sync
                            </label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Events sync in both directions between source and target calendars
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="source_to_target" id="source_to_target" className="mt-1" />
                          <div className="space-y-1 leading-none flex-1">
                            <label
                              htmlFor="source_to_target"
                              className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                            >
                              <ArrowRight className="h-4 w-4 text-primary" />
                              Source → Target Only
                            </label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Events sync only from source calendar to target calendar
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="target_to_source" id="target_to_source" className="mt-1" />
                          <div className="space-y-1 leading-none flex-1">
                            <label
                              htmlFor="target_to_source"
                              className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                            >
                              <ArrowLeft className="h-4 w-4 text-primary" />
                              Target → Source Only
                            </label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Events sync only from target calendar to source calendar
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {(syncDirection === 'bidirectional' || syncDirection === 'source_to_target') && (
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getCalendarColor(sourceCalendarId) }}
                  />
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="truncate">{sourceCalendarName} → {targetCalendarName}</span>
                </CardTitle>
                <CardDescription>
                  Privacy and filtering for events syncing from {sourceCalendarName} to {targetCalendarName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="source_to_target_privacy_mode"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                      <div className="space-y-0.5 flex-1">
                        <FormLabel className="text-base font-semibold">Enable Privacy Mode</FormLabel>
                        <FormDescription>
                          Hide event details when syncing to target calendar
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch('source_to_target_privacy_mode') && (
                  <FormField
                    control={form.control}
                    name="source_to_target_placeholder_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Placeholder Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Busy" {...field} />
                        </FormControl>
                        <FormDescription>
                          This text will replace event titles in the target calendar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="source_to_target_prefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Event Title Prefix</FormLabel>
                      <FormControl>
                        <Input placeholder="[Volt] " {...field} />
                      </FormControl>
                      <FormDescription>
                        Add a prefix to event titles when syncing to target calendar (e.g., &quot;[Volt] &quot;)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source_to_target_event_filter_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Event Filter</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value="all" id="source_all" />
                            <label htmlFor="source_all" className="text-sm font-medium leading-none cursor-pointer flex-1">
                              Sync all events
                            </label>
                          </div>
                          <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value="accepted_only" id="source_accepted" />
                            <label htmlFor="source_accepted" className="text-sm font-medium leading-none cursor-pointer flex-1">
                              Only sync events I&apos;ve accepted
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {(syncDirection === 'bidirectional' || syncDirection === 'target_to_source') && (
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <ArrowLeft className="h-5 w-5 text-primary" />
                  <span>{targetCalendarName} → {sourceCalendarName}</span>
                </CardTitle>
                <CardDescription>
                  Privacy and filtering for events syncing from {targetCalendarName} to {sourceCalendarName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="target_to_source_privacy_mode"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                      <div className="space-y-0.5 flex-1">
                        <FormLabel className="text-base font-semibold">Enable Privacy Mode</FormLabel>
                        <FormDescription>
                          Hide event details when syncing to source calendar
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch('target_to_source_privacy_mode') && (
                  <FormField
                    control={form.control}
                    name="target_to_source_placeholder_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Placeholder Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Busy" {...field} />
                        </FormControl>
                        <FormDescription>
                          This text will replace event titles in the source calendar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="target_to_source_prefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Event Title Prefix</FormLabel>
                      <FormControl>
                        <Input placeholder="[Email] " {...field} />
                      </FormControl>
                      <FormDescription>
                        Add a prefix to event titles when syncing to source calendar (e.g., &quot;[Email] &quot;)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_to_source_event_filter_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Event Filter</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value="all" id="target_all" />
                            <label htmlFor="target_all" className="text-sm font-medium leading-none cursor-pointer flex-1">
                              Sync all events
                            </label>
                          </div>
                          <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value="accepted_only" id="target_accepted" />
                            <label htmlFor="target_accepted" className="text-sm font-medium leading-none cursor-pointer flex-1">
                              Only sync events I&apos;ve accepted
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={form.formState.isSubmitting} size="lg">
              {form.formState.isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
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
    </div>
  );
}
