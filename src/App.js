import React from 'react';
import JoinRoom from './components/JoinRoom.jsx';
// import * as firebase from 'firebase';
import Firebase from 'firebase';
import GameRoom from './components/GameRoom.jsx';
import SpyfallGameRoom from './components/SpyfallGameRoom.jsx';
import SpectatorRoom from './components/SpectatorRoom.jsx'; //delete!
import _ from 'lodash';
import queryString from 'query-string';
import globals from './globals.js'
import FacebookLogin from 'react-facebook-login';

const amplifyStore = require('amplify-store');

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOnMainMenu: true,
      roomCodes: [],
      currentRoomCode: null,
      players: [], //delete
      wantsToJoinLastHand: false,
    }

    this.facebookCallback = this.facebookCallback.bind(this);
  }

  getURLParams() {
    return queryString.parse(window.location.search);
  }

  cleanupOldRooms() {
    var ref = new Firebase('https://avalon-online-53e63.firebaseio.com/games');
    var now = Date.now();
    var cutoff = now - 4 * 60 * 60 * 1000;
    var old = ref.orderByChild('timestamp').startAt(cutoff).limitToLast(1);
    var listener = old.on('child_added', function(snapshot) {
        snapshot.ref().remove();
    });
  }

  componentDidMount() {
    this.cleanupOldRooms();

    const ref = new Firebase(`https://avalon-online-53e63.firebaseio.com/games`);
    ref.on("value", (snapshot) => {
      let rooms = [];
      snapshot.forEach((childSnapshot) => {
        const room = childSnapshot.val();
        const roomCode = room.roomCode;
        const currTimeInMs = Date.now();
        // if (true) {
        if (room.dateCreated >= currTimeInMs - 1000*60*60*24*1) {
          rooms.push(room);
        }
      });

      const roomCodes = rooms.sort((a,b) => {
        return b.dateCreated - a.dateCreated;
      }).map(r => r.roomCode);
      this.setState({'roomCodes': roomCodes});
    });

    if (this.getURLParams().debug) {
      this.populatePlayerState();
    }
  }

  getNewRoomCode() {
    return this.randomString(4);
  }

  randomString(length) {
    var mask = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
  }

  gameClicked(roomCode) {
    this.setState({ isOnMainMenu: false })

    // null roomCode means New Game was clicked and we need to create a new room
    if (roomCode == null) {
      roomCode = this.getNewRoomCode();
    }

    this.setState({ currentRoomCode: roomCode })

    const fbGame = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${roomCode}`);
    const roomCodeObj = {
      'roomCode': roomCode,
      'dateCreated': Date.now(),
    };

    fbGame.update(roomCodeObj);
    this.setState(roomCodeObj);
  }

  lastHandClicked(lastHandState) {
    this.setState(lastHandState);
    this.wantsToJoinLastHand=true;
    this.roomCode=lastHandState.roomCode;
    this.setState({ wantsToJoinLastHand: true })
    this.populatePlayerState();
  }

  facebookCallback(facebook) {
    amplifyStore('facebook', facebook);

    this.setState({facebook});
  }

  getMainMenu() {
    const lastHandState = amplifyStore(globals.lastHandStore);
    const lastHand = (
      <div>
        <i>You just left a game. Rejoin?</i>
        <br/>
        <button type="button" onClick={this.lastHandClicked.bind(this, lastHandState)}>
          Rejoin last hand
        </button>
        <br/>
        <br/>
      </div>
    );

    return (
      <div>
        <h2>Avalon 2.0 and Spyfall 1.5</h2>
        {!this.state.facebook && <FacebookLogin
            appId={window.location.origin.indexOf("github") !== -1 ? "1777903595843541" : "144285902885696"}
            autoLoad={true}
            fields="name,email,picture"
            callback={this.facebookCallback}
            cssClass="my-facebook-button-class"
            icon="fa-facebook"
        />}
        { this.state.facebook &&
          <div>
            <h3>{`Successfully logged in as ${this.state.facebook.name}`}</h3>
            { lastHandState ? lastHand : null }
            <p>Join an existing game: </p>
            { this.getRoomList() }
            <br/>
            Create a new game:<br/>
            <button type="button" onClick={this.gameClicked.bind(this, null)}>
              New Game
            </button>
          </div>
        }
      </div>
    );
  }

  getRoomList() {
    let rooms = [];
    this.state.roomCodes.forEach( (roomCode) => {
      rooms.push(
        <div className='roomButtonDiv'>
          <button type="button" onClick={this.gameClicked.bind(this, roomCode )}>
            { roomCode }
          </button>
        </div>
      );
    });

    return rooms;
  }

  getDefaultRoomCode() {
    if (this.wantsToJoinLastHand || this.state.wantsToJoinLastHand) {
      return this.roomCode ? this.roomCode : this.state.roomCode;
    }
    return this.getURLParams().roomCode ? this.getURLParams().roomCode : 'cary';
  }

  //if debug==true vvvvvv -----------------------------------------------------------------------------------------------
  populatePlayerState() {
    const ref = new Firebase(`https://avalon-online-53e63.firebaseio.com/games/${this.getDefaultRoomCode()}/players`);
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

  getGameRoom() {
    if (!this.state.facebook) {
      return null;
    }

    if (this.getURLParams().spyfall) {
      return (
        <SpyfallGameRoom
          roomCode={this.getDefaultRoomCode()}
          playerName={(this.state.wantsToJoinLastHand && this.state.playerName) || (this.getURLParams().allowPlayerName && this.getURLParams().playerName) || this.state.facebook.name}
          players={this.state.players}
        />
      );
    }
    return (
      <GameRoom
        roomCode={this.getDefaultRoomCode()}
        playerName={this.state.wantsToJoinLastHand ? this.state.playerName : (this.getURLParams().allowPlayerName && this.getURLParams().playerName) || this.state.facebook.name}
        players={this.state.players}
      />
    );
  }

  getSpectatorRoom() {
    return (
      <SpectatorRoom
        roomCode={this.getDefaultRoomCode()}
        players={this.state.players}
      />
    );
  }
  //end if debug==true ^^^^^ -----------------------------------------------------------------------------------------------

  getWaitingRoomScreen() {
    return <JoinRoom
      roomCode={this.state.currentRoomCode}
    />;
  }

  render() {
    if (this.state.players.length > 0 && this.getURLParams().debug || this.state.wantsToJoinLastHand) {
      if (this.getURLParams().isSpectator || this.state.isSpectator) {
        return this.getSpectatorRoom();
      }
      return this.getGameRoom();
    }

    if (this.state.isOnMainMenu) {
      return this.getMainMenu();
    } else { // IN_GAME
      return this.getWaitingRoomScreen();
    }
  }
}
