import { Pool, QueryResult } from 'pg';
import pool from '../config/db';

interface EmbedData {
  user_id: string;
  status: number;
  tenant_id: string;
  created_by: string;
  updated_by: string;
  service_id: string;
}

interface UserAccreditation {
  id: number;
  user_id: string;
  status: number;
  tenant_id: string;
  created_by: string;
  updated_by: string;
  service_id: string;
}

const saveEmbedLink = async (embedData: EmbedData): Promise<number> => {
  const {
    user_id,
    status,
    tenant_id,
    created_by,
    updated_by,
    service_id,
  } = embedData;

  const query = `
    INSERT INTO user_accreditation (
      user_id, status, tenant_id, created_by, updated_by, service_id, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;
  `;

  const now = new Date(); // Generate a current timestamp

  const values: (string | number | Date)[] = [
    user_id,
    status,
    tenant_id,
    created_by,
    updated_by,
    service_id,
    now, // Current timestamp for created_at
    now, // Current timestamp for updated_at
  ];

  try {
    const result: QueryResult<{ id: number }> = await pool.query(query, values);
    return result.rows[0].id; // Return the ID of the newly inserted record
  } catch (error) {
    console.error('Error saving embed link:', error);
    throw new Error('Database error');
  }
};
export {
  saveEmbedLink,
  EmbedData,
  UserAccreditation
};