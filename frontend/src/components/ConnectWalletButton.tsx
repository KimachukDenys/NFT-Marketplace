import { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw } from 'react-icons/fi'; // Іконка оновлення
import './ConnectWalletButton.css';

interface ConnectWalletButtonProps {
  setAccount: (address: string | null) => void;
}

const ConnectWalletButton = ({ setAccount }: ConnectWalletButtonProps) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);


  const connectWallet = async () => {
    setIsSpinning(true);
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request<string[]>({
          method: 'eth_requestAccounts',
        });

        const userAddress = accounts?.[0] ?? null;

        if (userAddress) {
          setAddress(userAddress);
          setAccount(userAddress);
          localStorage.setItem('userAddress', userAddress); // збереження
        } else {
          handleDisconnect();
        }
      } catch (error) {
        console.error('User rejected connection', error);
        handleDisconnect();
      }
    } else {
      alert('MetaMask not detected');
      handleDisconnect();
    }
    setTimeout(() => setIsSpinning(false), 500);
  };

  const handleDisconnect = () => {
    setAddress(null);
    setAccount(null);
    localStorage.removeItem('userAddress');
  };

  const restoreAddress = useCallback(() => {
    const saved = localStorage.getItem('userAddress');
    if (saved) {
      setAddress(saved);
      setAccount(saved);
    }
  }, [setAccount]);

  useEffect(() => {
    restoreAddress();
  }, [restoreAddress]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {address ? (
        <>
          <p style={{ margin: 0 }}>
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </p>
         <a
            onClick={(e) => {
              e.preventDefault();
              connectWallet();
            }}
            title="Оновити адресу"
            className={`refresh-icon ${isSpinning ? 'spin' : ''}`}
            href="#"
          >
            <FiRefreshCw size={18} />
          </a>
        </>
      ) : (
        <button onClick={connectWallet}>Connect MetaMask</button>
      )}
    </div>
  );
};

export default ConnectWalletButton;