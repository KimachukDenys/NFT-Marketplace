import { useEffect, useState, useCallback } from 'react';
import { Contract, EventLog } from 'ethers';
import { auctionAbi, auctionAddress } from '../constants/Auction';
import { mynftAbi } from '../constants/MyNFT';
import AuctionCard from '../components/common/AuctionCard';
import { useAppContext } from '../hooks/useAppContext';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
}

interface AuctionMeta {
  tokenId: number;
  seller: string;
  highestBid: bigint;
  highestBidder: string;
  buyNowPrice: bigint;
  minBidIncrement: bigint;
  endTime: number;
  metadata?: NFTMetadata;
  onCancelAuction?: () => Promise<void>;
}

const ipfsToHttp = (ipfsUrl: string) => {
    if (!ipfsUrl) return '';
    if (ipfsUrl.startsWith('http')) return ipfsUrl;
    if (ipfsUrl.startsWith('ipfs://')) {
      const hash = ipfsUrl.replace('ipfs://', '');
      return `http://localhost:8080/ipfs/${hash}`;
    }
    return ipfsUrl;
  };

const AuctionsPage = () => {
  const { provider, account } = useAppContext();
  const [auctionContract, setAuctionContract] = useState<Contract | null>(null);
  const [nftContract, setNftContract] = useState<Contract | null>(null);
  const [auctions, setAuctions] = useState<AuctionMeta[]>([]);
  const [txPending, setTxPending] = useState(false);

  // 1. Ініціалізація контрактів
  useEffect(() => {
    if (!provider) return;

    const initContracts = async () => {
      const signer = await provider.getSigner();
      const auctionWithSigner = new Contract(auctionAddress, auctionAbi, signer);
      const auctionRead = new Contract(auctionAddress, auctionAbi, provider);
      const nftAddress = await auctionRead.nftContract();
      const nft = new Contract(nftAddress, mynftAbi, provider);

      setAuctionContract(auctionWithSigner);
      setNftContract(nft);
    };

    initContracts();
  }, [provider]);

  // 2. Завантаження активних аукціонів
  const loadAuctions = useCallback(async () => {
    if (!auctionContract || !nftContract) return;
    setTxPending(true);

    try {
      const events = await auctionContract.queryFilter(
        auctionContract.filters.AuctionCreated(),
        0,
        'latest'
      );

      const tokenIds = [
        ...new Set(
          events
            .map(e => (e as EventLog).args?.tokenId)
            .filter((id): id is bigint => !!id)
            .map(id => Number(id))
        )
      ];

      const results: AuctionMeta[] = [];

      for (const tokenId of tokenIds) {
        const auction = await auctionContract.auctions(tokenId);
        if (auction.ended) continue;

        let metadata;
        try {
          const tokenURI = await nftContract.tokenURI(tokenId);
          const res = await fetch(ipfsToHttp(tokenURI));
          metadata = await res.json();
        } catch (err) {
          console.warn(`Metadata fetch failed for token ${tokenId}, ${err}`);
        }

        results.push({
          tokenId,
          seller: auction.seller,
          highestBid: auction.highestBid,
          highestBidder: auction.highestBidder,
          buyNowPrice: auction.buyNowPrice,
          minBidIncrement: auction.minBidIncrement,
          endTime: Number(auction.endTime),
          metadata,
        });
      }

      setAuctions(results);
    } catch (err) {
      console.error('Failed to load auctions', err);
    } finally {
      setTxPending(false);
    }
  }, [auctionContract, nftContract]);

  // 3. Завантажити аукціони при зміні блоків
  useEffect(() => {
    if (!provider || !auctionContract) return;

    loadAuctions();

    provider.on('block', loadAuctions);
    return () => {
      provider.off('block', loadAuctions);
    };
  }, [provider, auctionContract, loadAuctions]);

  // 4. Вивід
  if (!provider) {
    return <p className="p-4">Підключіть гаманець</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Активні NFT-аукціони</h1>

      {txPending && <p className="mb-4">Завантаження даних…</p>}
      {!txPending && auctions.length === 0 && (
        <p>Наразі немає активних аукціонів</p>
      )}

      <div className="flex flex-wrap gap-4">
        {auctions.map(a => (
          <AuctionCard
            key={a.tokenId}
            auction={a}
            nftImgUrl={a.metadata?.image ? ipfsToHttp(a.metadata.image) : undefined}
            auctionContract={auctionContract!}
            disabled={txPending}
            refetch={loadAuctions}
            currentAddress={account ?? ''} 
          />
        ))}
      </div>
    </div>
  );
};

export default AuctionsPage;
