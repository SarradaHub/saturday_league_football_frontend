import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";

const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const HomePage = lazy(() => import("@/features/home/pages/HomePage"));
const ChampionshipListPage = lazy(
  () => import("@/features/championships/pages/ChampionshipListPage"),
);
const ChampionshipDetailsPage = lazy(
  () => import("@/features/championships/pages/ChampionshipDetailsPage"),
);
const RoundDetailsPage = lazy(
  () => import("@/features/rounds/pages/RoundDetailsPage"),
);
const MatchDetailsPage = lazy(
  () => import("@/features/matches/pages/MatchDetailsPage"),
);
const PlayerDetailsPage = lazy(
  () => import("@/features/players/pages/PlayerDetailsPage"),
);
const TeamDetailsPage = lazy(
  () => import("@/features/teams/pages/TeamDetailsPage"),
);

const LoadingScreen = () => (
  <div style={{ display: "flex", minHeight: "60vh", alignItems: "center", justifyContent: "center" }}>
    <LoadingSpinner size="lg" text="Carregando conteúdo..." />
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/championships"
        element={
          <ProtectedRoute>
            <ChampionshipListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/championships/:id"
        element={
          <ProtectedRoute>
            <ChampionshipDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rounds/:id"
        element={
          <ProtectedRoute>
            <RoundDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/matches/:id"
        element={
          <ProtectedRoute>
            <MatchDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/players/:id"
        element={
          <ProtectedRoute>
            <PlayerDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams/:id"
        element={
          <ProtectedRoute>
            <TeamDetailsPage />
          </ProtectedRoute>
        }
      />
      {/* Catch-all route: redireciona qualquer rota não encontrada para HomePage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
