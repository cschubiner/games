import React from 'react';
import PropTypes from 'prop-types';
import Firebase from 'firebase';
import _ from 'lodash';
import globals from '../globals.js'
import RoleList from './RoleList.jsx';
import YourInfo from './YourInfo.jsx';
import jsonfile from 'jsonfile';
import rolesJson from '../roles.json';

const propTypes = {
  roomCode: PropTypes.string.isRequired,
  playerName: PropTypes.string.isRequired,
  players: PropTypes.array.isRequired,
};

const SPY = 'Spy';
const VILLAGER = 'Villager';

export default class SpyfallGameRoom extends React.Component {
  constructor() {
    super();

    this.state = {
      gameState: {
        isPaused: false,
      },
    }
  }

  // this is the controlling player. it is the player that corresponds to this browser
  getCurrentPlayer() {
    return this.findPlayerByName(this.props.playerName);
  }

  amIEvil() {
    return this.getCurrentPlayer().role === SPY;
  }

  amIGood() {
    return !this.amIEvil();
  }

  players() {
    if (this.state.players) {
      return Object.values(this.state.players);
    }

    return this.props.players;
  }

  componentDidMount() {
    console.log('CS- this.props:');
    console.log(this.props);

    const gameStateRef = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${this.props.roomCode}`);
    gameStateRef.on("value", snapshot => {
      this.setState(snapshot.val())
    });

    this.setInitialGameState();
  }

  findPlayerByName(playerName) {
    return this.players().find(p =>
      p.playerName === playerName
    );
  }

  clickedPlayer(selectedPlayerName, e) {
    console.log('CS- selectedPlayerName:');
    console.log(selectedPlayerName);

    const currPlayer = this.getCurrentPlayer();
    const playerRef = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${this.props.roomCode}/players/${currPlayer.playerName}`);

    if (!currPlayer.selectedPlayerName) {
      this.setState({selectedPlayerName: selectedPlayerName});
      playerRef.update({
        selectedPlayerName,
        chosePlayerAt: Date.now() - this.state.gameState.startTime,
      });
    }
  }

  setInitialGameState() {
    const gameStateRef = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${this.props.roomCode}/gameState`);
    gameStateRef.once("value", (snapshot) => {
      const gameState = snapshot.val();
      if (!gameState || !gameState.isPaused) {
        gameStateRef.update({isPaused: false});
      }

      if (!gameState.startTime) {
        gameStateRef.update({startTime: Date.now()});
      }

      let location = gameState && gameState.location;
      if (!location) {
        location = _.sample(Object.keys(rolesJson))
        // Set the location
        gameStateRef.update({location: location});
      }

      let i = 0;
      const locationRoles = _.shuffle(rolesJson[location]);
      this.players().filter(p => !globals.roleIsEvil(p.role) && !p.locationRole).forEach((player) => {
         const playerRef = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${this.props.roomCode}/players/${player.playerName}`);
         playerRef.update({
           locationRole: locationRoles[i],
         });

         i += 1;
       });

      window.history.pushState({}, "Spyfall",
        "http://localhost:3001/?spyfall=true&debug=true&playerName=" + this.props.playerName
        + "&roomCode=" + this.props.roomCode
      );
    });
  }

  updateCurrentState(updatedState) {
    const gameStateRef = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${this.props.roomCode}/gameState`);
    gameStateRef.update(updatedState);
  }

  // the game state that is always displayed
  getPermanentGameStateDiv() {
    if (!this.state.gameState) return null;

    return (
      <div>
        <div>
          Current Time: {this.state.gameState.startTime}
          Possible locations:
          <ul>
            {
              Object.keys(rolesJson).map(location => {
                return (
                  <li>{location}</li>
                );
              })
            }
          </ul>
        </div>
      </div>
    );
  }

  sortedPlayers() {
    return this.players().sort((p1, p2) => {
      return p1.playerName.localeCompare(p2.playerName);
    });
  }

  setGameMessage(s, messageType = globals.MESSAGE_NEUTRAL) {
    this.updateCurrentState({
      gameMessage: s,
      gameMessageType: messageType,
    });
  }

  setNextActionMessage(s) {
    this.updateCurrentState({
      nextActionMessage: s,
    });
  }

  getPlayerList() {
    let players = [];

    const currPlayer = this.getCurrentPlayer();
    const chosenPlayer = currPlayer.selectedPlayerName;
    const chosePlayerAt = currPlayer.chosePlayerAt;

    this.sortedPlayers().forEach( player => {
      players.push(
        <div className="checkbox-div">
          <input type="checkbox" name="??" value={ player.playerName } onClick={this.clickedPlayer.bind(this, player.playerName)}
            checked={this.state.selectedPlayerName === player.playerName} className='checkbox'/>
          <span className={"checkboxtext" + (true ? " bold" : "")} onClick={this.clickedPlayer.bind(this, player.playerName)}>
            { player.playerName } { chosenPlayer === player.playerName && chosePlayerAt && Math.round(chosePlayerAt / 60 / 60 / 60 * 100 , 2)/100 }
          </span>
          <br/>
        </div>
      );
    });

    return (
      <form>
        { players }
      </form>
    );
  }

  render() {
    console.log('CS- this.state2:');
    console.log(this.state);

    return (
      <div className={"outer-div"}>
      <div className="inner-div">
        <h1>Spyfall Game Room: {this.props.roomCode}</h1>
        <span>
          There are { this.players().filter(p => {
            return globals.roleIsEvil(p.role)
          }).length } spies total
        </span>
        <h2>Who do you think is the Spy?</h2>
        { this.getPlayerList() }
        { this.getPermanentGameStateDiv() }
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <h2>Your name is: <span className='bold'>{ this.props.playerName }</span></h2>
        <h2>Your role is: <span className='bold'>{ this.getCurrentPlayer() && this.getCurrentPlayer().locationRole || this.getCurrentPlayer().role}</span></h2>
        { this.amIGood() &&
          <h2>The location is: <span className='bold'>{ this.state.gameState.location }</span></h2>
        }
      </div>
      </div>
    );
  }
}

SpyfallGameRoom.propTypes = propTypes;
