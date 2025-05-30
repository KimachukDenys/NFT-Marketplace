import React from "react";
import { NftCard } from "../common/NftCard";

interface Props {
  items: NFT[];
  onBuy: (id: number, price: string) => void;
  account: string | null;
  convertIpfsUrl: (u: string) => string;
}

export const Marketplace: React.FC<Props> = ({ items, onBuy, account, convertIpfsUrl }) => (
  <section>
    <h2>Маркетплейс</h2>
    {items.length === 0 ? "Нічого не продається" : (
      <div className="nft-grid">
        {items.map(nft => (
          <NftCard key={nft.tokenId} nft={nft}
                   onBuy={onBuy} account={account}
                   convertIpfsUrl={convertIpfsUrl} />
        ))}
      </div>
    )}
  </section>
);
