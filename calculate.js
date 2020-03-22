
const commands = ["hoc", "hod", "hos", "hoh",
  "sac", "sad", "sas", "sah",
  "nac", "nad", "nas", "nah",
  "anc", "and", "ans", "anh"];

let functions = {};
module.exports.point = (cards, command) => {
  try{
    let functionName = command.substring(0, 2)
    return functions[functionName](cards, command)
  } catch (err) {
    console.log(err)
  }
}

functions.sa = function (cards, command) {
  try{
    const firstSuit = cards[0].name[0];
    const commandSuit = command[2];

    let winnerCard = cards[0];
    let point = 5;
    for(let card of cards){
      //find winner
      if(card.name[0] == firstSuit || (firstSuit == commandSuit && card.name[0] == 'j')){
        let winnerRank = saRanks(winnerCard)
        let cardRank = saRanks(card)
        if(cardRank > winnerRank) {
          winnerCard = card;
        }
      }

      //calculate point
      if(card.name[1] == 'a') point += 15;
      else if(card.name[1] == '1' && card.name[2] == '0') point += 10;
      else if(card.name[1] == '5') point += 5;
      else if(card.name == 'jb') point += 20;
      else if(card.name == 'jc') point += 25;
    }

    return {winnerCard, point}
  } catch (err) {
    throw err;
  }
}
function saRanks(card) {
  if(isNaN(card.name[1])){
    if(card.name[1] == 'j') {
      return 11;
    } else if(card.name[1] == 'q') {
      return 12;
    } else if(card.name[1] == 'k') {
      return 13;
    } else if(card.name[1] == 'a') {
      return 14;
    } else if(card.name[0] == 'j') {
      if(card.name[1] == 'b') return 15;
      if(card.name[1] == 'c') return 16;
    }
  } else {
    return parseInt(card.name[1]);
  }
}

functions.na = function (cards, command) {
  try{
    const firstSuit = cards[0].name[0];
    const commandSuit = command[2];

    let winnerCard = cards[0];
    let point = 5;
    for(let card of cards){
      //find winner
      if(card.name[0] == firstSuit || (firstSuit == commandSuit && card.name[0] == 'j')){
        let winnerRank = naRanks(winnerCard)
        let cardRank = naRanks(card)
        if(cardRank > winnerRank) {
          winnerCard = card;
        }
      }

      //calculate point
      if(card.name[1] == '2') point += 15;
      else if(card.name[1] == '1' && card.name[2] == '0') point += 5;
      else if(card.name[1] == '5') point += 10;
      else if(card.name == 'jb') point += 20;
      else if(card.name == 'jc') point += 25;
    }

    return {winnerCard, point}
  } catch (err) {
    throw err;
  }
}
function naRanks(card) {
  if(isNaN(card.name[1])){
    if(card.name[1] == 'j') {
      return 5;
    } else if(card.name[1] == 'q') {
      return 4;
    } else if(card.name[1] == 'k') {
      return 3;
    } else if(card.name[1] == 'a') {
      return 2;
    } else if(card.name[0] == 'j') {
      if(card.name[1] == 'b') return 15;
      if(card.name[1] == 'c') return 16;
    }
  } else {
    return 10 - parseInt(card.name[1]) + 6;
  }
}

functions.an = function (cards, command) {
  try{
    const firstSuit = cards[0].name[0];
    const commandSuit = command[2];

    let winnerCard = cards[0];
    let point = 5;
    for(let card of cards){
      //find winner
      if(card.name[0] == firstSuit || (firstSuit == commandSuit && card.name[0] == 'j')){
        let winnerRank = anRanks(winnerCard)
        let cardRank = anRanks(card)
        if(cardRank > winnerRank) {
          winnerCard = card;
        }
      }

      //calculate point
      if(card.name[1] == 'a') point += 15;
      else if(card.name[1] == '1' && card.name[2] == '0') point += 0;
      else if(card.name[1] == '5') point += 10;
      else if(card.name == 'jb') point += 20;
      else if(card.name == 'jc') point += 25;
    }

    return {winnerCard, point}
  } catch (err) {
    throw err;
  }
}
function anRanks(card) {
  if(isNaN(card.name[1])){
    if(card.name[1] == 'j') {
      return 4;
    } else if(card.name[1] == 'q') {
      return 3;
    } else if(card.name[1] == 'k') {
      return 2;
    } else if(card.name[1] == 'a') {
      return 14;
    } else if(card.name[0] == 'j') {
      if(card.name[1] == 'b') return 15;
      if(card.name[1] == 'c') return 16;
    }
  } else {
    return 10 - parseInt(card.name[1]) + 5;
  }
}

functions.ho = function (cards, command) {
  try{
    const firstSuit = cards[0].name[0];
    const commandSuit = command[2];

    let winnerCard = cards[0];
    let point = 5;
    for(let card of cards){
      //find winner
      let winnerRank = hoRanks(winnerCard)
      if(winnerCard.name[0] == commandSuit) winnerRank += 13;
      let cardRank = hoRanks(card)
      if(card.name[0] == commandSuit) cardRank += 13;
      if(cardRank > winnerRank) {
        winnerCard = card;
      }

      //calculate point
      if(card.name[1] == 'a') point += 15;
      else if(card.name[1] == '1' && card.name[2] == '0') point += 10;
      else if(card.name[1] == '5') point += 5;
      else if(card.name == 'jb') point += 20;
      else if(card.name == 'jc') point += 25;
    }

    return {winnerCard, point}
  } catch (err) {
    throw err;
  }
}
function hoRanks(card) {
  if(isNaN(card.name[1])){
    if(card.name[1] == 'j') {
      return 11;
    } else if(card.name[1] == 'q') {
      return 12;
    } else if(card.name[1] == 'k') {
      return 13;
    } else if(card.name[1] == 'a') {
      return 14;
    } else if(card.name[0] == 'j') {
      if(card.name[1] == 'b') return 15;
      if(card.name[1] == 'c') return 16;
    }
  } else {
    return parseInt(card.name[1]);
  }
}