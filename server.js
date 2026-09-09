const http = require('http');
const app = require('./api/index');

const PORT = 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Test URLs:`);
  console.log(`  Root:        http://localhost:${PORT}/`);
  console.log(`  Stats:       http://localhost:${PORT}/api?username=edgar&card=stats&theme=dark`);
  console.log(`  Languages:   http://localhost:${PORT}/api?username=edgar&card=languages&theme=dark`);
  console.log(`  Streak:      http://localhost:${PORT}/api?username=edgar&card=streak&theme=dark`);
  console.log(`  Contribs:    http://localhost:${PORT}/api?username=edgar&card=contributions&theme=dark`);
  console.log(`  All:         http://localhost:${PORT}/api?username=edgar&card=all&theme=dark`);
});
