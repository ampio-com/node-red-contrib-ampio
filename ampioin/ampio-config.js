"use strict";

var nodeHueApi   = require('node-hue-api');

var LightServer  = require('../lib/hue-server.js');

/**
 * Exports LightServer to Node-Red
 * @param  {object} RED Node-red
 */
module.exports = function(RED) {
  // list of servers
  var hueServerList = {};

  /**
   * LightServer wrapper for Node-Red
   * @param {object} config Configuration
   */
  function LightServerWrapper(config) {
    var self = this;
    RED.nodes.createNode(self, config);

    self.config = {
      name:     config.name,
      key:      config.key,
      address:  config.address,
      port:     80,
      interval: config.interval,
    };

    // Split address and port
    var regex = /^(.*):(\d+)$/.exec(self.config.address);
    if (regex) {
      self.config.address = regex[1];
      self.config.port = parseInt(regex[2], 10);
    }

    // Create server
    try {
      this.lightServer = new LightServer(self.config);
    }
    catch (e) {
      self.error(e.message, e.stack);
      return;
    }
  
    // Create wrapper functions
    this.getLightHandler = this.lightServer.getLightHandler.bind(this.lightServer);
    this.getLights       = this.lightServer.getLights.bind(this.lightServer);


    // Handle close event
    self.on('close', () => {
      self.lightServer.stop();

      delete hueServerList[self.id];
    });

    // Server errors
    this.lightServer.on('error', (msg, obj) => {
      self.error(msg, obj);
    });

    // Server warnings
    this.lightServer.on('warning', (msg, obj) => {
      self.warn(msg, obj);
    });

    // Initialize server
    this.lightServer.init((err) => {
      if (err) {
        self.error(err.message, err.stack);
        return;
      }

      hueServerList[self.id] = self;
    });
  }

  RED.nodes.registerType("node-hue-bridge", LightServerWrapper);

  // Search for hub
  RED.httpAdmin.get('/node-hue/nupnp', (req, res) => {
    nodeHueApi.nupnpSearch().then((result) => {
      res.set({'content-type': 'application/json; charset=utf-8'});
      res.end(JSON.stringify(result));
    }).fail((err) => {
      res.status(500).send(err.message);
    }).done();
  });

  // Register
  RED.httpAdmin.get('/node-hue/register', (req, res) => {
    if(!req.query.address) {
      return res.status(500).send("Missing arguments");
    }
    var hue = nodeHueApi.HueApi();

    hue.registerUser(req.query.address, "node-red-contrib-node-hue")
      .then(function(result) {
        res.set({'content-type': 'application/json; charset=utf-8'});
        res.end(JSON.stringify(result));
      }).fail(function(err) {
        res.status(500).send(err.message);
      }).done();
  });

  // Validate key
  RED.httpAdmin.get('/node-hue/validate_key', (req, res) => {
    if(!req.query.address || !req.query.key) {
      return res.status(500).send("Missing arguments");
    }

    var address = req.query.address;
    var port = 80;

    // Split address and port
    var regex = /^(.*):(\d+)$/.exec(req.query.address);
    if (regex) {
      address = regex[1];
      port = parseInt(regex[2], 10);
    }

    var hue = new nodeHueApi.HueApi(address, req.query.key, 2000, port);
    hue.config()
      .then((result) => {
        // Check if result has ipaddress
        if (typeof result !== 'object' || !result.hasOwnProperty('ipaddress'))
          return res.status(401).send('Invalid key');

        res.set({'content-type': 'application/json; charset=utf-8'});
        res.end(JSON.stringify({}));
      }).fail((err) => {
        res.status(500).send(err.message);
      })
  });

  // Get list of lights
  RED.httpAdmin.get('/node-hue/lights', (req, res) => {
    if(!req.query.server) {
      return res.status(500).send("Missing arguments");
    }

    // Check if we have this server
    if (!hueServerList.hasOwnProperty(req.query.server)) {
      return res.status(500).send("Server not found or not activated");
    }


    // Query server for information
    var server = hueServerList[req.query.server];
    res.set({'content-type': 'application/json; charset=utf-8'});
    res.end(JSON.stringify(server.getLights()));

    return;
  });
}