import React from "react";
import { Link } from "react-router-dom";
import ConnectWalletButton from "../ConnectWalletButton";
import { useAppContext } from '../../AppContext';

const Navbar: React.FC = () => {
  const { setAccount } = useAppContext();

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-blue-600 text-white shadow-md">
      <h1 className="text-xl font-bold">NFT Marketplace</h1>
      <div className="space-x-4 flex items-center">
        <Link to="/" className="hover:underline">Marketplace</Link>
        <Link to="/mint" className="hover:underline">Mint NFT</Link>
        <Link to="/my-nfts" className="hover:underline">My NFTs</Link>
        <ConnectWalletButton setAccount={setAccount} />
      </div>
    </nav>
  );
};

export default Navbar;
