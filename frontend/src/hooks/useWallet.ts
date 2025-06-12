// src/hooks/useWallet.ts
import { useState } from "react";
import { ethers } from "ethers";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  async function connectWallet() {
    if (window.ethereum) {
      try {
        console.log("it`s hook")
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await ethProvider.send("eth_accounts", []);
        setAddress(accounts[0]);
        setProvider(ethProvider);
        console.log("Connected:", accounts[0]);
      } catch (err) {
        console.error("User rejected the request", err);
      }
    } else {
      alert("Please install MetaMask!");
    }
  }

  return { address, connectWallet, provider };
}
