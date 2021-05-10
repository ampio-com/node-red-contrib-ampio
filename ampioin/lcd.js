module.exports = function(RED) {
    function ampiolcd(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var leftPad = require('left-pad');
        au = require('../generic/ampio-utils');

        node.mac = au.sanitize_mac(config.mac);
        node.lcdfont = config.lcdfont;
        node.lcdxpos = config.lcdxpos;
        node.lcdypos = config.lcdypos;
        node.lcdcharcolor = config.lcdcharcolor;
        node.lcdbackcolor = config.lcdbackcolor;
        node.ampioserv = config.server;
        node.brokerConn = RED.nodes.getNode(node.ampioserv);

        
        

        node.lcdxpos = node.lcdxpos.toString(16);
        node.lcdxpos = leftPad(node.lcdxpos,2,'0');
        node.lcdypos = node.lcdypos.toString(16);
        node.lcdypos = leftPad(node.lcdypos,2,'0');
        if(node.lcdcharcolor[0]=='#'){
            node.lcdcharcolor=node.lcdcharcolor.substring(1);
        }
        if(node.lcdbackcolor[0]=='#'){
            node.lcdbackcolor=node.lcdcharcolor.substring(1);
        }
        var crgb565 = au.hex2rgb565(node.lcdcharcolor);
        var brgb565 = au.hex2rgb565(node.lcdbackcolor);

        node.on("input", function(msg,send,done) {

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
                outstr = outstr + "04" + leftPad(msg.payload.square.x1.toString(16),2,'0') + leftPad(msg.payload.square.y1.toString(16),2,'0') + leftPad(msg.payload.square.x2.toString(16),2,'0') + leftPad(msg.payload.square.y2.toString(16),2,'0') + hex2rgb565(msg.payload.square.col).toUpperCase();
            }
            else if(typeof msg.payload === ('string' || 'number')){
                msg = msg.payload.toString();
                if(node.lcdfont=='07' || msg.length > 11){
                    msg = msg.substr(0, 11);
                }
                else if(node.lcdfont=='09' || msg.length > 6){
                    msg = msg.substr(0, 6);
                }
                let msglen = msg.length;
                var restofmsg = leftPad(msglen.toString(16),2,'0') + Buffer.from(msg,'utf-8').toString('hex');
                outstr = outstr + node.lcdfont + node.lcdxpos + node.lcdypos + crgb565 + brgb565 + leftPad(msglen.toString(16),2,'0') + Buffer.from(msg,'utf-8').toString('hex');
            }
            //node.client.publish('ampio/to/'+mac+'/raw',outstr);
            
            let outmsg={};
            outmsg.payload=outstr;
            outmsg.topic='ampio/to/'+node.mac+'/raw';

            this.brokerConn.publish(outmsg, function(err) {
				let args = arguments;
				let l = args.length;
				done(err);
			});

			done();
            
        })

        node.on('close', function() {
            if (node.brokerConn) {
                node.brokerConn.unsubscribe(node.topic,node.id, removed);
                node.brokerConn.deregister(node,done);
            }
        });

        node.brokerConn.register(node);
    }
    RED.nodes.registerType("Ampio LCD",ampiolcd);
};


