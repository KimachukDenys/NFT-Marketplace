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
    metadata?: NFTMetadata;
  }
}
