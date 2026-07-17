import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminAdsTab from "@/components/admin/AdminAdsTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";
import AdminMetricsTab from "@/components/admin/AdminMetricsTab";
import AdminNotificationsTab from "@/components/admin/AdminNotificationsTab";
import RealTimeNotifications from "@/components/admin/RealTimeNotifications";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminPanel = () => {
  const [currentTab, setCurrentTab] = useState("metrics");
  const isMobile = useIsMobile();

  const renderContent = () => {
    switch (currentTab) {
      case "ads":
        return <AdminAdsTab />;
      case "users":
        return <AdminUsersTab />;
      case "notifications":
        return <AdminNotificationsTab />;
      case "settings":
        return <AdminSettingsTab />;
      case "metrics":
      default:
        return <AdminMetricsTab />;
    }
  };

  const sidebar = <AdminSidebar currentTab={currentTab} onTabChange={setCurrentTab} />;

  return (
    <AdminLayout mobileNav={isMobile ? sidebar : null}>
      <RealTimeNotifications />
      <div className="flex flex-col md:flex-row gap-6">
        {!isMobile && sidebar}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPanel;