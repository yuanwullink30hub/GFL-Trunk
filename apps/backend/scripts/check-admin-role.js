/**
 * Check admin role assignment in local MongoDB
 * Helps diagnose PUT /api/admin/prompts auth failures
 */
const { MongoClient } = require('mongodb');
const config = require('./config');

async function checkAdminRole() {
  if (!config.mongoUri) {
    console.log('❌ MONGODB_URI not set in .env');
    process.exit(1);
  }

  const client = new MongoClient(config.mongoUri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('\n👥 Checking users and admin roles in local MongoDB:\n');
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    
    if (users.length === 0) {
      console.log('❌ No users found in database. You need to register first.');
      console.log('   Then come back here and run this script again.\n');
      process.exit(1);
    }
    
    console.log(`Found ${users.length} user(s):\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    users.forEach((user, idx) => {
      console.log(`\n[User ${idx + 1}]`);
      console.log(`  ID:    ${user._id}`);
      console.log(`  Email: ${user.email || '(no email)'}`);
      console.log(`  Name:  ${user.displayName || '(no name)'}`);
      console.log(`  Role:  ${user.role || '(no role set - NOT ADMIN)'}`);
      console.log(`  Created: ${user.createdAt || '(no timestamp)'}`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check if any admin exists
    const adminUser = users.find(u => u.role === 'admin');
    
    if (!adminUser) {
      console.log('⚠️  WARNING: No admin user found!\n');
      console.log('🔧 FIX: To make a user admin, run this command in MongoDB:\n');
      console.log('   db.users.updateOne(');
      console.log(`     { _id: ObjectId("${users[0]._id}") },`);
      console.log('     { $set: { role: "admin" } }');
      console.log('   )\n');
      console.log(`   This will make ${users[0].displayName || users[0].email} an admin.\n`);
    } else {
      console.log(`✅ Admin user found: ${adminUser.email} (${adminUser.displayName})\n`);
      console.log('🔍 NEXT STEPS TO DEBUG PUT /api/admin/prompts:\n');
      console.log('1. Make sure you\'re logged in as this admin in the dashboard');
      console.log('2. Check browser DevTools → Network tab → Filter for "prompts"');
      console.log('3. When you click Save, look for the PUT request');
      console.log('4. Check if response status is 200 (success) or 401 (auth failed)\n');
    }
    
  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkAdminRole();
