import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer
      className="bg-blue-600 text-white py-10 px-6 shadow-inner"
      style={{ backgroundColor: 'var(--accent-color)' }}
    >
      <div className="max-w-7xl mx-auto text-center">
        {/* Гасло */}
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">
          Відкрий для себе цифрове мистецтво майбутнього
        </h2>
        <p className="text-sm md:text-base mb-8 text-white/90">
          Купуй, продавай і створюй унікальні NFT на децентралізованому маркетплейсі.
        </p>

        {/* Посилання */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm mb-6">
          <Link to="/marketplace" className="hover:underline">Marketplace</Link>
          <Link to="/mint" className="hover:underline">Mint NFT</Link>
          <Link to="/auction" className="hover:underline">Аукціон</Link>
          <Link to="/terms" className="hover:underline">Умови</Link>
          <Link to="/privacy" className="hover:underline">Конфіденційність</Link>
        </div>

        {/* Лінія та авторські права */}
        <hr className="border-white/30 mb-4" />
        <p className="text-xs text-white/70">
          © {new Date().getFullYear()} NFT Marketplace. Усі права захищені.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
