import { PropsWithChildren } from "react";
import Navbar from "@/shared/layout/Navbar";
import Footer from "@/shared/layout/Footer";

const MainLayout = ({ children }: PropsWithChildren) => (
  <>
    <Navbar />
    <main>{children}</main>
    <Footer />
  </>
);

export default MainLayout;
