/**
 * Get full system prompt from MongoDB
 */
const { MongoClient } = require('mongodb');
const config = require('./config');

async function getPrompt() {
  if (!config.mongoUri) {
    console.log('❌ MONGODB_URI not set in .env');
    process.exit(1);
  }

  const client = new MongoClient(config.mongoUri);
  
  try {
    await client.connect();
    const db = client.db();
    
    const config = await db.collection('promptConfigs').findOne({ _id: 'default' });
    
    if (!config || !config.systemPromptTemplate) {
      console.log('❌ No system prompt found');
      process.exit(1);
    }
    
    console.log('📝 FULL SYSTEM PROMPT:\n');
    console.log(config.systemPromptTemplate);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Last updated: ${config.updatedAt}`);
    console.log(`Character count: ${config.systemPromptTemplate.length}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

getPrompt();
