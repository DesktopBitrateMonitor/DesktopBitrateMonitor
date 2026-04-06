# Full Release

## v1.0.1

- Fix unwanted switches away from intro on stream start

---

## v1.0.0 - First full release

- Fix Data display for stats data
- Fix try to send chat messages without logged in broadcaster for the selected platform
- Implement Nginx-RTMP stats watching and switching
- Add Icons for multi platform settings (commands, messages)
- Add command to switch to starting scene

---

## v0.0.10 - Beta

- Fix value overrides when older backups are imported to newer version of the configs
- Implement a textfield to change the host of the overlay
- <b>ATTENTION</b>: Older overlay URLs does not connect anymore, setup the source with new URL from the editor
- Add a key in the overlay url for security
- Fix for merging new commands or messages with older config files without touch user changed settings

---

## v0.0.9 - Beta

- Implement a backup export/import dialog
  - Export selected settings from the current app setup
  - Import settings in the app
- Implement session and actions logging to files
  - Log all session and actions activities in folders

---

## v0.0.8 - Beta

- Implement a option to disable the automatic switch from intro to live scene [💡fullymira]
- Add a Help button to the Navigation and open the github readme in the local browser

---

## v0.0.7 - Beta

- Implement automatic reconnect the overlay websocket to the service
- Implement belabox server connection
- Add messages variable for server names
- Fix update message after finishing download

---

## v0.0.6 - Beta

- Implement stats overlay service

---

## v0.0.5 - Beta

- Fix error handling trigger values
- Fix changer low and live trigger values with chat commands
- Fix frontend update on add admin or mod user with chat commands

## v0.0.4 - Beta

---

- Fix bitrate chat response for Srt-Relay-Server stats
- Fix switch command for moderators. Only block the command if the broadcasting software is in privacy scene

## v0.0.3 - Beta

---

- Little fixes and restructured message handling for all platforms
- Switcher-Service restructuring for more stability
- Implement missing functions (Stop streamer after raid) for all platforms
- Implement a dashboard right-click context menu for functions like unlock/lock dashboard layout
- Add icons in the platform settings. Makes it easier to see in what kind of platform settings you are
- Implement a .txt export function to export log files to your local machine

## v0.0.2 - Beta

---

- Finish the beta state from the dashboard
- Add draggable dashboard items
- Add logs page with filtering
- some little bugfixes (frontend only)

## v0.0.1 - Beta

---

- Test main bitrate switching functionalities
- Test platform and chat connection stabilities
- Test stats fetching stability
- Test connection stabilities (server, broadcasting softwares)
- Test chat command handling
- Test feedback messages
