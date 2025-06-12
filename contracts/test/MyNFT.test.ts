import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyNFT", () => {
  it("should mint an NFT and assign correct URI", async () => {
    const [owner, user] = await ethers.getSigners();
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const nft = await MyNFT.deploy();
    await nft.waitForDeployment();

    const tx = await nft.connect(owner).mintNFT(user.address, "ipfs://uri1");
    const receipt = await tx.wait();
    const tokenId = 1;

    expect(await nft.ownerOf(tokenId)).to.equal(user.address);
    expect(await nft.tokenURI(tokenId)).to.equal("ipfs://uri1");
  });
});