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
			console.log("In wwsSend");
			var appId = this.wwsApplications.appId;
			var appSecret = this.wwsApplications.appSecret;
			var jwtToken = this.wwsApplications.accessToken;
			var listSpaces = this.wwsApplications.listSpaces;
			var spaceid = config.spaceid;
			var content = msg.payload;
			console.log("All Spaces");
			console.log(listSpaces);
			
			msg.payload = "jwt :" + appId + "/" + appSecret + " Bearer {"
					+ jwtToken + "}";
			sendMessage(content, spaceid, jwtToken, (err, body) => {
				if (err) {
					console.log (`Unable to send message : ${err}`)					
				};
				console.log('Message Posted : '+ body);
			});
		});
	}
	
	RED.nodes.registerType("wwsSend", wwsSend);
	
	function sendMessage(text, spaceId, jwtToken, callback) {
		var url = `https://api.watsonwork.ibm.com/v1/spaces/${spaceId}/messages`;
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
						color: '#6CB7FB',
						text: text,
				}]
			}
		};

		console.log('Responding to ' + url + ' with ' + JSON.stringify(body));

		request.post(url, body, (err, res) => {
			if (err || res.statusCode !== 201) {
				console.error(`Error sending message to ${spaceId} ${err}`);
				callback(err);
				return;
			}
			callback(null, res.body);
		});
	}
};