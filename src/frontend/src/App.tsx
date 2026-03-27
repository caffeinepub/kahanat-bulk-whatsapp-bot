import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Layout, type Page } from "./components/Layout";
import { ThreeBackground } from "./components/ThreeBackground";
import { Archive } from "./pages/Archive";
import { Campaigns } from "./pages/Campaigns";
import { Contacts } from "./pages/Contacts";
import { Dashboard } from "./pages/Dashboard";
import { MissionRunner } from "./pages/MissionRunner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [activeCampaignId, setActiveCampaignId] = useState<bigint | null>(null);

  const handleLaunchMission = (campaignId: bigint) => {
    setActiveCampaignId(campaignId);
    setCurrentPage("mission");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            onNavigate={setCurrentPage}
            onLaunchMission={handleLaunchMission}
          />
        );
      case "contacts":
        return <Contacts />;
      case "campaigns":
        return (
          <Campaigns
            onNavigate={setCurrentPage}
            onLaunchMission={handleLaunchMission}
          />
        );
      case "mission":
        return (
          <MissionRunner
            activeCampaignId={activeCampaignId}
            onSelectCampaign={setActiveCampaignId}
          />
        );
      case "archive":
        return <Archive />;
      default:
        return (
          <Dashboard
            onNavigate={setCurrentPage}
            onLaunchMission={handleLaunchMission}
          />
        );
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThreeBackground />
      <div className="relative z-0 h-screen bg-background/90 backdrop-blur-[2px]">
        <Layout
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          activeCampaignName={
            activeCampaignId ? `Campaign #${activeCampaignId}` : undefined
          }
        >
          {renderPage()}
        </Layout>
      </div>
      {/* Footer */}
      <div className="fixed bottom-0 right-0 p-2 text-[10px] text-muted-foreground/50 z-50">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground transition-colors"
        >
          Built with love using caffeine.ai
        </a>
      </div>
      <Toaster richColors theme="dark" />
    </QueryClientProvider>
  );
}
