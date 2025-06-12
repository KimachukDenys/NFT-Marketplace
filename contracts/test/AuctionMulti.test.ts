import { expect } from "chai";
import { ethers } from "hardhat";

describe("AuctionMulti", () => {
  let nft: any, auction: any, seller: any, bidder: any;

  beforeEach(async () => {
    [seller, bidder] = await ethers.getSigners();

    const MyNFT = await ethers.getContractFactory("MyNFT");
    nft = await MyNFT.deploy();
    await nft.mintNFT(seller.address, "ipfs://uri");

    const Auction = await ethers.getContractFactory("AuctionMulti");
    auction = await Auction.deploy();

    await nft.connect(seller).approve(await auction.getAddress(), 1);
  });

  it("should create an auction", async () => {
    await expect(
      auction.connect(seller).createAuction(
        await nft.getAddress(),
        1,
        60,
        ethers.parseEther("5"),
        ethers.parseEther("1")
      )
    ).to.emit(auction, "AuctionCreated");
  });

  it("should place a bid", async () => {
    await auction.connect(seller).createAuction(
      await nft.getAddress(),
      1,
      60,
      ethers.parseEther("5"),
      ethers.parseEther("1")
    );

    await expect(
      auction.connect(bidder).placeBid(await nft.getAddress(), 1, { value: ethers.parseEther("1.1") })
    ).to.emit(auction, "BidPlaced");
  });

  it("should buy now", async () => {
    await auction.connect(seller).createAuction(
      await nft.getAddress(),
      1,
      60,
      ethers.parseEther("2"),
      ethers.parseEther("0.1")
    );

    await expect(
      auction.connect(bidder).buyNow(await nft.getAddress(), 1, { value: ethers.parseEther("2") })
    ).to.emit(auction, "AuctionEnded");

    expect(await nft.ownerOf(1)).to.equal(bidder.address);
  });

  it("should end auction by seller after time", async () => {
    await auction.connect(seller).createAuction(
      await nft.getAddress(),
      1,
      10, // 1 second
      ethers.parseEther("3"),
      ethers.parseEther("0.1")
    );

    await auction.connect(bidder).placeBid(await nft.getAddress(), 1, { value: ethers.parseEther("1") });

    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      auction.connect(seller).endAuction(await nft.getAddress(), 1)
    ).to.emit(auction, "AuctionEnded");
  });

  it("should cancel auction without bids", async () => {
    await auction.connect(seller).createAuction(
      await nft.getAddress(),
      1,
      60,
      ethers.parseEther("3"),
      ethers.parseEther("0.1")
    );

    await expect(
      auction.connect(seller).cancelAuction(await nft.getAddress(), 1)
    ).to.emit(auction, "AuctionCanceled");

    expect(await nft.ownerOf(1)).to.equal(seller.address);
  });
});
