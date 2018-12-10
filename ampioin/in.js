module.exports = function(RED) {
    function ampioin(config) {
        
        RED.nodes.createNode(this,config);
        var context = this.context();
        var node = this;
        this.mac = config.mac;
        this.ioid = config.ioid;
        this.valtype = config.valtype;
        var mqtt = require('mqtt');
        var client  = mqtt.connect('mqtt://192.168.77.80');
        var n=false;
        var m=false;

        var mac = node.mac;
        var ioid = node.ioid;
        var valtype = node.valtype;

        

        mac = mac.toUpperCase();
        node.status({fill:"yellow",shape:"dot",text:"not connected"});

        //ODKOMENTUJ JAK OLEK ZAKTUALIZUJE API
        while(m==false){
            if(mac[0]=='0'){
                mac = mac.substring(1);
            }
            else{
                m=true;
            }
        }
        


        while(n==false){
            if(ioid[0]=='0'){
                ioid = ioid.substring(1);
            }
            else{
                n=true;
            }
        }


        client.on('connect', function () {
          client.subscribe('ampio/from/'+mac+'/state/'+valtype+'/'+ioid, function (err) { //topic to subscribe
            if (!err && mac!="" && ioid!="" && valtype!="") {
                node.status({fill:"green",shape:"dot",text:"connected"});
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
            // message is Buffer
            var outMsg = {payload: Number(message.toString('utf-8'))};
            node.send(outMsg);
        })

        this.on('close', function() {
            // tidy up any state
            client.end();
        });

    }
    RED.nodes.registerType("Ampio IN",ampioin);
};


