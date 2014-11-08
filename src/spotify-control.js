// Description:
//   Control spotify on linux via DBus
//
// Dependencies:
//   dbus: ~0.2
//   pidof: ~1.0
//   properties: ~1.2
//   q: ~1.0
//
// Configuration:
//   HUBOT_SPOTIFY_SLACK_SUPPORT - if set will use slack attachments to send the message, otherwise just a regular message
//
//// Commands:
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

var InterfaceFetcher = require('./spotify-interface-fetcher');

module.exports = function(robot) {

    var processName = 'spotify';
    var service = 'org.mpris.MediaPlayer2.spotify';
    var path = '/org/mpris/MediaPlayer2';
    var playerMemb = 'org.mpris.MediaPlayer2.Player';
    var propertiesMemb = 'org.freedesktop.DBus.Properties';

    var mediaInterface = new InterfaceFetcher(processName, service, path, playerMemb);
    var dbusPropertiesInterface = new InterfaceFetcher(processName, service, path, propertiesMemb);

    robot.respond(/sp pause$/i, function(msg) {
        mediaInterface.getInterface().then(
            function(iface) {
                iface.Pause();
                msg.send(':pause:');
            },
            function(err) {
                msg.send('Error: ' + err);
            }
        );
    });

    robot.respond(/sp play$/i, function(msg) {
        mediaInterface.getInterface().then(
            function(iface) {
                iface.PlayPause();
                msg.send(':playpause:');
            },
            function(err) {
                msg.send('Error: ' + err);
            }
        );
    });

    robot.respond(/sp next$/i, function(msg) {
        mediaInterface.getInterface().then(
            function(iface) {
                iface.Next();
                msg.send(':next:');
            },
            function(err) {
                msg.send('Error: ' + err);
            }
        );
    });

    robot.respond(/sp prev$/i, function(msg) {
        mediaInterface.getInterface().then(
            function(iface) {
                iface.Previous();
                iface.Previous();
                msg.send(':previous:');
            },
            function(err) {
                msg.send('Error: ' + err);
            }
        );
    });

    robot.respond(/sp open (.*?)$/i, function(msg) {
        mediaInterface.getInterface().then(
            function(iface) {
                iface.OpenUri(msg.match[1]);
            },
            function(err) {
                msg.send('Error: ' + err);
            }
        );
    });

    robot.respond(/sp current$/i, function(msg) {
        dbusPropertiesInterface.getInterface().then(
            function(iface) {
                iface.Get['finish'] = function(meta) {
                    var artist = meta['xesam:artist'].join(', ');
                    var album = meta['xesam:album'];
                    var title = meta['xesam:title'];
                    var art = '<' + meta['mpris:artUrl'] + '|Album Art>';

                    if(process.env.HUBOT_SPOTIFY_SLACK_SUPPORT) {
                        var payload = {
                            message: msg.message,
                            content: {
                                fallback: 'Current playing track',
                                pretext: 'Current playing track (' + new Date() + ')',
                                color: 'good',
                                fields: [
                                    {"title": "Track", "value": title},
                                    {"title": "Artist", "value": artist},
                                    {"title": "Album", "value": album},
                                    {"title": "Album Art", "value": art}
                                ]
                            }
                        };

                        robot.emit('slack-attachment', payload);
                    } else {
                        msg.send('*Track:* ' + title + ' *Artist:* ' + artist + ' *Album:* ' + album);
                        msg.send('*Album Art:* ' + art);
                    }
                };
                iface.Get(playerMemb, 'Metadata');
            },
            function(err) {
                msg.send('Failed to fetch interface: ' + err);
            }
        );
    });

    robot.respond(/sp radio (.*?)$/i, function(msg) {
        var seed = msg.match[1];
        var seedArray = seed.split(':');
        var uriLength = seedArray.length;
        if ((uriLength > 1) && (seedArray[0] === 'spotify')) {
            var identifier = seedArray[uriLength - 1];
            var type = seedArray[uriLength - 2];
            var link = 'spotify:app:radio:' + type + ':' + identifier;
            mediaInterface.getInterface().then(
                function(iface) {
                    iface.OpenUri(link);
                    msg.send('Started the :radio:');
                },
                function(err) {
                    msg.send('Error: ' + err);
                }
            );
        } else {
            msg.send('Not a valid spotify URL, must start with `spotify:`');
        }
    });
};


