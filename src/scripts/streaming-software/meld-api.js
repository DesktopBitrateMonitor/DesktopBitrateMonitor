import { injectDefaults } from '../store/defaults';
import { MeldWsConnection } from './meld-ws-connection';
import Logger from '../logging/logger';

let meld;
let isConnected = false;
let reconnectionLoop = false;
let reconnectionAttempt = 0;
const MELD_RECONNECT_DELAY_SECONDS = 5;

function getMeldInstance() {
  if (!meld) {
    const { streamingSoftwareConfig } = injectDefaults();
    const meldConfig = streamingSoftwareConfig.get('meld-studio');
    meld = new MeldWsConnection({
      host: meldConfig.host,
      port: meldConfig.port,
      reconnecting: true
    });

    meld.onMessage((msg) => {
      console.log('Received message from Meld Studio:', msg);
    });

    meld.onConnect(() => {
      isConnected = true;
      reconnectionAttempt = 0;
      Logger.info('Connected to Meld Studio');
    });

    // meld.on('connected', () => {
    //   isConnected = true;
    //   reconnectionAttempt = 0;
    //   Logger.info('Connected to Meld Studio');
    // });

    // meld.on('disconnected', () => {
    //   isConnected = false;
    //   Logger.warn('Disconnected from Meld Studio');
    //   if (!reconnectionLoop) {
    //     reconnectionLoop = true;
    //     attemptReconnection();
    //   }
    // });

    // meld.on('error', (error) => {
    //   Logger.error('Meld connection error:', error);
    // });
  }
  return meld;
}

export async function connectToMeld(mainWindow = null) {
  const meldInstance = getMeldInstance();
  try {
    await meldInstance.connect();
    Logger.info('Connected to Meld Studio');
  } catch (error) {
    Logger.error(`Failed to connect to Meld Studio: ${error}`);
  }
}

export async function disconnectFromMeld() {
  if (meld) {
    try {
      await meld.close();
      isConnected = false;
      Logger.info('Disconnected from Meld Studio');
    } catch (error) {
      Logger.error(`Failed to disconnect from Meld Studio: ${error}`);
    }
  }
}
