module.exports = {
  turn: (match, player) => {
    try {
      let games = match.games;
      let lastGame = games[games.length - 1];
      let sets = lastGame.sets;
      let lastSet = sets[sets.length - 1];
      if (!lastSet) {
        return player.commander;
      }
      if (lastSet.cards.length == 4) {
        return lastSet.winner.name == player.name;
      }
      if (lastSet.cards.find(card => card.playerName == player.name))
        return false;
      else return true;
    } catch (err) {
      console.log(err);
    }
  },
  cardPlay: (match, card, player) => {
    try{
      let games = match.games;
      let lastGame = games[games.length - 1];
      let gpl = lastGame.players.find(gpl => gpl.name == player.name);
      if(gpl.commander && (!lastGame.sets || !lastGame.sets[0])){
        if(lastGame.command.startsWith("ho")) {
          return card.name[0] == lastGame.command[2]
        }
      }
      if(gpl.cards.find(gca => gca.name == card.name)) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.log(err);
    }
  },
  cardsReplace: (oldCards, replaceCards, newCards) => {
    try{
      for(let card of newCards) {
        if(!oldCards.find(oc => oc.name == card.name) && !replaceCards.find(rc => rc.name == card.name)) {
          return false;
        }
      }
      return true;
    } catch (err) {
      console.log(err)
    }
  }
};
