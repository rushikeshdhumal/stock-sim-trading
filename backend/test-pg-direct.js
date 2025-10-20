const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://stocksim:password@localhost:5432/stocksim'
});

client.connect()
  .then(() => {
    console.log('✅ Direct pg client connected successfully');
    return client.query('SELECT current_database(), current_user, version()');
  })
  .then(result => {
    console.log('Query result:', result.rows[0]);
    return client.end();
  })
  .then(() => {
    console.log('✅ Connection closed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.error('Error details:', err);
    process.exit(1);
  });
