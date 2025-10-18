"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical, Search, X, Check } from "lucide-react";
import Initials from "@/components/Initials";
import { GetHubResponse } from "@/types/hub";

type HubMember = GetHubResponse["hub"]["members"][number];

type SelectedMember = {
  userId: string;
  position: number;
};

function SortableMemberItem({
  member,
  position,
  onRemove,
}: {
  member: HubMember;
  position: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.hubUserid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fullName = `${member.user.firstName} ${member.user.lastName}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-background border rounded-lg hover:bg-accent/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="size-5 text-muted-foreground" />
      </button>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <span className="font-medium">{position}</span>
        </div>

        <Avatar className="size-10 shrink-0">
          <AvatarImage src={member.user.avatarUrl || ""} />
          <AvatarFallback>
            <Initials name={fullName} />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fullName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {member.user.email}
          </p>
        </div>
      </div>

      <button
        onClick={onRemove}
        className="shrink-0 p-1 hover:bg-accent rounded transition-colors"
      >
        <X className="size-4 text-muted-foreground" />
      </button>
    </div>
  );
}

function AvailableMemberItem({
  member,
  onSelect,
  isSelected,
}: {
  member: HubMember;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const fullName = `${member.user.firstName} ${member.user.lastName}`;

  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-3 p-3 bg-background border rounded-lg hover:bg-accent/50 transition-colors text-left w-full ${
        isSelected ? "border-primary bg-primary/5" : ""
      }`}
    >
      <Avatar className="size-10 shrink-0">
        <AvatarImage src={member.user.avatarUrl || ""} />
        <AvatarFallback>
          <Initials name={fullName} />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fullName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {member.user.email}
        </p>
      </div>

      {isSelected && (
        <div className="shrink-0 size-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="size-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

export default function SelectMembersModal({
  open,
  onOpenChange,
  members,
  onSave,
  initialSelected = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: HubMember[];
  onSave: (selectedMembers: SelectedMember[]) => void;
  initialSelected?: SelectedMember[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() =>
    initialSelected.sort((a, b) => a.position - b.position).map((s) => s.userId)
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedMembers = useMemo(() => {
    return selectedMemberIds
      .map((userId) => members.find((m) => m.hubUserid === userId))
      .filter((m): m is HubMember => m !== undefined);
  }, [selectedMemberIds, members]);

  const availableMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      return members;
    }

    const query = searchQuery.toLowerCase();
    return members.filter((member) => {
      const fullName =
        `${member.user.firstName} ${member.user.lastName}`.toLowerCase();
      const email = member.user.email.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [members, searchQuery]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedMemberIds((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleToggleMember(userId: string) {
    setSelectedMemberIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  }

  function handleRemoveMember(userId: string) {
    setSelectedMemberIds((prev) => prev.filter((id) => id !== userId));
  }

  function handleSave() {
    const selectedWithPositions: SelectedMember[] = selectedMemberIds.map(
      (userId, index) => ({
        userId,
        position: index + 1,
      })
    );
    onSave(selectedWithPositions);
    onOpenChange(false);
  }

  function handleCancel() {
    // Reset to initial state
    setSearchQuery("");
    setSelectedMemberIds(
      initialSelected
        .sort((a, b) => a.position - b.position)
        .map((s) => s.userId)
    );
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-4xl min-h-[85vh] flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Select Members</DialogTitle>
          <DialogDescription>
            Choose hub members and arrange them in your preferred order. The
            order determines rotation sequence.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid md:grid-cols-2 gap-6 min-h-0 overflow-hidden">
          {/* Available Members Section */}
          <div className="flex flex-col gap-3 min-h-0 px-2 border-r-0 md:border-r border-border">
            <div>
              <h3 className="text-sm font-medium mb-2">Available Members</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {availableMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No members found
                  </p>
                ) : (
                  availableMembers.map((member) => (
                    <AvailableMemberItem
                      key={member.hubUserid}
                      member={member}
                      isSelected={selectedMemberIds.includes(member.hubUserid)}
                      onSelect={() => handleToggleMember(member.hubUserid)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Selected Members Section */}
          <div className="flex flex-col gap-3 min-h-0 px-2">
            <div>
              <h3 className="text-sm font-medium">
                Selected Members ({selectedMembers.length})
              </h3>
              <p className="text-xs text-muted-foreground">Drag to reorder</p>
            </div>

            <ScrollArea className="flex-1">
              {selectedMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No members selected
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedMemberIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedMembers.map((member, index) => (
                        <SortableMemberItem
                          key={member.hubUserid}
                          member={member}
                          position={index + 1}
                          onRemove={() => handleRemoveMember(member.hubUserid)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={selectedMembers.length === 0}>
            Save ({selectedMembers.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
