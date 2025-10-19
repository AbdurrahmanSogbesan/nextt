"use client";

import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateInvite } from "@/hooks/hub";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.email(),
});

type InviteForm = z.infer<typeof inviteSchema>;

export default function InviteModal({
  show,
  onClose,
  title,
  isRosterInvite = false,
}: {
  show: boolean;
  onClose: VoidFunction;
  title: string;
  isRosterInvite?: boolean;
}) {
  const { id: hubId, rosterId } = useParams<{ id: string; rosterId: string }>();

  const { mutateAsync: createInvite, isPending: isSubmitting } =
    useCreateInvite(() => {
      handleClose();
    });

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
    },
  });

  const {
    formState: { isValid },
    register,
    handleSubmit,
  } = form;

  const onSubmit = async (data: InviteForm) => {
    await createInvite({
      email: data.email.trim(),
      hubId,
      ...(isRosterInvite && rosterId && { rosterId }),
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[584px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:gap-2 gap-4">
            <Input
              type="email"
              placeholder="Enter Email here"
              {...register("email")}
              className="flex-1 py-4 px-3 text-base h-13"
            />
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="sm:w-[156px] w-full h-13 text-base gap-4"
            >
              <Plus className="size-6" />
              Invite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
