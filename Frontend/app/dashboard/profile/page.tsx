import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import ProfileClient from "./profile-client";

export const metadata = {
  title: "Profile | Gaucho RSVP",
  description: "View and manage your Gaucho RSVP profile",
};

export default function ProfilePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <DashboardHeader />
      <ProfileClient />
    </div>
  );
}

