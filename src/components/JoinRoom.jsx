import React from 'react';
import PropTypes from 'prop-types';
import Firebase from 'firebase';
import WaitingRoom from './WaitingRoom.jsx';
import _ from 'lodash';
import globals from '../globals.js'
const amplifyStore = require('amplify-store');

const propTypes = {
  roomCode: PropTypes.string.isRequired,
};

export default class JoinRoom extends React.Component {
  constructor() {
    super();
    this.state = {
      isOnJoinRoom: true,
      playerName: '',
    }
  }

  handleSubmit(isSpectator, e) {
    e.preventDefault();

    const newState = {
      playerName: globals.getFacebookCreds().name,
      isOnJoinRoom: false,
      isSpectator: isSpectator,
      roomCode: this.props.roomCode,
    };
    amplifyStore(globals.lastHandStore, newState);
    this.setState(newState);
  }

  getJoinRoom() {
    return (
      <div>
        <h3>Joining Room</h3>
        <h1>{this.props.roomCode}</h1>
        <p> Go to cschubiner.github.io/games and enter the room code <span className="bold">{this.props.roomCode}</span> to join! </p>

        <button type="button" onClick={this.handleSubmit.bind(this, false)}>
          Join as Player
        </button>
        <button type="button" onClick={this.handleSubmit.bind(this, true)}>
          Join as Spectator
        </button>
      </div>
    );
  }

  getWaitingRoom() {
    return <WaitingRoom
      roomCode={this.props.roomCode}
      isSpectator={this.state.isSpectator}
      playerName={this.state.playerName}
    />;
  }

  render() {
    if (this.state.isOnJoinRoom) {
      return this.getJoinRoom();
    } else {
      return this.getWaitingRoom();
    }
  }
}

JoinRoom.propTypes = propTypes;
