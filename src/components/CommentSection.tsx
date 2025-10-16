"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RosterComment } from "@/types/roster";
import { useState } from "react";
import ActivityCard from "./ActivityCard";
import { Activity } from "lucide-react";

interface CommentSectionProps {
  comments: RosterComment[];
  onAddComment: (comment: string) => void;
}

export default function CommentSection({
  comments,
  onAddComment,
}: CommentSectionProps) {
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!comment.trim()) return;
    onAddComment(comment);
    setComment("");
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">Comments</h2>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px]"
          />
          <Button onClick={handleSubmit} className="self-end">
            Send
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
                />
              ))
          ) : (
            <div className="w-full flex flex-col items-center gap-6 py-8">
              <Activity
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
        </div>
      </div>
    </section>
  );
}
