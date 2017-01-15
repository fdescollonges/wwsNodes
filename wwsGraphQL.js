/**
 * Created by franck on 09/11/2016.
 */

"use strict";
var request = require('request');
var url = require('url');

module.exports = function(RED) {
	function wwsGraphQL(config) {
		RED.nodes.createNode(this, config);
		this.wwsApplications = RED.nodes.getNode(config.wwsApplications);

		this.on('input', function(msg) {
			// console.log("[wwsNodes] In wwsGraphQL");
			var appId = this.wwsApplications.appId;
			var appSecret = this.wwsApplications.appSecret;
			var jwtToken = this.wwsApplications.accessToken;
			var query = config.graphQLQuery;
			var node = this;
			
			if (msg.graphQLQuery) {
				console.log("[wwsNodes] graphQLQuery dynamically specified : " + msg.graphQLQuery);
				query = msg.graphQLQuery;
			}
			
			// msg.payload = "jwt :" + appId + "/" + appSecret + " Bearer {"+
			// jwtToken + "}";
		
				console.log("[wwsNodes] Sending GraphQL Query");
				sendQuery(query, jwtToken, (err, body) => {
						if (err) {
							node.error("Unable to send query : " + query +" (" + err + ")");
							node.status({fill:"red",shape:"dot",text:"Bad query"});
							// console.log (`Unable to send message : ${err}`);
						} else {
							node.status({fill:"green",shape:"dot",text:"Query Ok"});
							msg.graphQLResult = body;
							node.send(msg);
							// console.log (`Message sent : ${body}`);
						}
					});
				});
	}
	
	RED.nodes.registerType("wwsGraphQL", wwsGraphQL);
	
	function sendQuery(query, token, cb) {
//		setTimeout(function(){
		console.log('[wwsNodes] In sendQuery');
		var _url = 'https://workspace.ibm.com/graphql?query='+query;
		var _headers = {
				//Authorization: `Bearer ${token}`,
				jwt : token,
				'content-type' : 'application/graphql'
		};

		//var _query = "query getSpaceId{spaces(first:200){items{id title}}}";

		var _request = {
				headers: _headers,
				json: true,
		};

		request.post(_url, _request, (err, res) => {
			if (err) {
				console.log("[wwsNodes] graphQL request error : "+JSON.stringify(err,null, 2)+" Query : "+ _url);
				cb(err);
				return;
			}
			console.log("[wwsNodes] graphQL request success : "+JSON.stringify(res.body.data));
			cb(null, JSON.stringify(res.body.data));
		});	
	}
};