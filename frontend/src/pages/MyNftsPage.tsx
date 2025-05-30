import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { NftCard } from "../components/common/NftCard";
import { mynftAddress, mynftAbi } from '../constants/MyNFT';
import { marketplaceAddress, marketplaceAbi } from '../constants/Marketplace';
import { useAppContext } from '../AppContext';

export const MyNftsPage = () => {
  const { account } = useAppContext();
  const [nfts, setNfts] = useState<NFT[]>([]);
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

      // Load listed NFTs
      const [listedIds, listings] = await marketContract.getAllListings();
      const listedItems: NFT[] = [];

      for (let i = 0; i < listedIds.length; i++) {
        const tokenId = Number(listedIds[i]);
        const listing = listings[i];
        
        // Skip if listing doesn't exist
        if (!listing.exists) continue;

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

      // Combine and filter NFTs
      const combinedNfts = [
        ...userNfts.filter(nft => !listedItems.some(listed => listed.tokenId === nft.tokenId)),
        ...listedItems.filter(item => item.owner.toLowerCase() === account.toLowerCase())
      ];
      
      setNfts(combinedNfts);
    }
    catch(error){
      console.error("Error loading NFTs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [account]);

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

      const tx = await market.listItem(tokenId, priceWei);
      
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
      
      const tx = await market.cancelListing(tokenId);
      
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

  useEffect(() => {
    loadNFTs();
  }, [account, loadNFTs]);

  if (!account) {
    return <div className="container">Будь ласка, підключіть гаманець</div>;
  }

  if (isLoading) {
    return <div className="container">Завантаження NFT...</div>;
  }

  return (
    <div className="container">
      <h2>Мої NFT</h2>
      
      {nfts.length === 0 ? (
        <p>У вас немає NFT</p>
      ) : (
        <div className="nft-grid">
          {nfts.map(nft => (
            <NftCard
              key={nft.tokenId}
              nft={nft}
              account={account}
              convertIpfsUrl={convertIpfsUrl}
              onApprove={async () => approveNFT(nft.tokenId)}
              onList={async (priceEth) => listNFT(nft.tokenId, priceEth)}
              onCancel={nft.isListed 
                ? async () => cancelListing(nft.tokenId)
                : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};