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
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { Alert, Button, Card, CardHeader, CardTitle, CardContent, Container } from "@sarradahub/design-system";
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
      <div style={{ marginTop: "6rem", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner size="lg" text="Carregando peladas..." />
      </div>
    );
  }

  if (error) {
    const message =
      error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    return (
      <div style={{ marginTop: "6rem", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <Alert variant="error" title="Erro ao carregar peladas">
          {message}
        </Alert>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "6rem", minHeight: "100vh", backgroundColor: "#fafafa", padding: "2rem 0" }}>
      <Container>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "1.5rem" }}>
          <div style={{ gridColumn: "span 12", marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.875rem", fontWeight: 700, color: "#171717" }}>
              <FaTrophy style={{ color: "#f59e0b" }} aria-hidden />
              Peladas Cadastradas
            </h1>
            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              variant="primary"
              size="lg"
              leftIcon={FaPlus}
              aria-label="Criar nova pelada"
            >
              Nova Pelada
            </Button>
          </div>
          {championships && championships.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}
            >
              {championships.map((championship: Championship) => (
                <motion.div
                  key={championship.id}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card
                    variant="elevated"
                    padding="lg"
                    style={{ height: "100%", cursor: "pointer" }}
                    onClick={() => handleCardClick(championship.id)}
                  >
                    <CardHeader>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <CardTitle>{championship.name}</CardTitle>
                        <span style={{ borderRadius: "9999px", backgroundColor: "#dbeafe", padding: "0.25rem 0.75rem", fontSize: "0.875rem", color: "#1e40af" }}>
                          {championship.round_total} rodadas
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {championship.description && (
                        <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#737373" }}>
                          {championship.description}
                        </p>
                      )}
                      <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.875rem", color: "#737373" }}>
                        <span>{championship.total_players} jogadores</span>
                        <span>ID #{championship.id}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card variant="outlined" padding="lg" style={{ gridColumn: "span 12", textAlign: "center", color: "#737373", padding: "3rem" }}>
              <CardContent>
                Nenhuma pelada cadastrada ainda.
              </CardContent>
            </Card>
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
