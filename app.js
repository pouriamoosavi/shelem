// var createError = require('http-errors');
// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

// var app = express();

// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// module.exports = app;

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);
// WARNING: app.listen(80) will NOT work here!

let allCards = [
  {name: 'c1'}, {name: 'c2'}, {name: 'c3'}, {name: 'c4'}, {name: 'c5'}, {name: 'c6'}, {name: 'c7'}, {name: 'c8'}, {name: 'c9'}, {name: 'c10'}, {name: 'cj'}, {name: 'cq'}, {name: 'ck'},
  {name: 'd1'}, {name: 'd2'}, {name: 'd3'}, {name: 'd4'}, {name: 'd5'}, {name: 'd6'}, {name: 'd7'}, {name: 'd8'}, {name: 'd9'}, {name: 'd10'}, {name: 'dj'}, {name: 'dq'}, {name: 'dk'},
  {name: 's1'}, {name: 's2'}, {name: 's3'}, {name: 's4'}, {name: 's5'}, {name: 's6'}, {name: 's7'}, {name: 's8'}, {name: 's9'}, {name: 's10'}, {name: 'sj'}, {name: 'sq'}, {name: 'sk'},
  {name: 'h1'}, {name: 'h2'}, {name: 'h3'}, {name: 'h4'}, {name: 'h5'}, {name: 'h6'}, {name: 'h7'}, {name: 'h8'}, {name: 'h9'}, {name: 'h10'}, {name: 'hj'}, {name: 'hq'}, {name: 'hk'},
  {name: 'jb'}, {name: 'jc'},
]
let thisGameCards = allCards;
let db = {
  players: [
    // {name: '',
    // socket: {},
    // ip: '',
    // read: 0,
    // cards: []}
  ],
  read: 0,
}
let numberOfPlayers = 4;

// app.get('/', function (req, res) {
//   res.sendFile('/index.html');
// });

io.on('connection', async function (socket) {
  socket.on('join', async function(data) {
    if(db.players.length >= numberOfPlayers) return socket.emit('roomFull');
    const name = data.myName;
    let playerCards = [];
    for(let i=0; i<12; i++) {
      let rand = Math.floor(Math.random() * thisGameCards.length);
      playerCards.push(thisGameCards[rand]);
      thisGameCards.splice(rand, 1);
    } 

    let otherPlayers = db.players.map(player => player.name);

    let newPlayer = {
      name,
      socket,
      ip: '',
      cards: playerCards,
    }
    db.players.push(newPlayer);
    console.log(newPlayer.cards)
    io.to('room1').emit('newPlayerJoined', {player: {name}});
    socket.emit('youJoined', {name: newPlayer.name, cards: newPlayer.cards, otherPlayers});
    socket.join('room1');

    await checkAndStart();
  })
});

async function checkAndStart() {
  if(db.players.length == numberOfPlayers) {
    io.to('room1').emit('startGame', {});
    await reading(0, function(err, lastRead){
      db.read = lastRead;
      console.log("==================================================" + db.read);
    });
  }
}
async function reading(playerIndex, cb) {
  if(db.players.filter(player => player.read == -1).length == (numberOfPlayers-1)) {
    return cb(null, db.players.find(player => player.read != -1).read);
  } else if(db.players[playerIndex].read == -1) {
    await reading((playerIndex+1)%numberOfPlayers, cb)
  } else {
    let socket = db.players[playerIndex].socket;
    socket.removeAllListeners('Iread');
    socket.emit('read');
    socket.on('Iread', async function(data) {
      db.players[playerIndex].read = data.read;
      console.log(playerIndex + ' read')
      io.to('room1').emit('otherPlayerRead', {name: db.players[playerIndex].name, read: db.players[playerIndex].read});
      console.log(((playerIndex+1)%numberOfPlayers) + ' turn')
      await reading((playerIndex+1)%numberOfPlayers, cb)
    })
  }
}
