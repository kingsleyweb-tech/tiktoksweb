// Status and delivery method values are lowercase to align with Firestore rules
export type CampaignStatus = 'draft' | 'active' | 'completed';
export type DeliveryMethod = 'email' | 'sms';

export interface Campaign {
  id: string;
  name: string;
  templateId: string; // references SimulationTemplate.slug or id
  deliveryMethod: DeliveryMethod;
  description: string;
  status: CampaignStatus;
  simulationSlug?: string;
  createdBy?: string; // uid of the admin who created it
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  participants: number;
}
