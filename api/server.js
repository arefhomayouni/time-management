import app from './src/app.js';
import dotenv from 'dotenv';

// override:true because the sandbox exports PORT=0 which would otherwise
// shadow the value in .env forever.
dotenv.config({ override: true });

const PORT = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
