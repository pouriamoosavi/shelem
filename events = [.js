events = [
  {
    action: "join",
    from: "player",
    to: "server",
    data: {
      name: "my name"
    }
  },
  {
    action: 'youJoined',
    from: 'server',
    to: 'player',
    data: {
      name: "player name", 
      cards: [{name: 'c1', img: 'ace_of_clubs'}, ...{}], 
      otherPlayers: [{name: "other player's name"}]
    }
  },
  {
    action: "newPlayerJoined",
    from: 'server',
    to: 'room1',
    data: {
      player: {name: "joined player's name"}
    }
  },
  {
    action: "gameStarts",
    from: "server",
    to: "room1",
    data: {}
  },
  {
    action: "read",
    from: "server",
    to: "player",
    data: {
      highestRead: 150,
    }
  },
  {
    action: "Iread",
    from: "player",
    to: "server",
    data: {
      read: 150,
    }
  },
  {
    action: "otherPlayerRead",
    from: "server",
    to: "room1",
    data: {
      name: "other player's name",
      read: 150,
    }
  },
  {
    action: "command",
    from: "server",
    to: "player",
    data: {}
  },
  {
    action: "Icommand",
    from: "player",
    to: "server",
    data: {
      command: "hc"
    }
  },
  {
    action: "otherPlayerCommand",
    from: "server",
    to: "room1",
    data: {
      name: "other player's name",
      command: "hc"
    }
  },
  {
    action: "",
    from: "",
    to: "",
    data: {
      
    }
  }
];
commands: 

          ["hc", "hd", "hs", "hh",
          "sc", "sd", "ss", "sh",
          "nc", "nd", "ns", "nh",
          "ac", "ad", "as", "ah"]