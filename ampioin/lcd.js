module.exports = function(RED) {
    function ampiolcd(config) {
        
        RED.nodes.createNode(this,config);
        var context = this.context();
        var node = this;
        this.mac = config.mac;
        this.lcdfont = config.lcdfont;
        this.lcdxpos = config.lcdxpos;
        this.lcdypos = config.lcdypos;
        this.lcdcharcolor = config.lcdcharcolor;
        this.lcdbackcolor = config.lcdbackcolor;

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
            
            let outstr = "2901";
            let xpos = node.lcdxpos.toString(16);
            xpos = leftPad(xpos,2,'0');
            let ypos = node.lcdypos.toString(16);
            ypos = leftPad(ypos,2,'0');
            msg = msg.payload.toString();
            if(msg.length > 11){
                msg = msg.substr(0, 11);
            }

            if(node.lcdcharcolor[0]=='#'){
                node.lcdcharcolor=node.lcdcharcolor.substring(1);
            }
            if(node.lcdbackcolor[0]=='#'){
                node.lcdbackcolor=node.lcdcharcolor.substring(1);
            }

            //convertion from HEX to RGB and from RGB to RGB565
                let cr=node.lcdcharcolor.substring(0,2);
                let cg=node.lcdcharcolor.substring(2,4);
                let cb=node.lcdcharcolor.substring(4,6);

                cr = parseInt(cr,16);
                cg = parseInt(cg,16);
                cb = parseInt(cb,16);

                let cr5 = cr>>3;
                let cg6 = cg>>2;
                let cb5 = cb>>3;


                let crgb565 = cr5<<11 | cg6<<5 | cb5;
                crgb565 = leftPad(crgb565.toString(16),4,'0');
            //end of convertion

            //convertion from HEX to RGB and from RGB to RGB565
                let br=node.lcdbackcolor.substring(0,2);
                let bg=node.lcdbackcolor.substring(2,4);
                let bb=node.lcdbackcolor.substring(4,6);

                br = parseInt(br,16);
                bg = parseInt(bg,16);
                bb = parseInt(bb,16);

                let br5 = br>>3;
                let bg6 = bg>>2;
                let bb5 = bb>>3;

                let brgb565 = br5<<11 | bg6<<5 | bb5;
                brgb565 = leftPad(brgb565.toString(16),4,'0');
            //end of convertion

            let msglen = msg.length;
            outstr = outstr + node.lcdfont + xpos + ypos + crgb565.toUpperCase() + brgb565.toUpperCase() + leftPad(msglen.toString(16),2,'0') + Buffer.from(msg,'utf-8').toString('hex');
            client.publish('ampio/to/'+mac+'/raw',outstr);
            
        })

        this.on('close', function() {
            // tidy up any state
            client.end();
        });

    }
    RED.nodes.registerType("Ampio LCD",ampiolcd);
};


