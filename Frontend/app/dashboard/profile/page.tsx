import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import ProfileClient from "./profile-client";

export const metadata = {
  title: "Profile | Gaucho RSVP",
  description: "View and manage your Gaucho RSVP profile",
};

export default function ProfilePage() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_40%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_38%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.12),transparent_35%)]" />
      <DashboardHeader />
      <div className="relative z-10">
        <ProfileClient />
      </div>
    </div>
  );
}

