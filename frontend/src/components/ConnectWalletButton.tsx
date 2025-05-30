import { useState } from 'react';

interface ConnectWalletButtonProps {
  setAccount: (address: string | null) => void;
}

const ConnectWalletButton = ({ setAccount }: ConnectWalletButtonProps) => {
  const [address, setAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request<string[]>({ 
          method: 'eth_requestAccounts' 
        });
        if (accounts && accounts.length > 0) {
          const userAddress = accounts[0];
          if (userAddress) {
            setAddress(userAddress);
            setAccount(userAddress);
          } else {
            setAddress(null);
            setAccount(null);
          }
        } else {
          alert('No accounts found');
          setAddress(null);
          setAccount(null);
        }
      } catch (error) {
        console.error('User rejected connection', error);
        setAddress(null);
        setAccount(null);
      }
    } else {
      alert('MetaMask not detected');
      setAddress(null);
      setAccount(null);
    }
  };

  return (
    <div>
      {address ? (
        <p>Connected: {address}</p>
      ) : (
        <button onClick={connectWallet}>Connect MetaMask</button>
      )}
    </div>
  );
};

export default ConnectWalletButton;