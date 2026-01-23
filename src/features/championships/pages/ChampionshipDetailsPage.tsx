import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { format } from "date-fns";
import championshipRepository from "@/features/championships/api/championshipRepository";
import roundRepository from "@/features/rounds/api/roundRepository";
import CreateRoundModal from "@/features/rounds/components/CreateRoundModal";
import Container from "@/shared/components/layout/Container";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { Alert } from "@sarradahub/design-system";
import { colors } from "@sarradahub/design-system/tokens";
import { Round } from "@/types";

const queryKeys = {
  championship: (id: number) => ["championship", id] as const,
};

const ChampionshipDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const championshipId = Number(params.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string | null }>(
    {
      open: false,
      message: null,
    },
  );

  const {
    data: championship,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.championship(championshipId),
    queryFn: () => championshipRepository.findById(championshipId),
    enabled: Number.isFinite(championshipId),
  });

  const createRoundMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      round_date: string;
      championship_id: number;
    }) => roundRepository.createRound(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.championship(championshipId),
      });
      setToast({ open: true, message: "Rodada criada com sucesso!" });
      setIsModalOpen(false);
    },
    onError: (mutationError) => {
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Falha ao criar rodada.",
      });
    },
  });

  const rounds = useMemo(() => championship?.rounds ?? [], [championship]);
  const players = useMemo(() => championship?.players ?? [], [championship]);

  const handleCloseToast = (
    _event: Event | React.SyntheticEvent,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") return;
    setToast({ open: false, message: null });
  };

  if (!Number.isFinite(championshipId)) {
    return (
      <div className="mt-24 flex min-h-screen items-center justify-center">
        <span className="rounded-lg bg-error-50 px-4 py-3 text-error-600">
          Identificador de pelada inválido.
        </span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-24 flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  if (error || !championship) {
    const message =
      error instanceof Error
        ? error.message
        : championship
          ? "Ocorreu um erro inesperado."
          : "Pelada não encontrada.";
    return (
      <div className="mt-24 flex min-h-screen items-center justify-center">
        <Alert variant="error" title="Erro">
          {message}
        </Alert>
      </div>
    );
  }

  return (
    <div className="mt-24 min-h-screen bg-neutral-50 py-8 font-sans">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <section className="md:col-span-12 rounded-2xl bg-neutral-50 p-6 shadow-lg">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex items-center gap-2 text-neutral-600 transition-colors hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
              aria-label="Voltar para página anterior"
            >
              <FaArrowLeft aria-hidden="true" />
              Voltar
            </button>
            <h1 className="text-3xl font-bold text-neutral-900">
              {championship.name}
            </h1>
            {championship.description && (
              <p className="mt-2 text-neutral-600">{championship.description}</p>
            )}
            <dl className="mt-6 grid grid-cols-1 gap-4 text-sm text-neutral-600 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-neutral-800">Criada em</dt>
                <dd>
                  {format(new Date(championship.created_at), "dd/MM/yyyy")}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-800">
                  Última atualização
                </dt>
                <dd>
                  {format(new Date(championship.updated_at), "dd/MM/yyyy")}
                </dd>
              </div>
            </dl>
          </section>

          <section className="md:col-span-12 rounded-2xl bg-neutral-50 p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-neutral-900">Rodadas</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Criar nova rodada"
              >
                <FaPlus aria-hidden="true" />
                Nova Rodada
              </button>
            </div>
            {rounds.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rounds.map((round: Round) => (
                  <motion.button
                    key={round.id}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    className="rounded-xl border border-neutral-100 p-4 text-left shadow-sm transition hover:border-primary-200 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={() => navigate(`/rounds/${round.id}`)}
                  >
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {round.name}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600">
                      {format(new Date(round.round_date), "dd/MM/yyyy")}
                    </p>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-neutral-500">
                Nenhuma rodada cadastrada ainda.
              </p>
            )}
          </section>

          <section className="md:col-span-12 rounded-2xl bg-neutral-50 p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-neutral-900">Jogadores</h2>
            {players.length > 0 ? (
              <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((player) => (
                  <li key={player.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/players/${player.id}`)}
                      className="flex w-full items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-left transition hover:border-primary-200 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900">
                          {player.name}
                        </span>
                        <span className="text-xs text-neutral-500">
                          Participou de {player.rounds?.length ?? 0} rodadas
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-neutral-500">
                Nenhum jogador cadastrado nesta pelada.
              </p>
            )}
          </section>
        </div>
      </Container>
      {isModalOpen && (
        <CreateRoundModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialChampionshipId={championshipId}
          onCreate={async (payload) => {
            await createRoundMutation.mutateAsync({
              ...payload,
              championship_id: championshipId,
            });
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

export default ChampionshipDetailsPage;
