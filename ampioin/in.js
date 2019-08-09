module.exports = function(RED) {
    function ampioin(config) {
        
        RED.nodes.createNode(this,config);
        var context = this.context();
        var node = this;
        this.mac = config.mac;
        this.ioid = config.ioid;
        this.valtype = config.valtype;
        this.retainignore = config.retainignore;
        this.srvaddress = config.srvaddress;
        var mqtt = require('mqtt');
        var client  = mqtt.connect('mqtt://'+node.srvaddress);
        var n=false;
        var m=false;

        var mac = node.mac;
        var ioid = node.ioid;
        var valtype = node.valtype;
        var retainignore = node.retainignore
        var JustConnected;
        var RisingEdgeDetection=false;
        if (valtype == "re"){
            valtype = "i";
            RisingEdgeDetection = true;
        }

        mac = mac.toUpperCase();
        node.status({fill:"yellow",shape:"dot",text:"not connected"});

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


