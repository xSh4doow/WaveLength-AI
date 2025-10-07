import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MobileOptimized } from "@/components/MobileOptimized";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <Hero />
        <MobileOptimized />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
