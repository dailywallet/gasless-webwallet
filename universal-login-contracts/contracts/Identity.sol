pragma solidity ^0.5.2;

import "./ERC1077.sol";
import './InviteLinkScheme.sol';
import './DaiToXdaiMovable.sol';


contract Identity is ERC1077, InviteLinkScheme, DaiToXdaiMovable {
  constructor(bytes32 _key) payable public  {
    ERC1077.init(_key);
  }

  function init(bytes32 _key) public {
    ERC1077.init(_key);
  }  
}
