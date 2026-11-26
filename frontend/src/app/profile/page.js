import { Suspense } from "react";
import RequireLogin from "@/components/RequireLogin";
import ProfileView from "@/components/profile/ProfileView";

export const metadata = {
  title: "Profile | L.A.R.P",
};

export default function ProfilePage() {
  return (
    <Suspense>
      <RequireLogin message="Log in to see your profile, saved places and reviews.">
        <ProfileView />
      </RequireLogin>
    </Suspense>
  );
}
