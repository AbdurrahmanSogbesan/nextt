"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RosterComment } from "@/types/roster";
import { Dispatch, SetStateAction, useState } from "react";
import ActivityCard from "./ActivityCard";
import { MessageSquare, MessageSquarePlus } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

export default function CommentSection({
  comments,
  addCommentMutation,
}: {
  comments: RosterComment[];

  addCommentMutation: UseMutationResult<void, Error, { content: string }>;
}) {
  const [comment, setComment] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = () => {
    if (!comment.trim() || addCommentMutation.isPending) return;
    addCommentMutation.mutate(
      { content: comment },
      {
        onSuccess() {
          handleModalClose();
        },
      }
    );
  };

  const handleModalClose = () => {
    if (addCommentMutation.isPending) return;
    setIsModalOpen(false);
    setComment("");
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Comments</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-2"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Add Comment
        </Button>
      </div>

      <div className="space-y-3">
        {comments.length > 0 ? (
          comments
            .slice(0, 5)
            .map((comment) => (
              <ActivityCard
                key={comment.id}
                body={comment.content}
                actor={comment.user}
                createdAt={comment.createdAt}
                title={`${comment.user.firstName} ${comment.user.lastName}`}
                variant="secondary"
              />
            ))
        ) : (
          <div className="w-full flex flex-col items-center gap-6 py-8">
            <MessageSquare
              className="h-24 w-24 text-muted-foreground/80"
              strokeWidth={1}
            />
            <span className="font-medium text-muted-foreground text-center">
              No comments yet.
              <br />
              Be the first to start the conversation.
            </span>
          </div>
        )}

        {/* {comments.length > 5 && (
          <Button variant="link" className="text-sm text-muted-foreground">
            View all comments
          </Button>
        )} */}
      </div>

      <AddCommentModal
        isModalOpen={isModalOpen}
        handleModalClose={handleModalClose}
        isAddingComment={addCommentMutation.isPending}
        comment={comment}
        setComment={setComment}
        handleSubmit={handleSubmit}
      />
    </section>
  );
}

function AddCommentModal({
  isModalOpen,
  handleModalClose,
  isAddingComment,
  comment,
  setComment,
  handleSubmit,
}: {
  isModalOpen: boolean;
  handleModalClose: VoidFunction;
  isAddingComment: boolean;
  comment: string;
  setComment: Dispatch<SetStateAction<string>>;
  handleSubmit: VoidFunction;
}) {
  return (
    <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        showCloseButton={!isAddingComment}
      >
        <DialogHeader>
          <DialogTitle>Share Your Thoughts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={isAddingComment}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleModalClose}
            disabled={isAddingComment}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!comment.trim()}
            loading={isAddingComment}
          >
            Add Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
