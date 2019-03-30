import Identity from 'universal-login-contracts/build/Identity';
import IdentityFactory from 'universal-login-contracts/build/IdentityFactory';
import ERC20 from 'universal-login-contracts/build/ERC20';
import {addressToBytes32, hasEnoughToken, isAddKeyCall, getKeyFromData, isAddKeysCall} from '../utils/utils';
import { computeAddress } from '../utils/computeAddress';
import ethers, {utils, Interface} from 'ethers';
import defaultDeployOptions from '../config/defaultDeployOptions';



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

    _mainnetDaiBalance() {
	
    }
    
    async moveDaiToXdai(publicKey) {	
	// dai balance should be positive

	const contractAddress = computeAddress(publicKey);
	console.log({contractAddress, publicKey});
	return {contractAddress};
	//daiBalance = getDaiBalance(contractAddress)
	// if (daiBalance === 0) { return null } 

	// check xDAI contract
	// if (contractOnXdai is not deployed) {
	//     deployContractOnxDAI()
	// }

	
	
	// const key = addressToBytes32(publicKey);
	// const bytecode = `0x${Identity.bytecode}`;	
	// const { data } = new Interface(IdentityFactory.interface)
	// 	  .functions.moveIdentityDaiToXdai(
	// 	      key
	// 	  );
	// console.log({data});

	// // #TODO move address to config
	// const IDENTITY_FACTORY_ADDRESS = "0x911bE9fC0dE67AAF68EBdb94c1bd04311DD56fE7";
	// const transaction = {
	//     value: 0,
	//     to: IDENTITY_FACTORY_ADDRESS, 
	//     data,
	//     ...defaultDeployOptions
	// };

	// console.log({transaction})
	// //this.hooks.emit('created', transaction);
	// //return transaction;
	// return await this.xdaiWallet.sendTransaction(transaction);

    }
    
    async executeSigned(message, networkId=100) {
    //if (await hasEnoughToken(message.gasToken, message.from, message.gasLimit, this.provider)) {
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
