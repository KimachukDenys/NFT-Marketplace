import React from "react";

interface Props {
  nft: NFT;
  onApprove?: (id: number) => void;
  onList?: (id: number) => void;
  onBuy?: (id: number, price: string) => void;
  account?: string | null;
  convertIpfsUrl: (u: string) => string;
}

export const NftCard: React.FC<Props> = ({
  nft, onApprove, onList, onBuy, account, convertIpfsUrl
}) => (
  <div className="nft-card">
    {nft.metadata?.image && (
      <img
        src={convertIpfsUrl(nft.metadata.image)}
        alt={nft.metadata?.name}
        style={{ maxWidth: 150 }}
      />
    )}
    <h3>{nft.metadata?.name ?? `NFT #${nft.tokenId}`}</h3>
    <p>{nft.metadata?.description}</p>

    {/* дії для власника */}
    {!nft.isListed && onApprove && onList && (
      <>
        <button onClick={() => onApprove(nft.tokenId)}>Підтвердити</button>
        <button onClick={() => onList(nft.tokenId)}>Виставити</button>
      </>
    )}

    {/* дії для покупця */}
    {nft.isListed && onBuy && nft.price && nft.seller !== account && (
      <>
        <p>Ціна: {nft.price} ETH</p>
        <button onClick={() => onBuy(nft.tokenId, nft.price!)}>Купити</button>
      </>
    )}
  </div>
);
