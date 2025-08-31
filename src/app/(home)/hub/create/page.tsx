"use client";

import { z } from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ThemeSwatches from "@/components/ThemeSwatches";
import Dropzone from "@/components/Dropzone";
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
import Image from "next/image";
import { createHubSchema } from "@/lib/schemas";

type Values = z.infer<typeof createHubSchema>;

const themeToBg: Record<string, string> = {
  indigo: "bg-indigo-500",
  sky: "bg-sky-400",
  rose: "bg-rose-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  zinc: "bg-zinc-600",
};

export default function NewHubPage() {
  const router = useRouter();

  const form = useForm<Values>({
    resolver: zodResolver(createHubSchema),
    defaultValues: {
      name: "",
      logoUrl: null,
      theme: "indigo",
      visibility: "PRIVATE",
      description: "",
    },
  });

  async function onSubmit(values: Values) {
    const res = await fetch("/api/hubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const t = await res.text();
      alert("Failed to create hub: " + t);
      return;
    }
    const { id } = await res.json();
    router.push(`/hub/${id}`);
  }

  const themeValue = form.watch("theme");
  const logoUrl = form.watch("logoUrl");

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Create a hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload a logo, set your name, pick a theme, and choose visibility
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          {/* Left column: form */}
          <Card className="md:col-span-3 border border-border/60 bg-background/80 backdrop-blur shadow-sm">
            <CardHeader>
              <CardTitle>Hub details</CardTitle>
              <CardDescription>
                Make it feel like home for your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={() => (
                      <FormItem>
                        <FormLabel>Logo</FormLabel>
                        <FormControl>
                          <Dropzone
                            value={logoUrl ?? null}
                            onChange={(url: string | null) =>
                              form.setValue("logoUrl", url)
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
                          <Input placeholder="My Team Hub" {...field} />
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
                            placeholder="What is this hub for?"
                            className="min-h-[96px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                              <Label
                                htmlFor="v-public"
                                className="cursor-pointer"
                              >
                                Public
                              </Label>
                            </div>
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
                              <RadioGroupItem
                                value="UNLISTED"
                                id="v-unlisted"
                              />
                              <Label
                                htmlFor="v-unlisted"
                                className="cursor-pointer"
                              >
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
                              form.setValue("theme", v, { shouldDirty: true })
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <CardFooter className="px-0">
                    <div className="flex w-full items-center justify-end gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.push("/dashboard")}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Create hub</Button>
                    </div>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Right column: live preview */}
          <Card className="md:col-span-2 border border-border/60 bg-gradient-to-br from-muted/40 to-background/80 backdrop-blur shadow-sm">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>How it will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border p-5">
                <div className="mb-4 flex items-center gap-3">
                  {logoUrl ? (
                    <div className="relative h-9 w-9 overflow-hidden rounded-xl ring-1 ring-border">
                      <Image
                        src={logoUrl}
                        alt="Logo"
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`h-9 w-9 rounded-xl ${
                        themeToBg[themeValue ?? "indigo"]
                      }`}
                    />
                  )}
                  <div className="flex flex-col">
                    <div className="text-base font-medium">
                      {form.watch("name") || "Your hub name"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {form.watch("visibility") || "PRIVATE"}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {form.watch("description") ||
                    "Short description will appear here. Keep it clear and friendly."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
