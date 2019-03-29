pragma solidity ^0.5.2;

import './Identity.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import './CloneFactory.sol';
import './IERC1077.sol';


contract IdentityFactory is Ownable, CloneFactory {
  address public libraryAddress;

  mapping (bytes32 => address payable) identitiesDct;
  
  event IdentityCreated(address newIdentityAddr);
  
  function setLibraryAddress(address _libraryAddress) public onlyOwner {
    libraryAddress = _libraryAddress;
  }

  function getIdentity(bytes32 _key) public view returns (address payable) {
    return identitiesDct[_key];
  }

  function findOrCreateIdentity(bytes32 _key) public returns (address payable) {
    address payable identity = getIdentity(_key);
    if (identity == 0x0000000000000000000000000000000000000000) {
      identity = createIdentity(_key);      
    }
    return identity;
  }
  
  function executeIdentity(bytes32 _key,
			   address to,
			   uint256 value,
			   bytes memory data,
			   uint nonce,
			   uint gasPrice,
			   address gasToken,
			   uint gasLimit,
			   IERC1077.OperationType operationType,
			   bytes memory signatures) public {
    address payable identity = findOrCreateIdentity(_key);
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
    address payable identity = findOrCreateIdentity(_key);
    Identity(identity).moveDaiToXdai();
  }

  
  function createIdentity(bytes32 _key) public returns(address payable) {
    
    // only one identity contract per public key
    require(getIdentity(_key) == 0x0000000000000000000000000000000000000000);
    
    address payable newIdentityAddr = createClone(libraryAddress, uint256(_key));

    identitiesDct[_key] = newIdentityAddr;
    
    Identity(newIdentityAddr).init(_key);
    
    emit IdentityCreated(newIdentityAddr);
    return newIdentityAddr;
  }
}
