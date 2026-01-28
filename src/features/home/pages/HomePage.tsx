import { useNavigate } from "react-router-dom";
import { FaChartLine, FaRobot, FaTrophy } from "react-icons/fa";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Container,
} from "@platform/design-system";

const heroFeatures = [
  {
    icon: <FaChartLine aria-hidden />,
    title: "Estatísticas Detalhadas",
    description:
      "Dados específicos como gols, assistências e desempenho individual com visualizações temporais personalizadas.",
  },
  {
    icon: <FaRobot aria-hidden />,
    title: "Automação Inteligente",
    description:
      "Algoritmos que organizam rodadas automaticamente, equilibrando times com base em habilidades e frequência.",
  },
  {
    icon: <FaTrophy aria-hidden />,
    title: "Histórico Competitivo",
    description:
      "Rankings atualizados e conquistas históricas para promover competição saudável entre jogadores.",
  },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Container as="section">
        <Card variant="default" padding="lg">
          <CardHeader>
            <h1>
              <CardTitle>Transforme Suas Peladas</CardTitle>
            </h1>
          </CardHeader>
          <CardContent>
            <p>
              Organize, analise e evolua suas peladas com ferramentas profissionais
              de forma simples e intuitiva.
            </p>
            <Button onClick={() => navigate("/login")} size="lg">
              Comece Agora Gratuitamente
            </Button>
          </CardContent>
        </Card>
      </Container>
      <Container as="section">
        <Card variant="default" padding="lg">
          <CardHeader>
            <h2>
              <CardTitle>Vantagens Exclusivas</CardTitle>
            </h2>
          </CardHeader>
          <CardContent>
            {heroFeatures.map((feature) => (
              <Card key={feature.title} variant="elevated" padding="lg">
                <CardHeader>
                  <div>{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </Container>
      <Container as="section">
        <Card variant="outlined" padding="lg">
          <CardHeader>
            <h3>
              <CardTitle>Pronto para revolucionar suas peladas?</CardTitle>
            </h3>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" onClick={() => navigate("/login")} size="lg">
              <FaTrophy aria-hidden />
              Comece Agora
            </Button>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default HomePage;
