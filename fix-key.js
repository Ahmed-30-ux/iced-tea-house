const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const pubKey = fs.readFileSync('deploy_key.pub', 'utf8').trim();

conn.on('ready', () => {
  console.log('Connected');
  conn.exec(`echo '${pubKey}' > ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo "Key updated" && cat ~/.ssh/authorized_keys`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => { conn.end(); process.exit(0); });
    stream.on('data', (data) => { process.stdout.write(data); });
    stream.stderr.on('data', (data) => { process.stderr.write(data); });
  });
}).on('error', (err) => {
  console.error('Connection failed:', err.message);
}).connect({
  host: '173.212.211.175',
  port: 22,
  username: 'root',
  readyTimeout: 10000,
  // Will try password auth interactively - needs password
});
