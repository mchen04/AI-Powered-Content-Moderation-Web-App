require('dotenv').config();
const fs = require('fs');
const fetch = require('node-fetch');

// Read Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Read the SQL schema file
const schemaSQL = fs.readFileSync('./formatted-supabase-schema.sql', 'utf8');

// Split the SQL into individual statements
const statements = schemaSQL
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0);

// Function to execute a SQL statement via REST API
async function executeSql(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SQL execution failed: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
}

// Execute each SQL statement
async function setupDatabase() {
  console.log('Setting up database tables...');
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}:`);
    console.log(statement);
    
    try {
      const result = await executeSql(statement);
      console.log(`Statement ${i + 1} executed successfully`);
    } catch (error) {
      console.error(`Error executing statement ${i + 1}:`, error.message);
      
      // If this is a "relation already exists" error, we can continue
      if (error.message.includes('already exists')) {
        console.log('Table already exists, continuing...');
      } else {
        // For other errors, ask if we should continue
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
          readline.question('Continue with next statement? (y/n): ', resolve);
        });
        
        readline.close();
        
        if (answer.toLowerCase() !== 'y') {
          console.log('Aborting database setup');
          return;
        }
      }
    }
  }
  
  console.log('Database setup complete!');
}

// First, check if node-fetch is installed
try {
  require.resolve('node-fetch');
  // Run the setup
  setupDatabase().catch(console.error);
} catch (e) {
  console.log('node-fetch is not installed. Installing it now...');
  const { execSync } = require('child_process');
  execSync('npm install node-fetch@2', { stdio: 'inherit' });
  console.log('node-fetch installed. Please run this script again.');
}