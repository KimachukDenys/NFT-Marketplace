import { BrowserProvider, Contract } from 'ethers';
export {};

declare global {
  interface NFTMetadata {
    name: string;
    description: string;
    image: string;
  }

  interface NFT {
    tokenId: number;
    owner: string;
    price?: string;
    seller?: string;
    isListed: boolean;
    onStartAuction?: boolean;
    metadata?: NFTMetadata;

    isAuction?: boolean;
    highestBid?: string;
    buyNowPrice?: string;
    highestBidder?: string;
    canEnd?: boolean;
  }

  interface Filters {
    searchQuery: string;
    minPrice: string;
    maxPrice: string;
    sortBy: 'price-asc' | 'price-desc' | 'newest';
  }

  interface AppContextType {
    account: string | null;
    setAccount: (account: string | null) => void;
    provider: BrowserProvider | null;
    nftContract: Contract | null;
    marketContract: Contract | null;
    ipfsStatus: 'connecting' | 'connected' | 'error';
  }
}
