import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { NftCard } from "../components/common/NftCard";
import { mynftAddress, mynftAbi } from '../constants/MyNFT';
import { marketplaceAddress, marketplaceAbi } from '../constants/Marketplace';
import { useAppContext } from '../AppContext';

export const MyNftsPage = () => {
  const { account } = useAppContext();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [listPrice, setListPrice] = useState('0.01');
  const [isLoading, setIsLoading] = useState(false);

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

  const loadNFTs = async () => {
    if (!account) return;
    setIsLoading(true);

    try {
      const signer = await getProviderAndSigner();
      const nftContract = new ethers.Contract(mynftAddress, mynftAbi, signer);
      const marketContract = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

      const balance = await nftContract.balanceOf(account);
      const userNfts: NFT[] = [];

      for (let i = 1; i <= balance; i++) {
        try {
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const tokenURI = await nftContract.tokenURI(i);
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
              tokenId: i,
              owner: account,
              isListed: false,
              metadata
            });
          }
        } catch (e) {
          console.log(`Token ${i} not found or error:`, e);
        }
      }

      const [listedIds, listings] = await marketContract.getAllListings();
      const listedItems: NFT[] = [];

      for (let i = 0; i < listedIds.length; i++) {
        const tokenId = Number(listedIds[i]);
        const listing = listings[i];
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

        listedItems.push({
          tokenId,
          owner: await nftContract.ownerOf(tokenId),
          price: ethers.formatEther(listing.price),
          seller: listing.seller,
          isListed: true,
          metadata
        });
      }

      const combinedNfts = [...userNfts, ...listedItems.filter(item => 
        item.owner.toLowerCase() === account.toLowerCase()
      )];
      
      setNfts(combinedNfts);
    } catch (error) {
      console.error("Error loading NFTs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const approveNFT = async (tokenId: number) => {
    try {
      const signer = await getProviderAndSigner();
      const nft = new ethers.Contract(mynftAddress, mynftAbi, signer);
      const tx = await nft.approve(marketplaceAddress, tokenId, {
        gasLimit: 300000
      });
      await tx.wait();
      return true;
    } catch (error) {
      console.error(error);
      throw new Error("Approval error: " + (error as Error).message);
    }
  };

  const listNFT = async (tokenId: number) => {
    try {
      const signer = await getProviderAndSigner();
      const market = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);
      const nftContract = new ethers.Contract(mynftAddress, mynftAbi, signer);
      const priceWei = ethers.parseEther(listPrice);
      
      const approvedAddress = await nftContract.getApproved(tokenId);
      
      if (approvedAddress !== marketplaceAddress) {
        const approveTx = await nftContract.approve(marketplaceAddress, tokenId);
        await approveTx.wait();
      }

      const tx = await market.listItem(tokenId, priceWei, {
        gasLimit: 300000
      });
      
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

  const handleList = async (tokenId: number) => {
    try {
      await approveNFT(tokenId);
      await listNFT(tokenId);
    } catch (error) {
      alert(`Listing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    loadNFTs();
  }, [account]);

  if (!account) {
    return <div className="container">Please connect your wallet to view your NFTs</div>;
  }

  if (isLoading) {
    return <div className="container">Loading your NFTs...</div>;
  }

  return (
    <div className="container">
      <h2>My NFTs</h2>
      <div className="price-input">
        <label htmlFor="listPrice">Listing Price (ETH):</label>
        <input
          id="listPrice"
          type="text"
          value={listPrice}
          onChange={(e) => setListPrice(e.target.value)}
          placeholder="0.01"
        />
      </div>
      
      {nfts.length === 0 ? (
        <p>You don't own any NFTs yet</p>
      ) : (
        <div className="nft-grid">
          {nfts.map(nft => (
            <div key={nft.tokenId} className="nft-card-wrapper">
              <NftCard 
                nft={nft}
                onApprove={approveNFT}
                onList={handleList}
                convertIpfsUrl={convertIpfsUrl}
              />
              {!nft.isListed && (
                <button 
                  onClick={() => handleList(nft.tokenId)}
                  className="list-button"
                >
                  List for Sale
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};