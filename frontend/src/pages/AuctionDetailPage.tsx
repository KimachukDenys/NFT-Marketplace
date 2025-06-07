import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Contract, EventLog, parseEther, formatEther, JsonRpcSigner } from 'ethers';
import { auctionAbi, auctionAddress } from '../constants/Auction';
import { mynftAbi, mynftAddress } from '../constants/MyNFT';
import { useAppContext } from '../hooks/useAppContext';



const ipfsToHttp = (ipfsUrl: string) => {
  if (!ipfsUrl) return '';
  if (ipfsUrl.startsWith('ipfs://')) {
    return `http://localhost:8080/ipfs/${ipfsUrl.replace('ipfs://', '')}`;
  }
  return ipfsUrl;
};

const AuctionDetailPage = () => {
  const { id } = useParams();
  const tokenId = Number(id);
  const { provider } = useAppContext();

  const [auction, setAuction] = useState<AuctionMeta | null>(null);
  const [bids, setBids] = useState<{ bidder: string; amount: string; time: number }[]>([]);
  const [imgUrl, setImgUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const [bidEth, setBidEth] = useState('');
  const [endingTxPending, setEndingTxPending] = useState(false);
  const [isCancelingAuction, setIsCancelingAuction] = useState(false);
  const [signerAddress, setSignerAddress] = useState('');
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  useEffect(() => {
    const setupSigner = async () => {
      if (provider) {
        const s = await provider.getSigner();
        setSigner(s);
        const address = await s.getAddress();
        setSignerAddress(address);
      }
    };
    setupSigner();
  }, [provider]);

  const auctionContract = signer
    ? new Contract(auctionAddress, auctionAbi, signer)
    : null;

  const ended = auction ? Date.now() / 1000 >= auction.endTime : false;
  const canEndAuction = auction && signerAddress
    ? [auction.seller, auction.highestBidder]
        .map(a => a?.toLowerCase())
        .includes(signerAddress.toLowerCase())
    : false;
  const isSeller = auction && signerAddress
    ? auction.seller.toLowerCase() === signerAddress.toLowerCase()
    : false;

  useEffect(() => {
    const fetchAuctionData = async () => {
      if (!provider || isNaN(tokenId)) return;

      const auctionContract = new Contract(auctionAddress, auctionAbi, provider);
      const nftContract = new Contract(mynftAddress, mynftAbi, provider);

      try {
        const a = await auctionContract.auctions(mynftAddress, tokenId);
        if (!a || a.seller === '0x0000000000000000000000000000000000000000') return;

        let metadata: NFTMetadata | undefined;
        try {
          const uri = await nftContract.tokenURI(tokenId);
          const res = await fetch(ipfsToHttp(uri));
          metadata = await res.json();
          if (metadata?.image) {
            setImgUrl(ipfsToHttp(metadata.image));
          }
        } catch (err) {
          console.warn('Metadata fetch failed:', err);
        }

        setAuction({
          nftAddress: mynftAddress,
          tokenId,
          seller: a.seller,
          highestBid: a.highestBid,
          highestBidder: a.highestBidder,
          buyNowPrice: a.buyNowPrice,
          minBidIncrement: a.minBidIncrement,
          endTime: Number(a.endTime),
          metadata,
        });

        const rawEvents = await auctionContract.queryFilter(
          auctionContract.filters.BidPlaced(mynftAddress, tokenId),
          0,
          'latest'
        );

        const events = rawEvents as EventLog[];

        const history = await Promise.all(
          events.map(async (e) => {
            const block = await provider.getBlock(e.blockNumber);
            return {
              bidder: e.args?.bidder,
              amount: formatEther(e.args?.amount),
              time: block?.timestamp ?? 0,
            };
          })
        );

        setBids(history.reverse());
      } catch (err) {
        console.error('Error fetching auction:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionData();
  }, [provider, tokenId]);

  const placeBid = async () => {
    if (!auctionContract || !auction) return;
    try {
      const tx = await auctionContract.placeBid(mynftAddress, auction.tokenId, {
        value: parseEther(bidEth),
        gasLimit: 300000
      });
      await tx.wait();
      window.location.reload();
    } catch (err) {
      console.error('Помилка ставки:', err);
    }
  };

  const buyNow = async () => {
    if (!auctionContract || !auction) return;
    try {
      const tx = await auctionContract.buyNow(mynftAddress, auction.tokenId, {
        value: auction.buyNowPrice
      });
      await tx.wait();
      window.location.reload();
    } catch (err) {
      console.error('Buy now error:', err);
    }
  };

  const endAuction = async () => {
    if (!auctionContract || !auction) return;
    setEndingTxPending(true);
    try {
      const tx = await auctionContract.endAuction(auction.tokenId);
      await tx.wait();
      window.location.reload();
    } catch (err) {
      console.error('End error:', err);
    } finally {
      setEndingTxPending(false);
    }
  };

  const cancelAuction = async () => {
    if (!auctionContract || !auction) return;
    setIsCancelingAuction(true);
    try {
      const tx = await auctionContract.cancelAuction(mynftAddress, auction.tokenId);
      await tx.wait();
      window.location.reload();
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setIsCancelingAuction(false);
    }
  };

  if (loading) return <div className="p-4">Завантаження...</div>;
  if (!auction) return <div className="p-4">Аукціон не знайдено</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Аукціон для NFT #{auction.tokenId}</h1>

      {imgUrl && (
        <img src={imgUrl} alt={`NFT ${auction.tokenId}`} className="w-64 mb-4 rounded" />
      )}

      <div className="mb-4">
        <p><strong>Назва:</strong> {auction.metadata?.name}</p>
        <p><strong>Опис:</strong> {auction.metadata?.description}</p>
        <p><strong>Продавець:</strong> {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}</p>
        <p><strong>Купити зараз:</strong> {formatEther(auction.buyNowPrice)} ETH</p>
        <p><strong>Найвища ставка:</strong> {auction.highestBid === 0n ? '—' : formatEther(auction.highestBid) + ' ETH'}</p>
        <p><strong>Дата завершення:</strong> {new Date(auction.endTime * 1000).toLocaleString()}</p>
      </div>

        <div className="mt-6">
          {isSeller && auction.highestBid === 0n && !ended && (
            <button
              onClick={cancelAuction}
              disabled={isCancelingAuction}
              className="bg-yellow-500 text-white w-full py-2 rounded mb-2"
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
                  disabled={endingTxPending}
                  className="bg-blue-600 text-white w-full py-2 rounded"
                >
                  {endingTxPending ? 'Завершення…' : 'Завершити аукціон'}
                </button>
              )}
            </>
          ) : (
            <>
              {(auction.highestBid !== 0n || !isSeller) && (
                <>
                  <input
                    className="border p-2 w-full mb-2"
                    placeholder="Ставка, ETH"
                    value={bidEth}
                    onChange={e => setBidEth(e.target.value)}
                  />
                  <button
                    onClick={placeBid}
                    disabled={!bidEth}
                    className="bg-green-600 text-white w-full py-2 rounded mb-2"
                  >
                    Ставка
                  </button>
                  <button
                    onClick={buyNow}
                    className="bg-red-600 text-white w-full py-2 rounded"
                  >
                    Купити зараз
                  </button>
                </>
              )}
            </>
          )}
        </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Історія ставок</h2>
        {bids.length === 0 ? (
          <p>Ще немає ставок</p>
        ) : (
          <ul className="space-y-2">
            {bids.map((bid, i) => (
              <li key={i} className="border-b pb-2">
                <p><strong>Адреса:</strong> {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}</p>
                <p><strong>Сума:</strong> {bid.amount} ETH</p>
                <p><strong>Дата:</strong> {new Date(bid.time * 1000).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AuctionDetailPage;