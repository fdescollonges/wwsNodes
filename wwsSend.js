/**
 * Created by franck on 09/11/2016.
 */

"use strict";
var request = require('request');
var url = require('url');

module.exports = function(RED) {
	function wwsSend(config) {
		RED.nodes.createNode(this, config);
		this.wwsApplications = RED.nodes.getNode(config.wwsApplications);

		this.on('input', function(msg) {
			// console.log("In wwsSend");
			var appId = this.wwsApplications.appId;
			var appSecret = this.wwsApplications.appSecret;
			var jwtToken = this.wwsApplications.accessToken;
			var listSpaces = config.listSpaces;
			var spaceId = config.spaceId;
			var allSpaces = config.allSpaces;
			var node = this;
			
			// msg.payload = "jwt :" + appId + "/" + appSecret + " Bearer {"+
			// jwtToken + "}";
			if (allSpaces) {
				console.log("Sending to all Spaces");
				try {
					var objListSpaces = JSON.parse(listSpaces);
					for(var i = 0; i < objListSpaces.length; i++) {
					    var space = objListSpaces[i];
						console.log("Sending to : "+ space.title +"{"+space.id+"}");
						sendMessage(msg, space.id, jwtToken, (err, body) => {
							if (err) {
								node.error("Unable to send the message : "+msg.payload+" (" + err + ")");
								node.status({fill:"red",shape:"dot",text:"Not sent"});
								// console.log (`Unable to send message :
								// ${err}`);
							} else { 
								node.status({fill:"green",shape:"dot",text:"Msg sent"});
								// console.log (`Message sent : {body}`);
							};
						});
						
					}
				} catch (err) {
					node.error("Unable to send the message : "+msg.payload+" (No spaces)");
					node.status({fill:"red",shape:"dot",text:"Not sent"});
				}
				} else {
				console.log("Sending to one space : " + spaceId);
				if (!spaceId) {
					node.error("Unable to send the message : "+msg.payload+" ( Invalid space )");
					node.status({fill:"red",shape:"dot",text:"Not sent"});					
				} else {
					sendMessage(msg, spaceId, jwtToken, (err, body) => {
						if (err) {
							node.error("Unable to send the message : "+msg.payload+" (" + err + ")");
							node.status({fill:"red",shape:"dot",text:"Not sent"});
							// console.log (`Unable to send message : ${err}`);
						} else {
							node.status({fill:"green",shape:"dot",text:"Msg sent"});
							// console.log (`Message sent : ${body}`);
						};
					});
				}
			}

		});
	}
	
	RED.nodes.registerType("wwsSend", wwsSend);
	
	function sendMessage(msg, spaceId, jwtToken, callback) {
		var url = `https://api.watsonwork.ibm.com/v1/spaces/${spaceId}/messages`;
		var title = msg.title || 'title';
		var color = msg.color || '#0000FF';
		var text = String(msg.payload) || 'text';
		var name = msg.name || 'name';
		var avatar = msg.avatar || 'https://raw.githubusercontent.com/fdescollonges/wwsNodes/master/icons/node-red.png';
		var body = {
			headers: {
				Authorization: `Bearer ${jwtToken}`
			},
			json: true,
			body: {
				type: 'appMessage',
				version: 1.0,
				annotations: [{
						type: 'generic',
						version: 1.0,
						title: title,
						color: color,
						text: text,
						actor:{
							name: name,
							avatar: avatar
						}
				}]
			}
		};

		// console.log('Responding to ' + url + ' with ' +
		// JSON.stringify(body));

		request.post(url, body, (err, res) => {
			if (err || res.statusCode !== 201) {
				if (!err) { 
					console.error(`Error sending message to ${spaceId} with return code : ${res.statusCode}`); 
					callback(`Return code : ${res.statusCode}`);
				}
			} else {
				callback(null, res.body);
			}
		});
	}
	 
    RED.httpAdmin.get('/wwsApplication/', function(req, res){
    	console.log("Getting wwsApplications data for "+req.query.id);
    	let wwsAppTmp = RED.nodes.getNode(req.query.id);
    	// console.log(wwsAppTmp);
		let listSpacesTmp = 'No space found';
    	if (wwsAppTmp) {
    		listSpacesTmp = wwsAppTmp.listSpaces;
    	} 
    	res.json(listSpacesTmp);
    });
};