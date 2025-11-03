export type MemberUserDetails = {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  email: string;
};

export type UpdateInviteParams = {
  inviteId: number;
  response: "ACCEPT" | "REJECT";
};

export type UpdateInviteResponse = {
  message: "ACCEPTED" | "REJECTED";
  hubId?: number;
  rosterId?: number;
};
