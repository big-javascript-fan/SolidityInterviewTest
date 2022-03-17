import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

let owner : SignerWithAddress, 
	owner2 : SignerWithAddress, 
	addr1 : SignerWithAddress, 
	addr2 : SignerWithAddress, 
	addr3 : SignerWithAddress, 
	addr4 : SignerWithAddress, 
	beneficiary: SignerWithAddress;
let milk : Contract;
let DEPOSITOR_ROLE: string,
	CONTRACT_ROLE: string,
	MASTER_ROLE: string;

beforeEach(async function () {
	let accounts: SignerWithAddress[] = await ethers.getSigners();
	[owner, owner2, addr1, addr2, addr3, addr4, beneficiary] = accounts;
	
	const ERC20 =  await ethers.getContractFactory('Milk');
	milk = await ERC20.deploy('Milk Token', 'MTK');
	DEPOSITOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEPOSITOR_ROLE'));
	CONTRACT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('CONTRACT_ROLE'));
	MASTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MASTER_ROLE'));
	await milk.setupRole(DEPOSITOR_ROLE, addr1.address);
	await milk.setupRole(CONTRACT_ROLE, addr2.address);
	await milk.setupRole(MASTER_ROLE, addr3.address);
})


describe('Milk contract unit testing', function() {
	describe('deposit feature', function () {
		it ('success on deposit from depositor role account', async function() {
			let amount = ethers.utils.parseEther('100000000');
			let amountAbi = ethers.utils.defaultAbiCoder.encode(['uint256'], [amount]);
			await expect(milk.connect(addr1).deposit(owner2.address, amountAbi))
				.to.emit(milk, 'Transfer')
				.withArgs(ethers.constants.AddressZero, owner2.address, amount);
		})
		it ('failed on deposit from non-depositor role account', async function() {
			let amount = ethers.utils.parseEther('100000000');
			let amountAbi = ethers.utils.defaultAbiCoder.encode(['uint256'], [amount]);
			await expect(milk.connect(addr2).deposit(owner2.address, amountAbi))
				.to.be.revertedWith(`AccessControl: account ${addr2.address.toLowerCase()} is missing role ${DEPOSITOR_ROLE}`)
		})
	});
	describe('withdraw', function () {
		beforeEach(async function() {
			let amount = ethers.utils.parseEther('100000000');
			let amountAbi = ethers.utils.defaultAbiCoder.encode(['uint256'], [amount]);
			await milk.connect(addr1).deposit(owner2.address, amountAbi);
		})
		it('burn feature success', async function () {
			let amount = ethers.utils.parseEther('100000000');
			await expect(milk.connect(owner2).withdraw(amount))
				.to.emit(milk, 'Transfer')
				.withArgs(owner2.address, ethers.constants.AddressZero, amount);
		})
		it('burn will fail if there is no enough balance minted', async function () {
			let amount = ethers.utils.parseEther('100000000');
			await expect(milk.connect(addr1).withdraw(amount))
				.to.be.revertedWith(`ERC20: burn amount exceeds balance`);
		})
	})
	describe('gameMint', function () {
		it('burn feature success', async function () {
			let amount = ethers.utils.parseEther('100000000');
			await expect(milk.connect(addr2).gameMint(addr2.address, amount))
				.to.emit(milk, 'Transfer')
				.withArgs(ethers.constants.AddressZero, addr2.address, amount);
		})
		it('burn will fail if caller doesnt have contractor role', async function () {
			let amount = ethers.utils.parseEther('100000000');
			await expect(milk.connect(addr1).gameMint(addr2.address, amount))
				.to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${CONTRACT_ROLE}`);
		})
	})
	describe('game burn', function () {
		beforeEach(async function() {
			let amount = ethers.utils.parseEther('100000000');
			await milk.connect(addr2).gameMint(addr2.address, amount);
		})
		it('burn feature success', async function () {
			let amount = ethers.utils.parseEther('100000000');
			await expect(milk.connect(addr2).gameBurn(addr2.address, amount))
				.to.emit(milk, 'Transfer')
				.withArgs(addr2.address, milk.address, amount);
		})
		it('burn will fail if there is no enough balance minted', async function () {
			let amount = ethers.utils.parseEther('100000000');
			await expect(milk.connect(addr1).withdraw(amount))
				.to.be.revertedWith(`ERC20: burn amount exceeds balance`);
		})
	})
	describe('game transfer from', function () {
		beforeEach(async function() {
			let amount = ethers.utils.parseEther('100000000');
			await milk.connect(addr2).gameMint(addr2.address, amount);
		})
		it('transfer feature success', async function () {
			let amount = ethers.utils.parseEther('100000000');
			await expect(milk.connect(addr2).gameTransferFrom(addr2.address, milk.address, amount))
				.to.emit(milk, 'Transfer')
				.withArgs(addr2.address, milk.address, amount);
		})
		it('transfer will fail if caller doesnt have contractor role', async function () {
			let amount = ethers.utils.parseEther('100000000');
			await expect(milk.connect(addr1).gameTransferFrom(addr2.address, milk.address, amount))
				.to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${CONTRACT_ROLE}`);
		})
		it('transfer will fail if there is no enough balance minted', async function () {
			let amount = ethers.utils.parseEther('100000000');
			await expect(milk.connect(addr2).gameTransferFrom(addr1.address, milk.address, amount))
				.to.be.revertedWith(`ERC20: transfer amount exceeds balance`);
		})
	})
	describe('game withdraw from', function () {
		beforeEach(async function() {
			let amount = ethers.utils.parseEther('100000000');
			await milk.connect(addr2).gameMint(addr2.address, amount);
		})
		it('withdraw feature success', async function () {
			let amount = ethers.utils.parseEther('100000000');
			await expect(milk.connect(addr2).gameWithdraw(addr2.address, amount))
				.to.emit(milk, 'Transfer')
				.withArgs(addr2.address, ethers.constants.AddressZero, amount);
		})
		it('withdraw will fail if caller doesnt have contractor role', async function () {
			let amount = ethers.utils.parseEther('100000000');
			await expect(milk.connect(addr1).gameWithdraw(addr2.address, amount))
				.to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${CONTRACT_ROLE}`);
		})
		it('withdraw will fail if there is no enough balance minted', async function () {
			let amount = ethers.utils.parseEther('100000000');
			await expect(milk.connect(addr2).gameWithdraw(addr1.address, amount))
				.to.be.revertedWith(`ERC20: burn amount exceeds balance`);
		})
	})
})