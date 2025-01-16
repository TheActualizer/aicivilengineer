import { Link } from "react-router-dom";
import { Session } from "@supabase/auth-helpers-react";
import { motion } from "framer-motion";
import { TopBar } from "./navbar/TopBar";
import { NavLinks } from "./navbar/NavLinks";
import { ActionButtons } from "./navbar/ActionButtons";
import { UserMenu } from "./navbar/UserMenu";
import { MobileMenu } from "./navbar/MobileMenu";
import { useToolbarStyle } from "@/contexts/ToolbarStyleContext";
import { Button } from "./ui/button";
import { SunMoon } from "lucide-react";

interface NavbarProps {
  session: Session | null;
}

const Navbar = ({ session }: NavbarProps) => {
  const { style, toggleStyle } = useToolbarStyle();

  const modernStyles = "fixed w-full z-50 bg-gradient-to-b from-white via-white to-white/80 border-b border-gray-200 shadow-lg backdrop-blur-md";
  const classicStyles = "fixed w-full z-50 bg-white/95 border-b border-gray-200";

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={style === 'modern' ? modernStyles : classicStyles}
    >
      <div className="max-w-[2000px] mx-auto">
        <TopBar />

        <div className="flex justify-between items-center px-6 h-20 relative">
          {/* Left section */}
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className="group flex items-center space-x-2"
            >
              <motion.span 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`text-2xl font-bold ${
                  style === 'modern' 
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] bg-clip-text text-transparent group-hover:to-[#D946EF]' 
                    : 'text-gray-900 group-hover:text-primary'
                } transition-all duration-300`}
              >
                AI Civil Engineer
              </motion.span>
            </Link>

            <NavLinks />
          </div>

          {/* Right section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center space-x-4"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleStyle}
              className="mr-2"
              title={`Switch to ${style === 'modern' ? 'classic' : 'modern'} style`}
            >
              <SunMoon className="h-5 w-5" />
            </Button>
            <ActionButtons session={session} />
            <UserMenu session={session} />
            <MobileMenu session={session} />
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;