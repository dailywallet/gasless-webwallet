import Identity from 'universal-login-contracts/build/Identity';
import IdentityFactory from 'universal-login-contracts/build/IdentityFactory';
import ERC20 from 'universal-login-contracts/build/ERC20';
import {addressToBytes32, hasEnoughToken, isAddKeyCall, getKeyFromData, isAddKeysCall} from '../utils/utils';
import { computeAddress } from '../utils/computeAddress';
import ethers, {utils, Interface} from 'ethers';
import defaultDeployOptions from '../config/defaultDeployOptions';

// #TODO move address to config
const IDENTITY_FACTORY_ADDRESS = "0x911bE9fC0dE67AAF68EBdb94c1bd04311DD56fE7";


class IdentityService {
    constructor(xdaiWallet, xdaiProvider,  mainnetWallet, mainnetProvider, hooks) {
	this.xdaiWallet = xdaiWallet;
	this.xdaiProvider = xdaiProvider;

	this.mainnetWallet = mainnetWallet;
	this.mainnetProvider = mainnetProvider;

	
	this.abi = Identity.interface;
	this.hooks = hooks;
  }

    _getWallet(networkId) {
	let wallet; 
	if (networkId === 100) {
	    wallet = this.xdaiWallet;
	} else if (networkId === 1 ) {
	    wallet = this.mainnetWallet;
	} else {
	    throw new Error("Unknown networkId: ", networkId);
	}
	return wallet;
    }

    
    async create(managementKey, networkId = 100, overrideOptions = {}) {
	const key = addressToBytes32(managementKey);
	const bytecode = `0x${Identity.bytecode}`;
	const args = [key];
	const deployTransaction = {
            ...defaultDeployOptions,
            ...overrideOptions,
            ...ethers.Contract.getDeployTransaction(bytecode, this.abi, ...args)
	};

	const wallet = this._getWallet(networkId);
	const transaction = await wallet.sendTransaction(deployTransaction);
	
	this.hooks.emit('created', transaction);
	return transaction;
    }

    _getDaiBalance(contractAddress) {
	const DAI_ADDRESS = '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359';
	const dai = new ethers.Contract(DAI_ADDRESS, ERC20.abi, this.mainnetProvider);
	return dai.balanceOf(contractAddress);
    }

    async deployIdentityFromFactory(managementKey) {
	const pubKey = addressToBytes32(managementKey);
	const { data } = new Interface(IdentityFactory.interface)
		  .functions.findOrCreateIdentity(
		      pubKey
		  );
	const transaction = {
	    value: 0,
	    to: IDENTITY_FACTORY_ADDRESS, 
	    data,
	    ...defaultDeployOptions
	};

	return await this.xdaiWallet.sendTransaction(transaction);
    }

    async _isIdentityContractDeployed(addr) {
	let code = await this.xdaiProvider.getCode(addr);
	console.log({code})
	return (code !== '0x');
    }

    async _moveDaiToXdai(publicKey) {
	const key = addressToBytes32(publicKey);
	const bytecode = `0x${Identity.bytecode}`;	
	const { data } = new Interface(IdentityFactory.interface)
		  .functions.moveIdentityDaiToXdai(
		      key
		  );
	console.log({data});

	const transaction = {
	    value: 0,
	    to: IDENTITY_FACTORY_ADDRESS, 
	    data,
	    ...defaultDeployOptions
	};

	console.log({transaction})
	//this.hooks.emit('created', transaction);
	//return transaction;
	return await this.mainnetWallet.sendTransaction(transaction);
    }
    
    async moveDaiToXdai(publicKey) {	
	// dai balance should be positive
	const contractAddress = computeAddress(publicKey);
	console.log({contractAddress, publicKey});

	// check DAI balance
	const daiBalance = (await this._getDaiBalance(contractAddress)).toString();
	console.log({daiBalance})
	if (daiBalance == "0") {
	    console.log("DAI balance is 0. Doing nothing.");
	    return { success: false, message: "DAI balance is 0" };
	} 

	// check xDAI contract
	if (!(await this._isIdentityContractDeployed(contractAddress))) {
	    console.log("Identity Contract hasn't been deployed on xDAI chain. Deploying...");
	    this.deployIdentityFromFactory(publicKey);
	} else {
	    console.log("Identity is already deployed on xDAI");
	}

	// move DAI to xDAI
	return await this._moveDaiToXdai(publicKey);
    }
    
    async executeSigned(message, networkId=100) {
	//if (await hasEnoughToken(message.gasToken, message.from, message.gasLimit, this.provider)) {
	console.log("sending tx on network: ", networkId)
      const {data} = new Interface(Identity.interface).functions.executeSigned(message.to, message.value, message.data, message.nonce, message.gasPrice, message.gasToken, message.gasLimit, message.operationType, message.signature);
      const transaction = {
        value: 0,
        to: message.from,
        data,
        ...defaultDeployOptions
      };
      // const estimateGas = await this.wallet.estimateGas(transaction);
      // if (message.gasLimit >= estimateGas) {
      //   if (message.to === message.from && isAddKeyCall(message.data)) {
      //     const key = getKeyFromData(message.data);
      //     // await this.authorisationService.removeRequest(message.from, key);
      //     const sentTransaction = await this.wallet.sendTransaction(transaction);
      //     this.hooks.emit('added', sentTransaction);
      //     return sentTransaction;
      //   } else if (message.to === message.from && isAddKeysCall(message.data)) {
      //     const sentTransaction = await this.wallet.sendTransaction(transaction);
      //     this.hooks.emit('keysAdded', sentTransaction);
      //     return sentTransaction;
      //   }
      	const wallet = this._getWallet(networkId);
	return await wallet.sendTransaction(transaction);
	//      }
    //}
    //throw new Error('Not enough tokens');
  }

    
    async createIdentityFactory(networkId=100, overrideOptions = {}) {
	const bytecode = `0x${IdentityFactory.bytecode}`;
	const abi = IdentityFactory.interface;
	const deployTransaction = {
	    value: 0,
	    ...defaultDeployOptions,
	    ...overrideOptions,
	    ...ethers.Contract.getDeployTransaction(bytecode, abi)
	};
	const wallet = this._getWallet(networkId);
	const transaction = await wallet.sendTransaction(deployTransaction);

	console.log("creating Identity Factory");
	this.hooks.emit('created', transaction);
	return transaction;
    }

    async transferTokensByLink({
	identityPubKey,
	sigSender,
	sigReceiver,
	token,
	amount,
	transitPubKey,
	sender
    }) {
	const receiverPubKey = addressToBytes32(identityPubKey);
	const bytecode = `0x${Identity.bytecode}`;	
	const { data } = new Interface(Identity.interface)
		  .functions.transferByLink(
		      token, 
		      amount,
		      receiverPubKey,
		      transitPubKey,
		      sigSender,
		      sigReceiver
		  );
	console.log({data});
	const transaction = {
	    value: 0,
	    to: sender, // sender's identity address
	    data,
	    ...defaultDeployOptions
	};


	this.hooks.emit('created', transaction);
	//return transaction;
	return await this.xdaiWallet.sendTransaction(transaction);
    }
}

export default IdentityService;
