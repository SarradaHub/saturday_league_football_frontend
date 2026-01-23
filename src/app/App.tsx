import { useEffect } from "react";
import MainLayout from "@/app/layouts/MainLayout";
import AppRoutes from "@/app/router/AppRoutes";
import DesignSystemHealthCheck from "@/shared/components/dev/DesignSystemHealthCheck";
import { runDesignSystemAudit } from "@/shared/dev/designSystemAudit";

const App = () => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      runDesignSystemAudit();
    }
  }, []);

  return (
    <MainLayout>
      <AppRoutes />
      {import.meta.env.DEV && <DesignSystemHealthCheck />}
    </MainLayout>
  );
};

export default App;
