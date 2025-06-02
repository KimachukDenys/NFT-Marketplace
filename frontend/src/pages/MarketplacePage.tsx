import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { NftCard } from "../components/common/NftCard";
import { mynftAddress, mynftAbi } from '../constants/MyNFT';
import { marketplaceAddress, marketplaceAbi } from '../constants/Marketplace';
import { useAppContext } from '../hooks/useAppContext';
import { NftFilters } from '../components/common/NftFilters';

export const MarketplacePage = () => {
  const { account } = useAppContext();
  const [listedNfts, setListedNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest'
  });

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
  }, []);

  const filteredNfts = useMemo(() => {
    return listedNfts.filter(nft => {
      // Filter by search query
      const matchesSearch = filters.searchQuery === '' || 
        (nft.metadata?.name?.toLowerCase().includes(filters.searchQuery.toLowerCase()));
      
      // Filter by price range
      const price = parseFloat(nft.price || '0');
      const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : 0;
      const maxPrice = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
      const matchesPrice = price >= minPrice && price <= maxPrice;
      
      return matchesSearch && matchesPrice;
    }).sort((a, b) => {
      // Sort by selected option
      const priceA = parseFloat(a.price || '0');
      const priceB = parseFloat(b.price || '0');

      switch (filters.sortBy) {
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'newest':
        default:
          return b.tokenId - a.tokenId; // Assuming higher tokenId means newer
      }
    });
  }, [listedNfts, filters]);

  const buyNFT = async (tokenId: number, price: string) => {
    if (!account) {
      alert("Будьласка під'єднайте");
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
      alert('NFT куплено успішно!');
      await loadListedNFTs();
    } catch (error) {
      console.error("Помилка оплати:", error);
      alert(`Оплата провалена: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const minAvailablePrice = useMemo(() => {
    if (listedNfts.length === 0) return 0;
    return Math.floor(Math.min(...listedNfts.map(nft => parseFloat(nft.price || '0'))) * 100) / 100;
  }, [listedNfts]);

  const maxAvailablePrice = useMemo(() => {
    if (listedNfts.length === 0) return 10; // Дефолтне значення, якщо немає NFT
    return Math.ceil(Math.max(...listedNfts.map(nft => parseFloat(nft.price || '0'))) * 100) / 100;
  }, [listedNfts]);

  useEffect(() => {
    loadListedNFTs();
    
    const interval = setInterval(loadListedNFTs, 30000);
    return () => clearInterval(interval);
  }, [account, loadListedNFTs]);

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
      
      <NftFilters 
        onFilterChange={setFilters} 
        minAvailablePrice={minAvailablePrice} 
        maxAvailablePrice={maxAvailablePrice} 
      />
      
      {filteredNfts.length === 0 ? (
        <p>No NFTs match your search criteria</p>
      ) : (
        <div className="nft-grid">
          {filteredNfts.map(nft => (
            <NftCard 
              key={nft.tokenId}
              nft={nft}
              onBuy={buyNFT}
              account={account}
              convertIpfsUrl={convertIpfsUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
};