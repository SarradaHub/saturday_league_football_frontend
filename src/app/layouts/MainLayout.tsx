import { PropsWithChildren } from "react";
import Navbar from "@/shared/layout/Navbar";
import Footer from "@/shared/layout/Footer";

const MainLayout = ({ children }: PropsWithChildren) => (
  <div className="flex min-h-screen flex-col font-sans bg-neutral-50">
    <Navbar />
    <main className="mt-16 flex-1">{children}</main>
    <Footer />
  </div>
);

export default MainLayout;
