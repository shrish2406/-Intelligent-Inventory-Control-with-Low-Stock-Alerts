import { useCallback, useEffect, useState } from "react";
import Layout from "./components/layout/Layout";
import { ToastProvider, useToast } from "./components/common/ToastContext";
import { useWebSocket } from "./hooks/useWebSocket";
import { alertsApi } from "./services/api";
import OverviewPage from "./pages/OverviewPage";
import ProductsPage from "./pages/ProductsPage";
import WarehousesPage from "./pages/WarehousesPage";
import InventoryPage from "./pages/InventoryPage";
import MovementsPage from "./pages/MovementsPage";
import AlertsPage from "./pages/AlertsPage";

function DashboardApp() {
  const { showToast } = useToast();
  const [activePage, setActivePage] = useState("overview");
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  const refreshActiveAlertCount = useCallback(async () => {
    try {
      const active = await alertsApi.list({ status: "ACTIVE" });
      setActiveAlertCount(active.length);
    } catch {
      // Ignore transient errors during background badge sync
    }
  }, []);

  useEffect(() => {
    refreshActiveAlertCount();
  }, [refreshActiveAlertCount, refreshSignal]);

  const handleWsEvent = useCallback(
    (payload) => {
      setRefreshSignal((prev) => prev + 1);

      if (payload.event === "low_stock_alert" && payload.data?.message) {
        showToast(payload.data.message, "warning");
      } else if (payload.event === "alert_resolved") {
        showToast("An alert was resolved", "info");
      }
    },
    [showToast]
  );

  const { status: wsStatus } = useWebSocket(handleWsEvent);
  const triggerRefresh = useCallback(() => setRefreshSignal((prev) => prev + 1), []);
  const handleNavigate = useCallback((page) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return (
          <OverviewPage
            refreshSignal={refreshSignal}
            onNavigate={setActivePage}
            onAlertsChanged={refreshActiveAlertCount}
          />
        );
      case "products":
        return <ProductsPage onDataChanged={triggerRefresh} />;
      case "warehouses":
        return <WarehousesPage onDataChanged={triggerRefresh} />;
      case "inventory":
        return (
          <InventoryPage refreshSignal={refreshSignal} onNavigate={setActivePage} />
        );
      case "movements":
        return (
          <MovementsPage
            refreshSignal={refreshSignal}
            onMovementCreated={triggerRefresh}
          />
        );
      case "alerts":
        return (
          <AlertsPage
            refreshSignal={refreshSignal}
            onAlertsChanged={refreshActiveAlertCount}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout
      activePage={activePage}
      onNavigate={handleNavigate}
      wsStatus={wsStatus}
      activeAlertCount={activeAlertCount}
    >
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <DashboardApp />
    </ToastProvider>
  );
}
