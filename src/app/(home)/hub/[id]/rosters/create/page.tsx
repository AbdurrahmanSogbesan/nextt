"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRosterSchema } from "@/lib/schemas";
import Loading from "@/components/Loading";
import { ROTATION_CHOICE, ROTATION_TYPE } from "@prisma/client";
import { addDays, subDays } from "date-fns";
import { DatePicker } from "@/components/DatePicker";
import { useGetHub } from "@/hooks/hub";
import { CreateRosterForm } from "@/types/roster";
import { useCreateRoster } from "@/hooks/roster";

const rotationChoiceLabels: Record<ROTATION_CHOICE, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  ANNUALLY: "Annually",
  CUSTOM: "Custom",
};

const rotationTypeLabels: Record<ROTATION_TYPE, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  ANNUALLY: "Annually",
};

export default function CreateRosterPage() {
  const router = useRouter();
  const { id: hubUuid } = useParams<{ id: string }>();

  const {
    data: hubData,
    isLoading: isLoadingHub,
    error: hubError,
  } = useGetHub(hubUuid);

  const form = useForm<CreateRosterForm>({
    resolver: zodResolver(createRosterSchema),
    defaultValues: {
      hubId: undefined,
      name: "",
      description: "",
      rotationType: ROTATION_CHOICE.DAILY,
      start: new Date(),
      end: addDays(new Date(), 30),
      enablePushNotifications: false,
      enableEmailNotifications: false,
      isPrivate: false,
      includeAllHubMembers: false,
      members: undefined,
      rotationOption: {
        rotation: ROTATION_TYPE.DAILY,
        unit: 1,
      },
    },
  });

  const {
    watch,
    formState: { isValid },
    setValue,
    handleSubmit,
    control,
  } = form;

  useEffect(() => {
    if (hubData?.hub?.id) {
      setValue("hubId", hubData.hub.id);
    }
  }, [hubData?.hub?.id, setValue]);

  const { mutate: createRoster, isPending: isCreatingRoster } = useCreateRoster(
    (id) => {
      router.push(`/hub/${hubUuid}/rosters/${id}`);
    }
  );

  async function onSubmit(values: CreateRosterForm) {
    const formValues: CreateRosterForm = {
      ...values,
      rotationOption:
        values.rotationType === ROTATION_CHOICE.CUSTOM
          ? values.rotationOption
          : undefined,
    };
    console.log("formValues", formValues);
    createRoster(formValues);
  }

  const rotationType = watch("rotationType");
  const includeAllHubMembers = watch("includeAllHubMembers");
  const isCustomRotation = rotationType === ROTATION_CHOICE.CUSTOM;
  const start = watch("start");
  const members = watch("members");

  const hasMembers = includeAllHubMembers || (members && members.length > 0);
  const hasCompleteCustomRotation = isCustomRotation
    ? watch("rotationOption.rotation") && watch("rotationOption.unit")
    : true;

  // const hasRequiredFields =
  //   watch("name") &&
  //   watch("rotationType") &&
  //   watch("start") &&
  //   watch("end") &&
  //   watch("isPrivate") !== undefined;

  // couldnt use isValid because of issue with number input and setting value as
  const isFormValid = isValid && hasMembers && hasCompleteCustomRotation;

  if (isLoadingHub) {
    return <Loading />;
  }

  if (!hubData?.hub || hubError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Hub not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Create Roster
          </h1>
          <p className="text-sm text-muted-foreground">
            Venue, times, location, line ups... we will keep you in the loop
            when things are updated
          </p>
        </div>

        <Card className="border border-border/60 bg-background/80 backdrop-blur shadow-sm">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Venue, times, location, line ups... we will keep you in the loop
              when things are updated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                            <Label
                              htmlFor="v-private"
                              className="cursor-pointer"
                            >
                              Private
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-lg border p-3">
                            <RadioGroupItem value="PUBLIC" id="v-public" />
                            <Label
                              htmlFor="v-public"
                              className="cursor-pointer"
                            >
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
                      Venue, times, location, line ups... we will keep you in
                      the loop when things are updated
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
                        // todo: confirm if necessary
                        disabled: (date) => date < subDays(new Date(), 1),
                      }}
                    />

                    <DatePicker
                      control={control}
                      name="end"
                      label="End date"
                      calendarProps={{
                        disabled: (date) => date < start,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">
                      Notification Settings
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Venue, times, location, Line ups. We&apos;ll keep you in
                      the loop when things are updated
                    </p>
                  </div>

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
                  <div className="flex gap-4 items-center">
                    <FormField
                      control={control}
                      name="includeAllHubMembers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Add all Hub Members</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {!includeAllHubMembers && (
                      // todo: add hub member select modal (searchable, draggable list to set position of members in roster)
                      <Button type="button" variant="outline">
                        Select hub members
                      </Button>
                    )}
                  </div>
                </div>

                <CardFooter className="px-0">
                  <div className="flex w-full items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.push(`/hub/${hubUuid}`)}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!isFormValid}
                      type="submit"
                      loading={isCreatingRoster}
                    >
                      Create
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
