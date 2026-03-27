import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Pause,
  Play,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CampaignStatus } from "../backend";
import {
  useCampaigns,
  useContacts,
  useMarkCampaignComplete,
  useRecordSend,
  useTodaySendCount,
  useUpdateCampaignProgress,
} from "../hooks/useQueries";

const DAILY_LIMIT = 245;
const SEND_INTERVAL_MS = 60_000;

interface MissionRunnerProps {
  activeCampaignId: bigint | null;
  onSelectCampaign: (id: bigint) => void;
}

export function MissionRunner({
  activeCampaignId,
  onSelectCampaign,
}: MissionRunnerProps) {
  const { data: campaigns = [] } = useCampaigns();
  const { data: contacts = [] } = useContacts();
  const { data: todayCount = 0n } = useTodaySendCount();
  const updateProgress = useUpdateCampaignProgress();
  const markComplete = useMarkCampaignComplete();
  const recordSend = useRecordSend();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(SEND_INTERVAL_MS / 1000);
  const [isComplete, setIsComplete] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const campaign = campaigns.find((c) => c.id === activeCampaignId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const unsentContacts = useMemo(
    () => contacts.filter((c) => !sentSet.has(String(c.id))),
    [contacts, sentSet],
  );
  const unsentLen = unsentContacts.length;
  const sentSize = sentSet.size;

  const sendNext = useCallback(
    async (idx: number, unsent: typeof unsentContacts) => {
      if (!campaign) return;
      const contact = unsent[idx];
      if (!contact) return;

      const todaySent = Number(todayCount) + sentSize;
      if (todaySent >= DAILY_LIMIT) {
        toast.warning(
          `Daily limit of ${DAILY_LIMIT} reached! Pausing mission.`,
        );
        setIsPaused(true);
        return;
      }

      setIsSending(true);
      const phone = contact.phone.replace(/\D/g, "");
      const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(campaign.message)}`;
      window.open(url, "_blank");

      try {
        await Promise.all([
          recordSend.mutateAsync({
            contactId: contact.id,
            campaignId: campaign.id,
          }),
          updateProgress.mutateAsync({
            campaignId: campaign.id,
            sentCount: BigInt(sentSize + 1),
          }),
        ]);
      } catch {
        // non-fatal
      }

      setSentSet((prev) => new Set([...prev, String(contact.id)]));
      setIsSending(false);
      const nextIdx = idx + 1;
      setCurrentIdx(nextIdx);

      if (nextIdx >= unsent.length) {
        try {
          await markComplete.mutateAsync(campaign.id);
        } catch {
          /* non-fatal */
        }
        setIsComplete(true);
        clearTimers();
      } else {
        setCountdown(SEND_INTERVAL_MS / 1000);
      }
    },
    [
      campaign,
      todayCount,
      sentSize,
      recordSend,
      updateProgress,
      markComplete,
      clearTimers,
    ],
  );

  useEffect(() => {
    if (!campaign || isPaused || isComplete || unsentLen === 0) return;
    if (currentIdx >= unsentLen) return;

    if (currentIdx === 0 && sentSize === 0) {
      sendNext(currentIdx, unsentContacts);
      return;
    }

    setCountdown(SEND_INTERVAL_MS / 1000);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerRef.current = setTimeout(() => {
      sendNext(currentIdx, unsentContacts);
    }, SEND_INTERVAL_MS);

    return () => clearTimers();
  }, [
    currentIdx,
    isPaused,
    isComplete,
    unsentLen,
    sentSize,
    campaign,
    sendNext,
    clearTimers,
    unsentContacts,
  ]);

  if (!campaign && campaigns.length > 0) {
    const pending = campaigns.filter(
      (c) => c.status !== CampaignStatus.complete,
    );
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Mission Runner</h1>
        <p className="text-sm text-muted-foreground">
          Select a campaign to run
        </p>
        <div className="grid gap-3" data-ocid="mission.campaign.list">
          {pending.length === 0 ? (
            <div
              className="p-8 text-center"
              data-ocid="mission.campaign.empty_state"
            >
              <p className="text-muted-foreground text-sm">
                No pending campaigns. Create one in Campaigns.
              </p>
            </div>
          ) : (
            pending.map((c, i) => (
              <Card
                key={String(c.id)}
                className="bg-card border-border card-glow cursor-pointer hover:border-primary/50 transition-colors"
                data-ocid={`mission.campaign.item.${i + 1}`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.message.slice(0, 60)}...
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground"
                    onClick={() => onSelectCampaign(c.id)}
                    data-ocid={`mission.run.button.${i + 1}`}
                  >
                    <Play className="w-3 h-3 mr-1" /> Run
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Mission Runner</h1>
        <div className="p-8 text-center" data-ocid="mission.empty_state">
          <p className="text-muted-foreground text-sm">
            No campaign selected. Go to Campaigns to create one.
          </p>
        </div>
      </div>
    );
  }

  if (isComplete || campaign.status === CampaignStatus.complete) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
        data-ocid="mission.complete.section"
      >
        <div className="animate-mission-complete mission-complete-glow bg-primary/10 border border-primary/30 rounded-2xl p-12 text-center max-w-md">
          <CheckCircle className="w-20 h-20 text-primary mx-auto mb-4 animate-float" />
          <h1 className="text-4xl font-bold text-primary glow-green mb-2">
            MISSION COMPLETE
          </h1>
          <p className="text-muted-foreground mb-4">
            Campaign:{" "}
            <span className="text-foreground font-medium">{campaign.name}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {String(campaign.sentCount)} messages sent to{" "}
            {String(campaign.totalContacts)} contacts
          </p>
          <Badge className="mt-4 bg-primary/20 text-primary border-primary/30 text-sm px-4 py-1">
            ✓ MISSION COMPLETE
          </Badge>
        </div>
      </div>
    );
  }

  const total = unsentLen;
  const sent = currentIdx;
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
  const currentContact = unsentContacts[currentIdx];
  const remaining = DAILY_LIMIT - Number(todayCount) - sentSize;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Mission Runner</h1>
          <p className="text-sm text-muted-foreground">{campaign.name}</p>
        </div>
        <Button
          data-ocid="mission.pause.toggle"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsPaused((p) => {
              const next = !p;
              if (next) {
                clearTimers();
                toast.info("Mission paused");
              } else {
                toast.info("Mission resumed");
              }
              return next;
            });
          }}
          className="border-border"
        >
          {isPaused ? (
            <Play className="w-3 h-3 mr-1" />
          ) : (
            <Pause className="w-3 h-3 mr-1" />
          )}
          {isPaused ? "Resume" : "Pause"}
        </Button>
      </div>

      {remaining < 50 && (
        <div
          className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md"
          data-ocid="mission.limit.error_state"
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <p className="text-xs text-yellow-400">
            Daily limit warning: {remaining} sends remaining today (max{" "}
            {DAILY_LIMIT}/day)
          </p>
        </div>
      )}

      <Card
        className="bg-card border-border card-glow"
        data-ocid="mission.progress.card"
      >
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Mission Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {sent} of {total} contacts messaged
              </span>
              <span className="text-primary font-bold">{pct}%</span>
            </div>
            <Progress value={pct} className="h-3" />
          </div>

          {currentContact && !isSending && (
            <div
              className="flex items-center gap-3 p-3 bg-secondary rounded-md"
              data-ocid="mission.current.card"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {currentContact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">
                  Next: {currentContact.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {currentContact.phone}
                </p>
              </div>
              {!isPaused && (
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold text-primary">
                    {countdown}s
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    until send
                  </p>
                </div>
              )}
            </div>
          )}

          {isSending && (
            <div
              className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-md"
              data-ocid="mission.sending.loading_state"
            >
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <div>
                <p className="text-sm text-primary font-medium">
                  Opening WhatsApp for {currentContact?.name}...
                </p>
                <p className="text-xs text-muted-foreground">
                  A new tab will open with the WhatsApp Web link
                </p>
              </div>
            </div>
          )}

          {isPaused && (
            <div
              className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md"
              data-ocid="mission.paused.loading_state"
            >
              <p className="text-sm text-yellow-400">
                Mission paused. Click Resume to continue.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card
          className="bg-card border-border"
          data-ocid="mission.stats.sent.card"
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{sent}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </CardContent>
        </Card>
        <Card
          className="bg-card border-border"
          data-ocid="mission.stats.remaining.card"
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{total - sent}</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </CardContent>
        </Card>
        <Card
          className="bg-card border-border"
          data-ocid="mission.stats.daily.card"
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-node-teal">{remaining}</p>
            <p className="text-xs text-muted-foreground">Daily Left</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border card-glow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Manual Send</p>
              <p className="text-xs text-muted-foreground">
                Open next WhatsApp link immediately
              </p>
            </div>
            <Button
              data-ocid="mission.manual.primary_button"
              onClick={() => sendNext(currentIdx, unsentContacts)}
              disabled={isSending || currentIdx >= total}
              className="bg-primary text-primary-foreground"
              size="sm"
            >
              <Send className="w-3 h-3 mr-1" />
              Send Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
