pragma solidity ^0.4.24;

import './Identity.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import './CloneFactory.sol';
import './IERC1077.sol';


contract IdentityFactory is Ownable, CloneFactory {
  address public libraryAddress;

  mapping (bytes32 => address) identitiesDct;
  
  event IdentityCreated(address newIdentityAddr);
  
  function setLibraryAddress(address _libraryAddress) public onlyOwner {
    libraryAddress = _libraryAddress;
  }

  function getIdentity(bytes32 _key) public view returns (address) {
    return identitiesDct[_key];
  }

  function findOrCreateIdentity(bytes32 _key) public returns (address identity) {
    identity = getIdentity(_key);
    if (identity == 0x0) {
      identity = createIdentity(_key);      
    }
  }
  
  function executeIdentity(bytes32 _key,
			   address to,
			   uint256 value,
			   bytes data,
			   uint nonce,
			   uint gasPrice,
			   address gasToken,
			   uint gasLimit,
			   IERC1077.OperationType operationType,
			   bytes signatures) public {
    address identity = findOrCreateIdentity(_key);
    Identity(identity).executeSigned(to,
			   value,
			   data,
			   nonce,
			   gasPrice,
			   gasToken,
			   gasLimit,
			   operationType,
			   signatures);
  }
  
  function moveIdentityDaiToXdai(bytes32 _key) public {
    address identity = findOrCreateIdentity(_key);
    Identity(identity).moveDaiToXdai();
  }

  
  function createIdentity(bytes32 _key) public returns(address) {
    
    // only one identity contract per public key
    require(getIdentity(_key) == 0x0);
    
    address newIdentityAddr = createClone(libraryAddress, uint256(_key));

    identitiesDct[_key] = newIdentityAddr;
    
    Identity(newIdentityAddr).init(_key);
    
    emit IdentityCreated(newIdentityAddr);
    return newIdentityAddr;
  }
}
