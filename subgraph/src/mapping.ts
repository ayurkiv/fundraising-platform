import { CampaignCreated } from "../generated/CampaignFactory/CampaignFactory"
import { Campaign } from "../generated/schema"

export function handleCampaignCreated(event: CampaignCreated): void {
  let campaign = new Campaign(event.params.campaign.toHex())

  campaign.owner = event.params.owner
  campaign.targetAmount = event.params.targetAmount
  campaign.deadline = event.params.deadline
  campaign.metadataCID = event.params.metadataCID
  campaign.createdAtBlock = event.block.number

  campaign.save()
}
