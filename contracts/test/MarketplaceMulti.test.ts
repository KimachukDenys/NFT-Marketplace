import { expect } from "chai";
import { ethers } from "hardhat";

describe("MarketplaceMulti", () => {
  let nft: any, market: any, owner: any, buyer: any;

  beforeEach(async () => {
    [owner, buyer] = await ethers.getSigners();

    const MyNFT = await ethers.getContractFactory("MyNFT");
    nft = await MyNFT.deploy();
    await nft.mintNFT(owner.address, "ipfs://uri");

    const Marketplace = await ethers.getContractFactory("MarketplaceMulti");
    market = await Marketplace.deploy();

    await nft.approve(await market.getAddress(), 1);
  });

  it("should list an NFT", async () => {
    await expect(market.listItem(await nft.getAddress(), 1, ethers.parseEther("1")))
      .to.emit(market, "ItemListed");

    const listing = await market.listings(await nft.getAddress(), 1);
    expect(listing.price).to.equal(ethers.parseEther("1"));
  });

  it("should buy a listed NFT", async () => {
    await market.listItem(await nft.getAddress(), 1, ethers.parseEther("1"));

    await expect(
      market.connect(buyer).buyItem(await nft.getAddress(), 1, { value: ethers.parseEther("1") })
    ).to.emit(market, "ItemBought");

    expect(await nft.ownerOf(1)).to.equal(buyer.address);
  });

  it("should cancel listing", async () => {
    await market.listItem(await nft.getAddress(), 1, ethers.parseEther("1"));
    await expect(market.cancelListing(await nft.getAddress(), 1))
      .to.emit(market, "ItemCanceled");
  });
});
