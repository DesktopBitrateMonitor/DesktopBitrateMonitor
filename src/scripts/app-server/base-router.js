import express from 'express';
import { twitchRouter } from '../authorization/twitch-auth';
import { kickRouter } from '../authorization/kick-auth';
import { overlayRouter } from '../overlay/overlay-router';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('App server is running');
});

router.get('/oauth/twitch', twitchRouter);

router.get('/oauth/kick', kickRouter);

router.get('/overlay/stats', overlayRouter);

export default router;