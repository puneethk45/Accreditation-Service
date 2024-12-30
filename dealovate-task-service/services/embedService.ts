export interface UserData {
  user_id: string;
  tenant_id: string;
  created_by: string;
  updated_by: string;
  service_id?: string;
  [key: string]: any;
}

export interface EmbedData {
  user_id: string;
  status: number;
  tenant_id: string;
  created_by: string;
  updated_by: string;
  service_id: string;
}

export interface EmbedLinkResponse {
  embedLinkData: string;
  externalUniqueId: string;
}

export interface VerificationResponse {
  details: [{
    status: string;
    pdfLetterUrl: string;
    legalName: string;
  }];
  statusCode: number;
  message?: string;
}

export interface StatusMapping {
  [key: string]: number;
  Expired: number;
  Failed: number;
  Verified: number;
  Processing: number;
}

// src/services/embedService.ts
import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';
import FormData from 'form-data';
import fs from 'fs/promises';
import path from 'path';
import pool from '../config/db';
import { QueryResult } from 'pg';



const API_KEY = '0aa4469dc6.f68c1096965f4c6db1d317f0c614d0d4';
const url = 'https://api.accredd.com/v1/verifications/embed-ui-link';
const statusCheckUrl = 'https://api.accredd.com/v1/verifications/';

const fetchEmbedLink = async (userData: UserData): Promise<EmbedLinkResponse> => {
  const externalUniqueID = crypto.randomBytes(16).toString('hex');
console.log("hi")
  const formData = new FormData();
  formData.append('IsPublicURL', 'false');
  formData.append('IsInsideIframe', 'true');
  formData.append('OnVerifyPostMessage', 'true');
  formData.append('ExternalUniqueID', externalUniqueID);
  formData.append('InvestorType', '');
  formData.append('IssuerName', '');
  formData.append('LegalName', '');
  formData.append('Comment', '');
  formData.append('InvalidRequestRedirectURL', '');
  formData.append('OnSubmitRedirectURL', 'http://localhost:3000/success');
  formData.append('ShowIncomeTab', '');
  formData.append('ShowNetWorthTab', '');
  formData.append('ShowOtherLicTab', '');
  formData.append('ShowOtherLetterTab', '');
  formData.append('ShowTopBar', '');

  try {
    const response: AxiosResponse = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        apiKey: API_KEY,
      },
    });
   console.log(response)
   const embedLinkData = 
   {
       embedLinkData:response.data.custom_link,externalUniqueID:externalUniqueID
   }
   
     
   return {
    embedLinkData: response.data.custom_link,
    externalUniqueId: externalUniqueID,
  }; 
  } catch (error) {
    console.error('Error fetching embed UI link:', error);
    throw new Error('Failed to fetch embedded UI link');
  }
};

const checkVerificationStatus = async (transactionID: string): Promise<string> => {
  try {
    const response: AxiosResponse<VerificationResponse> = await axios.get(
      `${statusCheckUrl}${transactionID}`,
      {
        headers: { apiKey: API_KEY },
      }
    );
    return response.data.details[0].status;
  } catch (error) {
    console.error('Error checking verification status:', error);
    throw new Error('Failed to fetch verification status');
  }
};

const updateStatus = async (transactionID: string, newStatus: string): Promise<void> => {
  try {
    const statusMapping: StatusMapping = {
      "Expired": 132,
      "Failed": 133,
      "Verified": 134,
      "Processing": 135,
    };

    const verificationUrl = `${statusCheckUrl}${transactionID}/pdf-letter`;
    const verificationResponse: AxiosResponse<VerificationResponse> = await axios.get(verificationUrl, {
      headers: {
        apiKey: API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (verificationResponse.data.statusCode !== 200) {
      throw new Error(verificationResponse.data.message || 'Failed to fetch PDF letter URL');
    }

    const pdfLetterUrl = verificationResponse.data.details[0].pdfLetterUrl;
    const username = verificationResponse.data.details[0].legalName;
    const date = new Date().toLocaleDateString();

    // Download and save PDF
    const pdfResponse: AxiosResponse<Buffer> = await axios.get(pdfLetterUrl, { responseType: 'arraybuffer' });
    const pdfBuffer = Buffer.from(pdfResponse.data);
    const tempFilePath = path.join(__dirname, 'temp-pdf-letter.pdf');
    await fs.writeFile(tempFilePath, pdfBuffer);

    const userid = ['550e8400-e29b-41d4-a716-446655440045']; // Replace with actual user ID logic

    // Upload PDF to document service
    const uploadUrl = 'http://your-document-service-url/api/uploadDocuments/upload';
    const formData = new FormData();

    formData.append('file', await fs.readFile(tempFilePath), {
      filename: `accreditation-letter-${username}-${date}.pdf`,
      contentType: 'application/pdf',
    });

    formData.append('users', JSON.stringify(userid));
    formData.append('createdBy', 'system');
    formData.append('updatedBy', 'system');
    formData.append('description', `Accreditation for ${username}-${date}`);
    formData.append('type_id', 136);

    const uploadResponse = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    await fs.unlink(tempFilePath);

    if (!uploadResponse.data?.data) {
      throw new Error('Failed to upload PDF');
    }

    const documentId = uploadResponse.data.data;

    // Update database
    const query = `
      UPDATE user_accreditation
      SET status = $1, document_id = $2
      WHERE service_id = $3
      RETURNING id;
    `;
    const values = [statusMapping[newStatus], documentId, transactionID];
    const result: QueryResult = await pool.query(query, values);

    if (result.rowCount === 0) {
      console.log(`No record found for service_id: ${transactionID}`);
    }
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
};

const startStatusPolling = (): NodeJS.Timer => {
  return setInterval(async () => {
    try {
      const query = 'SELECT service_id FROM user_accreditation WHERE status = $1';
      const values = [135]; // Processing status
      const { rows }: QueryResult<{ service_id: string }> = await pool.query(query, values);

      for (const row of rows) {
        const status = await checkVerificationStatus(row.service_id);
        if (status !== 'Processing') {
          await updateStatus(row.service_id, status);
        }
      }
    } catch (error) {
      console.error('Error during polling:', error);
    }
  }, 7000);
};

export {
  fetchEmbedLink,
  checkVerificationStatus,
  updateStatus,
  startStatusPolling,
};

