/**
 * Quick MongoDB check script
 * Verifies if the promptConfigs collection has the saved data
 */
const { MongoClient } = require('mongodb');
const config = require('./config');

async function checkMongo() {
  if (!config.mongoUri) {
    console.log('❌ MONGODB_URI not set in .env');
    process.exit(1);
  }

  const client = new MongoClient(config.mongoUri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('\n📊 Checking promptConfigs collection:\n');
    
    const config = await db.collection('promptConfigs').findOne({ _id: 'default' });
    
    if (!config) {
      console.log('❌ No config found in promptConfigs collection');
      process.exit(1);
    }
    
    console.log('✅ Found config:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('_id:', config._id);
    console.log('systemPromptTemplate (first 200 chars):');
    console.log(config.systemPromptTemplate ? config.systemPromptTemplate.substring(0, 200) + '...' : '(empty)');
    console.log('updatedAt:', config.updatedAt || '(no timestamp)');
    console.log('updatedBy:', config.updatedBy || '(no user info)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkMongo();
