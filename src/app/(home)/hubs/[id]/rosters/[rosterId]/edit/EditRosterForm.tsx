"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DatePicker } from "@/components/DatePicker";
import { subDays } from "date-fns";
import type { EditRosterForm } from "@/types/roster";
import { editRosterSchema } from "@/lib/schemas";
import { rotationChoiceLabels, rotationTypeLabels } from "@/lib/constants";
import { useUpdateRoster } from "@/hooks/roster";

export default function EditRosterForm({
  hubId,
  rosterId,
  initialValues,
}: {
  hubId: number;
  rosterId: number;
  initialValues: EditRosterForm;
}) {
  const router = useRouter();

  const form = useForm<EditRosterForm>({
    resolver: zodResolver(editRosterSchema),
    defaultValues: {
      ...initialValues,
      start: initialValues.start ? new Date(initialValues.start) : new Date(),
      end: initialValues.end ? new Date(initialValues.end) : new Date(),
      ...(initialValues.rotationType !== "CUSTOM"
        ? { rotationOption: undefined }
        : {}),
    },
  });

  const { mutateAsync: updateRoster, isPending: isUpdatingRoster } =
    useUpdateRoster(String(rosterId), () => {
      router.push(`/hubs/${hubId}/rosters/${rosterId}`);
    });

  const {
    watch,
    formState: { isValid, isDirty },
    handleSubmit,
    control,
  } = form;

  const rotationType = watch("rotationType");
  const isCustomRotation = rotationType === "CUSTOM";
  const start = watch("start");

  const isFormValid =
    isValid &&
    (!isCustomRotation ||
      (!!watch("rotationOption.rotation") && !!watch("rotationOption.unit")));

  async function onSubmit(values: EditRosterForm) {
    const payload = {
      ...values,
      rotationOption:
        values.rotationType === "CUSTOM" ? values.rotationOption : undefined,
    };

    await updateRoster(payload);
  }

  return (
    <Card className="border border-border/60 bg-background/80 backdrop-blur shadow-sm">
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Basic Information</h3>
          <p className="text-sm text-muted-foreground">
            Name and describe the roster so members know what it is for.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title of roster</FormLabel>
                  <FormControl>
                    <Input placeholder="Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description of roster</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a brief description"
                      className="min-h-[96px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value ? "PRIVATE" : "PUBLIC"}
                      onValueChange={(value) =>
                        field.onChange(value === "PRIVATE")
                      }
                      className="flex items-center gap-3"
                    >
                      <div className="flex items-center space-x-2 rounded-lg border p-3">
                        <RadioGroupItem value="PRIVATE" id="v-private" />
                        <Label htmlFor="v-private" className="cursor-pointer">
                          Private
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-3">
                        <RadioGroupItem value="PUBLIC" id="v-public" />
                        <Label htmlFor="v-public" className="cursor-pointer">
                          Public
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Rotation Options</h3>
                <p className="text-sm text-muted-foreground">
                  Choose the frequency of rotation and set the active window.
                </p>
              </div>

              <FormField
                control={control}
                name="rotationType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-2 md:grid-cols-5 gap-3"
                      >
                        {Object.entries(rotationChoiceLabels).map(
                          ([value, label]) => (
                            <div
                              key={value}
                              className="flex items-center space-x-2 rounded-lg border p-3"
                            >
                              <RadioGroupItem
                                value={value}
                                id={`rotation-${value}`}
                              />
                              <Label
                                htmlFor={`rotation-${value}`}
                                className="cursor-pointer"
                              >
                                {label}
                              </Label>
                            </div>
                          )
                        )}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isCustomRotation && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="rotationOption.rotation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rotation</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select rotation" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(rotationTypeLabels).map(
                                ([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="rotationOption.unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  control={control}
                  name="start"
                  label="Start date"
                  calendarProps={{
                    disabled: (date) => date < subDays(new Date(), 1),
                  }}
                />
                <DatePicker
                  control={control}
                  name="end"
                  label="End date"
                  calendarProps={{ disabled: (date) => date < start }}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="enablePushNotifications"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Push Notifications
                        </FormLabel>
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
                <FormField
                  control={control}
                  name="enableEmailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Email</FormLabel>
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
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div> */}
            </div>

            <CardFooter className="px-0">
              <div className="flex w-full items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    router.push(`/hubs/${hubId}/rosters/${rosterId}`)
                  }
                >
                  Cancel
                </Button>
                <Button
                  disabled={!isFormValid || !isDirty || isUpdatingRoster}
                  type="submit"
                >
                  Save changes
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
