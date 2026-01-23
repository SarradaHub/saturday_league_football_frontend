import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaChartLine, FaRobot, FaTrophy } from "react-icons/fa";
import Container from "@/shared/components/layout/Container";

const heroFeatures = [
  {
    icon: <FaChartLine className="mb-4 h-8 w-8 text-primary-600" />,
    title: "Estatísticas Detalhadas",
    description:
      "Dados específicos como gols, assistências e desempenho individual com visualizações temporais personalizadas.",
  },
  {
    icon: <FaRobot className="mb-4 h-8 w-8 text-success-600" />,
    title: "Automação Inteligente",
    description:
      "Algoritmos que organizam rodadas automaticamente, equilibrando times com base em habilidades e frequência.",
  },
  {
    icon: <FaTrophy className="mb-4 h-8 w-8 text-warning-600" />,
    title: "Histórico Competitivo",
    description:
      "Rankings atualizados e conquistas históricas para promover competição saudável entre jogadores.",
  },
];

const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-800 font-sans">
    <section className="relative pb-20 pt-24">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
                Transforme Suas{" "}
                <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                  Peladas
                </span>
              </h1>
              <p className="mx-auto mb-8 text-neutral-300 max-w-7xl">
                Organize, analise e evolua suas peladas com ferramentas
                profissionais de forma simples e intuitiva.
              </p>
              <Link
                to="/championships"
                className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-700 hover:shadow-xl"
              >
                Comece Agora Gratuitamente
              </Link>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
    <section className="bg-white/5 py-20 backdrop-blur-lg">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <h2 className="md:col-span-12 mb-16 text-center text-3xl font-bold text-white">
            <span className="border-b-4 border-primary-500 pb-2">
              Vantagens Exclusivas
            </span>
          </h2>
          <div className="md:col-span-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {heroFeatures.map((feature) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl bg-white p-8 shadow-xl transition-shadow hover:shadow-2xl"
              >
                <div className="text-center">
                  {feature.icon}
                  <h3 className="mb-4 text-2xl font-bold text-neutral-900">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-neutral-600">
                    {feature.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </Container>
    </section>
    <section className="bg-neutral-800 py-16">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-12 mx-auto max-w-7xl text-center">
            <h3 className="mb-6 text-3xl font-bold text-white">
              Pronto para revolucionar suas peladas?
            </h3>
            <Link
              to="/championships"
              className="mx-auto inline-flex items-center gap-2 rounded-xl bg-success-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-success-600 hover:shadow-xl"
            >
              <FaTrophy className="h-5 w-5" aria-hidden />
              Comece Agora
            </Link>
          </div>
        </div>
      </Container>
    </section>
  </div>
);

export default HomePage;
