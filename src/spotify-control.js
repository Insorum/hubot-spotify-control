// Description:
//   Control spotify on linux via DBus
//
// Dependencies:
//  "dbus-native": "0.2.x"
//  "pidof": "1.0.x"
//  "properties": "1.2.x"
//  "bluebird": "3.1.x"
//  "request": "2.67.x"
//
// Configuration:
//   HUBOT_SPOTIFY_SLACK_SUPPORT - if set will use slack attachments to send the message, otherwise just a regular message
//
// Commands:
//   hubot sp pause
//   hubot sp play
//   hubot sp next
//   hubot sp prev
//   hubot sp open <URI>
//   hubot sp radio <URI>
//
//  Notes:
//    Hubot should be running on the same machine and user as the spotify process
//
// Author:
//   Eluinhost
"use strict";

const request = require('request');
const InterfaceFetcher = require('./spotify-interface-fetcher');
const expandUrl = require('./expandUrl');
const Promise = require('bluebird');

const PROCESS_NAME = 'spotify';
const SERVICE = 'org.mpris.MediaPlayer2.spotify';
const PATH = '/org/mpris/MediaPlayer2';
const PLAYER_MEMB = 'org.mpris.MediaPlayer2.Player';
const PROPERTIES_MEMB = 'org.freedesktop.DBus.Properties';

const MEDIA_INTERFACE = new InterfaceFetcher(PROCESS_NAME, SERVICE, PATH, PLAYER_MEMB);
const DBUS_PROPERTIES_INTERFACE = new InterfaceFetcher(PROCESS_NAME, SERVICE, PATH, PROPERTIES_MEMB);

const BASIC_COMMANDS = [
    {
        trigger: /sp pause$/i,
        run: 'Pause',
        send: ':pause:'
    },
    {
        trigger: /sp play$/i,
        run: 'PlayPause',
        send: ':playpause:'
    },
    {
        trigger: /sp next$/i,
        run: 'Next',
        send: ':next:'
    },
    {
        trigger: /sp prev$/i,
        run: iFace => {
            iFace.Previous();
            iFace.Previous();
        },
        send: ':previous:'
    },
    {
        trigger: /sp open (.*?)$/i,
        run: (iFace, msg) => {
            iFace.OpenUri(msg.match[1]);
        },
        send: 'Opened link'
    }
];

module.exports = function(robot) {
    BASIC_COMMANDS.forEach(command => {
        robot.respond(command.trigger, msg => {
            MEDIA_INTERFACE
                .getInterface()
                .then(iFace => {
                    if (typeof command.run === 'string') {
                        iFace[command.run]();
                    } else {
                        command.run(iFace, msg);
                    }

                    if (command.send) {
                        msg.send(command.send);
                    }
                })
                .catch(err => {
                    msg.send('Error: ' + err);
                    throw err;
                });
        })
    });

    robot.respond(/sp current$/i, msg => {
        DBUS_PROPERTIES_INTERFACE
            .getInterface()
            .then(iFace => {
                return Promise.fromCallback(callback => {
                    iFace.Get(PLAYER_MEMB, 'Metadata', callback);
                });
            })
            .then(meta => {
                meta = meta[1][0].reduce((acc, item) => {
                    acc[item[0]] = item[1][1][0];
                    return acc;
                }, {});

                let artist = meta['xesam:artist'].join(', ');
                let album = meta['xesam:album'];
                let title = meta['xesam:title'];
                let art = meta['mpris:artUrl'];

                return expandUrl(art)
                    .then(longUrl => art = longUrl)
                    .finally(() => {
                        art = '<' + art + '|Art>';

                        if (process.env.HUBOT_SPOTIFY_SLACK_SUPPORT) {
                            let payload = {
                                message: msg.message,
                                content: {
                                    fallback: 'Current playing track',
                                    pretext: 'Current playing track (' + new Date() + ')',
                                    color: 'good',
                                    fields: [
                                        {title: "Track", value: title},
                                        {title: "Artist", value: artist},
                                        {title: "Album", value: album},
                                        {title: "Album Art", value: art}
                                    ]
                                }
                            };

                            robot.emit('slack-attachment', payload);
                            msg.send(art);
                        } else {
                            msg.send('*Track:* ' + title + ' *Artist:* ' + artist + ' *Album:* ' + album);
                            msg.send('*Album Art:* ' + art);
                        }
                    });
            })
            .catch(err => {
                msg.send('Failed to fetch track: ' + err);
                throw err;
            });
    });

    robot.respond(/sp radio (.*?)$/i, msg => {
        let seed = msg.match[1];
        let seedArray = seed.split(':');
        let uriLength = seedArray.length;

        if ((uriLength > 1) && (seedArray[0] === 'spotify')) {
            let identifier = seedArray[uriLength - 1];
            let type = seedArray[uriLength - 2];
            let link = 'spotify:app:radio:' + type + ':' + identifier;

            MEDIA_INTERFACE
                .getInterface()
                .then(iFace => {
                    iFace.OpenUri(link);
                    msg.send('Started the :radio:');
                })
                .catch(err => {
                    msg.send('Error: ' + err);
                    throw err;
                });
        } else {
            msg.send('Not a valid spotify URL, must start with `spotify:`');
        }
    });
};


