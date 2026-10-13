import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRouter from './router.js';

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api', apiRouter);

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

const port = process.env.PORT || 9090;
app.listen(port, () => console.log(`listening on port ${port}`));