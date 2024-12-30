import { Request, Response } from 'express';
import * as embedService from '../services/embedService';
import * as embedModel from '../models/embedModel';

// Interface definitions
interface UserData {
  user_id: string;
  tenant_id: string;
  created_by: string;
  updated_by: string;
  service_id?: string;
  [key: string]: any; // For additional dynamic properties
}

interface EmbedData {
  user_id: string;
  status: number;
  tenant_id: string;
  created_by: string;
  updated_by: string;
  service_id: string;
}

interface EmbedLinkResponse {

    embedLinkData: string;
    externalUniqueId: string;

}

// Controller to handle the request for fetching the embed UI link
const embedLink = async (req: Request, res: Response): Promise<void> => {
  console.log('Received request to fetch embed UI link');
  
  const baseUserData: UserData = req.body;
  console.log(baseUserData)
  try {
    // Fetch the embed link and transaction ID from the embed service
    const result: EmbedLinkResponse = await embedService.fetchEmbedLink(baseUserData);
    
    // Send the embed link and transaction ID to the frontend
    res.status(200).json({
      embedLinkData: result.embedLinkData, // This contains the embed UI link data
      transactionId: result.externalUniqueId, // The transaction ID to be stored as service_id
    });
  } catch (error) {
    console.error('Error processing request:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch embedded UI link' });
  }
};

// Controller to handle saving user data after form submission
const saveUserData = async (req: Request, res: Response): Promise<void> => {
  const userData: UserData = req.body;
  console.log(userData);
  
  try {
    // Save the user data, including the transactionId as service_id
    const embedData: EmbedData = {
      user_id: userData.user_id,
      status: 135, // Status can be based on form submission or progress
      tenant_id: userData.tenant_id,
      created_by: userData.created_by,
      updated_by: userData.updated_by,
      service_id: userData.service_id!, // Non-null assertion as it should exist at this point
    };
    
    // Call the service to save the data to the database
    const result = await embedModel.saveEmbedLink(embedData);
    
    // Respond with success message
    res.status(200).json({ message: "User data saved successfully!" });
  } catch (error) {
    console.error("Error saving user data:", error);
    res.status(500).json({ error: "Failed to save user data" });
  }
};

interface ServiceIdParams {
  serviceId: string;
}

const checkStatus = async (req: Request<ServiceIdParams>, res: Response): Promise<void> => {
  const { serviceId } = req.params;
  
  try {
    const status = await embedService.checkVerificationStatus(serviceId);
    
    res.status(200).json({ status });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
};

export {
  embedLink,
  saveUserData,
  checkStatus
};