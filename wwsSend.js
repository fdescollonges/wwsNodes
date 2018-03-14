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
			// console.log("[wwsNodes] In wwsSend");
			var appId = this.wwsApplications.appId;
			var appSecret = this.wwsApplications.appSecret;
			var jwtToken = this.wwsApplications.accessToken;
			var listSpaces = config.listSpaces;
			var spaceId = config.spaceId;
			var allSpaces = config.allSpaces;
			var autoRefresh= config.autoRefresh;
			var node = this;

			if (msg.spaceId) {
				console.log("[wwsNodes] SpaceId dynamically specified");
				allSpaces = false;
				spaceId = msg.spaceId;
			}

			// msg.payload = "jwt :" + appId + "/" + appSecret + " Bearer {"+
			// jwtToken + "}";
			if (allSpaces) {
				if (autoRefresh)  {
					console.log("[wwsNodes] Refreshing space list");
					getSpaces(jwtToken, (err, res) => {
						if (err) {
							console.log("[wwsNodes] Unable to refresh space list");
							node.warn("Unable to refresh space list");
							node.status({fill:"yellow",shape:"dot",text:"Unable to refresh space list"});
						} else {
							listSpaces = JSON.stringify(res);
							console.log("[wwsNodes] listSpaces :"+listSpaces)
						}
						sendToAllSpaces(node,msg, listSpaces, jwtToken);					
					})					
				} else  {
					sendToAllSpaces(node,msg, listSpaces, jwtToken);
				}

			} else {
				console.log("[wwsNodes] Sending to one space : " + spaceId);
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
							msg.sendResult = body;
							node.send(msg);
						};
					});
				}
			}

		});
	}

	RED.nodes.registerType("wwsSend", wwsSend);

	function sendToAllSpaces(node, msg, listSpaces, jwtToken) {
		console.log("[wwsNodes] Sending to all Spaces");
		try {
			var objListSpaces = JSON.parse(listSpaces);
			for(var i = 0; i < objListSpaces.length; i++) {
				var space = objListSpaces[i];
				console.log("[wwsNodes] Sending to : "+ space.title +"{"+space.id+"}");
				sendMessage(msg, space.id, jwtToken, (err, body) => {
					if (err) {
						node.error("Unable to send the message : "+msg.payload+" (" + err + ")");
						node.status({fill:"red",shape:"dot",text:"Not sent"});
						// console.log (`Unable to send message :
						// ${err}`);
					} else { 
						node.status({fill:"green",shape:"dot",text:"Msg sent"});
						msg.sendResult = body;
						node.send(msg);
						// console.log (`Message sent : {body}`);
					};
				});

			}
		} catch (err) {
			node.error("Unable to send the message : "+msg.payload+" (No spaces)");
			node.status({fill:"red",shape:"dot",text:"Not sent"});
		}
	}

	function getSpaces(token, cb) {
		// console.log('[wwsNodes] In get spaces');
		var _url = 'https://workspace.ibm.com/graphql?query=query%20getSpaceId%7Bspaces(first%3A200)%7Bitems%7Bid%20title%7D%7D%7D%0A&operationName=getSpaceId';
		var _headers = {
				// Authorization: `Bearer ${token}`,
				jwt : token,
				'content-type' : 'application/graphql'
		};

		var _query = "query getSpaceId{spaces(first:200){items{id title}}}";

		var _request = {
				headers: _headers,
				json: true,
		};

		request.post(_url, _request, (err, res) => {
			if (err) {
				console.error(`Error requesting spaces : ${err}`);
				cb(err);
				return;
			}
			cb(null, res.body.data.spaces.items);
		});

	};

	function sendMessage(msg, spaceId, jwtToken, callback) {
		var url = `https://api.watsonwork.ibm.com/v1/spaces/${spaceId}/messages`;
		var title = msg.title || '';
		var color = msg.color || '#0000FF';
		var text = String(msg.payload) || '';
		var name = msg.name || '';
		var avatar = msg.avatar || 'https://api.watsonwork.ibm.com/photos/a398828f-827c-477f-a6bf-98c949e28a50';
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
		console.log("[wwsNodes] Getting wwsApplications data for "+req.query.id);
		let wwsAppTmp = RED.nodes.getNode(req.query.id);
		// console.log(wwsAppTmp);
		let listSpacesTmp = 'No space found';
		if (wwsAppTmp) {
			listSpacesTmp = wwsAppTmp.listSpaces;
		} 
		res.json(listSpacesTmp);
	});
};