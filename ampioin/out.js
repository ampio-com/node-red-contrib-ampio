module.exports = function(RED) {
    


    function ampioout(config) {
        
        RED.nodes.createNode(this,config);
        var context = this.context();
        var node = this;
        this.mac = config.mac;
        this.ioid = config.ioid;
        this.valtype = config.valtype;
        this.srvaddress = config.srvaddress;
        

        var mqtt = require('mqtt');
        const leftPad = require('left-pad');
        var client  = mqtt.connect('mqtt://'+node.srvaddress);
        var n=false;

        var mac = node.mac;
        var ioid = node.ioid;
        var valtype = node.valtype;



        mac = mac.toUpperCase();
        node.status({fill:"yellow",shape:"dot",text:"not connected"});
        


        while(n==false){
            if(ioid[0]=='0'){
                ioid = ioid.substring(1);
            }
            else{
                n=true;
            }
        }

        client.on('connect', function () {
            node.status({fill:"green",shape:"dot",text:"connected"});
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

        this.on("input", function(msg) {
            if(valtype=='r'){
                client.publish('ampio/to/'+mac+'/raw',msg.payload.toString());
            }
            else if(valtype=='s'){
                client.publish('ampio/to/'+mac+'/o/'+ioid+'/cmd',msg.payload);
            }
            else if(valtype=='f'){
                var outMsg = '0101' + leftPad((Number(ioid)-1).toString(16),2,'0') + leftPad(Number(msg.payload).toString(16),2,'0');
                client.publish('ampio/to/'+mac+'/raw',outMsg)
            }

        })

        this.on('close', function() {
            // tidy up any state
            client.end();
        });

    }
    RED.nodes.registerType("Ampio OUT",ampioout);

    RED.httpAdmin.get('/ampio/devices/list/:cmd', RED.auth.needsPermission('ampio.read'),function(req,res){
        
        var mqtt = require('mqtt');
        var ip=req.params.cmd;
        var mqttcli  = mqtt.connect('mqtt://'+ip);
        
        function OnConnect(){
            return new Promise((resolve,reject) => {
                mqttcli.on('connect', function () {
                    resolve(true);
                });
                setTimeout(function() {
                    resolve('timeout');
                }, 2000);
            })
        }
        function OnSubscribe(){
            return new Promise((resolve,reject) => {
                mqttcli.subscribe('ampio/from/can/dev/list', function (err) { //topic to subscribe
                    if (!err) {
                        mqttcli.publish('ampio/to/can/dev/list','');
                        resolve(true); 
                    }
                });
                setTimeout(function() {
                    resolve('timeout');
                }, 2000);
            });
        }
        function GetMessage(){
            return new Promise((resolve,reject) => {
                mqttcli.on('message', function (topic, message) {
                    devices = JSON.parse(message);
                    resolve(devices.devices);
                });
                setTimeout(function() {
                    resolve('timeout');
                }, 2000);
            });
        }
        
        Promise.all([
            OnConnect(),
            OnSubscribe(),
            GetMessage()
        ])
        .then(resp => {
            if(resp[2]==='timeout'){
                res.status(504);
                res.json("508 server timeout");
                mqttcli.end();
            }
            else{
                mqttcli.end();
                res.json(resp[2]);
            }
        });
    });  
    RED.httpAdmin.get('/ampio/devices/types', RED.auth.needsPermission('ampio.read'),function(req,res){
        let DevTypes = require('./db/devtypes.json');
        res.json(DevTypes);
    });

    RED.httpAdmin.get('/ampio/invaluetypes', RED.auth.needsPermission('ampio.read'),function(req,res){
      let ValTypes = require('./db/invaltypes.json');
      //'hum', 'absp', 'relp', 'db', 'lm', 'iaq' nadawczy 1801, odbiorczy 1800
      res.json(ValTypes);
    });

    RED.httpAdmin.get('/ampio/outvaluetypes', RED.auth.needsPermission('ampio.read'),function(req,res){
        let ValTypes = require('./db/outvaltypes.json');
        res.json(ValTypes);
      });

};


