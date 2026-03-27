import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Campaign, Contact } from "../backend";
import { useActor } from "./useActor";

export function useContacts() {
  const { actor, isFetching } = useActor();
  return useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllContacts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useContactCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["contactCount"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getContactCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCampaigns() {
  const { actor, isFetching } = useActor();
  return useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCampaigns();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTodaySendCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["todaySendCount"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getTodaySendCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddContact() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, phone }: { name: string; phone: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.addContact(name, phone);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contactCount"] });
    },
  });
}

export function useBulkImportContacts() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entries: Array<[string, string]>) => {
      if (!actor) throw new Error("No actor");
      return actor.bulkImportContacts(entries);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contactCount"] });
    },
  });
}

export function useDeleteContact() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteContact(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contactCount"] });
    },
  });
}

export function useCreateCampaign() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      message,
    }: { name: string; message: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.createCampaign(name, message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useUpdateCampaignProgress() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      campaignId,
      sentCount,
    }: { campaignId: bigint; sentCount: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateCampaignProgress(campaignId, sentCount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useMarkCampaignComplete() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.markCampaignComplete(campaignId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useRecordSend() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contactId,
      campaignId,
    }: { contactId: bigint; campaignId: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.recordSend(contactId, campaignId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todaySendCount"] });
    },
  });
}
