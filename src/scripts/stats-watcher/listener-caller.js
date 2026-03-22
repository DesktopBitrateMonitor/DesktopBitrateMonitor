import Logger from "../logging/logger";
import { getStreamState } from "../streaming-software/obs-api";

export async function startListenerCallerWatcher(mainWindow) {
  console.log('Starting Listener Caller watcher');

  const streamState = await getStreamState();

  if(!streamState.success){
    Logger.error(`Failed to get stream state: ${streamState.error}`);
    return;
  }

  

  console.log('Current stream state:', streamState);

}