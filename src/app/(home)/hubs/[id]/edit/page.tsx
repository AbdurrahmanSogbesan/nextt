import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DeleteHubButton from "./_delete-hub-button";
import { PrismaHub } from "@/types/hub";
import EditHubForm, { EditHubValues } from "./EditHubForm";
import BackButton from "@/components/BackButton";

async function getData(hubId: string) {
  const me = await currentUser();
  const userId = me?.id || null;

  if (!userId) {
    return { me: null, hub: null, role: null };
  }

  const hub: Partial<PrismaHub> | null = await prisma.hub.findUnique({
    where: { id: Number(hubId) },
    include: { members: { where: { hubUserid: userId } } },
  });

  if (!hub) return { me, hub: null, role: null };
  const role = hub.members![0]?.isAdmin ? "ADMIN" : "MEMBER";
  return { me, hub, role };
}

export default async function EditHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { me, hub, role } = await getData(id);

  if (!me) redirect("/onboarding");
  if (!hub) notFound();
  if (role !== "ADMIN") notFound();

  const initialValues: EditHubValues = {
    name: hub.name!,
    description: hub.description ?? "",
    logo: hub.logo ?? null,
    theme: (hub.theme as EditHubValues["theme"]) || "indigo",
    visibility: hub.visibility as EditHubValues["visibility"],
  };

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <BackButton fallbackHref={`/hubs/${hub.id}`} />
          <div className="text-right">
            <h1 className="text-3xl font-semibold tracking-tight">Edit hub</h1>
            <p className="text-sm text-muted-foreground">
              Update details for {hub.name}
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border border-border/60 bg-background/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Hub details</CardTitle>
              <CardDescription>
                Edit name, description, logo, theme, and visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditHubForm
                hubId={String(hub.id)}
                initialValues={initialValues}
              />
            </CardContent>
          </Card>

          <Card className="border border-rose-200/40 bg-background/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-rose-600">Danger zone</CardTitle>
              <CardDescription>Delete this hub permanently</CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteHubButton hubId={String(hub.id)} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
