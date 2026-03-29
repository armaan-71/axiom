import 'dotenv/config';
import pool from '../src/db.js';
import axios from 'axios';

async function verify() {
  console.log('--- Starting Verification ---');

  try {
    // 1. Insert a dummy insight
    const insightResult = await pool.query(`
      INSERT INTO insights (claim, support_count, conflict_count, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['The dashboard load time is over 5 seconds for mobile users.', 10, 2, 'verified']);
    
    const insightId = insightResult.rows[0].id;
    console.log(`Created dummy insight: ${insightId}`);

    // 2. Insert dummy evidence
    await pool.query(`
      INSERT INTO evidence (insight_id, type, content, source_uuid)
      VALUES 
      ($1, 'support', 'User A reported 6s load time on iPhone 13.', '550e8400-e29b-41d4-a716-446655440000'),
      ($1, 'support', 'User B confirmed 5.5s load time on Android.', '550e8400-e29b-41d4-a716-446655440001'),
      ($1, 'conflict', 'User C said it loads instantly on high-speed WiFi.', '550e8400-e29b-41d4-a716-446655440002')
    `, [insightId]);
    console.log('Inserted dummy evidence.');

    // 3. Call the API endpoint
    // Assuming the server is running on port 3001
    const url = `http://localhost:3001/api/insights/${insightId}/decision`;
    console.log(`Calling API: ${url}`);
    
    try {
      const response = await axios.get(url);
      console.log('API Response:', JSON.stringify(response.data, null, 2));

      if (response.data.implication && response.data.suggested_action && typeof response.data.confidence === 'number') {
        console.log('✅ Verification Successful: Response format is correct.');
      } else {
        console.error('❌ Verification Failed: Invalid response format.');
      }
    } catch (apiErr: any) {
      console.error('❌ API Call Failed:', apiErr.message);
      if (apiErr.response) {
        console.error('Status:', apiErr.response.status);
        console.error('Data:', apiErr.response.data);
      }
    }

    // 4. Cleanup
    await pool.query('DELETE FROM insights WHERE id = $1', [insightId]);
    console.log('Cleaned up dummy data.');

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await pool.end();
  }
}

verify();
