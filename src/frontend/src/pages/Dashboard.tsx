import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, Send, TrendingUp, Users, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CampaignStatus } from "../backend";
import type { Page } from "../components/Layout";
import {
  useCampaigns,
  useContacts,
  useCreateCampaign,
  useTodaySendCount,
} from "../hooks/useQueries";

interface DashboardProps {
  onNavigate: (page: Page) => void;
  onLaunchMission: (campaignId: bigint) => void;
}

export function Dashboard({ onNavigate, onLaunchMission }: DashboardProps) {
  const { data: contacts = [] } = useContacts();
  const { data: campaigns = [] } = useCampaigns();
  const { data: todayCount = 0n } = useTodaySendCount();
  const createCampaign = useCreateCampaign();

  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");

  const completeCampaigns = campaigns.filter(
    (c) => c.status === CampaignStatus.complete,
  );
  const activeCampaigns = campaigns.filter(
    (c) => c.status !== CampaignStatus.complete,
  );

  const handleQuickCreate = async () => {
    if (!campaignName.trim() || !message.trim()) {
      toast.error("Please fill in campaign name and message");
      return;
    }
    try {
      const id = await createCampaign.mutateAsync({
        name: campaignName,
        message,
      });
      toast.success("Campaign created!");
      setCampaignName("");
      setMessage("");
      onLaunchMission(id);
    } catch {
      toast.error("Failed to create campaign");
    }
  };

  const kpis = [
    {
      label: "Total Contacts",
      value: contacts.length.toLocaleString(),
      icon: Users,
      color: "text-node-teal",
    },
    {
      label: "Campaigns Created",
      value: campaigns.length.toLocaleString(),
      icon: Zap,
      color: "text-primary",
    },
    {
      label: "Messages Today",
      value: todayCount.toString(),
      icon: Send,
      color: "text-blue-400",
    },
    {
      label: "Missions Complete",
      value: completeCampaigns.length.toLocaleString(),
      icon: CheckCircle,
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <div data-ocid="dashboard.section">
        <h1 className="text-3xl font-bold text-foreground">
          <span className="text-primary glow-green">KAHANAT</span>{" "}
          <span className="text-node-teal">BULK WHATSAPP</span>
          {" MESSAGE BOT"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Created by Malverin · Professional Bulk Messaging Platform
        </p>
      </div>

      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        data-ocid="dashboard.kpi.section"
      >
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.label}
              className="bg-card border-border card-glow"
              data-ocid={`dashboard.kpi.card.${i + 1}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {kpi.label}
                    </p>
                    <p className={`text-2xl font-bold ${kpi.color}`}>
                      {kpi.value}
                    </p>
                  </div>
                  <Icon className={`w-5 h-5 ${kpi.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card
          className="bg-card border-border card-glow"
          data-ocid="dashboard.campaigns.card"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Campaign Overview
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-primary"
                onClick={() => onNavigate("campaigns")}
                data-ocid="dashboard.campaigns.link"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activeCampaigns.length === 0 ? (
              <div
                className="px-4 pb-4 text-sm text-muted-foreground"
                data-ocid="dashboard.campaigns.empty_state"
              >
                No active campaigns. Create one below.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activeCampaigns.slice(0, 5).map((c, i) => {
                  const pct =
                    c.totalContacts > 0n
                      ? Number((c.sentCount * 100n) / c.totalContacts)
                      : 0;
                  return (
                    <div
                      key={String(c.id)}
                      className="px-4 py-3"
                      data-ocid={`dashboard.campaign.item.${i + 1}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium truncate max-w-[160px]">
                          {c.name}
                        </span>
                        <Badge
                          className="text-[10px] ml-2"
                          variant={
                            c.status === CampaignStatus.running
                              ? "default"
                              : "secondary"
                          }
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {String(c.sentCount)} / {String(c.totalContacts)} sent
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className="bg-card border-border card-glow"
          data-ocid="dashboard.activity.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Real-Time Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {campaigns.length === 0 ? (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="dashboard.activity.empty_state"
              >
                No activity yet.
              </p>
            ) : (
              campaigns
                .slice(-6)
                .reverse()
                .map((c, i) => (
                  <div
                    key={String(c.id)}
                    className="flex items-center gap-3 py-1.5"
                    data-ocid={`dashboard.activity.item.${i + 1}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {String(c.sentCount)} messages sent
                      </p>
                    </div>
                    <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card
        className="bg-card border-border card-glow"
        data-ocid="dashboard.compose.card"
      >
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Quick Create Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Campaign Name</Label>
              <Input
                data-ocid="dashboard.campaign.input"
                placeholder="e.g. Promo June 2026"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="bg-secondary border-border text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Textarea
              data-ocid="dashboard.message.textarea"
              placeholder="Type your WhatsApp message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="bg-secondary border-border text-sm resize-none"
            />
          </div>
          <Button
            data-ocid="dashboard.launch.primary_button"
            onClick={handleQuickCreate}
            disabled={createCampaign.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Zap className="w-4 h-4 mr-2" />
            {createCampaign.isPending ? "Creating..." : "Launch Mission"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
