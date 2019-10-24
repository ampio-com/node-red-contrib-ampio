module.exports = function(RED) {
    function ampioin(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        au = require('../generic/ampio-utils');
        
        node.mac = au.sanitize_mac(config.mac);
        node.ioid = au.sanitize_ioid(config.ioid);
        node.valtype = config.valtype;
        node.retainignore = config.retainignore;
        
        node.client  = au.setup_mqtt_client(node, config)
        au.setup_node_status_from_mqtt_client(node)

        var JustConnected;
        node.RisingEdgeDetection = false;
        if (node.valtype == "re"){
            node.valtype = "i";
            node.RisingEdgeDetection = true;
        }

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
        })

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
        })

        this.on('close', function() {
            // tidy up any state
            node.client.end();
        });

    }
    RED.nodes.registerType("Ampio IN", ampioin);
};


