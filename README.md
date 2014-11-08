Hubot Spotify Control
=====================

This script allows use of spotify via DBus on linux machines.

Hubot must be running as the same user as the spotify instance.

Commands
--------

Commands:

`hubot sp play` - toggle the play status (if playing will pause, if paused will play)

`hubot sp pause` - pauses the music, play again with sp play

`hubot sp prev` - go to previous track

`hubot sp next` - go to next track

`hubot sp open <URI>` - opens the spotify URI supplied (e.g. starts with spotify:*)

`hubot sp radio <URI>` - starts spotify radio using the given URI as a base (e.g. starts with spotify:*)


TODO:

`hubot sp current` - not implemented yet

`hubot sp art` - not implemented yet

`hubot sp search` - not implemented yet