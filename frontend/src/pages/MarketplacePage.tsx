import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { NftCard } from "../components/common/NftCard";
import { mynftAddress, mynftAbi } from '../constants/MyNFT';
import { marketplaceAddress, marketplaceAbi } from '../constants/Marketplace';
import { useAppContext } from '../AppContext';

export const MarketplacePage = () => {
  const { account } = useAppContext();
  const [listedNfts, setListedNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const loadListedNFTs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const signer = await getProviderAndSigner();
      const nftContract = new ethers.Contract(mynftAddress, mynftAbi, signer);
      const marketContract = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

      const [listedIds, listings] = await marketContract.getAllListings();
      const loadedNfts: NFT[] = [];

      for (let i = 0; i < listedIds.length; i++) {
        const tokenId = Number(listedIds[i]);
        const listing = listings[i];
        
        try {
          const tokenURI = await nftContract.tokenURI(tokenId);
          let metadata: NFTMetadata | undefined;

          if (tokenURI.startsWith('ipfs://')) {
            const ipfsHash = tokenURI.replace('ipfs://', '');
            try {
              const response = await fetch(convertIpfsUrl(tokenURI));
              if (!response.ok) throw new Error('Failed to fetch metadata');
              metadata = await response.json();
            } catch (e) {
              console.error('Error fetching metadata:', e);
              try {
                const fallbackResponse = await fetch(`https://gateway.ipfs.io/ipfs/${ipfsHash}`);
                if (fallbackResponse.ok) {
                  metadata = await fallbackResponse.json();
                }
              } catch (fallbackError) {
                console.error('Fallback gateway also failed:', fallbackError);
              }
            }
          }

          loadedNfts.push({
            tokenId,
            owner: await nftContract.ownerOf(tokenId),
            price: ethers.formatEther(listing.price),
            seller: listing.seller,
            isListed: true,
            metadata
          });
        } catch (e) {
          console.error(`Error loading NFT ${tokenId}:`, e);
        }
      }

      setListedNfts(loadedNfts);
    } catch (error) {
      console.error("Error loading marketplace NFTs:", error);
      setError("Failed to load marketplace data");
    } finally {
      setIsLoading(false);
    }
  };

  const buyNFT = async (tokenId: number, price: string) => {
    if (!account) {
      alert("Please connect your wallet to buy NFTs");
      return;
    }

    try {
      setIsLoading(true);
      const signer = await getProviderAndSigner();
      const market = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);
      
      const tx = await market.buyItem(tokenId, {
        value: ethers.parseEther(price),
      });
      
      await tx.wait();
      alert('NFT purchased successfully!');
      await loadListedNFTs();
    } catch (error) {
      console.error("Purchase error:", error);
      alert(`Purchase failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListedNFTs();
    
    const interval = setInterval(loadListedNFTs, 30000);
    return () => clearInterval(interval);
  }, [account]);

  if (isLoading && listedNfts.length === 0) {
    return <div className="container">Loading marketplace...</div>;
  }

  if (error) {
    return <div className="container">{error}</div>;
  }

  return (
    <div className="container">
      <h2>NFT Marketplace</h2>
      <p>Browse and purchase NFTs listed by other users</p>
      
      {listedNfts.length === 0 ? (
        <p>No NFTs currently listed for sale</p>
      ) : (
        <div className="nft-grid">
          {listedNfts.map(nft => (
            <div key={nft.tokenId} className="nft-card-wrapper">
              <NftCard 
                nft={nft}
                onBuy={buyNFT}
                account={account}
                convertIpfsUrl={convertIpfsUrl}
              />
              {account && account.toLowerCase() !== nft.seller?.toLowerCase() && (
                <button 
                  onClick={() => buyNFT(nft.tokenId, nft.price || '0')}
                  className="buy-button"
                  disabled={isLoading}
                >
                  Buy for {nft.price} ETH
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};