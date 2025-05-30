import React from "react";
import { NftCard } from "../common/NftCard";

interface Props {
  items: NFT[];
  onApprove: (id: number) => void;
  onList:   (id: number) => void;
  convertIpfsUrl: (u: string) => string;
}

export const MyNfts: React.FC<Props> = ({ items, onApprove, onList, convertIpfsUrl }) => (
  <section>
    <h2>Мої NFT</h2>
    {items.length === 0 ? "Немає" : (
      <div className="nft-grid">
        {items.map(nft => (
          <NftCard key={nft.tokenId} nft={nft}
                   onApprove={onApprove} onList={onList}
                   convertIpfsUrl={convertIpfsUrl} />
        ))}
      </div>
    )}
  </section>
);
