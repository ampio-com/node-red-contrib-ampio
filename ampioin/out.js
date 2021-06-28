module.exports = function(RED) {
    function ampioout(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        au = require('../generic/ampio-utils');
		node.mac = au.sanitize_mac(config.mac);
        node.ioid = au.sanitize_ioid(config.ioid);
        node.valtype = config.valtype;
        const zeroPad = (num, places) => String(num).padStart(places, '0');
        const leftPad = require('left-pad');
		node.ampioserv = config.server;
        node.brokerConn = RED.nodes.getNode(node.ampioserv);
		

			
        node.on("input", function(msg,send,done) {
            if(msg.hasOwnProperty('valtype')){
                var valtype2=msg.valtype;
            }
            else{
                var valtype2=node.valtype;
            }
            if(msg.hasOwnProperty('mac')){
                var mac2=msg.mac;
            }
            else{
                var mac2=node.mac;
            }
            if(msg.hasOwnProperty('ioid')){
                var ioid2=msg.ioid;
            }
            else{
                var ioid2=node.ioid;
            }

			let topic = 'ampio/to/'+mac2;
			let payload = msg.payload.toString()
			let outmsg = {topic:topic,payload:payload}

            if(valtype2=='r'){
				outmsg.topic = topic + '/raw';
            }
            else if(valtype2=='s'){
				outmsg.topic = topic + '/o/'+ioid2+'/cmd'
            }
            else if(valtype2=='rs' || valtype2=='rsdn' || valtype2=='rm' || valtype2=='f'){
				outmsg.topic = topic + '/' + valtype2 + '/'+ioid2+'/cmd';
            }
            else if(valtype2=='ir'){
				outmsg.topic = topic + '/raw'
                outmsg.payload = '8206' + leftPad((Number(ioid2)-1).toString(16),2,'0');
            }
			else if(valtype2=='afu8'){
				outmsg.topic = topic + '/raw';
				outmsg.payload = '7AF9' + zeroPad((Number(msg.payload)).toString(16),2) + zeroPad((Number(ioid2)-1).toString(16),2);
			}
            else{
				outmsg.topic = topic+ '/'+valtype2+'/'+ioid2+'/cmd';
            }

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
    RED.nodes.registerType("Ampio OUT",ampioout);
};


