module.exports = function(RED) {
    function ampiomdot(config) {
        
        RED.nodes.createNode(this,config);
        var context = this.context();
        var node = this;
        this.mac = config.mac;
        

        var mqtt = require('mqtt');
        const leftPad = require('left-pad');
        var client  = mqtt.connect('mqtt://192.168.77.80');

        var m=false;

        var mac = node.mac;

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

        function hex2rgb565(hexcol){
            let r=hexcol.substring(0,2);
            let g=hexcol.substring(2,4);
            let b=hexcol.substring(4,6);

            r = parseInt(r,16);
            g = parseInt(g,16);
            b = parseInt(b,16);

            let r5 = r>>3;
            let g6 = g>>2;
            let b5 = b>>3;


            let rgb565 = r5<<11 | g6<<5 | b5;
            rgb565 = leftPad(rgb565.toString(16),4,'0');
            return rgb565
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

        
        var xpos = node.lcdxpos.toString(16);
        xpos = leftPad(xpos,2,'0');
        var ypos = node.lcdypos.toString(16);
        ypos = leftPad(ypos,2,'0');
        if(node.lcdcharcolor[0]=='#'){
            node.lcdcharcolor=node.lcdcharcolor.substring(1);
        }
        if(node.lcdbackcolor[0]=='#'){
            node.lcdbackcolor=node.lcdcharcolor.substring(1);
        }
        var crgb565 = hex2rgb565(node.lcdcharcolor);
        var brgb565 = hex2rgb565(node.lcdbackcolor);
        crgb565 = crgb565.toUpperCase();
        brgb565 = brgb565.toUpperCase();

        this.on("input", function(msg) {

            var outstr = "2901";
            
            if(msg.payload.hasOwnProperty('brightness')){
                outstr = outstr + "02" + leftPad(msg.payload.brightness.toString(16),2,'0');
            }
            else if(msg.payload.hasOwnProperty('cls')){
                if(msg.payload.cls == true){
                    outstr = outstr + "03";
                }
            }
            else if(msg.payload.hasOwnProperty('square')){
                let x2 = parseInt(node.lcdxpos)+parseInt(msg.payload.square.x);
                let y2 = parseInt(node.lcdypos)+parseInt(msg.payload.square.y);
                outstr = outstr + "04" + xpos + ypos + leftPad(x2.toString(16),2,'0') + leftPad(y2.toString(16),2,'0') + crgb565;
            }
            else if(typeof msg.payload === ('string' || 'number')){
                cmdtype=node.lcdfont;
                msg = msg.payload.toString();
                if(node.lcdfont='07' || msg.length > 11){
                    msg = msg.substr(0, 11);
                }
                else if(node.lcdfont='09' || msg.length > 6){
                    msg = msg.substr(0, 6);
                }
                let msglen = msg.length;
                var restofmsg = leftPad(msglen.toString(16),2,'0') + Buffer.from(msg,'utf-8').toString('hex');
                outstr = outstr + node.lcdfont + xpos + ypos + crgb565 + brgb565 + leftPad(msglen.toString(16),2,'0') + Buffer.from(msg,'utf-8').toString('hex');
            }
            client.publish('ampio/to/'+mac+'/raw',outstr);
            
            
            
        })

        this.on('close', function() {
            // tidy up any state
            client.end();
        });

    }
    RED.nodes.registerType("Ampio MDOT",ampiomdot);
};


