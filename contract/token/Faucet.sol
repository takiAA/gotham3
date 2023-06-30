// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
contract Faucet {
    uint256 public amountAllowed = 100*10**18; 
    address public tokenContract;  
    mapping(address => uint256) public lastAccessTime;  

    // SendToken事件    
    event SendToken(address indexed Receiver, uint256 indexed Amount); 

    // 部署时设定ERC2代币合约
    constructor(address _tokenContract) {
        tokenContract = _tokenContract; // set token contract
    }

    // 用户领取代币函数
    function requestTokens(address recipient) external {
        require(
            lastAccessTime[recipient] + 1 days < block.timestamp,
            "You can claim tokens only once a day"
        );
        IERC20 token = IERC20(tokenContract); 
        require(token.balanceOf(address(this)) >= amountAllowed, "Faucet Empty!"); 
        lastAccessTime[recipient] = block.timestamp;
        token.transfer(recipient, amountAllowed); 
        emit SendToken(recipient, amountAllowed); 
    }
}