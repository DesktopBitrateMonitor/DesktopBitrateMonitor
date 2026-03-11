import router from './base-router';

const express = require('express');
const app = express();
app.use(express.json());

const port = import.meta.env.VITE_SERVERPORT;

app.listen(port, () => {
  console.log(`Auth server listening at http://localhost:${port}`);
});

app.use('/', router);
