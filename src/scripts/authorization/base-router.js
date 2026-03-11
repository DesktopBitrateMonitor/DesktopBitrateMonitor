import express from 'express';
import { twitchRouter } from './twitch-auth';
import { kickRouter } from './kick-auth';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Authorization server is running');
});

router.get('/oauth/twitch', twitchRouter);

router.get('/oauth/kick', kickRouter);

export default router;
