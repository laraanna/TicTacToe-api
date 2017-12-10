// models/game.js
const mongoose = require('../config/database')
const { Schema } = mongoose

const boardSchema = new Schema({
  symbol: { type: String, required: false },
  index: { type: Number }
});

const playerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'users' },
  pairs: [String],
});

const gameSchema = new Schema({
  board: [boardSchema],
  players: [playerSchema],
  turn: { type: Number, default: 0 }, // player index
  started: { type: Boolean, default: false },
  winnerId: { type: Schema.Types.ObjectId, ref: 'users' },
  userId: { type: Schema.Types.ObjectId, ref: 'users' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastCard: { type: Number },
  draw: { type: Boolean, default: false },
});

module.exports = mongoose.model('games', gameSchema)
