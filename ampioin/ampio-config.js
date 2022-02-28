module.exports = function(RED) {
    "use strict";
    
    const mqtt = require('mqtt');
    const net = require("net");

    function unixSocketConnectionBuilder(client, opts) {
        return net.createConnection(opts.pathname);
    }

    let node_global={};
    function ampioconfig(config){
    
        RED.nodes.createNode(this,config);
        let node;
        

        function matchTopic(ts,t) {
            if (ts == "#") {
                return true;
            }
            var re = new RegExp("^"+ts.replace(/([\[\]\?\(\)\\\\$\^\*\.|])/g,"\\$1").replace(/\+/g,"[^/]+").replace(/\/#$/,"(\/.*)?")+"$");
            return re.test(t);
        }

        //pass options from Node-RED
        this.server = config.server;
        this.port = config.port;

        //conf state
        this.connected = false;
        this.connecting = false;
        this.closing = false;
        this.subscriptions = {};
        this.queue = [];
        this.options = {};
        this.users = {};
        var node_id=this.id

        //node.tls = config.tls; //in future

        //credentials
        if (this.credentials) {
            
            this.username = this.credentials.user;
            this.password = this.credentials.password;
            console.log(this.id);
        }

        if (typeof this.usetls === 'undefined') {
            this.usetls = false;
        }

        node = this;
        node_global[this.id]=this;

        //MQTT client params & options
        if(!node.port || node.port === ""){
            node.port = '1883';
        }
        if (!node.server || node.server === "") {
            node.brokerurl = "mqtt+unix:///var/run/ampio/mqtt.sock";
            node.options.pathname = "/var/run/ampio/mqtt.sock";
        } else {
            node.brokerurl = "mqtt://" + node.server + ":" + node.port;
        }
        console.log(node.brokerurl)
        this.options.clientId = 'AmpioNode_' + (1+Math.random()*4294967295).toString(16);
        node.options.clean = true;
        node.options.username = node.username;
        node.options.password = node.password;
        node.options.reconnectPeriod = 5000;



        //register and deregister slave nodes to control states etc.
        node.register = function(mqttNode) {
            node.users[mqttNode.id] = mqttNode;
            if(Object.keys(node.users).length === 1){
                node.connect();
            }
        }

        node.deregister = function(mqttNode,done) {
            delete node.users[mqttNode.id];
            if (node.closing){
                node.client.end();
                return done();
            }
            if (Object.keys(node.users).length === 0) {
                if (node.client && node.client.connected){
                    //console.log("0 clients");
                    node.client.end();
                    return done();
                }
                else{
                    node.client.end();
                    return done();
                }
            }
            done();
        }


        node.connect = function(){ //mqtt connection part
            if(!node.connected && !node.connecting){
                node.connecting = true;
                try{
                    //node.client = null;
                    if (!node.server || node.server === "") {
                        node.client = new mqtt.MqttClient(function (client) {
                            return unixSocketConnectionBuilder(
                                client,
                                client.options
                            );
                        }, node.options);
                    } else {
                        node.client = mqtt.connect(
                            node.brokerurl,
                            node.options
                        );
                    }
                    node.client.setMaxListeners(0);

                    //handle connect event, update node statuses
                    node.client.on('connect', function(){
                        node.connecting = false;
                        node.connected = true;
                        node.log("Ampio Node instance connected to MQTT on: " + node.brokerurl + " with client id: " + node.options.clientId);

                        for(var id in node.users) {
                            if (node.users.hasOwnProperty(id)) {
                                node.users[id].status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
                            }
                        }

                        node.client.removeAllListeners('message');

                        for(var s in node.subscriptions){
                            if(node.subscriptions.hasOwnProperty(s)){
                                var topic = s;
                                for (var r in node.subscriptions[s]){
                                    if (node.subscriptions[s].hasOwnProperty(r)){
                                        node.client.on('message',node.subscriptions[s][r].handler);
                                    }
                                }
                                var options = {qos: 0};
                                node.client.subscribe(topic, options);
                                //console.log("zasubskrybowano " + topic);
                            }
                        }
                    })

                    //handle reconnect event, set node statuses
                    node.client.on("reconnect", function() {
                        console.log('RECONNECT')
                        for (var id in node.users) {
                            if (node.users.hasOwnProperty(id)) {
                                node.users[id].status({fill:"yellow",shape:"ring",text:"node-red:common.status.connecting"});
                            }
                        }
                    })

                    //handle closing event, change node statuses
                    node.client.on('close', function (){
                        if(node.connected){
                            node.connected = false;
                            node.log("! Ampio Node instance disconnected from MQTT on: " + node.brokerurl + " with client id: " + node.options.clientId);
                            //console.trace();
                            for (var id in node.users) {
                                if (node.users.hasOwnProperty(id)) {
                                    node.users[id].status({fill:"red",shape:"ring",text:"node-red:common.status.disconnected"});
                                }
                            }
                        }
                        else if(node.connecting){
                            node.log("! FAILED Ampio Node MQTT connection to: " + node.brokerurl + " with client id: " + node.options.clientId);
                        }
                    });
                    
                    //error, no need to handle it here
                    node.client.on('error', function(error){
                        console.log(error);
                    });
                }
                catch(err){
                    console.log(err);
                }
            }
        };

        node.subscribe = function(topic, callback, ref){
            ref=ref || 0;
            console.log("Topic: " + topic);
            node.subscriptions[topic] = node.subscriptions[topic]||{};
            var sub = {
                topic:topic,
                handler:function(mtopic,mpayload, mpacket){
                    if (matchTopic(topic,mtopic)){
                        callback(mtopic, mpayload, mpacket);
                    }
                },
                ref: ref
            };

            node.subscriptions[topic][ref] = sub;
            if (node.connected){
                node.client.on('message',sub.handler);
                var options = {};
                node.client.subscribe(topic, options);
            }
        }

        node.unsubscribe = function (topic, ref, removed) {
            ref = ref||0;
            var sub = node.subscriptions[topic];
            if (sub) {
                if (sub[ref]) {
                    node.client.removeListener('message',sub[ref].handler);
                    delete sub[ref];
                }
                if (removed) {
                    if (Object.keys(sub).length === 0) {
                        delete node.subscriptions[topic];
                        if (node.connected) {
                            node.client.unsubscribe(topic);
                            node.client.end();
                        }
                    }
                }
            }
        }

        node.publish = function (msg,done) {
            if (node.connected) {
                console.log(msg.topic + " " + msg.payload)
                if (msg.payload === null || msg.payload === undefined) {
                    msg.payload = "";
                } else if (!Buffer.isBuffer(msg.payload)) {
                    if (typeof msg.payload === "number") {
                        msg.payload = msg.payload.toString();
                    } else if (typeof msg.payload !== "string") {
                        msg.payload = "" + msg.payload;
                    }
                }

                var options = {
                };
                node.client.publish(msg.topic, msg.payload, options, function(err) {
                    done && done(err);
                    return
                });
            }
        };

        


        
        //DEVICES LIST
        RED.httpAdmin.get('/ampio/'+node_id+'/devices/list', RED.auth.needsPermission('ampio.read'),function(req,res){
            console.log('/ampio/'+node_id+'/devices/list');
            
            node=node_global[node_id];
            function OnSubscribe(){
                return new Promise((resolve,reject) => {
                    try{
                        node.client.subscribe('ampio/from/can/dev/list', function (err) { //topic to subscribe
                            if (!err) {
                                node.client.publish('ampio/to/can/dev/list','');
                                resolve(true); 
                            }
                            console.log(err);
                        });
                    }
                    catch(error){
                        console.error(error);
                    }
                    setTimeout(function() {
                        resolve('timeout');
                    }, 2000);
                });
            }
            function GetMessage(){
                return new Promise((resolve,reject) => {
                    node.client.on('message', function (topic, message) {
                        if(topic === 'ampio/from/can/dev/list'){
                            node.client.unsubscribe('ampio/from/can/dev/list');
                            let devices = JSON.parse(message);
                            resolve(devices.devices);
                        }
                    });
                    setTimeout(function() {
                        resolve('timeout');
                    }, 2000);
                });
            }
            
            if(node.connected){
                Promise.all([
                    OnSubscribe(),
                    GetMessage()
                ])
                .then(resp => {
                    if(resp[1]==='timeout'){
                        res.status(504);
                        res.json("508 server timeout");
                        node.client.unsubscribe('ampio/from/can/dev/list');
                    }
                    else{
                        res.json(resp[1]);
                    }
                });
            }
            
        });

        
        
        //DESCRIPTIONS
        RED.httpAdmin.get('/ampio/'+node_id+'/devices/desc', RED.auth.needsPermission('ampio.read'),function(req,res){
        
            let i = 0;
            let dmac=req.query.mac;

            console.log("Get descriptions");
            function btoa(data){
                let buff = new Buffer.from(data, 'ascii');
                let text = buff.toString('base64');
                return text;
            }

            function ListLoop(params){
                let List=[];
                let data=params.data;
                let con=params.con;
                console.log(dmac);
                console.log(params);
                for(i=1;i<(Number(params.lim)+1);i++){
                    List[i]=" ";
                }	
                for(var prop in data){
                    if(data.hasOwnProperty(prop)){
                        if(con.includes(Number(prop.split('_')[0]))){
                            if([11,13,15,17].includes(Number(prop.split('_')[0]))){
                                List[(Number(prop.split('_')[1])+255)]=data[prop];
                            }
                            else{
                                List[(Number(prop.split('_')[1])+1)]=data[prop];
                            }
                        }
                    }
                }
                return List;
            }
            
            function PrepareList(data){
                var DescList;
                let params={};
                params.data=data;
                let dict={
                s: {
                    lim: Math.max(req.query.bo,req.query.ao),
                    con: [12,13,16,17]
                },
                    r: {
                    lim: 0,
                    con: []
                },
                    f: {
                    lim: req.query.f,
                    con: [6]
                },
                    afu8: {
                    lim:6,
                    con: [7]
                },
                    rs: {
                    lim: req.query.rt,
                    con: [16,17]
                },
                    rsdn: {
                    lim: req.query.rt,
                    con: [16,17]
                },
                    rm: {
                    lim: req.query.rt,
                    con: [16,17]
                },
                    t: {
                    lim: 6,
                    con: [3]
                },
                    o: {
                    lim: Math.max(req.query.bo,req.query.ao),
                    con: [12,13,16,17]
                },
                    a: {
                    lim: Math.max(req.query.ai,req.query.ao),
                    con: [14,15,16,17]
                },
                    re: {
                    lim: req.query.bi,
                    con: [1,2,10,11]
                },
                    rgbw: {
                    lim: 1,
                    con: []
                },
                    i: {
                    lim: req.query.bi,
                    con: [1,2,10,11]
                },
                    au: {
                    lim: 18,
                    con: []
                },
                    au16: {
                    lim: 9,
                    con: []
                },
                    au32: {
                    lim: 32,
                    con: []
                },
                ir: {
                    lim: 0,
                    con: [21]
                }
                }
                
                if(dict.hasOwnProperty(req.query.valtype)){
                    params.con = dict[req.query.valtype].con;
                    params.lim = dict[req.query.valtype].lim;
                }
                else{
                    params.con=[];
                    params.lim=0;
                }
                DescList=ListLoop(params);
            return DescList;
            }
            
            function ErrorLoop(WarningMessage,length){
                let List=[];
                List[0]=WarningMessage;
                for(i=1;i<Number(length)+1;i++){
                    List[i]=btoa("Error reading name");
                }
                return List;
            }
            
            function ErrorList(){
                let WarningMessage=null;
                let List;
                let limit;
                
                let bo=req.query.bo;
                let bi=req.query.bi;
                let ao=req.query.ao;
                let ai=req.query.ai;
                let f=req.query.f;
                
                if(bo==32 && ao==16 && bi==40 && ai==8){
                WarningMessage=btoa("Legacy mode: Update your MQTT bridge on MSERV!");
                console.log("Error loading descriptions data from MSERV. It seems, you may have MQTT Bridge older than v3.7. Go to MSERV web panel and update Ampio software.")
            }
            else if(bo==0 && ao==0 && bi==0 && ai==0){
                WarningMessage=btoa("Update MQTT Bridge on your MSERV!");
                console.log("It seems you have MQTT Bridge v3.3-3.6, which had descriptions functionality in beta version. Upgrade it by MSERV web panel.")
                bo=8;
                bi=8;
                ai=8;
                f=32;
            }
                let LimDict={
                    s: Math.max(bo,ao),
                    r: 0,
                    f: f,
                    rs: req.query.rt,
                    rsdn: req.query.rt,
                    rm: req.query.rt,
                    t: 6,
                    o: Math.max(bo,ao),
                    a: ai,
                    re: bi,
                    rgbw: 1,
                    i: bi,
                    ir: 32,
                    au: 18,
                    au16: 9,
                    au32: 32,
                    afu8: 6
                }
                if(LimDict.hasOwnProperty(req.query.valtype)){
                    limit=LimDict[req.query.valtype];
                }
                else{
                    limit=0;
                }
            
            List=ErrorLoop(WarningMessage,limit)
            return List;
            }

            //connection part
            function OnSubscribe(){
                return new Promise((resolve,reject) => {
                    node.client.subscribe('ampio/from/'+dmac+'/description', function (err) { //topic to subscribe
                        if (!err) {
                            node.client.publish('ampio/to/'+dmac+'/description','');
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
                    node.client.on('message', function (topic, message) {
                        if(topic === 'ampio/from/'+dmac+'/description'){
                            let descriptions = JSON.parse(message);
                            resolve(descriptions);
                        }
                    });
                    setTimeout(function() {
                        resolve('timeout');
                    }, 2000);
                });
            }
            
            
        
            Promise.all([
                OnSubscribe(),
                GetMessage()
            ])
            .then(resp => {
                if(resp[1]==='timeout'){
                    node.client.unsubscribe('ampio/from/'+dmac+'/description');
                    let r = ErrorList();
                    res.json(r);
                }
                else{
                    node.client.unsubscribe('ampio/from/'+dmac+'/description');
                    //res.json(resp[1]);
                    res.json(PrepareList(resp[1]));
                }
            });
        });
        

        RED.httpAdmin.get('/ampio/'+node_id+'/devices/types', RED.auth.needsPermission('ampio.read'),function(req,res){
            let DevTypes = require('./db/devtypes.json');
            res.json(DevTypes);
        });

        RED.httpAdmin.get('/ampio/'+node_id+'/invaluetypes', RED.auth.needsPermission('ampio.read'),function(req,res){
            let ValTypes = require('./db/invaltypes.json');
            //'hum', 'absp', 'relp', 'db', 'lm', 'iaq' nadawczy 1801, odbiorczy 1800
            res.json(ValTypes);
        });

        RED.httpAdmin.get('/ampio/'+node_id+'/outvaluetypes', RED.auth.needsPermission('ampio.read'),function(req,res){
            let ValTypes = require('./db/outvaltypes.json');
            res.json(ValTypes);
        });


        this.on('close', function(done) {
            this.closing = true;
            if (this.connected) {
                node.client.once('close', function() {
                    //node.client = null;
                    done();
                });
                node.client.end();
            } else if (this.connecting || node.client.reconnecting) {
                node.client.end();
                done();
            } else {
                node.client.end();
                done();
            }
        });
    }

    

    RED.nodes.registerType("ampioconfig",ampioconfig,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
        //in future there will be ampio cloud access tokens, as soon as new cloud will be released in prod env
    });

    
}
