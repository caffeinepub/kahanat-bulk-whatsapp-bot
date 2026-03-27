import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MessageSquare, Play, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CampaignStatus } from "../backend";
import type { Page } from "../components/Layout";
import {
  useCampaigns,
  useContacts,
  useCreateCampaign,
} from "../hooks/useQueries";

interface CampaignsProps {
  onNavigate: (page: Page) => void;
  onLaunchMission: (campaignId: bigint) => void;
}

export function Campaigns({ onNavigate, onLaunchMission }: CampaignsProps) {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { data: contacts = [] } = useContacts();
  const createCampaign = useCreateCampaign();

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }
    if (contacts.length === 0) {
      toast.error("Add contacts before creating a campaign");
      return;
    }
    try {
      const id = await createCampaign.mutateAsync({
        name: name.trim(),
        message: message.trim(),
      });
      toast.success("Campaign created! Launching mission...");
      setName("");
      setMessage("");
      onLaunchMission(id);
    } catch {
      toast.error("Failed to create campaign");
    }
  };

  const statusColor = (s: CampaignStatus) => {
    if (s === CampaignStatus.complete)
      return "bg-primary/10 text-primary border-primary/30";
    if (s === CampaignStatus.running)
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Campaigns</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage WhatsApp message campaigns
        </p>
      </div>

      <Card
        className="bg-card border-border card-glow"
        data-ocid="campaigns.create.card"
      >
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Create New Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Campaign Name</Label>
            <Input
              data-ocid="campaigns.name.input"
              placeholder="e.g. Weekend Promotion"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary border-border text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              Message to send to ALL {contacts.length} contacts
            </Label>
            <Textarea
              data-ocid="campaigns.message.textarea"
              placeholder="Type your WhatsApp message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="bg-secondary border-border text-sm resize-none"
            />
            <p className="text-[11px] text-muted-foreground">
              {message.length} characters
            </p>
          </div>
          {contacts.length === 0 && (
            <div
              className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md"
              data-ocid="campaigns.no_contacts.error_state"
            >
              <p className="text-xs text-destructive">
                No contacts found.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => onNavigate("contacts")}
                >
                  Add contacts first →
                </button>
              </p>
            </div>
          )}
          <Button
            data-ocid="campaigns.launch.primary_button"
            onClick={handleCreate}
            disabled={createCampaign.isPending || contacts.length === 0}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Zap className="w-4 h-4 mr-2" />
            {createCampaign.isPending ? "Creating..." : "Launch Mission"}
          </Button>
        </CardContent>
      </Card>

      <Card
        className="bg-card border-border card-glow"
        data-ocid="campaigns.list.card"
      >
        <CardHeader>
          <CardTitle className="text-sm font-semibold">All Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="p-4 text-sm text-muted-foreground"
              data-ocid="campaigns.list.loading_state"
            >
              Loading...
            </div>
          ) : campaigns.length === 0 ? (
            <div
              className="p-8 text-center"
              data-ocid="campaigns.list.empty_state"
            >
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No campaigns yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Progress</TableHead>
                    <TableHead className="text-xs">Sent</TableHead>
                    <TableHead className="text-xs">Created</TableHead>
                    <TableHead className="text-xs" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c, i) => {
                    const pct =
                      c.totalContacts > 0n
                        ? Number((c.sentCount * 100n) / c.totalContacts)
                        : 0;
                    return (
                      <TableRow
                        key={String(c.id)}
                        className="border-border"
                        data-ocid={`campaigns.list.item.${i + 1}`}
                      >
                        <TableCell className="font-medium text-sm">
                          {c.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] ${statusColor(c.status)}`}
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-32">
                          <Progress value={pct} className="h-1.5" />
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {pct}%
                          </p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {String(c.sentCount)} / {String(c.totalContacts)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(
                              Number(c.createdAt) / 1_000_000,
                            ).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {c.status !== CampaignStatus.complete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-primary h-7"
                              onClick={() => onLaunchMission(c.id)}
                              data-ocid={`campaigns.run.button.${i + 1}`}
                            >
                              <Play className="w-3 h-3 mr-1" /> Run
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
