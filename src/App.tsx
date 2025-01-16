import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import Index from "./pages/Index";
import GetStarted from "./pages/GetStarted";
import LearnMore from "./pages/LearnMore";
import Login from "./pages/Login";
import Solutions from "./pages/Solutions";
import Marketplace from "./pages/Marketplace";
import Orders from "./pages/Orders";
import NewReport from "./pages/NewReport";
import Calculations from "./pages/Calculations";
import AddressValidation from "./pages/AddressValidation";
import AICivilEngineer from "./pages/AICivilEngineer";
import Assessment from "./pages/Assessment";
import AgentMonitoring from "./pages/AgentMonitoring";
import AIChat from "./pages/AIChat";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";
import { DebugProvider } from "@/lib/debug-panel/context/DebugContext";
import { DebugPanel } from "@/components/DebugPanel/DebugPanel";

function App() {
  console.log("App component mounting, initializing debug panel");
  
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <DebugProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/learn-more" element={<LearnMore />} />
            <Route path="/login" element={<Login />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/new-report" element={<NewReport />} />
            <Route path="/calculations" element={<Calculations />} />
            <Route path="/address-validation" element={<AddressValidation />} />
            <Route path="/ai-civil-engineer" element={<AICivilEngineer />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/agent-monitoring" element={<AgentMonitoring />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/parcel-details" element={<Navigate to="/ai-civil-engineer" replace />} />
          </Routes>
          <DebugPanel />
          <Toaster />
        </Router>
      </DebugProvider>
    </SessionContextProvider>
  );
}

export default App;