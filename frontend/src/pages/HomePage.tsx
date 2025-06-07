import { useState } from 'react';
import { useMarketplaceData } from '../hooks/useMarketplace';
import { NftCard } from '../components/common/NftCard';
import { NftModal } from '../modals/NftModal';

const HomePage = () => {
  const { nfts, account, onBuy, convertIpfsUrl } = useMarketplaceData();
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (nft: NFT) => {
    setSelectedNft(nft);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNft(null);
  };

  const latestNfts = nfts.slice(-10).reverse(); // останні 10 NFT

  return (
    <div>
      <h1>Головна</h1>
      <div className="nft-grid">
        {latestNfts.map(nft => (
          <NftCard
            key={nft.tokenId}
            nft={nft}
            onBuy={onBuy}
            account={account}
            convertIpfsUrl={convertIpfsUrl}
            onClick={() => openModal(nft)}
          />
        ))}
      </div>

      <NftModal
        nft={selectedNft}
        isOpen={isModalOpen}
        onClose={closeModal}
        onBuy={onBuy}
        onCancel={undefined}
        account={account}
        convertIpfsUrl={convertIpfsUrl}
      />
    </div>
  );
};

export default HomePage;
