"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dropzone from "@/components/Dropzone";
import ThemeSwatches from "@/components/ThemeSwatches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { EditHubForm } from "@/types/hub";
import { createHubSchema } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { useUpdateHub } from "@/hooks/hub";

export default function EditHubForm({
  hubId,
  initialValues,
}: {
  hubId: string;
  initialValues: EditHubForm;
}) {
  const router = useRouter();

  const form = useForm<EditHubForm>({
    resolver: zodResolver(createHubSchema),
    defaultValues: initialValues,
  });

  const {
    formState: { isValid, isDirty },
  } = form;

  const { mutateAsync: updateHub, isPending } = useUpdateHub(hubId, () => {
    router.push(`/hubs/${hubId}`);
  });

  async function onSubmit(values: EditHubForm) {
    await updateHub(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="logoUrl"
          render={() => (
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <FormControl>
                <Dropzone
                  value={form.watch("logoUrl") ?? null}
                  onChange={(url: string | null) =>
                    form.setValue("logoUrl", url, { shouldDirty: true })
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
                      form.setValue("theme", v as EditHubForm["theme"], {
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
          <Button type="submit" disabled={!isDirty || !isValid || isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
