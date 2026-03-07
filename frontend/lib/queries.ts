import { gql } from "@apollo/client";

export const GET_CAMPAIGNS = gql`
  query GetCampaigns {
    campaigns {
      id
      owner
      targetAmount
      totalRaised
      deadline
      metadataCID
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
      donations {
        id
        from
        amount
        timestamp
      }
    }
  }
`;

