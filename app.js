const express = require('express');
const app = express();
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const shortid = require('shortid')

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const server = require('http').Server(app);
const io = require('socket.io')(server);
server.listen(3001);
// WARNING: app.listen(80) will NOT work here!
 
const adapter = new FileSync('db.json')
const db = low(adapter)

db.defaults({ matches: [] }).write()

const allCards = [
  {name: 'c1'}, {name: 'c2'}, {name: 'c3'}, {name: 'c4'}, {name: 'c5'}, {name: 'c6'}, {name: 'c7'}, {name: 'c8'}, {name: 'c9'}, {name: 'c10'}, {name: 'cj'}, {name: 'cq'}, {name: 'ck'},
  {name: 'd1'}, {name: 'd2'}, {name: 'd3'}, {name: 'd4'}, {name: 'd5'}, {name: 'd6'}, {name: 'd7'}, {name: 'd8'}, {name: 'd9'}, {name: 'd10'}, {name: 'dj'}, {name: 'dq'}, {name: 'dk'},
  {name: 's1'}, {name: 's2'}, {name: 's3'}, {name: 's4'}, {name: 's5'}, {name: 's6'}, {name: 's7'}, {name: 's8'}, {name: 's9'}, {name: 's10'}, {name: 'sj'}, {name: 'sq'}, {name: 'sk'},
  {name: 'h1'}, {name: 'h2'}, {name: 'h3'}, {name: 'h4'}, {name: 'h5'}, {name: 'h6'}, {name: 'h7'}, {name: 'h8'}, {name: 'h9'}, {name: 'h10'}, {name: 'hj'}, {name: 'hq'}, {name: 'hk'},
  {name: 'jb'}, {name: 'jc'},
]
let thisGameCards = allCards;

const limitOfPlayers = 4;

io.on('connection', async function (socket) {
  socket.on('join', async function(data) {
    try{
      let {matchID} = await join({socket, name: data.myName});
      let {start} = await checkAndStart({matchID});
      if(start) {
        await reading(matchID, 0, async function(err, commander){
          const {name, read} = commander;
          db.get("matches").find({id: matchID}).get("games").last().assign({
            read,
            commander: {name},
          }).write();
          // console.log(db.get('read').value());
          await commanding(matchID, name, async function(err, command) {
            db.get("matches").find({id: matchID}).get("games").last().assign({command}).write();
          })
        });
      }

    } catch (err) {
      console.log(err)
    }
  })
});

async function join({socket, name}) {
  try{
    let match = db.get("matches").takeRight(1).cloneDeep().value();
    if(!match[0] || !match[0].players || (match[0].players && match[0].players.length >= 4)) { 
      // create match if the last one is full or not one exists
      match = db.get('matches').push({ 
        id: shortid.generate(),
        data: new Date(),
        availableCards: allCards,
        players: [],
        games: []
      }).cloneDeep().write()
    }
    let {id, availableCards, players} = match[0]
    //now match has at least one seat

    const otherPlayers = players.map(player => {return {name: player.name}});

    let playerCards = [];
    for(let i=0; i<12; i++) {
      let rand = Math.floor(Math.random() * availableCards.length);
      playerCards.push(thisGameCards[rand]);
      availableCards.splice(rand, 1);
    } 
    db.get("matches").find({id}).assign({availableCards}).write();

    let newPlayer = {
      name,
      team: (otherPlayers % 2)+1,
      socketID: socket.id,
      ip: '',
      cards: playerCards,
      read: 0,
    }
    players.push(newPlayer);
    db.get("matches").find({id}).assign({players}).write();

    io.to(id).emit('newPlayerJoined', {player: {name: newPlayer.name}});
    socket.emit('youJoined', {name: newPlayer.name, cards: newPlayer.cards, otherPlayers});
    socket.join(id);
    return {matchID: id};

  } catch (err) {
    console.log(err)
  }
}

async function checkAndStart({matchID}) {
  let match = db.get("matches").find({id: matchID}).cloneDeep().value();
  let matchPlayersNumber = match.players.length;
  if(matchPlayersNumber == limitOfPlayers) {
    let newGame = {
      read: 0,
      commander: null,
      command: "",
      team1Score: 0,
      team2Score: 0,
      sets: []
    }
    db.get("matches").find({id: matchID}).get("games").push(newGame).write();
    io.to(match.id).emit('startGame', {});
    return {start: true}
  } else {
    return {start: false}
  }
}
async function reading(matchID, playerIndex, cb) {
  let match = db.get("matches").find({id: matchID}).cloneDeep().value();
  if(match.players.filter(player => player.read == -1).length == (limitOfPlayers-1)) {
    return cb(null, match.players.find(player => player.read != -1));
  } else if(match.players[playerIndex].read == -1) {
    await reading(matchID, (playerIndex+1)%limitOfPlayers, cb)
  } else {
    let {name, read, socketID} = match.players[playerIndex];
    let socket = io.sockets.sockets[socketID]
    socket.removeAllListeners('Iread');
    socket.emit('read', {highestRead: await getHighestRead(matchID)});
    socket.on('Iread', async function(data) {
      db.get("matches").find({id: matchID}).get("players").nth(playerIndex).assign({ read: parseInt(data.read) }).write();
      io.to(match.id).emit('otherPlayerRead', {name, read});
      await reading(matchID, (playerIndex+1)%limitOfPlayers, cb)
    })
  }
}
async function commanding(matchID, playerName, cb) {
  try{
    let match = db.get("matches").find({id: matchID}).cloneDeep().value();
    const player = match.players.find(player => player.name == playerName)
    let {name, socketID} = player;
    let socket = io.sockets.sockets[socketID]
    socket.removeAllListeners('command');
    socket.emit('command');
    socket.on('Icommand', async function(data) {
      //db.get('players').nth(playerIndex).assign({ read: parseInt(data.read) }).write();
      io.to(match.id).emit('otherPlayerCommand', {name, command: data.command});
      //await reading((playerIndex+1)%numberOfPlayers, cb)
      cb(null, data.command);
    })
  } catch (err) {
    throw err;
  }
}
async function getHighestRead(matchID) {
  try{
    let reads = db.get("matches").find({id: matchID}).get("players").map('read');
    let highestRead = 0;
    for(let read of reads) {
      if(read > highestRead) highestRead = read;
    }
    return highestRead;
  } catch (err) {
    throw err;
  }
}