import 'dotenv/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3001/api/ingest';

async function testMutation() {
  const sourceUuid = uuidv4();

  console.log('--- Step 1: Ingesting base claim ---');
  await ingest("Axiom project uses PostgreSQL with pgvector for storage.", sourceUuid);

  console.log('\n--- Step 2: Ingesting supporting claim ---');
  await ingest("The Axiom engine stores its data in a PostgreSQL database enriched with pgvector.", sourceUuid);

  console.log('\n--- Step 3: Ingesting conflicting claim ---');
  await ingest("Axiom does not use PostgreSQL for its data storage; it uses MongoDB instead.", sourceUuid);
}

async function ingest(text: string, sourceUuid: string) {
  try {
    const response = await axios.post(API_URL, {
      text,
      source_uuid: sourceUuid
    });
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('Ingest failed:', error.response?.data || error.message);
  }
}

testMutation().catch(console.error);
