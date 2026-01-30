import { FiGithub, FiMail, FiArrowUpRight } from "react-icons/fi";
import Container from "@/shared/components/layout/Container";

const footerLinks = [
  { href: "#!", label: "Recursos" },
  { href: "#!", label: "Documentação" },
  { href: "#!", label: "Política de Privacidade" },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-800 text-slate-300 font-sans">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-12 grid grid-cols-1 gap-8 py-12 md:grid-cols-3">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-primary-400">
                Pelada Insights
              </h3>
              <p className="leading-relaxed text-slate-400">
                Transformando a gestão de peladas com tecnologia intuitiva e
                análises poderosas.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Navegação</h4>
              <ul className="space-y-2">
                {footerLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="flex items-center gap-1 transition-colors hover:text-blue-400"
                    >
                      <FiArrowUpRight className="flex-shrink-0" aria-hidden />
                      <span>{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Contato</h4>
              <div className="space-y-2">
                <a
                  href="mailto:sarradahub@gmail.com"
                  className="flex items-center gap-2 transition-colors hover:text-blue-400"
                >
                  <FiMail className="flex-shrink-0" aria-hidden />
                  chagas.lucas.mafra@gmail.com
                </a>
                <a
                  href="https://github.com/SarradaHub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-blue-400"
                >
                  <FiGithub className="flex-shrink-0" aria-hidden />
                  SarradaHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
      <div className="border-t border-slate-700 py-8 text-center text-slate-400 font-sans">
        © {currentYear} Pelada Insights. Todos os direitos reservados.
      </div>
    </footer>
  );
};

export default Footer;
