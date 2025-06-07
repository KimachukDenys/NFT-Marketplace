import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { mynftAddress, mynftAbi } from './constants/MyNFT';
import { marketplaceAddress, marketplaceAbi } from './constants/Marketplace';
import { auctionAddress, auctionAbi } from './constants/Auction';
import { AppContext } from './context/AppContext';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [nftContract, setNftContract] = useState<Contract | null>(null);
  const [marketContract, setMarketContract] = useState<Contract | null>(null);
  const [auctionContract, setAuctionContract] = useState<Contract | null>(null);
  const [ipfsStatus, setIpfsStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    const initContracts = async () => {
      if (window.ethereum && account) {
        const newProvider = new BrowserProvider(window.ethereum);
        setProvider(newProvider);
        
        const signer = await newProvider.getSigner();
        setNftContract(new Contract(mynftAddress, mynftAbi, signer));
        setMarketContract(new Contract(marketplaceAddress, marketplaceAbi, signer));
        setAuctionContract(new Contract(auctionAddress, auctionAbi, signer));
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
    const interval = setInterval(checkIPFSConnection, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('📡 Provider:', provider);
    console.log('👤 Account:', account);
    console.log('🧬 IPFS:', ipfsStatus);
  }, [provider, account, ipfsStatus]);


  const value: AppContextType = {
    account,
    setAccount,
    provider,
    nftContract,
    marketContract,
    auctionContract,
    ipfsStatus
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};