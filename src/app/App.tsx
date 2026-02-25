import MainLayout from "@/app/layouts/MainLayout";
import AppRoutes from "@/app/router/AppRoutes";

const App = () => {
  return (
    <MainLayout>
      <AppRoutes />
    </MainLayout>
  );
};

export default App;
