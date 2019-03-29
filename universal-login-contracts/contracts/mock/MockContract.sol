pragma solidity ^0.5.2;


contract MockContract {
    bool public wasCalled;

    constructor() public {
        wasCalled = false;
    }

    function() external payable {
        wasCalled = true;
    }

    function callMe() public {
        wasCalled = true;
    }

    function revertingFunction() public view {
        require(msg.sender == address(this));
    }
}
