import { useState } from 'react';
import { formatEther, parseEther, Contract } from 'ethers';
import { Link } from "react-router-dom";

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
  const isAuctionInvalid = auction.seller === ZERO || auction.endTime === 0;
  if (isAuctionInvalid) return null;

  const canEndAuction =
    auction.highestBidder.toLowerCase() === currentAddress.toLowerCase() ||
    auction.seller.toLowerCase() === currentAddress.toLowerCase();

  const placeBid = async () => {
    try {
      const tx = await auctionContract.placeBid(auction.nftAddress, auction.tokenId, {
        value: parseEther(bidEth),
        gasLimit: 300000
      });
      await tx.wait();
      refetch();
      setBidEth('');
    } catch (err) {
      console.error('Помилка виставлення ставки:', err);
    }
  };

  const buyNow = async () => {
    try {
      const tx = await auctionContract.buyNow(auction.nftAddress, auction.tokenId, {
        value: auction.buyNowPrice,
      });
      await tx.wait();
      refetch();
    } catch (err) {
      console.error('Помилка покупки зараз:', err);
    }
  };

  const endAuction = async () => {
    setEndingTxPending(true);
    try {
      const tx = await auctionContract.endAuction(auction.nftAddress, auction.tokenId);
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
      console.error('Помилка скасування:', err);
    } finally {
      setIsCancelingAuction(false);
    }
  };

  return (
    <div className="max-w-[18rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-md p-4 w-80 hover:shadow-lg transition-all">
      {nftImgUrl && (
        <Link to={`/auction/${auction.tokenId}`}>
          <img
            src={nftImgUrl}
            alt={`NFT #${auction.tokenId}`}
            className="rounded-xl w-full h-56 object-cover mb-4"
          />
        </Link>
      )}

      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">NFT #{auction.tokenId}</h3>
        <p className="text-sm text-gray-500">Продавець: {auction.seller.slice(0, 6)}…{auction.seller.slice(-4)}</p>
        <p className="text-sm text-gray-500">
          Найвища ставка:{' '}
          <span className="text-gray-900 dark:text-white font-medium">
            {auction.highestBid === 0n ? '—' : formatEther(auction.highestBid) + ' ETH'}
          </span>
        </p>
        <p className="text-sm text-gray-500">
          Купити зараз: <span className="text-green-600 dark:text-green-400 font-medium">{formatEther(auction.buyNowPrice)} ETH</span>
        </p>
        <p className="text-sm text-gray-400">
          Закінчується: {new Date(auction.endTime * 1000).toLocaleString()}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {currentAddress.toLowerCase() === auction.seller.toLowerCase() &&
          auction.highestBid === 0n &&
          !ended && (
            <button
              onClick={handleCancelAuction}
              disabled={isCancelingAuction}
              className="w-full danger text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
            >
              {isCancelingAuction ? 'Скасування…' : 'Скасувати аукціон'}
            </button>
          )}

        {ended ? (
          <>
            <p className="text-center text-sm text-red-600 dark:text-red-400">Аукціон завершено</p>
            {canEndAuction && (
              <button
                onClick={endAuction}
                disabled={disabled || endingTxPending}
                className="w-full text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
              >
                {endingTxPending ? 'Завершення…' : 'Завершити аукціон'}
              </button>
            )}
          </>
        ) : (
          <>
            {(auction.highestBid !== 0n || currentAddress.toLowerCase() !== auction.seller.toLowerCase()) && (
              <>
                <input
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white p-2 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  placeholder={`Ставка, ETH ${auction.minBidIncrement>auction.highestBid ? `(${formatEther(auction.minBidIncrement)} min)` : `(${formatEther(auction.highestBid)} min)`}`}
                  value={bidEth}
                  onChange={e => setBidEth(e.target.value)}
                  disabled={disabled}
                />
                <button
                  onClick={placeBid}
                  disabled={disabled || !bidEth}
                  className="w-full font-medium py-2 rounded-lg transition disabled:opacity-50"
                >
                  Ставка
                </button>
                <button
                  onClick={buyNow}
                  disabled={disabled}
                  className="w-full font-medium py-2 rounded-lg transition disabled:opacity-50"
                >
                  Купити зараз
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuctionCard;
