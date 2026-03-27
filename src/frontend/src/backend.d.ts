import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Contact {
    id: bigint;
    name: string;
    createdAt: Time;
    phone: string;
}
export interface Campaign {
    id: bigint;
    status: CampaignStatus;
    completedAt?: Time;
    name: string;
    createdAt: Time;
    totalContacts: bigint;
    sentCount: bigint;
    message: string;
}
export interface UserProfile {
    name: string;
}
export enum CampaignStatus {
    pending = "pending",
    complete = "complete",
    running = "running"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addContact(name: string, phone: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkImportContacts(entries: Array<[string, string]>): Promise<void>;
    createCampaign(name: string, message: string): Promise<bigint>;
    deleteContact(contactId: bigint): Promise<void>;
    getAllCampaigns(): Promise<Array<Campaign>>;
    getAllContacts(): Promise<Array<Contact>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCampaignById(campaignId: bigint): Promise<Campaign>;
    getCampaignSends(campaignId: bigint): Promise<Array<bigint>>;
    getContactCount(): Promise<bigint>;
    getSendsByContact(contactId: bigint): Promise<Array<bigint>>;
    getTodaySendCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markCampaignComplete(campaignId: bigint): Promise<void>;
    recordSend(contactId: bigint, campaignId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCampaignProgress(campaignId: bigint, newSentCount: bigint): Promise<void>;
}
