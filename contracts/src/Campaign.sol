// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Campaign is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public immutable owner;
    uint256 public immutable targetAmount;
    uint256 public immutable deadline;

    uint256 public totalRaised;
    bool public finalized;

    event Donation(address indexed from, uint256 amount, uint256 totalRaised);
    event Finalized(uint256 totalRaised);

    constructor(
        address _owner,
        address _usdc,
        uint256 _targetAmount,
        uint256 _deadline
    ) {
        require(_deadline > block.timestamp, "Invalid deadline");
        require(_targetAmount > 0, "Invalid target");

        owner = _owner;
        usdc = IERC20(_usdc);
        targetAmount = _targetAmount;
        deadline = _deadline;
    }

    function donate(uint256 amount) external nonReentrant {
        require(block.timestamp < deadline, "Campaign ended");
        require(amount > 0, "Zero amount");

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        totalRaised += amount;

        emit Donation(msg.sender, amount, totalRaised);
    }

    function finalize() external nonReentrant {
        require(block.timestamp >= deadline, "Not ended");
        require(!finalized, "Already finalized");

        finalized = true;

        uint256 balance = usdc.balanceOf(address(this));
        if (balance > 0) {
            usdc.safeTransfer(owner, balance);
        }

        emit Finalized(balance);
    }
}
