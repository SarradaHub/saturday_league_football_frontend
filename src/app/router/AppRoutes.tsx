import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";

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
  <div className="flex min-h-[60vh] items-center justify-center">
    <LoadingSpinner size="lg" text="Carregando conteúdo..." />
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/championships" element={<ChampionshipListPage />} />
      <Route path="/championships/:id" element={<ChampionshipDetailsPage />} />
      <Route path="/rounds/:id" element={<RoundDetailsPage />} />
      <Route path="/matches/:id" element={<MatchDetailsPage />} />
      <Route path="/players/:id" element={<PlayerDetailsPage />} />
      <Route path="/teams/:id" element={<TeamDetailsPage />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
