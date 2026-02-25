import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaChartLine } from "react-icons/fa";
import { motion } from "framer-motion";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import { FaArrowLeft, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { format, parse } from "date-fns";
import championshipRepository from "@/features/championships/api/championshipRepository";
import roundRepository from "@/features/rounds/api/roundRepository";
import CreateRoundModal from "@/features/rounds/components/CreateRoundModal";
import EditChampionshipModal from "@/features/championships/components/EditChampionshipModal";
import DeleteChampionshipModal from "@/features/championships/components/DeleteChampionshipModal";
import { ChampionshipPayload } from "@/features/championships/components/EditChampionshipModal";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { Alert, Container, Card, CardHeader, CardTitle, CardContent, Button } from "@sarradahub/design-system";
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
    queryFn: () => championshipRepository.findById(championshipId, {
      include: 'rounds,players',
    }),
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

  const updateChampionshipMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChampionshipPayload }) =>
      championshipRepository.updateChampionship(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.championship(championshipId),
      });
      setToast({ open: true, message: "Pelada atualizada com sucesso!" });
      setIsEditModalOpen(false);
    },
    onError: (mutationError) => {
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao atualizar pelada.",
      });
    },
  });

  const deleteChampionshipMutation = useMutation({
    mutationFn: (id: number) => championshipRepository.deleteChampionship(id),
    onSuccess: () => {
      setToast({ open: true, message: "Pelada excluída com sucesso!" });
      setIsDeleteModalOpen(false);
      navigate("/");
    },
    onError: (mutationError) => {
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao excluir pelada. Verifique se há rodadas ou partidas associadas.",
      });
    },
  });

  const rounds = useMemo(() => championship?.rounds ?? [], [championship]);
  const players = useMemo(() => championship?.players ?? [], [championship]);

  const { data: championshipStats } = useQuery({
    queryKey: ["championship", championshipId, "statistics"],
    queryFn: () => championshipRepository.getStatistics(championshipId),
    enabled: Number.isFinite(championshipId) && !!championship,
  });

  const statsList = useMemo(() => {
    if (!championshipStats || typeof championshipStats !== "object") return [];
    return Object.entries(championshipStats)
      .map(([playerId, stat]) => ({ playerId: Number(playerId), ...stat }))
      .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0));
  }, [championshipStats]);

  const handleCloseToast = (
    _event: Event | React.SyntheticEvent,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") return;
    setToast({ open: false, message: null });
  };

  if (!Number.isFinite(championshipId)) {
    return (
      <div style={{ marginTop: "6rem", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <Alert variant="error">Identificador de pelada inválido.</Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ marginTop: "6rem", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
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
      <div style={{ marginTop: "6rem", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <Alert variant="error" title="Erro">
          {message}
        </Alert>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "6rem", minHeight: "100vh", backgroundColor: "#fafafa", padding: "2rem 0" }}>
      <Container>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "1.5rem" }}>
          <Card variant="elevated" padding="lg" style={{ gridColumn: "span 12" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", flex: 1 }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  leftIcon={FaArrowLeft}
                  aria-label="Voltar para página anterior"
                >
                  Voltar
                </Button>
                <CardHeader>
                  <CardTitle style={{ fontSize: "1.875rem" }}>{championship.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {championship.description && (
                    <p style={{ marginTop: "0.5rem", color: "#737373" }}>{championship.description}</p>
                  )}
                  <dl style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", fontSize: "0.875rem", color: "#737373" }}>
                    <div>
                      <dt style={{ fontWeight: 600, color: "#171717" }}>Jogadores por time</dt>
                      <dd>
                        {championship.min_players_per_team === championship.max_players_per_team
                          ? `${championship.min_players_per_team} jogadores`
                          : `${championship.min_players_per_team} - ${championship.max_players_per_team} jogadores`}
                      </dd>
                    </div>
                    <div>
                      <dt style={{ fontWeight: 600, color: "#171717" }}>Total de rodadas</dt>
                      <dd>{championship.round_total}</dd>
                    </div>
                    <div>
                      <dt style={{ fontWeight: 600, color: "#171717" }}>Criada em</dt>
                      <dd>
                        {format(new Date(championship.created_at), "dd/MM/yyyy")}
                      </dd>
                    </div>
                    <div>
                      <dt style={{ fontWeight: 600, color: "#171717" }}>
                        Última atualização
                      </dt>
                      <dd>
                        {format(new Date(championship.updated_at), "dd/MM/yyyy")}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  leftIcon={FaEdit}
                  aria-label="Editar pelada"
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                  leftIcon={FaTrash}
                  aria-label="Excluir pelada"
                >
                  Excluir
                </Button>
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg" style={{ gridColumn: "span 12" }}>
            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <CardTitle style={{ fontSize: "1.5rem" }}>Rodadas</CardTitle>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setIsModalOpen(true)}
                leftIcon={FaPlus}
                aria-label="Criar nova rodada"
              >
                Nova Rodada
              </Button>
            </div>
            <CardContent>
              {rounds.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
                  {rounds.map((round: Round) => (
                    <motion.div
                      key={round.id}
                      whileHover={{ scale: 1.01 }}
                    >
                      <Card
                        variant="outlined"
                        padding="md"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/rounds/${round.id}`)}
                      >
                        <CardHeader>
                          <CardTitle style={{ fontSize: "1.125rem" }}>{round.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#737373" }}>
                            {format(parse(round.round_date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card variant="outlined" padding="lg" style={{ textAlign: "center", color: "#737373" }}>
                  <CardContent>
                    Nenhuma rodada cadastrada ainda.
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card variant="elevated" padding="lg" style={{ gridColumn: "span 12" }}>
            <CardHeader>
              <CardTitle style={{ fontSize: "1.5rem" }}>Jogadores</CardTitle>
            </CardHeader>
            <CardContent>
              {players.length > 0 ? (
                <ul style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", listStyle: "none", padding: 0 }}>
                  {players.map((player) => (
                    <li key={player.id}>
                      <Card
                        variant="outlined"
                        padding="md"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/players/${player.id}`)}
                      >
                        <CardContent>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ display: "flex", height: "2.5rem", width: "2.5rem", alignItems: "center", justifyContent: "center", borderRadius: "9999px", backgroundColor: "#dbeafe", color: "#2563eb", fontWeight: 600 }}>
                              {player.display_name.charAt(0).toUpperCase()}
                            </span>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 500, color: "#171717" }}>
                                {player.display_name}
                              </span>
                              <span style={{ fontSize: "0.75rem", color: "#737373" }}>
                                Participou de {player.rounds?.length ?? 0} rodadas
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ marginTop: "1rem", color: "#737373" }}>
                  Nenhum jogador cadastrado nesta pelada.
                </p>
              )}
            </CardContent>
          </Card>

          <Card variant="elevated" padding="lg" style={{ gridColumn: "span 12" }}>
            <CardHeader>
              <CardTitle style={{ fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FaChartLine style={{ color: "#2563eb" }} aria-hidden />
                Estatísticas do campeonato
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsList.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e5e5e5", textAlign: "left" }}>
                        <th style={{ padding: "0.75rem", fontWeight: 600, color: "#171717" }}>Jogador</th>
                        <th style={{ padding: "0.75rem", fontWeight: 600, color: "#171717" }}>Partidas</th>
                        <th style={{ padding: "0.75rem", fontWeight: 600, color: "#171717" }}>Gols</th>
                        <th style={{ padding: "0.75rem", fontWeight: 600, color: "#171717" }}>Assist.</th>
                        <th style={{ padding: "0.75rem", fontWeight: 600, color: "#171717" }}>Gols contra</th>
                        <th style={{ padding: "0.75rem", fontWeight: 600, color: "#171717" }}>Vitórias</th>
                        <th style={{ padding: "0.75rem", fontWeight: 600, color: "#171717" }}>Empates</th>
                        <th style={{ padding: "0.75rem", fontWeight: 600, color: "#171717" }}>Derrotas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsList.map(({ playerId, player, goals, assists, own_goals, matches, wins, draws, losses }) => (
                        <tr key={playerId} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "0.75rem" }}>
                            <span
                              style={{ cursor: "pointer", color: "#2563eb", fontWeight: 500 }}
                              onClick={() => navigate(`/players/${player?.id}`)}
                              onKeyDown={(e) => e.key === "Enter" && navigate(`/players/${player?.id}`)}
                              role="button"
                              tabIndex={0}
                            >
                              {player?.display_name ?? "—"}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem", color: "#737373" }}>{matches ?? 0}</td>
                          <td style={{ padding: "0.75rem", color: "#737373" }}>{goals ?? 0}</td>
                          <td style={{ padding: "0.75rem", color: "#737373" }}>{assists ?? 0}</td>
                          <td style={{ padding: "0.75rem", color: "#737373" }}>{own_goals ?? 0}</td>
                          <td style={{ padding: "0.75rem", color: "#737373" }}>{wins ?? 0}</td>
                          <td style={{ padding: "0.75rem", color: "#737373" }}>{draws ?? 0}</td>
                          <td style={{ padding: "0.75rem", color: "#737373" }}>{losses ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: "#737373", marginTop: "1rem" }}>
                  Nenhuma estatística disponível ainda. Jogue partidas nas rodadas para ver os números.
                </p>
              )}
            </CardContent>
          </Card>
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

      {isEditModalOpen && (
        <EditChampionshipModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={async (id, data) => {
            await updateChampionshipMutation.mutateAsync({ id, data });
          }}
          championship={championship}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteChampionshipModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={async () => {
            await deleteChampionshipMutation.mutateAsync(championshipId);
          }}
          championship={championship}
          isDeleting={deleteChampionshipMutation.isPending}
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
