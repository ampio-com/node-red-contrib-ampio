module.exports = function(RED) {
    function ampiomultisens(config) {
        
        RED.nodes.createNode(this,config);
        var context = this.context();
        var node = this;
        this.mac = config.mac;
        this.valtype = config.valtype;
        this.srvaddress = config.srvaddress;
        var mqtt = require('mqtt');
        var client  = mqtt.connect('mqtt://'+node.srvaddress);

        var mac = node.mac;
        var valtype = node.valtype;


        mac = mac.toUpperCase();
        node.status({fill:"yellow",shape:"dot",text:"not connected"});
        




        client.on('connect', function () {
          client.subscribe('ampio/from/'+mac+'/state/'+valtype, function (err) { //topic to subscribe
            if (!err && mac!="" && valtype!="") {
                node.status({fill:"green",shape:"dot",text:"connected"});
                JustConnected=true;
            }
            else{
                node.status({fill:"red",shape:"ring",text:"fill properties"});
            }
          })
        })

        client.on('error', function () {
            node.status({fill:"red",shape:"dot",text:"unable to connect"});
        })

        client.on('reconnect', function () {
            node.status({fill:"yellow",shape:"dot",text:"reconnecting"});
        })

        client.on('error', function() {
            node.status({fill:"red",shape:"dot",text:"error"});
        })

        client.on('close', function() {
                node.status({fill:"red",shape:"dot",text:"connection closed"});
        })

        client.on('offline', function() {
            node.status({fill:"red",shape:"dot",text:"disconnected"});
        })

        client.on('message', function (topic, message) {
            if(valtype!='t/1'){
                message = Number(message)/10;
            }
            var outMsg = {payload: message.toString()};
            node.send(outMsg);
        })

        this.on('close', function() {
            // tidy up any state
            client.end();
        });

    }
    RED.nodes.registerType("Ampio MULTISENS",ampiomultisens);
};


