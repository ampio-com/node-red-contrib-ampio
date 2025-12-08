module.exports = function(RED) {
    function ampioin(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        au = require('../generic/ampio-utils');
        
        node.mac = au.sanitize_mac(config.mac);
        node.ioid = au.sanitize_ioid(config.ioid);
        node.valtype = config.valtype;
        node.retainignore = config.retainignore;
        
        node.ampioserv = config.server;

        node.brokerConn = RED.nodes.getNode(node.ampioserv);

        var JustConnected;
        node.RisingEdgeDetection = false;
        if (node.valtype == "re"){
            node.valtype = "i";
            node.RisingEdgeDetection = true;
        }

        switch(node.valtype){
            case 'hum':
                node.valtype = 'au16l';
                node.ioid = '1';
            break;
            case 'absp':
                node.valtype = 'au16l';
                node.ioid = '2';
            break;
            case 'relp':
                node.valtype = 'au16l';
                node.ioid = '6'
            break;
            case 'db':
                node.valtype = 'au16l';
                node.ioid = '3';
            break;
            case 'lux':
                node.valtype = 'au16l';
                node.ioid = '4';
            break;
            case 'iaq':
                node.valtype = 'au16l';
                node.ioid = '5';
            break;
            case 'co2':
                node.valtype = 'au16l';
                node.ioid = '7';
            break;
            case 'temp':
                node.valtype = 't';
                node.ioid = '1';
            break;
            default:
            ;
        }

        if(node.valtype!='raw'){
            if(node.ioid==""){
                node.ioid='0';
            }
            if(node.valtype==""){
                node.valtype='0';
            }
            node.SubPath = 'ampio/from/' + node.mac + '/state/' + node.valtype + '/' + node.ioid;
        }
        else if(node.valtype=='raw'){
            node.SubPath = 'ampio/from/' + node.mac + '/raw'
        }

        

        if(true){
            node.status({fill:"red",shape:"ring",text:"node-red:common.status.disconnected"});
            node.brokerConn.register(node);
            if(/*node.mac!="" && node.ioid!="" && node.valtype!=""*/true){
                node.brokerConn.subscribe(node.SubPath,function(topic,payload){
                    var msg = {topic:topic, payload:payload.toString('utf-8')};
                    node.send(msg);
                }, node.id);
                if(node.brokerConn.connected){
                    node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
                }
            }
            else{
                node.error("Params not defined");
            }
        }


        /*
        node.client.on('connect', function () {
            switch(node.valtype){
                case 'hum':
                    node.valtype = 'au16l';
                    node.ioid = '1';
                break;
                case 'absp':
                    node.valtype = 'au16l';
                    node.ioid = '2';
                break;
                case 'relp':
                    node.valtype = 'au16l';
                    node.ioid = '6'
                break;
                case 'db':
                    node.valtype = 'au16l';
                    node.ioid = '3';
                break;
                case 'lux':
                    node.valtype = 'au16l';
                    node.ioid = '4';
                break;
                case 'iaq':
                    node.valtype = 'au16l';
                    node.ioid = '5';
                break;
                case 'temp':
                    node.valtype = 't';
                    node.ioid = '1';
                break;
                default:
                ;
            }
            // wilg, cis b, glos, jasn, iaq, cisn wz

            //hum: 'Humidity [%]',
            //absp: 'Atmospheric pressure (absolute) [hPa]',
            //relp: 'Atmospheric pressure (relative) [hPa]',
            //db: 'Loudness [dB]',
            //lux: 'Brightness [lux]',
            //iaq: 'Indoor Air Quality index [IAQ]',

            if(node.valtype!='raw'){
                node.SubPath = 'ampio/from/' + node.mac + '/state/' + node.valtype + '/' + node.ioid;
            }
            else if(node.valtype=='raw'){
                node.SubPath = 'ampio/from/' + node.mac + '/raw'
            }
            node.client.subscribe(node.SubPath, function (err) { // topic to subscribe
                if (!err && node.mac!="" && node.ioid!="" && node.valtype!="") {
                    node.status({fill: "green", shape: "dot", text: "connected"});
                    node.JustConnected=true;
                } else {
                    node.status({fill: "red", shape: "ring", text: "fill properties"});
                }
            })
        })*/

        /*
        node.client.on('message', function (topic, message) {

            if(node.RisingEdgeDetection==true){
                if(message == 1){
                    const outMsg = {
                    	payload: message.toString('utf-8'),
                    	mac: node.mac
                    };
                    node.send(outMsg);
                }
            } else {
                if(node.JustConnected==true && node.retainignore==true){
                    JustConnected=false;
                }
                else if(node.JustConnected==true && node.retainignore==false){
                    node.JustConnected=false;
                    const outMsg = {payload: message.toString('utf-8')};
                    node.send(outMsg);
                }
                else{
                    const outMsg = {payload: message.toString('utf-8')};
                    node.send(outMsg);
                }
            }
        })*/

        node.on('close', function(removed, done) {
            if (node.brokerConn) {
                node.brokerConn.unsubscribe(node.topic,node.id, removed);
                node.brokerConn.deregister(node,done);
            }
        });

    }
    RED.nodes.registerType("Ampio IN", ampioin);
};


