# Description:
#   Control a spotify client on Linux
#
# Dependencies:
#   "dbus": "0.2.9"
#
# Configuration:
#   None
#
# Commands:
#   hubot sp play
#   hubot sp pause
#   hubot sp prev
#   hubot sp next
#   hubot sp open <URI>
#   hubot sp current
#   hubot sp art
#   hubot sp search
#   hubot
#
# Author:
#   Eluinhost

module.exports = (robot) ->

  robot.respond /(rage )?flip( .*)?$/i, (msg) ->