import { useState, useEffect, useCallback  } from 'react';
import { ethers } from 'ethers';
import { mynftAddress, mynftAbi } from '../constants/MyNFT';
import { marketplaceAddress, marketplaceAbi } from '../constants/Marketplace';
import { useAppContext } from './useAppContext';

export const useMarketplaceData = () => {
  const { account } = useAppContext();
  const [listedNfts, setListedNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getProviderAndSigner = async () => {
    const provider = new ethers.BrowserProvider(
      window.ethereum as unknown as ethers.Eip1193Provider
    );
    return provider.getSigner();
  };

  const convertIpfsUrl = (ipfsUrl: string) => {
    if (!ipfsUrl) return '';
    if (ipfsUrl.startsWith('http')) return ipfsUrl;
    if (ipfsUrl.startsWith('ipfs://')) {
      const hash = ipfsUrl.replace('ipfs://', '');
      return `http://localhost:8080/ipfs/${hash}`;
    }
    return ipfsUrl;
  };

  const loadListedNFTs = useCallback(async () => {
    setIsLoading(true);
    try {
      const signer = await getProviderAndSigner();
      const nftContract = new ethers.Contract(mynftAddress, mynftAbi, signer);
      const marketContract = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);
      const [keys, listings] = await marketContract.getAllListings();

      const loadedNfts: NFT[] = [];

      for (let i = 0; i < keys.length; i++) {
        const { nft: mynftAddress, tokenId } = keys[i];
        const listing = listings[i];
        try {
          const tokenURI = await nftContract.tokenURI(tokenId);
          let metadata: NFTMetadata | undefined;

          if (tokenURI.startsWith('ipfs://')) {
            const response = await fetch(convertIpfsUrl(tokenURI));
            if (response.ok) {
              metadata = await response.json();
            }
          }

          loadedNfts.push({
            nftAddress: mynftAddress,
            tokenId,
            owner: await nftContract.ownerOf(tokenId),
            price: ethers.formatEther(listing.price),
            seller: listing.seller,
            isListed: true,
            metadata
          });
        } catch (e) {
          console.error(`Error loading NFT ${tokenId}`, e);
        }
      }

      setListedNfts(loadedNfts);
    } catch (e) {
      console.error("Error loading NFTs", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListedNFTs();
  }, [account, loadListedNFTs]);

  const buyNFT = async (tokenId: number, price: string) => {
    if (!account) {
      alert("Під’єднай гаманець");
      return;
    }

    try {
      const signer = await getProviderAndSigner();
      const market = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

      const tx = await market.buyItem(mynftAddress, tokenId, {
        value: ethers.parseEther(price),
      });

      await tx.wait();
      alert("NFT куплено успішно");
      loadListedNFTs();
    } catch (e) {
      console.error("Buy error", e);
    }
  };

  const cancelListing = async (tokenId: number) => {
    try {
      const signer = await getProviderAndSigner();
      const market = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);
      
      const tx = await market.cancelListing(mynftAddress, tokenId);
      
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert('Listing canceled successfully!');
        loadListedNFTs();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error("Cancel listing error:", error);
      throw error;
    }
  };

  return {
    nfts: listedNfts,
    account,
    onBuy: buyNFT,
    convertIpfsUrl,
    onCancel: cancelListing,
    reload: loadListedNFTs,
    isLoading
  };
};
