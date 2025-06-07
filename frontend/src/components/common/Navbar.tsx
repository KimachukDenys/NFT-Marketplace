import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConnectWalletButton from "../ConnectWalletButton";
import { useAppContext } from '../../hooks/useAppContext';
import { FiSun, FiMoon } from "react-icons/fi";

const Navbar: React.FC = () => {
  const { setAccount } = useAppContext();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });

  // При зміні theme оновлюємо атрибут data-theme на <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-blue-600 text-white shadow-md" 
         style={{ backgroundColor: 'var(--accent-color)' }}>
      <Link to="/" className="text-xl font-bold">NFT Marketplace</Link>
      <div className="space-x-4 flex items-center">
        <Link to="/marketplace" className="hover:underline">Marketplace</Link>
        <Link to="/mint" className="hover:underline">Mint NFT</Link>
        <Link to="/my-nfts" className="hover:underline">My NFTs</Link>
        <Link to="/auction" className="hover:underline">Auction</Link>

        {/* Перемикач теми */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full transition"
          style={{
            backgroundColor: theme === "light" ? "rgba(255, 255, 255, 0.2)" : "rgba(0,0,0,0.2)",
            color: theme === "light" ? "#000" : "#fff"
          }}
          title="Toggle theme"
        >
          {theme === "light" ? <FiMoon size={18} /> : <FiSun size={18} />}
        </button>

        <ConnectWalletButton setAccount={setAccount} />
      </div>
    </nav>
  );
};

export default Navbar;
