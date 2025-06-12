import React, { useState } from "react";

interface Props {
  nft: NFT;
  onApprove?: () => Promise<boolean>;
  onList?: (priceEth: string) => Promise<void>;
  onCancel?: () => Promise<void>;
  onStartAuction?: (tokenId: number) => void;
  onBuy?: (tokenId: number, price: string) => Promise<void>;
  account?: string | null;
  convertIpfsUrl: (u: string) => string;
  onClick?: () => void;
}

export const NftCard: React.FC<Props> = ({
  nft,
  onApprove,
  onList,
  onCancel,
  onBuy,
  onStartAuction,
  account,
  convertIpfsUrl,
  onClick,
}) => {
  const [price, setPrice] = useState("0.01");
  const [isApproving, setIsApproving] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onApprove) return;
    setIsApproving(true);
    try {
      await onApprove();
    } finally {
      setIsApproving(false);
    }
  };

  const handleList = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onList) return;
    setIsListing(true);
    try {
      await onList(price);
    } finally {
      setIsListing(false);
    }
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onCancel) return;
    setIsCanceling(true);
    try {
      await onCancel();
    } finally {
      setIsCanceling(false);
    }
  };

  const handleBuy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onBuy || !nft.price) return;
    setIsBuying(true);
    try {
      await onBuy(nft.tokenId, nft.price);
    } finally {
      setIsBuying(false);
    }
  };

  const handleStartAuction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStartAuction) {
      onStartAuction(nft.tokenId);
    }
  };

  return (
    <div
      className="max-w-[15rem] rounded-2xl shadow-lg bg-white dark:bg-zinc-900 hover:shadow-xl transition duration-300 cursor-pointer flex flex-col"
      onClick={onClick}
    >
      {nft.metadata?.image && (
        <div className="w-full relative h-54">  
          <img
            src={convertIpfsUrl(nft.metadata.image)}
            alt={nft.metadata?.name}
            className="w-full h-full object-contain mb-3"
          />
        </div>
      )}
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
          {nft.metadata?.name ?? `NFT #${nft.tokenId}`}
        </h3>

        {!nft.isListed ? (
          <div className="mt-2 ml-2">
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ціна, ETH"
              onClick={(e) => e.stopPropagation()}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-2 dark:bg-zinc-800 dark:text-white"
              />

            <div className="flex flex-wrap gap-2">
              {onApprove && (
                <button
                onClick={handleApprove}
                disabled={isApproving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm"
                >
                  {isApproving ? "Підтвердження..." : "Підтвердити"}
                </button>
              )}
              {onList && (
                <button
                onClick={handleList}
                disabled={isListing || Number(price) <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-sm"
                >
                  {isListing ? "Виставлення..." : "Маркетплейс"}
                </button>
              )}
              {onStartAuction && (
                <button
                onClick={handleStartAuction}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded-md text-sm"
                >
                  Аукціон
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Ціна:</strong> {nft.price} ETH
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Продавець: {nft.seller?.slice(0, 6)}…{nft.seller?.slice(-4)}
            </p>

            <div className="flex gap-2 mt-3">
              {onCancel && (
                <button
                onClick={handleCancel}
                disabled={isCanceling}
                className="danger flex-1 py-1 px-3 rounded-md text-sm"
                >
                  {isCanceling ? "Скасування..." : "Скасувати"}
                </button>
              )}
              {onBuy &&
                account &&
                account.toLowerCase() !== nft.seller?.toLowerCase() && (
                  <button
                  onClick={handleBuy}
                  disabled={isBuying}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm"
                  >
                    {isBuying ? "Купівля..." : "Купити"}
                  </button>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
