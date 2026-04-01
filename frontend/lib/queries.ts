import { gql } from "@apollo/client";

export const GET_CAMPAIGNS = gql`
  query GetCampaigns {
    campaigns(first: 100, orderBy: createdAtBlock, orderDirection: desc) {
      id
      owner
      targetAmount
      totalRaised
      deadline
      metadataCID
      createdAtBlock
    }
  }
`;

export const GET_CAMPAIGN = gql`
  query GetCampaign($id: ID!) {
    campaign(id: $id) {
      id
      owner
      targetAmount
      totalRaised
      deadline
      metadataCID
      createdAtBlock
      donations(orderBy: timestamp, orderDirection: desc) {
        id
        from
        amount
        timestamp
        txHash
      }
    }
  }
`;

export const GET_MY_CAMPAIGNS = gql`
  query GetMyCampaigns($owner: String!) {
    campaigns(
      where: { owner: $owner }
      orderBy: createdAtBlock
      orderDirection: desc
    ) {
      id
      owner
      targetAmount
      totalRaised
      deadline
      metadataCID
      createdAtBlock
    }
  }
`;

export const GET_MY_DONATIONS = gql`
  query GetMyDonations($from: String!) {
    donations(
      where: { from: $from }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      from
      amount
      timestamp
      txHash
      campaign {
        id
        owner
        targetAmount
        totalRaised
        deadline
        metadataCID
        createdAtBlock
      }
    }
  }
`;
