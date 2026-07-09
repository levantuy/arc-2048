import { network } from "hardhat";

async function main() {
  const { ethers } = await network.getOrCreate();
  const factory = await ethers.getContractFactory("Game2048ResultNFT");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  console.log("Game2048ResultNFT deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
