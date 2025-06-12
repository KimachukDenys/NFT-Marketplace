import { useState } from 'react';
import { useMarketplaceData } from '../hooks/useMarketplace';
import { NftCard } from '../components/common/NftCard';
import { NftModal } from '../modals/NftModal';
import Iridescence from './Iridescence';

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
    <div className="relative">
      {/* Фон з гаслом */}
      <div style={{ height: '650px' }} className="relative overflow-hidden">
        <Iridescence color={[1, 1, 1]} mouseReact={false} amplitude={0.1} speed={1.0} />
      </div>

      {/* NFT-картки */}
      <div className="max-w-7xl mx-auto py-10 px-4">
        <h2 className="text-2xl font-bold mb-6">Останні NFT</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
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
      </div>

      {/* Модальне вікно */}
      <NftModal
        nft={selectedNft}
        isOpen={isModalOpen}
        onClose={closeModal}
        onBuy={onBuy}
        onCancel={undefined}
        account={account}
        convertIpfsUrl={convertIpfsUrl}
      />

      {/* Блок "Про проєкт" */}
      <div className="bg-gray-100 dark:bg-gray-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-semibold mb-4">Що таке NFT Marketplace?</h3>
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            Це децентралізована платформа, що дозволяє творцям виставляти свої NFT, а користувачам — купувати, продавати або брати участь в аукціонах.
            Ми підтримуємо відкритість, справедливість і безпечні транзакції на блокчейні.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
