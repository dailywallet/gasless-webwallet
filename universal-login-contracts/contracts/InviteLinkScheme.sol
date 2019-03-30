pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import './IdentityFactory.sol';
import "./KeyHolder.sol";


contract InviteLinkScheme is KeyHolder {
  using ECDSA for bytes32;  
  using Address for address payable;

  // Mappings of transit pub key => true if link is used.
  mapping (address => bool) usedLinks;
  
  
  function isLinkValid(
		       address tokenAddress,
		       uint tokenAmount,		       
		       address receiverAddress,
		       address transitPubKey,
		       bytes memory sigSender,
		       bytes memory sigReceiver) public view returns (bool) {

    //  checks
    // 0. token amount check
    require(hasEnoughTokens(tokenAddress, tokenAmount));

    
    // 1. check that transitPubKey and transfer params were signed by sender
    require(checkSenderSignature(
    				 transitPubKey,
    				 tokenAddress,
    				 tokenAmount,
    				 sigSender
    				 ));

    /* // 2. check that Receiver's address was signed by transit key */
    require(checkReceiverSignature(
    				   receiverAddress,
    				   transitPubKey,
    				   sigReceiver));

    /* // 3. check that link hasn't been used before */
    require(hasBeenUsed(transitPubKey) == false);

    return true;
  }

  
  function hasEnoughTokens(address tokenAddress, uint tokenAmount) public view returns (bool) {
    uint senderBalance;
    if (tokenAddress == 0x0000000000000000000000000000000000000000) {
      senderBalance = address(this).balance;
    } else { 
      ERC20 token = ERC20(tokenAddress);
      senderBalance = token.balanceOf(address(this));
    }
    return senderBalance > 0 && senderBalance >= tokenAmount;
  }

  
  function hasBeenUsed(address transitPubKey) public view returns (bool) {
    return usedLinks[transitPubKey];
  }

  
  function checkReceiverSignature(address receiverAddress,
				  address transitPubKey,
				  bytes memory sigReceiver) public pure returns (bool) {

    // hash signed by receiver using transit private key
    bytes32 hash = keccak256(abi.encodePacked(receiverAddress,
					      transitPubKey));
    address signer = hash.toEthSignedMessageHash().recover(sigReceiver);
    return signer == transitPubKey;
    
  }


  function checkSenderSignature(
				address transitPubKey,
				address tokenAddress,
				uint tokenAmount,
				bytes memory sigSender) public view returns(bool) {

    // calculate hash signed by sender
    bytes32 hash = keccak256(abi.encodePacked(
					      tokenAddress,
					      tokenAmount,
					      transitPubKey
					      ));
    
    // check that the hash was signed by sender
    address signer = hash.toEthSignedMessageHash().recover(sigSender);
    return keyExist(bytes32(uint256(signer)));
  }

  function transferToken(address payable receiverWallet, address tokenAddress, uint tokenAmount) private {
    if (tokenAddress == 0x0000000000000000000000000000000000000000) {
      receiverWallet.transfer(tokenAmount); // if eth
    } else { // if erc20 tokens
      ERC20 token = ERC20(tokenAddress);
      token.transfer(receiverWallet, tokenAmount);
    }
  }
  
  function transferByLink(
			  address tokenAddress,
			  uint256 tokenAmount,
			  bytes32 receiverPubKey, // address of Wallet Contract or receiver's public key if new address			  
			  address transitPubKey,			  			  
			  bytes memory sigSender,
			  bytes memory sigReceiver
			  ) public {
    
    require(isLinkValid(
		       tokenAddress,
		       tokenAmount,		       
		       address(bytes20(receiverPubKey)),
		       transitPubKey,
		       sigSender,
		       sigReceiver));
    
    
    // Contract addresses don't have private keys
    require(!address(bytes20(receiverPubKey)).isContract(), "Contract addresses are not allowed");

    // mark link as used, so that it can be used only once
    usedLinks[transitPubKey] = true;   
    
    // get receiver wallet
    IdentityFactory _identityFactory = IdentityFactory(0x911bE9fC0dE67AAF68EBdb94c1bd04311DD56fE7);
    address payable receiverWallet = _identityFactory.findOrCreateIdentity(receiverPubKey);

    // transfer tokens
    transferToken(receiverWallet, tokenAddress, tokenAmount);
  }

}
