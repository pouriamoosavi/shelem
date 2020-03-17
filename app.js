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
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);
// WARNING: app.listen(80) will NOT work here!

let allCards = [
  {name: 'c1', img: 'ace_of_clubs'}, {name: 'c2', img: '2_of_clubs'}, {name: 'c3', img: '3_of_clubs'}, {name: 'c4', img: '4_of_clubs'}, {name: 'c5', img: '5_of_clubs'}, {name: 'c6', img: '6_of_clubs'}, {name: 'c7', img: '7_of_clubs'}, {name: 'c8', img: '8_of_clubs'}, {name: 'c9', img: '9_of_clubs'}, {name: 'c10', img: '10_of_clubs'}, {name: 'cj', img: 'jack_of_clubs2'}, {name: 'cq', img: 'queen_of_clubs2'}, {name: 'ck', img: 'king_of_clubs2'},
  {name: 'd1', img: 'ace_of_diamonds'}, {name: 'd2', img: '2_of_diamonds'}, {name: 'd3', img: '3_of_diamonds'}, {name: 'd4', img: '4_of_diamonds'}, {name: 'd5', img: '5_of_diamonds'}, {name: 'd6', img: '6_of_diamonds'}, {name: 'd7', img: '7_of_diamonds'}, {name: 'd8', img: '8_of_diamonds'}, {name: 'd9', img: '9_of_diamonds'}, {name: 'd10', img: '10_of_diamonds'}, {name: 'dj', img: 'jack_of_diamonds2'}, {name: 'dq', img: 'queen_of_diamonds2'}, {name: 'dk', img: 'king_of_diamonds2'},
  {name: 's1', img: 'ace_of_spades'}, {name: 's2', img: '2_of_spades'}, {name: 's3', img: '3_of_spades'}, {name: 's4', img: '4_of_spades'}, {name: 's5', img: '5_of_spades'}, {name: 's6', img: '6_of_spades'}, {name: 's7', img: '7_of_spades'}, {name: 's8', img: '8_of_spades'}, {name: 's9', img: '9_of_spades'}, {name: 's10', img: '10_of_spades'}, {name: 'sj', img: 'jack_of_spades2'}, {name: 'sq', img: 'queen_of_spades2'}, {name: 'sk', img: 'king_of_spades2'},
  {name: 'h1', img: 'ace_of_hearts'}, {name: 'h2', img: '2_of_hearts'}, {name: 'h3', img: '3_of_hearts'}, {name: 'h4', img: '4_of_hearts'}, {name: 'h5', img: '5_of_hearts'}, {name: 'h6', img: '6_of_hearts'}, {name: 'h7', img: '7_of_hearts'}, {name: 'h8', img: '8_of_hearts'}, {name: 'h9', img: '9_of_hearts'}, {name: 'h10', img: '10_of_hearts'}, {name: 'hj', img: 'jack_of_hearts2'}, {name: 'hq', img: 'queen_of_hearts2'}, {name: 'hk', img: 'king_of_hearts2'},
  {name: 'jb', img: 'black_joker'}, {name: 'jc', img: 'red_joker'},
]
let thisGameCards = allCards;
let db = {
  users: [
    // {name: '',
    // socket: {},
    // ip: '',
    // read: 0,
    // cards: []}
  ],
  read: 0,
}

app.get('/', function (req, res) {
  res.sendFile('/index.html');
});

io.on('connection', async function (socket) {
  socket.on('join', async function(data) {
    if(db.users.length >= 4) return socket.emit('roomFull');
    const name = data.myName;
    let userCards = [];
    for(let i=0; i<12; i++) {
      let rand = Math.floor(Math.random() * thisGameCards.length);
      userCards.push(thisGameCards[rand]);
      thisGameCards.splice(rand, 1);
    } 

    let otherUsers = db.users.map(user => user.name);

    let newUser = {
      name,
      socket,
      ip: '',
      cards: userCards,
    }
    db.users.push(newUser);
    console.log(newUser.cards)
    io.to('room1').emit('newUserJoined', {user: {name}});
    socket.emit('youJoined', {cards: newUser.cards, otherUsers});
    socket.join('room1');

    await checkAndStart();
  })
});

async function checkAndStart() {
  if(db.users.length == 1) {
    console.log('startGame')
    io.to('room1').emit('startGame', {});
    await reading(0, function(err, lastRead){
      db.read = lastRead;
      console.log("==================================================" + db.read);
    });
  }
}

async function reading(userIndex, cb) {
  console.log(db.users)
  if(db.users[userIndex].read == -1) {
    return await reading((userIndex+1)%4, cb)
  }
  if(db.users.filter(user => user.read == -1).length == 3) {
    return cb(null, db.users.find(user => user.read != -1).read);
  } 
  let socket = db.users[userIndex].socket;
  socket.emit('read');
  socket.on('read', async function(data) {
    db.users[userIndex].read = data.read;
    io.to('room1').emit('otherPlayerRead', {name: db.users[userIndex].name, read: db.users[userIndex].read});
    await reading((userIndex+1)%4, cb)
  })
}
