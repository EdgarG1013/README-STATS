import app from "./api/index.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}/`);
  console.log(`API endpoints:`);
  console.log(`  GET /api/card/stats?username=<username>&theme=<theme>`);
  console.log(`  GET /api/card/languages?username=<username>&theme=<theme>`);
  console.log(`  GET /api/card/streak?username=<username>&theme=<theme>`);
  console.log(`  GET /api/card/contributions?username=<username>&theme=<theme>`);
  console.log(`  GET /api/card/all?username=<username>&theme=<theme>`);
});
