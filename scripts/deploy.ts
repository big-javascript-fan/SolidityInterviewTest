import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(
      "Deploying the contracts with the account: ",
      await deployer.getAddress()
    );

    const MilkBase = await ethers.getContractFactory("Milk");
    const milkBase = await MilkBase.deploy("Milk Token", "MTK");
    await milkBase.deployed();
    console.log("milk contract address:", milkBase.address);

    const ItemFactoryContract = await ethers.getContractFactory('ItemFactory');
    const itemFactoryContract = await ItemFactoryContract.deploy("", milkBase.address);
    await itemFactoryContract.deployed();
    console.log("Item Factory Contract address:", itemFactoryContract.address);

    let	CONTRACT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('CONTRACT_ROLE'));
    await milkBase.setupRole(CONTRACT_ROLE, itemFactoryContract.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });