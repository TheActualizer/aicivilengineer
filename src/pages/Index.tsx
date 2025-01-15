import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import OrderHistory from "@/components/OrderHistory";
import AccountInfo from "@/components/AccountInfo";
import { useSession } from "@supabase/auth-helpers-react";

const Index = () => {
  const session = useSession();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24">
        {!session ? (
          <>
            <Hero />
            <Features />
          </>
        ) : (
          <div className="container mx-auto px-4 space-y-8">
            <AccountInfo />
            <OrderHistory />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;