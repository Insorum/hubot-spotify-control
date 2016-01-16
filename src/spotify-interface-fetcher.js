"use strict";

const Promise = require('bluebird');
const properties = require('properties');
const pidof = Promise.promisify(require('pidof'));
const dbus = require('dbus-native');
const fs = Promise.promisifyAll(require('fs'));

class InterfaceFetcher {
    constructor(processName, service, path, memb) {
        this.processName = processName;
        this.service = service;
        this.path = path;
        this.memb = memb;
    }

    getPid() {
        return pidof(this.processName)
            .then(pid => {
                if (!pid) {
                    return Promise.reject('Process does not seem to be running');
                }

                return pid;
            });
    }

    setSessionDbusAddress() {
        return this
            .getPid()
            .then(pid => fs.readFileAsync('/proc/' + pid + '/environ', { encoding: 'utf-8' }))
            .then(file => {
                let fixedfile = file.replace(/\0/g, '\n');
                let parsed = properties.parse(fixedfile, { strict: true });
                process.env['DBUS_SESSION_BUS_ADDRESS'] = parsed['DBUS_SESSION_BUS_ADDRESS'];
            });
    };

    getInterface() {
        return this
            .setSessionDbusAddress()
            .then(() => {
                return Promise.fromCallback(callback => {
                    dbus
                       .sessionBus()
                        .getService(this.service)
                        .getInterface(this.path, this.memb, callback);
                });
            });
    }
}

module.exports = InterfaceFetcher;