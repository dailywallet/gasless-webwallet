pragma solidity ^0.4.24;
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract DaiToXdaiMovable {

  // Dai Mainnet address
  public address DAI_MAINNET_ADDRESS = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359';
  public address TO_XDAI_BRIDGE_ADDRESS = '0x4aa42145Aa6Ebf72e164C9bBC74fbD3788045016';
  
  function moveDaiToXdai() public {
      ERC20 dai = ERC20(DAI_MAINNET_ADDRESS);
      
      // get dai balance 
      uint256 daiBalance = dai.balanceOf(address(this));
      
      // move it to the bridge
      dai.transfer(TO_XDAI_BRIDGE_ADDRESS, daiBalance);      
  }
}
