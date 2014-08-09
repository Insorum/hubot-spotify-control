# Description:
#   Control a spotify client on Linux
#
# Dependencies:
#   "dbus": "0.2.9"
#   "pidof": "1.0.2",
#   "properties": "1.2.1"
#
# Configuration:
#   None
#
# Commands:
#   hubot sp playtoggle - toggle the play status
#   hubot sp pause - pauses the music, play again with sp playtoggle
#   hubot sp prev - not implemented yet
#   hubot sp next - not implemented yet
#   hubot sp open <URI> - not implemented yet
#   hubot sp current - not implemented yet
#   hubot sp art - not implemented yet
#   hubot sp search - not implemented yet
#
# Author:
#   Eluinhost

pidof = require 'pidof'
properties = require 'properties'
fs = require 'fs'
DBus = require 'dbus'

dbus = new DBus()

service = 'org.mpris.MediaPlayer2.spotify'
path = '/org/mpris/MediaPlayer2'
memb = 'org.mpris.MediaPlayer2.Player'

module.exports = (robot) ->

  robot.respond /sp pause$/i, (msg) ->
    getInterface (err, iface) ->
      if err
        msg.send "Error: #{err}"
      else
        iface.Pause()
        msg.send "Music paused"

  robot.respond /sp playtoggle$/i, (msg) ->
    getInterface (err, iface) ->
      if err
        msg.send "Error: #{err}"
      else
        iface.PlayPause()
        msg.send "Play toggled"


spotifyPid = (callback) ->
  pidof 'spotify', (err, pid) ->
    if err
      callback err
    else if not pid
      callback "Spotify doesn't seem to be running"
    else
      callback err, pid

dbusAddress = (callback) ->
  spotifyPid (err, pid) ->
    if err
      callback err
    else if not pid
      callback "Spotify doesn't seem to be running"
    else
      callback err, pid

dbusAddress = (callback) ->
  spotifyPid (err, pid) ->
    if err
      callback err
    else
      file = fs.readFileSync "/proc/#{pid}/environ", {encoding: 'utf-8'}
      fixedfile = file.replace /\0/g, "\n"
      parsed = properties.parse fixedfile, {strict: true}
      process.env['DBUS_SESSION_BUS_ADDRESS'] = parsed['DBUS_SESSION_BUS_ADDRESS']
      callback()

getInterface = (callback) ->
  dbusAddress (err) ->
    if err
      callback err
    else
      bus = dbus.getBus 'session'
      bus.getInterface service, path, memb, (err, iface) ->
        callback err, iface

