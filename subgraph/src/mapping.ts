import { CampaignCreated } from "../generated/CampaignFactory/CampaignFactory";
import { Campaign as CampaignTemplate } from "../generated/templates";
import { Campaign } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleCampaignCreated(event: CampaignCreated): void {
  let campaign = new Campaign(event.params.campaign.toHex());

  campaign.owner = event.params.owner;
  campaign.targetAmount = event.params.targetAmount;
  campaign.deadline = event.params.deadline;
  campaign.metadataCID = event.params.metadataCID;
  campaign.createdAtBlock = event.block.number;
  campaign.totalRaised = BigInt.zero();

  campaign.save();

  // 🔥 ВАЖЛИВО: підключаємо dynamic data source
  CampaignTemplate.create(event.params.campaign);
}
