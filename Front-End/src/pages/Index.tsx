import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProcessAnimation } from "@/components/ProcessAnimation";
import { MobileOptimized } from "@/components/MobileOptimized";
import { DemoPreview } from "@/components/DemoPreview";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <Hero />
        <ProcessAnimation />
        <MobileOptimized />
        <DemoPreview />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
