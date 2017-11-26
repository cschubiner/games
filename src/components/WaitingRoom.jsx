import React from 'react';
import PropTypes from 'prop-types';
import Firebase from 'firebase';
import RoleList from './RoleList.jsx';
import GameRoom from './GameRoom.jsx';
import SpyfallGameRoom from './SpyfallGameRoom.jsx';
import SpectatorRoom from './SpectatorRoom.jsx';
import globals from '../globals.js'
import _ from 'lodash';

const propTypes = {
  roomCode: PropTypes.string.isRequired,
  playerName: PropTypes.string.isRequired,
  isSpectator: PropTypes.bool.isRequired,
};

const AVALON = 'avalon_game';
const SPYFALL = 'spyfall_game';

export default class WaitingRoom extends React.Component {
  constructor() {
    super();
    this.state = {
      players: [],
      hasStarted: false,
    }
  }

  populatePlayerState() {
    const ref = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${this.props.roomCode}/players`);
    ref.on("value", (snapshot) => {
      let players = [];
      snapshot.forEach((childSnapshot) => {
        let key = childSnapshot.key();
        let childData = childSnapshot.val();
        players.push(childData);
      });
      this.setState({'players': players});
    });
  }

  addCurrentPlayerToFirebase() {
    const gameRef = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${this.props.roomCode}/hasStarted`);
    gameRef.once("value", (snapshot) => {
      let hasStarted = snapshot.val();
      if (!hasStarted) {
        const ref = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${this.props.roomCode}/players/${this.props.playerName}`);
        ref.update({
          playerName: this.props.playerName,
          isSpectator: this.props.isSpectator,
        });
      }
    });
  }

  componentDidMount() {
    if (!this.props.isSpectator) {
      this.addCurrentPlayerToFirebase();
    }
    this.populatePlayerState();

    // listen to hasStarted
    const gameRef = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${this.props.roomCode}/hasStarted`);
    gameRef.on("value", (snapshot) => {
      let hasStarted = snapshot.val();

      const gameRef = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${this.props.roomCode}/gameName`);
      gameRef.on("value", (snapshot) => {
        let gameName = snapshot.val();
        this.setState({
          'gameName': gameName,
          'hasStarted': hasStarted,
        });
      });

    });
  }

  startGameClicked(gameName, roleSet = null) {
    let roleNames;
    if (gameName === AVALON) {
      roleNames = _.shuffle(globals.roleNamesForPlayerCountAvalon(this.state.players.length));
    } else {
      roleNames = _.shuffle(globals.roleNamesForPlayerCountSpyfall(this.state.players.length));
    }

    let i = 0;
    this.state.players.forEach((player) => {
      const playerRef = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${this.props.roomCode}/players/${player.playerName}`);
      playerRef.update({
        role: roleNames[i],
      });

      i+=1;
    });

    const gameRef = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${this.props.roomCode}`);
    gameRef.update({
      hasStarted: true,
      gameName: gameName,
      roleSet: roleSet,
    });

    this.setState({gameName});
  }

  getPlayerRow(playerData) {
    const isCurrPlayer = playerData.playerName === this.props.playerName;
    return (
      <li className={isCurrPlayer ? "bold" : ""}>
        { playerData.playerName }
      </li>
    );
  }

  getPlayerList() {
    let players = [];
    this.state.players.forEach((player) => {
      players.push(this.getPlayerRow(player));
    });

    return <ul>
      { players }
    </ul>;
  }

  getAdditionalPlayerMessage() {
    return <div className="italics">
      Need {5 - this.state.players.length} more players to start
    </div>;
  }

  getWaitingRoom() {
    return (
      <div>
        <h1> Waiting Room </h1>
        <p> Go to cschubiner.github.io/games and enter the room code to join! </p>
        <span>Room Code: </span>
        <span>{this.props.roomCode}</span>
        <h3> Players </h3>
        { this.getPlayerList() }
        <RoleList
          playerCount={this.state.players.length}
        />

        { this.state.players.length < 5 ? this.getAdditionalPlayerMessage() : null }
        <button type="button" onClick={this.startGameClicked.bind(this, AVALON)}>
          Start Avalon
        </button>
        <button type="button" onClick={this.startGameClicked.bind(this, SPYFALL, 'rolesMichael.json')}>
          Start Spyfall (Michael Locations)
        </button>
        <button type="button" onClick={this.startGameClicked.bind(this, SPYFALL, 'rolesSeven.json')}>
          Start Spyfall (7-Role Locations)
        </button>
        <button type="button" onClick={this.startGameClicked.bind(this, SPYFALL, 'rolesTen.json')}>
          Start Spyfall (10-Role Locations)
        </button>
      </div>
    );
  }

  getGameRoom() {
    if (this.state.gameName === SPYFALL) {
      return (
        <SpyfallGameRoom
          roomCode={this.props.roomCode}
          playerName={this.props.playerName}
          players={this.state.players}
        />
      );
    }

    return (
      <GameRoom
        roomCode={this.props.roomCode}
        isSpectator={this.props.isSpectator}
        playerName={this.props.playerName}
        players={this.state.players}
      />
    );
  }

  getSpectatorRoom() {
    return (
      <SpectatorRoom
        roomCode={this.props.roomCode}
        players={this.state.players}
      />
    );
  }

  render() {
    if (!this.state.hasStarted) {
      return this.getWaitingRoom();
    }

    if (this.props.isSpectator) {
      return this.getSpectatorRoom();
    }

    const currentPlayerExists = this.state.players.find(p => {
      return p.playerName === this.props.playerName
    });

    if (!currentPlayerExists) {
      return <div>Sorry, you cannot join an existing game. Please refresh the page and join a new game</div>;
    }

    return this.getGameRoom();
  }
}

WaitingRoom.propTypes = propTypes;
