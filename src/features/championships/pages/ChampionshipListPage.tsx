import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Snackbar from "@mui/material/Snackbar";
import { SnackbarCloseReason } from "@mui/material/Snackbar";
import { motion } from "framer-motion";
import { FaPlus, FaTrophy } from "react-icons/fa";
import championshipRepository from "@/features/championships/api/championshipRepository";
import CreateChampionshipModal, {
  ChampionshipPayload,
} from "@/features/championships/components/CreateChampionshipModal";
import Container from "@/shared/components/layout/Container";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { Alert, Button } from "@sarradahub/design-system";
import { colors } from "@sarradahub/design-system/tokens";
import { Championship } from "@/types";

const queryKeys = {
  championships: ["championships"] as const,
};

const ChampionshipListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string | null }>(
    {
      open: false,
      message: null,
    },
  );

  const {
    data: championships,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.championships,
    queryFn: () => championshipRepository.list(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: ChampionshipPayload) =>
      championshipRepository.createChampionship(payload),
    onSuccess: (created) => {
      setToast({
        open: true,
        message: `Pelada "${created.name}" criada com sucesso!`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.championships });
      setIsModalOpen(false);
    },
    onError: (mutationError) => {
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Não foi possível criar a pelada.",
      });
    },
  });

  const handleCloseToast = (
    _event: Event | React.SyntheticEvent,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") return;
    setToast({ open: false, message: null });
  };

  const handleCardClick = (championshipId: number) => {
    navigate(`/championships/${championshipId}`);
  };

  if (isLoading) {
    return (
      <div className="mt-24 flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando peladas..." />
      </div>
    );
  }

  if (error) {
    const message =
      error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    return (
      <div className="mt-24 flex min-h-screen items-center justify-center">
        <Alert variant="error" title="Erro ao carregar peladas">
          {message}
        </Alert>
      </div>
    );
  }

  return (
    <div className="mt-24 min-h-screen bg-gray-50 py-8 font-sans">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-12 mb-8 flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
              <FaTrophy className="text-yellow-500" aria-hidden />
              Peladas Cadastradas
            </h1>
            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              variant="primary"
              size="lg"
              aria-label="Criar nova pelada"
            >
              <FaPlus aria-hidden="true" className="mr-2" />
              Nova Pelada
            </Button>
          </div>
          {championships && championships.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="md:col-span-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {championships.map((championship: Championship) => (
                <motion.button
                  key={championship.id}
                  type="button"
                  onClick={() => handleCardClick(championship.id)}
                  whileHover={{ scale: 1.02 }}
                  className="h-full rounded-xl bg-white p-6 text-left shadow-md transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {championship.name}
                    </h3>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                      {championship.round_total} rodadas
                    </span>
                  </div>
                  {championship.description && (
                    <p className="mt-4 text-sm text-gray-600">
                      {championship.description}
                    </p>
                  )}
                  <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                    <span>{championship.total_players} jogadores</span>
                    <span>ID #{championship.id}</span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <div className="md:col-span-12 rounded-lg bg-white py-12 text-center text-gray-500 shadow-sm">
              Nenhuma pelada cadastrada ainda.
            </div>
          )}
        </div>
      </Container>
      {isModalOpen && (
        <CreateChampionshipModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={async (payload) => {
            await createMutation.mutateAsync(payload);
          }}
        />
      )}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        message={toast.message}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          "& .MuiSnackbarContent-root": {
            backgroundColor: toast.message?.includes("sucesso")
              ? colors.primary[600]
              : colors.error[700],
            color: "#fff",
          },
        }}
      />
    </div>
  );
};

export default ChampionshipListPage;
