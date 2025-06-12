import { useState, useMemo } from 'react';
import { NftCard } from "../components/common/NftCard";
import { NftFilters } from '../components/common/NftFilters';
import { NftModal } from '../modals/NftModal';
import { useMarketplaceData } from '../hooks/useMarketplace';

export const MarketplacePage = () => {
  const {
    nfts,
    account,
    onBuy,
    convertIpfsUrl,
    onCancel,
    isLoading
  } = useMarketplaceData();

  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest'
  });

  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (nft: NFT) => {
    setSelectedNft(nft);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedNft(null);
    setIsModalOpen(false);
  };

  const filteredNfts = useMemo(() => {
    return nfts.filter(nft => {
      const matchesSearch = filters.searchQuery === '' ||
        nft.metadata?.name?.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const price = parseFloat(nft.price || '0');
      const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : 0;
      const maxPrice = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;

      return matchesSearch && price >= minPrice && price <= maxPrice;
    }).sort((a, b) => {
      const priceA = parseFloat(a.price || '0');
      const priceB = parseFloat(b.price || '0');

      switch (filters.sortBy) {
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'newest':
        default:
          return Number(b.tokenId) - Number(a.tokenId);
      }
    });
  }, [nfts, filters]);

  const minAvailablePrice = useMemo(() => {
    if (nfts.length === 0) return 0;
    return Math.floor(Math.min(...nfts.map(nft => parseFloat(nft.price || '0'))) * 100) / 100;
  }, [nfts]);

  const maxAvailablePrice = useMemo(() => {
    if (nfts.length === 0) return 10;
    return Math.ceil(Math.max(...nfts.map(nft => parseFloat(nft.price || '0'))) * 100) / 100;
  }, [nfts]);

  if (isLoading && nfts.length === 0) {
    return <div className="container">Завантаження NFT...</div>;
  }

  return (
    <div className="container">
      <h2>NFT Marketplace</h2>
      <p>Переглядайте та купуйте NFT, запропоновані іншими користувачами</p>

      <NftFilters
        onFilterChange={setFilters}
        minAvailablePrice={minAvailablePrice}
        maxAvailablePrice={maxAvailablePrice}
      />

      {filteredNfts.length === 0 ? (
        <p>Жоден NFT не відповідає вашим критеріям пошуку</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {filteredNfts.map(nft => (
            <NftCard
              key={nft.tokenId}
              nft={nft}
              onBuy={onBuy}
              account={account}
              convertIpfsUrl={convertIpfsUrl}
              onClick={() => openModal(nft)}
              onCancel={nft.isListed && account?.toLowerCase() === nft.seller?.toLowerCase()
                ? async () => onCancel(nft.tokenId)
                : undefined
              }
            />
          ))}
        </div>
      )}

      <NftModal
        nft={selectedNft}
        isOpen={isModalOpen}
        onClose={closeModal}
        onBuy={onBuy}
        account={account}
        convertIpfsUrl={convertIpfsUrl}
        onCancel={selectedNft && account?.toLowerCase() === selectedNft.seller?.toLowerCase()
          ? () => onCancel(selectedNft.tokenId)
          : undefined
        }
      />
    </div>
  );
};
