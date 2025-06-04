import React, { useState } from "react";

interface Props {
  nft: NFT;
  onApprove?: () => Promise<boolean>;
  onList?: (priceEth: string) => Promise<void>;
  onCancel?: () => Promise<void>;
  onStartAuction?: (tokenId: number) => void; // Змінено тут - додано параметр tokenId
  onBuy?: (tokenId: number, price: string) => Promise<void>;
  account?: string | null;
  convertIpfsUrl: (u: string) => string;
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
}) => {
  const [price, setPrice] = useState("0.01");
  const [isApproving, setIsApproving] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsApproving(true);
    try {
      await onApprove();
    } finally {
      setIsApproving(false);
    }
  };

  const handleList = async () => {
    if (!onList) return;
    setIsListing(true);
    try {
      await onList(price);
    } finally {
      setIsListing(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    setIsCanceling(true);
    try {
      await onCancel();
    } finally {
      setIsCanceling(false);
    }
  };

  const handleBuy = async () => {
    if (!onBuy || !nft.price) return;
    setIsBuying(true);
    try {
      await onBuy(nft.tokenId, nft.price);
    } finally {
      setIsBuying(false);
    }
  };


  const handleStartAuction = () => {
    if (onStartAuction) {
      onStartAuction(nft.tokenId); // Передаємо tokenId у функцію
    }
  };

  return (
    <div className="nft-card">
      {nft.metadata?.image && (
        <img
          src={convertIpfsUrl(nft.metadata.image)}
          alt={nft.metadata?.name}
          style={{ maxWidth: 150 }}
        />
      )}

      <h3>{nft.metadata?.name ?? `NFT #${nft.tokenId}`}</h3>
      <p>{nft.metadata?.description}</p>

      {!nft.isListed ? (
        <div className="owner-actions">
          <input
            type="text"
            value={price}
            className="price-input"
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Цiна, ETH"
          />

          <div className="action-buttons">
            {onApprove && (
              <button onClick={handleApprove} disabled={isApproving}>
                {isApproving ? "Підтвердження..." : "Підтвердити"}
              </button>
            )}

            {onList && (
              <button onClick={handleList} disabled={isListing || Number(price) <= 0}>
                {isListing ? "Виставлення..." : "Виставити"}
              </button>
            )}

            {onStartAuction && (
              <button onClick={handleStartAuction} className="mx-1">
                Аукціон
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="listing-info">
          <p className="mt-2">
            Цiна: <strong>{nft.price}</strong> ETH
          </p>
          <p className="text-xs text-gray-500">
            Продавець: {nft.seller?.slice(0, 6)}…{nft.seller?.slice(-4)}
          </p>

          {onCancel && (
            <button onClick={handleCancel} disabled={isCanceling} className="cancel-btn">
              {isCanceling ? "Скасування..." : "Скасувати лістинг"}
            </button>
          )}

          {onBuy && account && account.toLowerCase() !== nft.seller?.toLowerCase() && (
            <button onClick={handleBuy} disabled={isBuying} className="buy-btn">
              {isBuying ? "Купівля..." : "Купити"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};