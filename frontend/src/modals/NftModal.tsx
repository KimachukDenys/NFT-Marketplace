import React from "react";
import "./Modal.css"

interface NftModalProps {
  nft: NFT | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy?: (tokenId: number, price: string) => Promise<void>;
  onCancel?: () => Promise<void>;
  account?: string | null;
  convertIpfsUrl: (url: string) => string;
}

export const NftModal: React.FC<NftModalProps> = ({
  nft,
  isOpen,
  onClose,
  onBuy,
  onCancel,
  account,
  convertIpfsUrl,
}) => {
  if (!isOpen || !nft) return null;

  const isOwner = account?.toLowerCase() === nft.seller?.toLowerCase();

  return (
    <div className="fixed inset-0 bg-opacity-100 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg w-full max-w-3xl p-6 flex flex-col md:flex-row gap-6">
        {/* Зображення */}
        <img
          src={convertIpfsUrl(nft.metadata?.image || "")}
          alt={nft.metadata?.name}
          className="w-full md:w-1/2 rounded-xl object-cover"
        />

        {/* Інформація */}
        <div className="flex flex-col justify-between w-full">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {nft.metadata?.name ?? `NFT #${nft.tokenId}`}
            </h2>
            {nft.metadata?.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {nft.metadata.description}
              </p>
            )}
            <p className="text-lg text-gray-700 dark:text-gray-200 mb-2">
              <strong>Цiна:</strong> {nft.price} ETH
            </p>
            <p className="text-sm text-gray-500">
              Продавець: {nft.seller?.slice(0, 6)}...{nft.seller?.slice(-4)}
            </p>
          </div>

          {/* Кнопки */}
          <div className="mt-6 flex flex-wrap gap-3">
            {isOwner && onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 danger text-white px-4 py-2 rounded-md text-sm"
              >
                Скасувати лістинг
              </button>
            )}
            {!isOwner && onBuy && (
              <button
                onClick={() => onBuy(nft.tokenId, nft.price!)}
                className="flex-1 text-white px-4 py-2 rounded-md text-sm"
              >
                Купити
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-black dark:text-white px-4 py-2 rounded-md text-sm"
            >
              Закрити
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
