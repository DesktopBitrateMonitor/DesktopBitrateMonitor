<div align="center">
  <h1>
    DESKTOP>BITRATE</span> MONITOR
  </h1>
  <h2>
    A Desktop app to listen for SRT ingest server stats and change scenes in your broadcasting software.
  </h2>
</div>

### Why Desktop-Bitrate-Monitor

<ul type="none">
  <li >
    🌟 All settings and Tokens are saved on your local machine, no server security issues are possible
  </li>
  <li>
    🌟 User friendly interface
  </li>
  <li>
    🌟 Manage and customize all your chat messages and commands by yourself
  </li>
  <li>
    🌟 Multi platform support (Twitch, Kick)
  </li>
</ul>

# Quick Start Guide

- Download the "Desktop-bitrate-monitor-x.x.x-setup.exe file

  ![downloader-exe](readme-assets/quick-start/downloader-exe.png)

- Execute and install the application
  - It might be you have to accept the warning for security risks. This warning accurse because i don't have bought a "content-security-policy" to sign the app as secure
- Choose your platform and [register](###account-Settings) your account
  - The enabled switch displays the current platform to listen for chat messages
- Setup your stats-server to listen for
- Connect your broadcasting software with the websocket (OBS-Websocket 5.x+ and higher)
  - If the connection credentials are correct, the app connection are automatically establishes
- If all correct connected, both connection state fields are green and the platform should display your account name

If you now start a SRT-Feed and the server publish stats you can see the current stats in the chart

# Dashboard

<details>
  <summary> Show all dashboard descriptions </summary>
  <img src="readme-assets/dashboard-full.png" alt="image" />
  <ol>
    <li>Navigation side panel with all navigation buttons</li>
      <ul>
        <li>Platform button opens a card to change the active platform and switch to the platform-settings</li>
        <li>Only one active platform are allowed</li>
        <img src="readme-assets/platform-select.png" alt="image">
      </ul>
    <li>Toggle navigation side panel</li>
      <ul>
        <li>State will stored in the config, after app restart the state are loaded again</li>
      </ul>
    <li>Full Feed-Chart</li>
      <ul>
        <li>Displays the live bitrate in a line chart</li>
      </ul>
    <li>Feed Stats</li>
      <ul>
        <li>The current feed-bitrate - refetching every 1000ms</li>
        <li>The current feed-speed - refetching every 1000ms</li>
        <li>The current feed-uptime - resets after restarting the feed</li>
        <li>The total feed-uptime - the sum of all single feed uptimes since the app starts, resets after app restart</li>
      </ul>
    <li>Connection states from the server and broadcasting software</li>
      <ul>
        <li>Color gray: No connection to a broadcasting software </li>
        <li>Color green: Broadcasting software is connected to the app</li>
        <li>Type: Show the server or broadcasting type if connected</li>
      </ul>
    <li>Current active platform to listen for chat messages</li>
      <ul>
        <li>Top: Shows the platform icon</li>
        <li>Bottom: Shows the Broadcaster nickname, is no broadcaster signed in for the active platform a information is shown instead the nick</li>
      </ul>
    <li>Open app session log feed</li>
  </ul>

</details>

# Platform Setup

<details>
  <summary>Display all platform settings</summary>
  <div align="center">
    <p>
      Only <span><u><b>one</b></u></span> platform could be the active platform. If you change the active platform and a account for that platform is connected, the application logs in to the chat and listen for messages
    </p>
  </div>

  ##

  ### Chat Commands

  - Chat commands are the same for all platforms. E.g. If a command is changed for Twitch, it is changed for all platforms at the same time. This includes all settings (Aliases, enabled state, required roles)

  ![image](readme-assets/platform/chat-commands.png)

  <ol>
    <li>Search/Layout region</li>
    <ul>
      <li>
        All changed sorting/filtering/layout states are stored in the configs.
      </li>
      <li>
        Searchbox - Search for the command name or a alias
      </li>
      <li>
        Filtering/Sorting - Change the sorting and filtering of commands
      </li>
      <li>
        Layout - Change the layout for the commands from list to grid layout
      </li>
    </ul>
    <li>Command name</li>
    <ul>
      <li>
        The name from the command you can search for in the searchbox
      </li>
    </ul>
    <li>Minimum required Role</li>
    <ul>
      <li>
        The minimum required role to execute the command in the chat. E.g. Admins are able to execute admin, mod and all commands, but not broadcaster commands
      </li>
    </ul>
    <li>Aliases</li>
    <ul>
      <li>
        Each alias has his own chip
      </li>
      <li>
        If you wanna execute a command with a alias, the alias must be the first word in the chat
      </li>
      <li>
        The wanted prefix must be included in the alias. E.b !start -> "!start" starts the stream, "start" does nothing "?start" does nothing as well
      </li>
    </ul>
  </ol>

  ##
  
  ### Chat Messages

  - Chat messages are the same for all platforms. E.g. If a message is changed for Twitch, it is changed for all platforms at the same time. This includes all settings (text and enabled states)
  - Some messages are triggered at two ways. Manually, with an alias (e.g. !b trigger the bitrate message), automatically in effect of an switcher event (e.g. the switcher switches to any scene). The enabled state disable both ways the the message are triggered

  ![image](readme-assets/platform//chat-messages.png)

  <ol>
    <li>Message name</li>
    <ul>
      <li>
        The name from the message you can search for in the searchbox
      </li>
    </ul>
    <li>Enabled state</li>
    <ul>
      <li>
        If the message is disabled the message will not posted in the broadcasters chat
      </li>
      <li>
        The message reply they are posted in the broadcasters chat
      </li>
    </ul>
    <li>Hint</li>
    <ul>
      <li>
        Hints are information for the possible variables. Variables must always be in brackets with a "$" as prefix. "{variable}" not works, the output is "text {variable} text".
      </li>
    </ul>
  </ol>

  ##

  ### User Settings

  - If no broadcaster for the platform is signed in you are not able to manage any users. The app need your access token from the platform to check if the user exists and send the api call to get the wanted users information. Only public user-information are requested from the api, no personal data (like email address).
  - Admins or Mods, they you setup in the app must not have any roles or permissions in your broadcaster chat (this means they don't have mod role in your chat). The users you setup in the app have only the permissions in the app to perform commands.
  - All platform moderators automatically owns the mod role in the app, you don't have to setup them all in the app

  ![image](readme-assets/platform/users.png)

  <ol>
    <li>Users for the role-group</li>
    <ul>
      <li>
        Each user displayed in his own chip
      </li>
      <li>
        To remove a user click at the cross in the users chip. All user data will be deleted from the user
      </li>
    </ul>
    <li>Add a user</li>
    <ul>
      <li>
        Entry the name from the user in the roles textfield. The name must be exact the name the user has on the platform.
      </li>
      <li>
        After click the button or press enter the api call for the user data runs, if no user found a error message is displayed, otherwise the chip for the user appears
      </li>
    </ul>
  </ol>

  ##

  ### Account Settings

  - The login of an broadcaster for the active platform is a requirement. Otherwise you are not able to use the applications chat functionality, the switching itself will be working without an login
  - It isn't a requirement to login a chatbot account. Messages are posted with the broadcasters account if you don't sign in a chatbot.

  ![image](readme-assets/platform/accounts.png)

  <ol>
    <li>Account card</li>
    <ul>
      <li>
        The user information and a logout button for the user. After logout all userdata will be deleted and the user access token are revoked.
      </li>
      <li>
        If no user is logged in you find a login button. After clicking the button the authorization code flow automatically starts in your machines main browser. After the authorization on the platform, the user information automatically stored in the app and the image and name of the user appears in the user card
      </li>
    </ul>
    <li>Enable Chatbot</li>
    <ul>
      <li>
        Set the toggle to enable to use the chatbot account to post messages in the platform chat
      </li>
    </ul>
  </ol>
</details>

##

### Platform Setup

<details>
  <summary>Display all server settings</summary>

  - The Bitrate Monitor is only able to listen for one server stats url. Different server types serve the stats in a little different way. To make sure the stats correctly send to the apps switcher function, it is required to choose the correct server type.

  ![image](readme-assets/server/server-settings.png)

  <ol>
    <li>
      Server Type
    </li>
    <ul>
      <li>
        The server type witch reaches the stream and serve the feed-stats  
      </li>
    </ul>
    <li>
      Server Name
    </li>
    <ul>
      <li>
        A random name for your server in the app. It doesn't matter what name it is, but the name is required
      </li>
    </ul>
    <li>
      Stats URL
    </li>
    <ul>
      <li>
        The stats url where the server serves the stats to fetch them.
      </li>
    </ul>
    <li>
      Publisher
    </li>
    <ul>
      <li>
        The publisher from your server stats
      </li>
    </ul>
  </ol>

</details>

# Software Setup

<details>
  <summary>Display all broadcasting software settings</summary>

  - The broadcasting software is permanently connected with the app. In state of the feed information, witch are listen from the server stats, the Bitrate Monitor switches scenes in the broadcasting software

  ![image](readme-assets/software/software-settings.png)

  <ol>
    <li>
      Software Type
    </li>
    <ul>
      <li>
        The software type the broadcasting software is (OBS Studio only at first, more will be added if there are relevant ones)
      </li>
    </ul>
    <li>
      Websocket Host
    </li>
    <ul>
      <li>
        The public or local address for the websocket host
      </li>
    </ul>
    <li>
      Websocket Port
    </li>
    <ul>
      <li>
        The port from the Websocket
      </li>
    </ul>
    <li>
      Websocket Password
    </li>
    <ul>
      <li>
        If the broadcasting software has a password on, the password is required. Passwords are sometimes optional, sometimes they named different (Streamlabs OBS called them API-Token)
      </li>
    </ul>
  </ol>

</details>

# Switcher Setup

<details>
  <summary>Display all switcher settings</summary>

  - The switcher is the main functionality from the application. In dependency of the incoming bitrate and your settings the switcher switches your broadcasting platforms scenes.

  ##

  ### Switcher enabled states

  ![image](readme-assets/switcher/enabled-states.png)

  <ol>
    <li>
      Enables Switcher
    </li>
    <ul>
      <li>
        Enable or disable the whole switcher. If the switcher is disable he never will switch any scene
      </li>
    </ul>
    <li>
      Only switch when live
    </li>
    <ul>
      <li>
        If this settings is enabled, the switcher only switches automatically if your broadcasting software has started a stream to any platform
      </li>
    </ul>
    <li>
      Enable Chat notifications
    </li>
    <ul>
      <li>
        This option is only for not-triggered-actions. If the settings is enabled and the switcher switches in automatism run a scene (e.g. low bitrate, the switcher switches to low-bitrate scene) a message will be posted in the broadcaster chat. Otherwise he will not send the message to the chat.
      </li>
      <li>
        If the message, the automatism wanna send, disabled in the message settings, the switcher will not send any message. 
      </li>
    </ul>
    <li>
      Switch to start scene on stream start
    </li>
    <ul>
      <li>
        If the stream start command are triggered, the switcher automatically switches to the in the scenes defined start scene
      </li>
    </ul>
    <li>
      Stop stream after raid
    </li>
    <ul>
      <li>
        After the broadcaster raids another broadcaster, the switcher automatically stops the stream in the broadcasting software
      </li>
    </ul>
  </ol>

  ##

  ### Switcher Scene Settings

  - Setup the scenes for the switcher. The scene names must match the scenes in your broadcasting software. They are not matching, the switcher doesn't abel to switch on the scene

  ![image](readme-assets/switcher/scene-settings.png)

  <ol>
    <li>
      Live Scene
    </li>
    <ul>
      <li>
        The main live scene. This is the scene if bitrate threshold is in range to show the live picture in the stream
      </li>
    </ul>
    <li>
      Offline Scene
    </li>
    <ul>
      <li>
        The scene if the threshold is below the off-trigger value
      </li>
    </ul>
    <li>
      Low Bitrate Scene
    </li>
    <ul>
      <li>
        The scene if the threshold is below the live-trigger and above the off-trigger value
      </li>
    </ul>
    <li>
      Privacy Scene
    </li>
    <ul>
      <li>
        The privacy scene is a special scene for private moments. The switcher will never switch from the scene away if no manual event is triggered. The scene can be restricted as well, this means, the switch scene command can be restricted, so no one without the required permissions can switch away from the privacy scene. Switching to the privacy scene is not restricted.
      </li>
      <li>
      <b><u>This scene must have a unique name! No other scene can have the same name like the privacy scene!</u></b>
      </li>
    </ul>
    <li>
      Intro Scene
    </li>
    <ul>
      <li>
        The scene where the switcher switches if the "Switch to Start on Stream Start" option is enabled
      </li>
    </ul>
  </ol>
  
  ##

  ### Switcher Scene Settings

  - Setup the trigger thresholds and the delays, they have to wait before the switcher switches the scene

  ![image](readme-assets/switcher/trigger-settings.png)

  <ol>
    <li>
      Bitrate Trigger to Low Scene
    </li>
    <ul>
      <li>
        If the current bitrate is equals or below this value, the switcher switches to the low-bitrate-scene after the delay time value.
      </li>
    </ul>
    <li>
      Bitrate Recovery Trigger
    </li>
    <ul>
      <li>
        If the current bitrate is equals or above this value, the switcher switches to the live-scene after the delay time value.
      </li>
      <li>
        Is the delay time value set to 0, the switcher switch switches instant back to the live-scene
      </li>
    </ul>
    <li>
      Bitrate Offline Trigger
    </li>
    <ul>
      <li>
        The the current bitrate is equals or below this value, the switcher switches to the offline scene
      </li>
    </ul>
    <li>
      Switch to Live Timeout
    </li>
    <ul>
      <li>
        The time in seconds the current bitrate have to be above the bitrate threshold before the switcher actual switch the scene.
      </li>
      <li>
        Set the value to 0 to force instant recover to live scene
      </li>
      <li>
      </li>
    </ul>
    <li>
      Switch to Low Timeout
    </li>
    <ul>
      <li>
        The time in seconds the current bitrate have to be below the bitrate threshold before the switcher actual switch the scene
      </li>
    </ul>
    <li>
      Switch to Offline Timeout
    </li>
    <ul>
      <li>
        The time in seconds the current bitrate have to be below the bitrate threshold before the switcher actual switch the scene
      </li>
    </ul>
  </ol>


</details>