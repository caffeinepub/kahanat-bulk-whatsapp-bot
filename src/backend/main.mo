import Time "mo:core/Time";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import List "mo:core/List";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = { name : Text };
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  type CampaignStatus = { #pending; #running; #complete };

  type Contact = {
    id : Nat;
    name : Text;
    phone : Text;
    createdAt : Time.Time;
  };

  type Campaign = {
    id : Nat;
    name : Text;
    message : Text;
    totalContacts : Nat;
    sentCount : Nat;
    status : CampaignStatus;
    createdAt : Time.Time;
    completedAt : ?Time.Time;
  };

  type SendRecord = {
    contactId : Nat;
    campaignId : Nat;
    timestamp : Time.Time;
  };

  var nextContactId = 1;
  var nextCampaignId = 1;
  let contacts = Map.empty<Nat, Contact>();
  let campaigns = Map.empty<Nat, Campaign>();
  let sendRecords = Map.empty<Nat, List.List<SendRecord>>();
  var todaySendCount = 0;
  var lastResetDay = 0;

  module Contact {
    public func compare(a : Contact, b : Contact) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module Campaign {
    public func compare(a : Campaign, b : Campaign) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  public shared (_msg) func addContact(name : Text, phone : Text) : async Nat {
    let contact : Contact = {
      id = nextContactId;
      name;
      phone;
      createdAt = Time.now();
    };
    contacts.add(nextContactId, contact);
    nextContactId += 1;
    contact.id;
  };

  public shared (_msg) func bulkImportContacts(entries : [(Text, Text)]) : async () {
    for ((name, phone) in entries.values()) {
      let contact : Contact = {
        id = nextContactId;
        name;
        phone;
        createdAt = Time.now();
      };
      contacts.add(nextContactId, contact);
      nextContactId += 1;
    };
  };

  public shared (_msg) func deleteContact(contactId : Nat) : async () {
    contacts.remove(contactId);
  };

  public query (_msg) func getAllContacts() : async [Contact] {
    contacts.values().toArray().sort();
  };

  public query (_msg) func getContactCount() : async Nat {
    contacts.size();
  };

  public shared (_msg) func createCampaign(name : Text, message : Text) : async Nat {
    let campaign : Campaign = {
      id = nextCampaignId;
      name;
      message;
      totalContacts = contacts.size();
      sentCount = 0;
      status = #pending;
      createdAt = Time.now();
      completedAt = null;
    };
    campaigns.add(nextCampaignId, campaign);
    nextCampaignId += 1;
    campaign.id;
  };

  public query (_msg) func getAllCampaigns() : async [Campaign] {
    campaigns.values().toArray().sort();
  };

  public shared (_msg) func updateCampaignProgress(campaignId : Nat, newSentCount : Nat) : async () {
    switch (campaigns.get(campaignId)) {
      case (null) { Runtime.trap("Campaign does not exist") };
      case (?campaign) {
        let updatedCampaign = {
          campaign with
          sentCount = newSentCount;
          status = if (newSentCount >= campaign.totalContacts) { #complete } else { #running };
        };
        campaigns.add(campaignId, updatedCampaign);
      };
    };
  };

  public shared (_msg) func markCampaignComplete(campaignId : Nat) : async () {
    switch (campaigns.get(campaignId)) {
      case (null) { Runtime.trap("Campaign does not exist") };
      case (?campaign) {
        let updatedCampaign = {
          campaign with
          status = #complete;
          completedAt = ?Time.now();
        };
        campaigns.add(campaignId, updatedCampaign);
      };
    };
  };

  public query (_msg) func getCampaignById(campaignId : Nat) : async Campaign {
    switch (campaigns.get(campaignId)) {
      case (null) { Runtime.trap("Campaign does not exist") };
      case (?campaign) { campaign };
    };
  };

  public shared (_msg) func recordSend(contactId : Nat, campaignId : Nat) : async () {
    let now = Time.now();
    let currentDay = (now / (24 * 3600 * 1000000000)).toNat();
    if (currentDay != lastResetDay) {
      todaySendCount := 0;
      sendRecords.clear();
      lastResetDay := currentDay;
    };
    let record : SendRecord = { contactId; campaignId; timestamp = Time.now() };
    todaySendCount += 1;
    let campaignSendRecords = switch (sendRecords.get(campaignId)) {
      case (null) { List.empty<SendRecord>() };
      case (?existing) { existing };
    };
    campaignSendRecords.add(record);
    sendRecords.add(campaignId, campaignSendRecords);
    switch (campaigns.get(campaignId)) {
      case (null) { Runtime.trap("Campaign does not exist") };
      case (?campaign) {
        campaigns.add(campaignId, { campaign with sentCount = campaign.sentCount + 1 });
      };
    };
  };

  public query (_msg) func getTodaySendCount() : async Nat {
    let now = Time.now();
    let currentDay = (now / (24 * 3600 * 1000000000)).toNat();
    if (currentDay != lastResetDay) { return 0 };
    todaySendCount;
  };

  public query (_msg) func getCampaignSends(campaignId : Nat) : async [Nat] {
    switch (sendRecords.get(campaignId)) {
      case (null) { [] };
      case (?sendList) { sendList.toArray().map(func(r) { r.contactId }) };
    };
  };

  public query (_msg) func getSendsByContact(contactId : Nat) : async [Nat] {
    sendRecords.entries().flatMap(
      func((campaignId, sendList)) {
        sendList.values().filter(func(r) { r.contactId == contactId }).map(
          func(_r) { campaignId }
        );
      }
    ).toArray();
  };
};
