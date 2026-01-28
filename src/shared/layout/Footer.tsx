import { FiGithub, FiMail, FiArrowUpRight } from "react-icons/fi";
import { Footer as DsFooter, FooterSection } from "@platform/design-system";

const footerLinks = [
  { href: "#!", label: "Recursos" },
  { href: "#!", label: "Documentação" },
  { href: "#!", label: "Política de Privacidade" },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const sections: FooterSection[] = [
    {
      title: "Navegação",
      items: footerLinks.map((link) => ({
        label: link.label,
        href: link.href,
        icon: <FiArrowUpRight aria-hidden />,
      })),
    },
    {
      title: "Contato",
      items: [
        {
          label: "chagas.lucas.mafra@gmail.com",
          href: "mailto:sarradahub@gmail.com",
          icon: <FiMail aria-hidden />,
        },
        {
          label: "SarradaHub",
          href: "https://github.com/SarradaHub",
          icon: <FiGithub aria-hidden />,
          external: true,
        },
      ],
    },
  ];

  return (
    <DsFooter
      variant="dark"
      brandTitle="Pelada Insights"
      description="Transformando a gestão de peladas com tecnologia intuitiva e análises poderosas."
      sections={sections}
      bottomText={`© ${currentYear} Pelada Insights. Todos os direitos reservados.`}
    />
  );
};

export default Footer;
