var express = require('express');
var router = express.Router();


allCards = [
  {name: 'c1', img: ''}, {name: 'c2', img: ''}, {name: 'c3', img: ''}, {name: 'c4', img: ''}, {name: 'c5', img: ''}, {name: 'c6', img: ''}, {name: 'c7', img: ''}, {name: 'c8', img: ''}, {name: 'c9', img: ''}, {name: 'c10', img:  ''}, {name: 'cj', img: ''}, {name: 'cq', img: ''}, {name: 'ck', img: ''},
  {name: 'd1', img: ''}, {name: 'd2', img: ''}, {name: 'd3', img: ''}, {name: 'd4', img: ''}, {name: 'd5', img: ''}, {name: 'd6', img: ''}, {name: 'd7', img: ''}, {name: 'd8', img: ''}, {name: 'd9', img: ''}, {name: 'd10', img:  ''}, {name: 'dj', img: ''}, {name: 'dq', img: ''}, {name: 'dk', img: ''},
  {name: 'h1', img: ''}, {name: 'h2', img: ''}, {name: 'h3', img: ''}, {name: 'h4', img: ''}, {name: 'h5', img: ''}, {name: 'h6', img: ''}, {name: 'h7', img: ''}, {name: 'h8', img: ''}, {name: 'h9', img: ''}, {name: 'h10', img:  ''}, {name: 'hj', img: ''}, {name: 'hq', img: ''}, {name: 'hk', img: ''},
  {name: 's1', img: ''}, {name: 's2', img: ''}, {name: 's3', img: ''}, {name: 's4', img: ''}, {name: 's5', img: ''}, {name: 's6', img: ''}, {name: 's7', img: ''}, {name: 's8', img: ''}, {name: 's9', img: ''}, {name: 's10', img:  ''}, {name: 'sj', img: ''}, {name: 'sq', img: ''}, {name: 'sk', img: ''},
  {name: 'jb', img: ''}, {name: 'jc', img: ''},
]
thisGameCards = [];
let db = {
  users: [
    // {name: '',
    // ip: '',
    // cards: []}
  ]
}
router.get('/start', function(req, res, next) {
  try{
    thisGameCards = allCards;
  } catch (err) {
    console.log(err)
  }
})
/* GET home page. */
router.post('/join', function(req, res, next) {
  try{
    const name = req.body.name;
    if(!name) return res.json({code: -1, message: 'اطلاعات ورودی ناقص است.'})

    let userCards = [];
    for(let i=0; i<13; i++) {
      let rand = Math.floor(Math.random() * thisGameCards.length);
      userCards.push(thisGameCards[rand]);
      thisGameCards.splice(rand, 1);
    } 
    
    let newUser = {
      name,
      ip: '',
      cards: userCards,
    }
    db.users.push(newUser);
    return res.json({code: 0, message: 'خوش آمدید.', data: {newUser}})
    // res.render('index', { title: 'Express' });
  } catch (err) {
    console.log(err)
  }
});
router.post('/play', function(req, res, next) {
  try{
  const {name, cardNumber} = req.body;

  let user = db.find(user => user.name == name);
  if(!user) return res.json({code: -1, message: 'اطلاعات ورودی اشتباه است.'})

  let card = user.cards.find(card => card.name == cardName);
  if(!card) return res.json({code: -1, message: 'اطلاعات ورودی اشتباه است.'})

  user.cards.splice(user.cards.indexOf(card), 1);
  return res.json({code: 0, message})
  } catch (err) {
    console.log(err);
  }
})
module.exports = router;
