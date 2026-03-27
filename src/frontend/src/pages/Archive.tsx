import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CheckCircle, MessageSquare, Users } from "lucide-react";
import { CampaignStatus } from "../backend";
import { useCampaigns } from "../hooks/useQueries";

export function Archive() {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const completed = campaigns.filter(
    (c) => c.status === CampaignStatus.complete,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Mission Archive</h1>
        <p className="text-sm text-muted-foreground">
          Completed campaigns — missions marked as done
        </p>
      </div>

      {isLoading ? (
        <div
          className="text-sm text-muted-foreground"
          data-ocid="archive.loading_state"
        >
          Loading...
        </div>
      ) : completed.length === 0 ? (
        <div className="p-12 text-center" data-ocid="archive.empty_state">
          <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No completed missions yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Completed campaigns will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4" data-ocid="archive.list">
          {completed.map((c, i) => (
            <Card
              key={String(c.id)}
              className="bg-card border-border card-glow"
              data-ocid={`archive.item.${i + 1}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{c.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {c.message}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{String(c.sentCount)} contacts reached</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="w-3 h-3" />
                          <span>{String(c.totalContacts)} total</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {c.completedAt
                              ? new Date(
                                  Number(c.completedAt) / 1_000_000,
                                ).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/30 text-xs flex-shrink-0">
                    ✓ MISSION COMPLETE
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
