import { Donation as DonationEvent } from "../generated/templates/Campaign/Campaign";
import { Campaign, Donation } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleDonation(event: DonationEvent): void {
  let id =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  let donation = new Donation(id);
  donation.campaign = event.address.toHex();
  donation.from = event.params.from;
  donation.amount = event.params.amount;
  donation.blockNumber = event.block.number;
  donation.timestamp = event.block.timestamp;
  donation.txHash = event.transaction.hash;
  donation.save();

  let campaign = Campaign.load(event.address.toHex());
  if (campaign) {
    campaign.totalRaised = campaign.totalRaised.plus(event.params.amount);
    campaign.save();
  }
}
