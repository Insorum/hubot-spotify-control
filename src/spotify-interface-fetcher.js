var Q = require('q');
var pidof = require('pidof');
var properties = require('properties');
var DBus = require('dbus');
var fs = require('fs');

/**
 * Fetch interface for DBus usage
 *
 * @param {string} processName - the name of the process to get an ID from
 * @param {string} service
 * @param {string} path
 * @param {string} memb
 * @constructor
 */
function InterfaceFetcher(processName, service, path, memb) {
    this.processName = processName;
    this.dbus = new DBus();
    this.service = service;
    this.path = path;
    this.memb = memb;
}

/**
 * Gets the process ID for the process
 *
 * @returns {promise} a promise that resolves to the process ID
 */
InterfaceFetcher.prototype.getPid = function() {
    var def;
    def = Q.defer();
    pidof(this.processName, function(err, pid) {
        if (err) {
            return def.reject(err);
        } else if (!pid) {
            def.reject('Process doesn\'t seem to be running');
        } else {
            def.resolve(pid);
        }
    });
    return def.promise;
};

InterfaceFetcher.prototype.setSessionDbusAddress = function() {
    var def;
    def = Q.defer();
    this.getPid().then(
        function(pid) {
            var file = fs.readFileSync('/proc/' + pid + '/environ', { encoding: 'utf-8' });
            var fixedfile = file.replace(/\0/g, '\n');
            var parsed = properties.parse(fixedfile, { strict: true });
            process.env['DBUS_SESSION_BUS_ADDRESS'] = parsed['DBUS_SESSION_BUS_ADDRESS'];
            def.resolve();
        },
        function fail(err) {
            def.reject(err);
        }
    );
    return def.promise;
};

InterfaceFetcher.prototype.getInterface = function() {
    var def = Q.defer();
    var self = this;
    this.setSessionDbusAddress().then(
        function() {
            var bus = self.dbus.getBus('session');
            bus.getInterface(self.service, self.path, self.memb, function(err, iface) {
                if (err) {
                    def.reject(err);
                } else {
                    def.resolve(iface);
                }
            });
        },
        function(err) {
            return def.reject(err);
        }
    );
    return def.promise;
};

module.exports = InterfaceFetcher;