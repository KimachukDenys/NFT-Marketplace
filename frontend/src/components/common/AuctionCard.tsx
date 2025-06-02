import { useState } from 'react';
import { formatEther, parseEther, Contract } from 'ethers';

interface AuctionMeta {
  tokenId: number;
  seller: string;
  highestBid: bigint;
  highestBidder: string;
  buyNowPrice: bigint;
  minBidIncrement: bigint;
  endTime: number;
  metadata?: NFTMetadata;
}

interface Props {
  auction: AuctionMeta;
  nftImgUrl: string | undefined;
  auctionContract: Contract;
  disabled: boolean;
  refetch: () => void;
  currentAddress: string;
  onCancelAuction?: () => Promise<void>;
}

const ZERO = '0x0000000000000000000000000000000000000000';

const AuctionCard: React.FC<Props> = ({
  auction,
  nftImgUrl,
  auctionContract,
  disabled,
  refetch,
  currentAddress,
  onCancelAuction
}) => {
  const [bidEth, setBidEth] = useState('');
  const [endingTxPending, setEndingTxPending] = useState(false);
  const [isCancelingAuction, setIsCancelingAuction] = useState(false);

  const ended = Date.now() / 1000 >= auction.endTime;

  const isAuctionInvalid =
    auction.seller === ZERO ||
    auction.endTime === 0;

  if (isAuctionInvalid) return null;

  const canEndAuction =
    auction.highestBidder.toLowerCase() === currentAddress.toLowerCase() ||
    auction.seller.toLowerCase() === currentAddress.toLowerCase();

  const placeBid = async () => {
    try {
      const tx = await auctionContract.placeBid(auction.tokenId, {
        value: parseEther(bidEth),
        gasLimit: 300000
      });
      await tx.wait();
      refetch();
      setBidEth('');
    } catch (err) {
      console.error('Place bid error:', err);
    }
  };

  const buyNow = async () => {
    try {
      const tx = await auctionContract.buyNow(auction.tokenId, {
        value: auction.buyNowPrice,
      });
      await tx.wait();
      refetch();
    } catch (err) {
      console.error('Buy now error:', err);
    }
  };

  const endAuction = async () => {
    setEndingTxPending(true);
    try {
      const tx = await auctionContract.endAuction(auction.tokenId);
      await tx.wait();
      refetch();
    } catch (err) {
      console.error('End auction error:', err);
    } finally {
      setEndingTxPending(false);
    }
  };

  const handleCancelAuction = async () => {
    if (!onCancelAuction) return;
    setIsCancelingAuction(true);
    try {
      await onCancelAuction();
      refetch();
    } catch (err) {
      console.error('Cancel auction error:', err);
    } finally {
      setIsCancelingAuction(false);
    }
  };

  return (
    <div className="border p-4 rounded shadow w-72">
      {nftImgUrl && (
        <img src={nftImgUrl} alt={`NFT #${auction.tokenId}`} className="mb-2" style={{ maxWidth: 150 }} />
      )}

      <h3 className="font-semibold mb-1">NFT #{auction.tokenId}</h3>
      <p className="text-sm mb-1">
        Seller: {auction.seller.slice(0, 6)}…{auction.seller.slice(-4)}
      </p>
      <p className="text-sm mb-1">
        Highest Bid:&nbsp;
        {auction.highestBid === 0n ? '—' : formatEther(auction.highestBid) + ' ETH'}
      </p>
      <p className="text-sm mb-1">
        Buy Now: {formatEther(auction.buyNowPrice)} ETH
      </p>
      <p className="text-sm mb-2">
        Ends&nbsp;{new Date(auction.endTime * 1000).toLocaleString()}
      </p>

      {/* Cancel auction button before bidding */}
      {currentAddress.toLowerCase() === auction.seller.toLowerCase() &&
        auction.highestBid === 0n &&
        !ended && (
          <button
            onClick={handleCancelAuction}
            disabled={isCancelingAuction}
            className="bg-yellow-500 text-white w-full py-1 rounded mb-2"
          >
            {isCancelingAuction ? 'Скасування…' : 'Скасувати аукціон'}
          </button>
        )}

      {ended ? (
        <>
          <p className="text-red-600 text-center mb-2">Аукціон завершено</p>
          {canEndAuction && (
            <button
              onClick={endAuction}
              disabled={disabled || endingTxPending}
              className="bg-blue-600 text-white w-full py-1 rounded"
            >
              {endingTxPending ? 'Завершення…' : 'Завершити аукціон'}
            </button>
          )}
        </>
      ) : (
        <>
          <input
            className="border p-1 w-full mb-2"
            placeholder="Bid, ETH"
            value={bidEth}
            onChange={e => setBidEth(e.target.value)}
            disabled={disabled}
          />
          <button
            onClick={placeBid}
            disabled={disabled || !bidEth}
            className="bg-green-600 text-white w-full py-1 rounded mb-1"
          >
            Ставка
          </button>
          <button
            onClick={buyNow}
            disabled={disabled}
            className="bg-red-600 text-white w-full py-1 rounded"
          >
            Buy&nbsp;Now
          </button>
        </>
      )}
    </div>
  );
};

export default AuctionCard;
