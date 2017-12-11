// routes/games.js
const router = require('express').Router()
const passport = require('../config/auth')
const { Game } = require('../models')
const utils = require('../lib/utils')
const winner = require('../lib/winner')

const authenticate = passport.authorize('jwt', { session: false })


module.exports = io => {
  router
    .get('/games', (req, res, next) => {
      Game.find()
        // Newest games first
        .sort({ createdAt: -1 })
        // Send the data in JSON format
        .then((games) => res.json(games))
        // Throw a 500 error if something goes wrong
        .catch((error) => next(error))
    })
    .get('/games/:id', (req, res, next) => {
      const id = req.params.id

      Game.findById(id)
        .then((game) => {
          if (!game) { return next() }
          res.json(game)
        })
        .catch((error) => next(error))
    })
    .post('/games', authenticate, (req, res, next) => {
      const newGame = {
        userId: req.account._id,
        players: [{
          userId: req.account._id,
        }],
        board: utils.gameGrid()

      }

      Game.create(newGame)
        .then((game) => {
          io.emit('action', {
            type: 'GAME_CREATED',
            payload: game
          })
          res.json(game)
        })
        .catch((error) => next(error))
    })
    .put('/games/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      const updatedGame = req.body

      Game.findByIdAndUpdate(id, { $set: updatedGame }, { new: true })
        .then((game) => {
          io.emit('action', {
            type: 'GAME_UPDATED',
            payload: game
          })
          res.json(game)
        })
        .catch((error) => next(error))
    })
    .patch('/games/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      const patch = req.body.tile
      const players = req.body.players
      const turn = req.body.turn
      const currentPlayer = req.body.currentPlayer

      const noWinner = winner.isWinner(req.body.game.board) === null


      if(noWinner){

        Game.findById(id)
          .then((game) => {
            if (!game) { return next() }

          const newBoard = game.board

          let newTurn = game.turn


          if (players[0].userId === currentPlayer.userId && patch.symbol === null && newTurn % 2 === 0) {
            newBoard[patch.index].symbol = "X"
            newTurn += 1
          } else if (players[1].userId === currentPlayer.userId && patch.symbol === null && newTurn % 2 !== 0){
            newBoard[patch.index].symbol = "O"
            newTurn += 1
          }

          const noNewWinner = winner.isWinner(newBoard) === null

          let newWinner = game.winner
          let newWinnerName = game.winnerName

          noNewWinner ? (newWinner = false) : (newWinner = true)
          noNewWinner ? (newWinnerName = null ):(newWinnerName = currentPlayer.name)

          // if (noNewWinner) {
          //   newWinner = false
          //   newWinnerName = null
          // } else {
          //   newWinner = true
          //   newWinnerName = currentPlayer.name
          // }


          //
          // console.log("hi")
          // console.log(newWinner)
          // console.log(newWinnerName)

            const updatedGame = {
              board: newBoard,
              winner: newWinner,
              winnerName: newWinnerName,
              turn: newTurn
            }

          Game.findByIdAndUpdate(id, { $set: updatedGame }, { new: true })
            .then((game) => {
              io.emit('action', {
                type: 'GAME_UPDATED',
                payload: game
              })
              res.json(game)
            })

            .catch((error) => next(error))
          })
        .catch((error) => next(error))
      }

    })


    .delete('/games/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      Game.findByIdAndRemove(id)
        .then(() => {
          io.emit('action', {
            type: 'GAME_REMOVED',
            payload: id
          })
          res.status = 200
          res.json({
            message: 'Removed',
            _id: id
          })
        })
        .catch((error) => next(error))
    })

  return router
}
