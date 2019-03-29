pragma solidity ^0.5.2;
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract DaiToXdaiMovable {

  // Dai Mainnet address
  address public DAI_MAINNET_ADDRESS = 0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359;
  address public TO_XDAI_BRIDGE_ADDRESS = 0x4aa42145Aa6Ebf72e164C9bBC74fbD3788045016;
  
  function moveDaiToXdai() public {
      ERC20 dai = ERC20(DAI_MAINNET_ADDRESS);
      
      // get dai balance 
      uint256 daiBalance = dai.balanceOf(address(this));
      
      // move it to the bridge
      dai.transfer(TO_XDAI_BRIDGE_ADDRESS, daiBalance);      
  }
}