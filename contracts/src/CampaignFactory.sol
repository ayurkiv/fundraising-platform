// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Campaign.sol";

contract CampaignFactory {
    address public immutable usdc;
    mapping(address => address) public campaignOf;

    event CampaignCreated(
        address indexed owner,
        address indexed campaign,
        uint256 targetAmount,
        uint256 deadline,
        string metadataCID
    );

    constructor(address _usdc) {
        usdc = _usdc;
    }

    function createCampaign(
        uint256 targetAmount,
        uint256 deadline,
        string calldata metadataCID
    ) external returns (address) {
        require(campaignOf[msg.sender] == address(0), "Already exists");

        Campaign campaign = new Campaign(
            msg.sender,
            usdc,
            targetAmount,
            deadline
        );

        campaignOf[msg.sender] = address(campaign);

        emit CampaignCreated(
            msg.sender,
            address(campaign),
            targetAmount,
            deadline,
            metadataCID
        );

        return address(campaign);
    }
}
