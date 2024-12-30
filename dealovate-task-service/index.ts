import express, { Application } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import embedRoutes from './routes/embedRoutes';
import { startStatusPolling } from './services/embedService';

const app: Application = express();
const port: number = 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use(embedRoutes);

// Start status polling service
startStatusPolling();

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;