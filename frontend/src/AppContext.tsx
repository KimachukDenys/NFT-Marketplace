import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react'; // Додано type-only import
import { BrowserProvider, Contract } from 'ethers';
import { mynftAddress, mynftAbi } from './constants/MyNFT';
import { marketplaceAddress, marketplaceAbi } from './constants/Marketplace';

interface AppContextType {
  account: string | null;
  setAccount: (account: string | null) => void;
  provider: BrowserProvider | null;
  nftContract: Contract | null;
  marketContract: Contract | null;
  ipfsStatus: 'connecting' | 'connected' | 'error';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [nftContract, setNftContract] = useState<Contract | null>(null);
  const [marketContract, setMarketContract] = useState<Contract | null>(null);
  const [ipfsStatus, setIpfsStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    const initContracts = async () => {
      if (window.ethereum && account) {
        const newProvider = new BrowserProvider(window.ethereum);
        setProvider(newProvider);
        
        const signer = await newProvider.getSigner();
        setNftContract(new Contract(mynftAddress, mynftAbi, signer));
        setMarketContract(new Contract(marketplaceAddress, marketplaceAbi, signer));
      }
    };

    initContracts();
  }, [account]);

  useEffect(() => {
    const checkIPFSConnection = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/v0/id', {
          method: 'POST'
        });
        if (!response.ok) throw new Error('IPFS not responding');
        setIpfsStatus('connected');
      } catch (err) {
        console.error('IPFS connection error:', err);
        setIpfsStatus('error');
      }
    };

    checkIPFSConnection();
    const interval = setInterval(checkIPFSConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    account,
    setAccount,
    provider,
    nftContract,
    marketContract,
    ipfsStatus
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}