const express = require('express');
const app = express();
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const shortid = require('shortid')
const calculate = require('./calculate');
const validate = require('./validate');

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
  {name: 'c2'}, {name: 'c3'}, {name: 'c4'}, {name: 'c5'}, {name: 'c6'}, {name: 'c7'}, {name: 'c8'}, {name: 'c9'}, {name: 'c10'}, {name: 'cj'}, {name: 'cq'}, {name: 'ck'}, {name: 'ca'},
  {name: 'd2'}, {name: 'd3'}, {name: 'd4'}, {name: 'd5'}, {name: 'd6'}, {name: 'd7'}, {name: 'd8'}, {name: 'd9'}, {name: 'd10'}, {name: 'dj'}, {name: 'dq'}, {name: 'dk'}, {name: 'da'}, 
  {name: 's2'}, {name: 's3'}, {name: 's4'}, {name: 's5'}, {name: 's6'}, {name: 's7'}, {name: 's8'}, {name: 's9'}, {name: 's10'}, {name: 'sj'}, {name: 'sq'}, {name: 'sk'}, {name: 'sa'}, 
  {name: 'h2'}, {name: 'h3'}, {name: 'h4'}, {name: 'h5'}, {name: 'h6'}, {name: 'h7'}, {name: 'h8'}, {name: 'h9'}, {name: 'h10'}, {name: 'hj'}, {name: 'hq'}, {name: 'hk'}, {name: 'ha'}, 
  {name: 'jb'}, {name: 'jc'},
]

const limitOfPlayers = 4;

var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function (req, res) {
  res.sendFile('/index.html');
});

io.on('connection', async function (socket) {
  socket.on('join', async function(data) {
    console.log(calculate.point([{name: 'd2'}, {name: 'd5'}, {name: 'jb'}, {name: 'c8'}], "nac"))
    try{
      let {matchID} = await join({socket, name: data.myName});
      let {start} = await checkAndStart({matchID});
      if(start) {
        await reading(matchID, 0, async function(err, commander){
          const {name} = commander;
          db.get("matches").find({id: matchID}).get("games").last()
            .get("players").find({name}).assign({commander: true}).write();
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
        date: new Date(),
        players: [],
        games: []
      }).cloneDeep().write()
    }
    let {id, players} = match[0]
    //now match has at least one seat

    const otherPlayers = players.map(player => {return {name: player.name}});

    let newPlayer = {
      name,
      socketID: socket.id,
      ip: '',
    }
    players.push(newPlayer);
    db.get("matches").find({id}).assign({players}).write();

    io.to(id).emit('newPlayerJoined', {player: {name: newPlayer.name}});
    socket.emit('youJoined', {name: newPlayer.name, otherPlayers});
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
    await startGameAndSendCards(matchID)
    return {start: true}
  } else {
    return {start: false}
  }
}

async function reading(matchID, playerIndex, cb) {
  let match = db.get("matches").find({id: matchID}).cloneDeep().value();
  let game = db.get("matches").find({id: matchID}).get("games").last().cloneDeep().value();
  if(game.players.filter(player => player.read == -1).length == 3 && game.players.filter(player => player.read == 0).length == 1) {
    io.to(match.id).emit('lastGameCanceled', {});
    await startGameAndSendCards(matchID)
    return await reading(matchID, 0, cb)
  } else if(game.players.filter(player => player.read == -1).length == (limitOfPlayers-1)) {
    return cb(null, game.players.find(player => player.read != -1));
  } else if(game.players[playerIndex].read == -1) {
    await reading(matchID, (playerIndex+1)%limitOfPlayers, cb)
  } else {
    let {name, socketID} = match.players[playerIndex];
    let socket = io.sockets.sockets[socketID]
    socket.removeAllListeners('Iread');
    socket.emit('read', {highestRead: await getHighestRead(matchID)});
    socket.on('Iread', async function(data) {
      db.get("matches").find({id: matchID}).get("games").last()
        .get("players").nth(playerIndex).assign({ read: parseInt(data.read) }).write();
      io.to(match.id).emit('otherPlayerRead', {name, read: data.read});
      await reading(matchID, (playerIndex+1)%limitOfPlayers, cb)
    })
  }
}
async function commanding(matchID, playerName, cb) {
  try{
    let match = db.get("matches").find({id: matchID}).cloneDeep().value();
    let game = db.get("matches").find({id: matchID}).get("games").last().cloneDeep().value();
    let gamePlayer = game.players.find(pl => pl.name == playerName);
    let replaceCards = game.availableCards;
    const player = match.players.find(player => player.name == playerName)
    let {name, socketID} = player;
    let socket = io.sockets.sockets[socketID]
    socket.removeAllListeners('command');
    socket.emit('command', {replaceCards});
    socket.on('Icommand', async function(data) {
      const {command, newCards} = data;
      if(validate.cardsReplace(gamePlayer.cards, replaceCards, newCards)) {
        db.get("matches").find({id: matchID}).get("games").last()
          .get("players").find({name: playerName}).assign({cards: newCards}).write()
      }
      io.to(match.id).emit('otherPlayerCommand', {name, command});
      //await reading((playerIndex+1)%numberOfPlayers, cb)
      cb(null, data.command);
    })
  } catch (err) {
    throw err;
  }
}
async function getHighestRead(matchID) {
  try{
    let reads = db.get("matches").find({id: matchID}).get("games").last().get("players").map('read');
    let highestRead = 0;
    for(let read of reads) {
      if(read > highestRead) highestRead = read;
    }
    return highestRead;
  } catch (err) {
    throw err;
  }
}
async function startGameAndSendCards(matchID) {
  try{
    let match = db.get("matches").find({id: matchID}).cloneDeep().value();

    //shift players. so when this method called for second time, the next user will read first;
    let players = match.players;
    let shifted = players.shift();
    players.push(shifted);
    db.get("matches").find({id: matchID}).assign({players}).write();

    io.to(match.id).emit('startGame', {});

    let newGame = {
      availableCards: [...allCards],
      players: [],
      command: "",
      team1Score: 0,
      team2Score: 0,
      sets: []
    }
    for(let mp in match.players) {
      let playerCards = [];
      for(let i=0; i<12; i++) {
        let rand = Math.floor(Math.random() * newGame.availableCards.length);
        playerCards.push(newGame.availableCards[rand]);
        newGame.availableCards.splice(rand, 1);
      } 
      newGame.players.push({
        name: match.players[mp].name,
        team: (parseInt(mp)%2) + 1,
        cards: playerCards,
        read: 0, 
        commander: false,
      })
      let socket = io.sockets.sockets[match.players[mp].socketID];
      socket.emit("sendCards", {cards: playerCards})
    }

    db.get("matches").find({id: match.id}).get("games").push(newGame).write();
    return;

  } catch (err) {
    throw err;
  }
}