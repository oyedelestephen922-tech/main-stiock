import { MobileTabBar, Sidebar } from "@/components/layout/DashboardNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1400px] px-4 sm:px-6">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-28 pt-6 md:pb-16 md:pl-8 md:pt-8">{children}</div>
      <MobileTabBar />
    </div>
  );
}
