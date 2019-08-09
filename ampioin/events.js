module.exports = function(RED) {
    function ampioevents(config) {
        
        RED.nodes.createNode(this,config);
        var context = this.context();
        var node = this;
        this.srvaddress = config.srvaddress;
        

        var mqtt = require('mqtt');
        const leftPad = require('left-pad');
        var client  = mqtt.connect('mqtt://'+node.srvaddress);

        node.status({fill:"yellow",shape:"dot",text:"not connected"});

        client.on('connect', function () {
            let SubPath = 'ampio/from/+/event'
            client.subscribe(SubPath, function (err) { //topic to subscribe
                if (!err) {
                    node.status({fill:"green",shape:"dot",text:"connected"});
                }
                else{
                    node.status({fill:"red",shape:"ring",text:"error"});
                }
            })
        })

        client.on('connect', function () {
            node.status({fill:"green",shape:"dot",text:"connected"});
        });

        client.on('error', function () {
            node.status({fill:"red",shape:"dot",text:"unable to connect"});
        });

        client.on('reconnect', function () {
            node.status({fill:"yellow",shape:"dot",text:"reconnecting"});
        });

        client.on('error', function() {
            node.status({fill:"red",shape:"dot",text:"error"});
        });

        client.on('close', function() {
            node.status({fill:"red",shape:"dot",text:"connection closed"});
        });

        client.on('offline', function() {
            node.status({fill:"red",shape:"dot",text:"disconnected"});
        });

        this.on("input", function(msg) {
            client.publish('ampio/to/event',msg.payload.toString());
        });

        client.on('message', function (topic, message) {
        let parsedTopic = topic.split('/');
        let sender = parsedTopic[2];
        var outMsg = {payload: message.toString('utf-8'), EventSender: sender};
        node.send(outMsg);
                
        })

        this.on('close', function() {
            // tidy up any state
            client.end();
        });

    }
    RED.nodes.registerType("Ampio Events",ampioevents);
};


