# Description:
#   Control a spotify client on Linux
#
# Dependencies:
#   "dbus": "0.2.9"
#   "pidof": "1.0.2",
#   "properties": "1.2.1"
#   "q": "1.0.1"
#
# Configuration:
#   None
#
# Commands:
#   hubot sp play - toggle the play status
#   hubot sp pause - pauses the music, play again with sp playtoggle
#   hubot sp prev - go to previous track
#   hubot sp next - go to next track
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
q = require 'q'

dbus = new DBus()

service = 'org.mpris.MediaPlayer2.spotify'
path = '/org/mpris/MediaPlayer2'
memb = 'org.mpris.MediaPlayer2.Player'

module.exports = (robot) ->

  robot.respond /sp pause$/i, (msg) ->
    getInterface()
    .then (iface) ->
      iface.Pause()
      msg.send ":pause:"
    .catch (err) ->
      msg.send "Error: #{err}"

  robot.respond /sp play$/i, (msg) ->
    getInterface()
    .then (iface) ->
      iface.PlayPause()
      msg.send ":playpause:"
    .catch (err) ->
      msg.send "Error: #{err}"

  robot.respond /sp next$/i, (msg) ->
    getInterface()
      .then (iface) ->
        iface.Next()
        msg.send ":next:"
      .catch (err) ->
        msg.send "Error: #{err}"

  robot.respond /sp prev$/i, (msg) ->
    getInterface()
      .then (iface) ->
        iface.Previous()
        iface.Previous()
        msg.send ":previous"
      .catch (err) ->
        msg.send "Error: #{err}"

spotifyPid = () ->
  def = q.defer()
  pidof 'spotify', (err, pid) ->
    if err
      def.reject err
    else if not pid
      def.reject "Spotify doesn't seem to be running"
    else
      def.resolve pid
  def.promise

dbusAddress = () ->
  def = q.defer()
  spotifyPid()
  .then (pid) ->
    file = fs.readFileSync "/proc/#{pid}/environ", {encoding: 'utf-8'}
    fixedfile = file.replace /\0/g, "\n"
    parsed = properties.parse fixedfile, {strict: true}
    process.env['DBUS_SESSION_BUS_ADDRESS'] = parsed['DBUS_SESSION_BUS_ADDRESS']
    def.resolve()
  .catch (err) ->
    def.reject err
  def.promise

getInterface = () ->
  def = q.defer()
  dbusAddress()
  .then () ->
    bus = dbus.getBus 'session'
    bus.getInterface service, path, memb, (err, iface) ->
      if err
        def.reject err
      else
        def.resolve iface
  .catch (err) ->
    def.reject err
  def.promise
