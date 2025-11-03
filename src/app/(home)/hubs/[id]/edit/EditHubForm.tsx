'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Dropzone from '@/components/Dropzone';
import ThemeSwatches from '@/components/ThemeSwatches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const Schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().max(500).optional().or(z.literal('')),
  logo: z.string().url().nullable().optional(),
  theme: z.enum(['indigo', 'sky', 'rose', 'emerald', 'amber', 'zinc']),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']),
});
export type EditHubValues = z.infer<typeof Schema>;

export default function EditHubForm({
  hubId,
  initialValues,
}: {
  hubId: string;
  initialValues: EditHubValues;
}) {
  const form = useForm<EditHubValues>({
    resolver: zodResolver(Schema),
    defaultValues: initialValues,
  });

  async function onSubmit(values: EditHubValues) {
    const res = await fetch(`/api/hubs/${hubId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const t = await res.text();
      alert('Update failed: ' + t);
      return;
    }
    window.location.href = `/hubs/${hubId}`;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="logo"
          render={() => (
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <FormControl>
                <Dropzone
                  value={form.watch('logo') ?? null}
                  onChange={(url: string | null) =>
                    form.setValue('logo', url, { shouldDirty: true })
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Hub name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What is this hub for"
                  className="min-h-[96px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-6">
          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibility</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex items-center gap-3"
                  >
                    <div className="flex items-center space-x-2 rounded-lg border p-3">
                      <RadioGroupItem value="PUBLIC" id="v-public" />
                      <Label htmlFor="v-public" className="cursor-pointer">
                        Public
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-3">
                      <RadioGroupItem value="PRIVATE" id="v-private" />
                      <Label htmlFor="v-private" className="cursor-pointer">
                        Private
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-3">
                      <RadioGroupItem value="UNLISTED" id="v-unlisted" />
                      <Label htmlFor="v-unlisted" className="cursor-pointer">
                        Unlisted
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="theme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Theme</FormLabel>
                <FormControl>
                  <ThemeSwatches
                    value={field.value}
                    onChange={(v) =>
                      form.setValue('theme', v as EditHubValues['theme'], {
                        shouldDirty: true,
                      })
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => history.back()}>
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </Form>
  );
}
