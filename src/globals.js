var globals = {};

globals.MESSAGE_NEUTRAL = 'message_neutral';
globals.MESSAGE_GOOD =    'message_good';
globals.MESSAGE_EVIL =    'message_evil';

globals.lastHandStore = 'avalon-online-last-hand';

globals.numPlayersOnQuests = (numPlayers) => {
  if (numPlayers === 5) {
    return [2, 3, 2, 3, 3];
  }
  if (numPlayers === 6) {
    return [2, 3, 4, 3, 4];
  }
  if (numPlayers === 7) {
    return [2, 3, 3, 4, 4];
  }

  return [3, 4, 4, 5, 5];
};

// 0 indexed
globals.numFailsToFail = (questNum, numPlayers) => {
  if (questNum === 3 && numPlayers >= 7)
    return 2;

  return 1;
};

globals.roleIsEvil = (role) => {
  return ['MORGANA', 'ASSASSIN', 'MINION', 'SPY'].includes(role.toUpperCase());
};

globals.roleIsGood = (role) => {
  return !globals.roleIsEvil(role);
};

globals.fbArrLen = (arr) => {
  return arr ? arr.length : 0;
};

globals.fbArr = (arr) => {
  return arr ? arr : [];
};

globals.roleNamesForPlayerCountSpyfall = (playerCount) => {
  let roleNames = ['Spy'];
  if (playerCount >= 2) {roleNames.push('Villager'); }
  if (playerCount >= 3) {roleNames.push('Villager'); }
  if (playerCount >= 4) {roleNames.push('Villager'); }
  if (playerCount >= 5) {roleNames.push('Villager'); }
  if (playerCount >= 6) {roleNames.push('Villager'); }
  if (playerCount >= 7) {roleNames.push('Villager'); }
  if (playerCount >= 8) {roleNames.push('Spy'); }
  if (playerCount >= 9) {roleNames.push('Villager'); }
  if (playerCount >= 10) {roleNames.push('Villager'); }
  if (playerCount >= 11) {roleNames.push('Villager'); }
  if (playerCount >= 12) {roleNames.push('Villager'); }
  if (playerCount >= 13) {roleNames.push('Villager'); }
  if (playerCount >= 14) {roleNames.push('Spy'); }

  for (let i = 15; i <= playerCount; i++) {
    roleNames.push('Villager');
  }

  return roleNames;
};

globals.roleNamesForPlayerCountAvalon = (playerCount) => {
  let roleNames = ['Merlin', 'Morgana', 'Percival', 'Assassin', 'Villager'];
  if (playerCount >= 6) {
    roleNames.push('Villager');
  }
  if (playerCount >= 7) {
    roleNames.push('Minion');
  }
  if (playerCount >= 8) {
    roleNames.push('Villager');
  }
  if (playerCount >= 9) {
    roleNames.push('Villager');
  }
  if (playerCount >= 10) {
    roleNames.push('Minion');
  }
  for (let i = 11; i <= playerCount; i++) {
    roleNames.push('Villager');
  }

  return roleNames;
};

export default globals;
