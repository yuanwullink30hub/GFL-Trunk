/**
 * Check user roles in MongoDB
 */
const { MongoClient } = require('mongodb');
const config = require('./config');

async function checkUsers() {
  if (!config.mongoUri) {
    console.log('❌ MONGODB_URI not set in .env');
    process.exit(1);
  }

  const client = new MongoClient(config.mongoUri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('\n👤 Checking users in database:\n');
    
    const users = await db.collection('users').find({}).project({ 
      _id: 1, 
      email: 1, 
      displayName: 1,
      role: 1,
      createdAt: 1
    }).toArray();
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      process.exit(1);
    }
    
    console.log(`Found ${users.length} user(s):\n`);
    
    users.forEach((user, i) => {
      console.log(`${i + 1}. _id: ${user._id}`);
      console.log(`   email: ${user.email || '(encrypted)'}`);
      console.log(`   displayName: ${user.displayName || '(encrypted)'}`);
      console.log(`   role: ${user.role || '(none - defaults to "client")'}`);
      console.log(`   createdAt: ${user.createdAt?.toISOString() || 'N/A'}`);
      console.log('');
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkUsers();
