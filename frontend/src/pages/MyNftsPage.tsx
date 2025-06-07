import { useState, useEffect, useCallback } from 'react';
import { ethers, EventLog } from 'ethers';
import { NftCard } from "../components/common/NftCard";
import { mynftAddress, mynftAbi } from '../constants/MyNFT';
import { marketplaceAddress, marketplaceAbi } from '../constants/Marketplace';
import { useAppContext } from '../hooks/useAppContext';
import { auctionAddress, auctionAbi } from '../constants/Auction';
import AuctionModal from '../modals/AuctionModal';
import AuctionCard from '../components/common/AuctionCard';

export const MyNftsPage = () => {
  const { account, provider } = useAppContext();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [auctions, setAuctions] = useState<AuctionMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAuctions, setIsLoadingAuctions] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTokenId, setModalTokenId] = useState<number | null>(null);

  const getProviderAndSigner = async () => {
    const provider = new ethers.BrowserProvider(
      window.ethereum as unknown as ethers.Eip1193Provider
    );
    return provider.getSigner();
  };

  const convertIpfsUrl = (ipfsUrl: string) => {
    if (!ipfsUrl) return '';
    if (ipfsUrl.startsWith('http')) return ipfsUrl;
    if (ipfsUrl.startsWith('ipfs://')) {
      const hash = ipfsUrl.replace('ipfs://', '');
      return `http://localhost:8080/ipfs/${hash}`;
    }
    return ipfsUrl;
  };

  const loadNFTs = useCallback(async () => {
    if (!account) return;
    setIsLoading(true);

    try {
      const signer = await getProviderAndSigner();
      const nftContract = new ethers.Contract(mynftAddress, mynftAbi, signer);
      const marketContract = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

      const balance = await nftContract.balanceOf(account);
      const userNfts: NFT[] = [];

      // Load owned NFTs
      for (let i = 0; i < balance; i++) {
        const tokenId = await nftContract.tokenOfOwnerByIndex(account, i);
        try {
          const owner = await nftContract.ownerOf(tokenId);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const tokenURI = await nftContract.tokenURI(tokenId);
            let metadata: NFTMetadata | undefined;
            
            if (tokenURI.startsWith('ipfs://')) {
              const ipfsHash = tokenURI.replace('ipfs://', '');
              try {
                const response = await fetch(convertIpfsUrl(tokenURI));
                if (!response.ok) throw new Error('Failed to fetch metadata');
                metadata = await response.json();
              } catch (e) {
                console.error('Error fetching metadata:', e);
                try {
                  const fallbackResponse = await fetch(`https://gateway.ipfs.io/ipfs/${ipfsHash}`);
                  if (fallbackResponse.ok) {
                    metadata = await fallbackResponse.json();
                  }
                } catch (fallbackError) {
                  console.error('Fallback gateway also failed:', fallbackError);
                }
              }
            }

            userNfts.push({
              nftAddress: mynftAddress,
              tokenId: Number(tokenId),
              owner: account,
              isListed: false,
              metadata
            });
          }
        } catch (e) {
          console.log(`Token ${tokenId} not found or error:`, e);
        }
      }

      // Load listed NFTs
      const [keys, listings] = await marketContract.getAllListings();
      const listedItems: NFT[] = [];

      for (let i = 0; i < keys.length; i++) {
        const { nft: mynftAddress, tokenId } = keys[i]; 
        const listing = listings[i];

        if (listing.seller.toLowerCase() !== account.toLowerCase()) continue;

        const nftC = new ethers.Contract(mynftAddress, mynftAbi, signer);
        const tokenURI = await nftC.tokenURI(tokenId);
        let metadata: NFTMetadata | undefined;
        
        if (tokenURI.startsWith('ipfs://')) {
          const ipfsHash = tokenURI.replace('ipfs://', '');
          try {
            const response = await fetch(convertIpfsUrl(tokenURI));
            if (!response.ok) throw new Error('Failed to fetch metadata');
            metadata = await response.json();
          } catch (e) {
            console.error('Error fetching metadata:', e);
            try {
              const fallbackResponse = await fetch(`https://gateway.ipfs.io/ipfs/${ipfsHash}`);
              if (fallbackResponse.ok) {
                metadata = await fallbackResponse.json();
              }
            } catch (fallbackError) {
              console.error('Fallback gateway also failed:', fallbackError);
            }
          }
        }

        listedItems.push({
          nftAddress: mynftAddress,
          tokenId,
          owner: await nftC.ownerOf(tokenId),
          price: ethers.formatEther(listing.price),
          seller: listing.seller,
          isListed: true,
          metadata
        });
      }


      // Combine and filter NFTs
      const combinedNftsMap = new Map<string, NFT>();

      userNfts.forEach(nft => {
        const key = `${nft.nftAddress}-${nft.tokenId}`;
        combinedNftsMap.set(key, { ...nft, isListed: false });
      });

      listedItems.forEach(item => {
        const key = `${item.nftAddress}-${item.tokenId}`;
        combinedNftsMap.set(key, { ...item, isListed: true });
      });

      const combinedNfts = Array.from(combinedNftsMap.values());
      setNfts(combinedNfts);
    }
    catch(error){
      console.error("Error loading NFTs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  const loadAuctions = useCallback(async () => {
    if (!account || !provider) return;
    setIsLoadingAuctions(true);

    try {
      const auctionContract = new ethers.Contract(auctionAddress, auctionAbi, provider);
      const nftContract = new ethers.Contract(mynftAddress, mynftAbi, provider);

      // Get all AuctionCreated events
      const events = await auctionContract.queryFilter(
        auctionContract.filters.AuctionCreated(),
        0,
        'latest'
      );

    const myAuctionsMap = new Map<number, AuctionMeta>();

    for (const event of events) {
      const args = (event as EventLog).args;
      if (!args) continue;

      const tokenId = Number(args.tokenId);
      const auction = await auctionContract.auctions(mynftAddress ,tokenId);

      if (auction.ended || auction.seller.toLowerCase() !== account.toLowerCase()) {
        continue;
      }

      // Якщо вже є, пропускаємо (щоб уникнути дублікатів)
      if (myAuctionsMap.has(tokenId)) continue;

      let metadata;
      try {
        const tokenURI = await nftContract.tokenURI(tokenId);
        const res = await fetch(convertIpfsUrl(tokenURI));
        metadata = await res.json();
      } catch (err) {
        console.warn(`Metadata fetch failed for token ${tokenId}, ${err}`);
      }

      myAuctionsMap.set(tokenId, {
        nftAddress: mynftAddress,
        tokenId,
        seller: auction.seller,
        highestBid: auction.highestBid,
        highestBidder: auction.highestBidder,
        buyNowPrice: auction.buyNowPrice,
        minBidIncrement: auction.minBidIncrement,
        endTime: Number(auction.endTime),
        metadata
      });
    }

    const myAuctions = Array.from(myAuctionsMap.values());
    setAuctions(myAuctions);

    } catch (error) {
      console.error("Error loading auctions:", error);
    } finally {
      setIsLoadingAuctions(false);
    }
  }, [account, provider]);

  const approveNFT = async (tokenId: number) => {
    try {
      const signer = await getProviderAndSigner();
      const nft = new ethers.Contract(mynftAddress, mynftAbi, signer);
      const tx = await nft.approve(marketplaceAddress, tokenId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error(error);
      throw new Error("Approval error: " + (error as Error).message);
    }
  };

  const listNFT = async (tokenId: number, priceEth: string) => {
    try {
      const signer = await getProviderAndSigner();
      const market = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);
      const nftContract = new ethers.Contract(mynftAddress, mynftAbi, signer);
      const priceWei = ethers.parseEther(priceEth);
      
      const approvedAddress = await nftContract.getApproved(tokenId);
      
      if (approvedAddress !== marketplaceAddress) {
        const approveTx = await nftContract.approve(marketplaceAddress, tokenId);
        await approveTx.wait();
      }

      const tx = await market.listItem(mynftAddress, tokenId, priceWei);
      
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert('NFT listed successfully!');
        loadNFTs();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error("Listing error:", error);
      throw error;
    }
  };

  const cancelListing = async (tokenId: number) => {
    try {
      const signer = await getProviderAndSigner();
      const market = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);
      
      const tx = await market.cancelListing(mynftAddress, tokenId);
      
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert('Listing canceled successfully!');
        loadNFTs();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error("Cancel listing error:", error);
      throw error;
    }
  };

  const createAuction = async (
    tokenId: number,
    durationSec: number,
    buyNowEth: string,
    minIncEth: string,
  ) => {
    const signer = await getProviderAndSigner();
    const nft = new ethers.Contract(mynftAddress, mynftAbi, signer);
    const auction = new ethers.Contract(auctionAddress, auctionAbi, signer);

    // 1) approve NFT to auction contract, якщо ще не approved
    const approved = await nft.getApproved(tokenId);
    if (approved.toLowerCase() !== auctionAddress.toLowerCase()) {
      const txAppr = await nft.approve(auctionAddress, tokenId);
      await txAppr.wait();
    }

    // 2) createAuction
    const tx = await auction.createAuction(
      mynftAddress,
      tokenId,
      durationSec,
      ethers.parseEther(buyNowEth),
      ethers.parseEther(minIncEth),
    );
    await tx.wait();
    alert('Аукціон створено!');
    loadAuctions();
    loadNFTs();
  };

  const cancelAuction = async (tokenId: number) => {
    try {
      const signer = await getProviderAndSigner();
      const auction = new ethers.Contract(auctionAddress, auctionAbi, signer);
      
      const tx = await auction.cancelAuction(mynftAddress, tokenId);
      await tx.wait();
      
      alert('Аукціон скасовано!');
      loadAuctions();
      loadNFTs();
    } catch (error) {
      console.error("Cancel auction error:", error);
      throw error;
    }
  };

  /* --- відкриття модалки --- */
  const openAuctionModal = (tokenId: number) => {
    setModalTokenId(tokenId);
    setModalOpen(true);
  };

  useEffect(() => {
    loadNFTs();
    loadAuctions();
  }, [account, loadNFTs, loadAuctions]);

  useEffect(() => {
    if (modalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [modalOpen]);

  if (!account) {
    return <div className="container">Будь ласка, підключіть гаманець</div>;
  }

  if (isLoading) {
    return <div className="container">Завантаження NFT...</div>;
  }

  return (
    <div className="container">
      <h2 className="text-2xl font-semibold mb-4">Мої NFT</h2>

      {/* Display active auctions */}
      {auctions.length > 0 && (
        <>
          <h3 className="text-xl font-semibold mb-4 mt-8">Мої аукціони</h3>
          <div className="nft-grid mb-8">
            {auctions.map(auction => (
              <AuctionCard
                key={`auction-${auction.nftAddress}-${auction.tokenId}`}
                auction={auction}
                nftImgUrl={auction.metadata?.image ? convertIpfsUrl(auction.metadata.image) : undefined}
                auctionContract={new ethers.Contract(auctionAddress, auctionAbi, provider!)}
                disabled={isLoadingAuctions}
                refetch={loadAuctions}
                currentAddress={account}
                onCancelAuction={async () => cancelAuction(auction.tokenId)}
              />
            ))}
          </div>
        </>
      )}

      {/* Display regular NFTs */}
      <h3 className="text-xl font-semibold mb-4">Мої NFT</h3>
      {nfts.length === 0 ? (
        <p>У вас немає NFT</p>
      ) : (
        <div className="nft-grid">
          {nfts.map(nft => (
            <NftCard
              key={`${nft.nftAddress}-${nft.tokenId}`}
              nft={nft}
              account={account}
              convertIpfsUrl={convertIpfsUrl}
              onApprove={async () => approveNFT(nft.tokenId)}
              onList={async p => listNFT(nft.tokenId, p)}
              onCancel={nft.isListed ? async () => cancelListing(nft.tokenId) : undefined}
              onStartAuction={openAuctionModal}
            />
          ))}
        </div>
      )}

      {/* Auction modal */}
      <AuctionModal
        isOpen={modalOpen}
        tokenId={modalTokenId}
        onClose={() => setModalOpen(false)}
        onSubmit={createAuction}
      />
    </div>
  );
};