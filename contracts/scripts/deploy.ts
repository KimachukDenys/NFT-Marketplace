import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  // Деплой MyNFT
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy();
  await myNFT.waitForDeployment();

  console.log("MyNFT deployed to:", await myNFT.getAddress());

  // Деплой Marketplace з передачею адреси MyNFT
  const Marketplace = await ethers.getContractFactory("MarketplaceMulti");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();

  console.log("Marketplace deployed to:", await marketplace.getAddress());

  // Деплой Auction
  const Auction = await ethers.getContractFactory("AuctionMulti");
  const auction = await Auction.deploy();
  await auction.waitForDeployment();

  console.log("Auction deployed to:", await auction.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });