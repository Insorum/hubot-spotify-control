var InterfaceFetcher = require('./spotify-interface-fetcher');

module.exports = function(robot) {

    var interfaceFetcher = new InterfaceFetcher('spotify', 'org.mpris.MediaPlayer2.spotify', '/org/mpris/MediaPlayer2', 'org.mpris.MediaPlayer2.Player');

    robot.respond(/sp pause$/i, function(msg) {
        interfaceFetcher.getInterface().then(
            function(iface) {
                iface.Pause();
                msg.send(":pause:");
            },
            function(err) {
                msg.send("Error: " + err);
            }
        );
    });

    robot.respond(/sp play$/i, function(msg) {
        interfaceFetcher.getInterface().then(
            function(iface) {
                iface.PlayPause();
                msg.send(":playpause:");
            },
            function(err) {
                msg.send("Error: " + err);
            }
        );
    });

    robot.respond(/sp next$/i, function(msg) {
        interfaceFetcher.getInterface().then(
            function(iface) {
                iface.Next();
                msg.send(":next:");
            },
            function(err) {
                msg.send("Error: " + err);
            }
        );
    });

    robot.respond(/sp prev$/i, function(msg) {
        interfaceFetcher.getInterface().then(
            function(iface) {
                iface.Previous();
                iface.Previous();
                msg.send(":previous");
            },
            function(err) {
                msg.send("Error: " + err);
            }
        );
    });

    robot.respond(/sp open (.*?)$/i, function(msg) {
        interfaceFetcher.getInterface().then(
            function(iface) {
                iface.OpenUri(msg.match[1]);
            },
            function(err) {
                msg.send("Error: " + err);
            }
        );
    });

    robot.respond(/sp radio (.*?)$/i, function(msg) {
        var seed = msg.match[1];
        var seedArray = seed.split(":");
        var uriLength = seedArray.length;
        if ((uriLength > 1) && (seedArray[0] === "spotify")) {
            var identifier = seedArray[uriLength - 1];
            var type = seedArray[uriLength - 2];
            var link = "spotify:app:radio:" + type + ":" + identifier;
            interfaceFetcher.getInterface().then(
                function(iface) {
                    iface.OpenUri(link);
                    msg.send("Started the :radio:");
                },
                function(err) {
                    msg.send("Error: " + err);
                }
            );
        } else {
            msg.send('Not a valid spotify URL, must start with `spotify:`');
        }
    });
};


