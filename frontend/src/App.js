import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import "@/App.css";

import LoadingScreen from "@/components/atlas/LoadingScreen";
import AdminPanel from "@/pages/AdminPanel";
import DelegateDashboard from "@/pages/DelegateDashboard";
import CoachellaDashboard from "@/pages/CoachellaDashboard";
import DelegatePassportPage from "@/pages/DelegatePassportPage";
import StandalonePassPage from "@/pages/StandalonePassPage";
import Navbar from "@/components/atlas/Navbar";
import StatusOverlay from "@/components/atlas/StatusOverlay";
import Hero from "@/components/atlas/Hero";
import Ecosystem from "@/components/atlas/Ecosystem";
import Committees from "@/components/atlas/Committees";
import SignatureCollection from "@/components/atlas/SignatureCollection";
import OperationRed from "@/components/atlas/OperationRed";
import ClassifiedArchives from "@/components/atlas/ClassifiedArchives";
import Passport from "@/components/atlas/Passport";
import Timeline from "@/components/atlas/Timeline";
import Partners from "@/components/atlas/Partners";
import Faq from "@/components/atlas/Faq";
import Footer from "@/components/atlas/Footer";
import AccessDialog from "@/components/atlas/AccessDialog";
import DelegateLoginDialog from "@/components/atlas/DelegateLoginDialog";
import { ScanWipe } from "@/components/atlas/SectionFX";
import { signOutUser } from "@/lib/atlasApi";

function Home({ setAccessOpen }) {
  const navigate = useNavigate();
  const [booted, setBooted] = useState(
    typeof window !== "undefined" &&
      sessionStorage.getItem("atlas_booted") === "1"
  );
  const [delegateLoginOpen, setDelegateLoginOpen] = useState(false);
  const [delegateUser, setDelegateUser] = useState(null);

  useEffect(() => {
    document.title =
      "ATLAS UNION SUMMIT 2026 · Where Diplomacy Meets Innovation";

    // Load delegate session if it exists
    const session = localStorage.getItem("aus_delegate_session");
    if (session) {
      try {
        setDelegateUser(JSON.parse(session));
      } catch {
        localStorage.removeItem("aus_delegate_session");
      }
    }
  }, []);

  const finishBoot = () => {
    sessionStorage.setItem("atlas_booted", "1");
    setBooted(true);
  };

  const handleDelegateLoginSuccess = (user) => {
    setDelegateUser(user);
    if (user.role === "admin") {
      toast.success("ADMIN COMMAND DETECTED", {
        description: "Authorized command session initialized.",
      });
      navigate("/admin");
    } else if (user.committee === "Coachella (Simulated Crisis)") {
      toast.success("VERIFICATION COMPLETED", {
        description: `Welcome to Coachella, ${user.full_name}`,
      });
      navigate("/coachella");
    } else {
      toast.success("VERIFICATION COMPLETED", {
        description: `Welcome back, Operator ${user.full_name}`,
      });
      navigate("/dashboard");
    }
  };

  const handleDelegateLogout = async () => {
    localStorage.removeItem("aus_delegate_session");
    localStorage.removeItem("aus_admin_user");
    try {
      await signOutUser();
    } catch (e) {
      console.error(e);
    }
    setDelegateUser(null);
    toast.success("DISCONNECTED", {
      description: "Dossier encryption restored.",
    });
  };

  return (
    <div className="App atlas-grain min-h-screen">
      {!booted && <LoadingScreen onDone={finishBoot} />}

      <Navbar
        onRequestAccess={() => setAccessOpen(true)}
        onRequestDelegateLogin={() => setDelegateLoginOpen(true)}
        delegateUser={delegateUser}
        onDelegateLogout={handleDelegateLogout}
      />
      <StatusOverlay />
      <ScanWipe />

      <main>
        <Hero onRequestAccess={() => setAccessOpen(true)} />
        <Ecosystem />
        <Committees />
        <SignatureCollection />
        <OperationRed />
        <ClassifiedArchives />
        <Passport delegateUser={delegateUser} onOpenRegistration={() => setAccessOpen(true)} />
        <Timeline />
        <Partners />
        <Faq />
      </main>

      <Footer onRequestAccess={() => setAccessOpen(true)} />
      
      <DelegateLoginDialog
        open={delegateLoginOpen}
        onClose={() => setDelegateLoginOpen(false)}
        onLoginSuccess={handleDelegateLoginSuccess}
      />

      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgba(10,2,18,0.92)",
            border: "1px solid rgba(201,164,76,0.35)",
            color: "#F5F1FF",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "11px",
            letterSpacing: "0.12em",
          },
        }}
      />
    </div>
  );
}

function App() {
  const [accessOpen, setAccessOpen] = useState(false);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home setAccessOpen={setAccessOpen} />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/dashboard" element={<DelegateDashboard onRequestAccess={() => setAccessOpen(true)} />} />
          <Route path="/coachella" element={<CoachellaDashboard onRequestAccess={() => setAccessOpen(true)} />} />
          <Route path="/passport" element={<DelegatePassportPage />} />
          <Route path="/p/:id" element={<StandalonePassPage />} />
        </Routes>
        <AccessDialog open={accessOpen} onClose={() => setAccessOpen(false)} />
      </BrowserRouter>
      <Analytics />
    </>
  );
}

export default App;
