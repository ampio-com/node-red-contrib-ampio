module.exports = function(RED) {
    function ampioin(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        au = require('../generic/ampio-utils')
        const mac = au.sanitize_mac(config.mac);

        //mutable as valtype can overide
        let ioid = au.sanitize_ioid(config.ioid);
        let valtype = config.valtype;

        const retainignore = config.retainignore;

        var client  = au.setup_mqtt_client(node, config)
        au.setup_node_status_from_mqtt_client(node, client)

        var JustConnected;
        var RisingEdgeDetection = false;
        if (valtype == "re"){
            valtype = "i";
            RisingEdgeDetection = true;
        }

        client.on('connect', function () {
            switch(valtype){
                case 'hum':
                valtype = 'au16l';
                ioid = '1';
                break;
                case 'absp':
                valtype = 'au16l';
                ioid = '2';
                break;
                case 'relp':
                valtype = 'au16l';
                ioid = '6'
                break;
                case 'db':
                valtype = 'au16l';
                ioid = '3';
                break;
                case 'lux':
                valtype = 'au16l';
                ioid = '4';
                break;
                case 'iaq':
                valtype = 'au16l';
                ioid = '5';
                break;
                case 'temp':
                valtype = 't';
                ioid = '1';
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

            if(valtype!='raw'){
                var SubPath = 'ampio/from/'+mac+'/state/'+valtype+'/'+ioid;
            }
            else if(valtype=='raw'){
                var SubPath = 'ampio/from/'+mac+'/raw'
            }
            client.subscribe(SubPath, function (err) { //topic to subscribe
                if (!err && mac!="" && ioid!="" && valtype!="") {
                    node.status({fill: "green", shape: "dot", text: "connected"});
                    JustConnected=true;
                } else {
                    node.status({fill: "red", shape: "ring", text:"fill properties"});
                }
            })
            
        })



        client.on('message', function (topic, message) {

            if(RisingEdgeDetection==true){
                if(message == 1){
                    var outMsg = {payload: message.toString('utf-8')};
                    node.send(outMsg);
                }
            }
            else{
                if(JustConnected==true && retainignore==true){
                    JustConnected=false;
                }
                else if(JustConnected==true && retainignore==false){
                    JustConnected=false;
                    var outMsg = {payload: message.toString('utf-8')};
                    node.send(outMsg);
                }
                else{
                    var outMsg = {payload: message.toString('utf-8')};
                    node.send(outMsg);
                }
            }
        })

        this.on('close', function() {
            // tidy up any state
            client.end();
        });

    }
    RED.nodes.registerType("Ampio IN",ampioin);
};


