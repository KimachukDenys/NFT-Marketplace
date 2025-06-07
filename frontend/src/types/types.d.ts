import { BrowserProvider, Contract } from 'ethers';
export {};

declare global {
  interface NFTMetadata {
    name: string;
    description: string;
    image: string;
  }

  interface NFT {
    nftAddress: string; 
    tokenId: number;
    owner: string;

    price?: string;
    seller?: string;
    isListed: boolean;
    onStartAuction?: boolean;
    
    isAuction?: boolean;
    highestBid?: string;
    buyNowPrice?: string;
    highestBidder?: string;
    canEnd?: boolean;
    
    metadata?: NFTMetadata;
  }

  interface Filters {
    searchQuery: string;
    minPrice: string;
    maxPrice: string;
    sortBy: 'price-asc' | 'price-desc' | 'newest';
  }

  interface AuctionMeta {
    nftAddress: string; 
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

  interface AppContextType {
    account: string | null;
    setAccount: (account: string | null) => void;
    provider: BrowserProvider | null;
    nftContract: Contract | null;
    marketContract: Contract | null;
    auctionContract: Contract | null;
    ipfsStatus: 'connecting' | 'connected' | 'error';
  }
}
