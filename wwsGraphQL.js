/**
 * Created by franck on 09/11/2016.
 */

"use strict";
var request = require('request');
var url = require('url');

module.exports = function (RED) {
	function wwsGraphQL(config) {
		RED.nodes.createNode(this, config);
		this.wwsApplications = RED.nodes.getNode(config.wwsApplications);

		this.on('input', function (msg) {
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
					node.error("Unable to send query : " + query + " (" + err + ")");
					node.status({
						fill: "red",
						shape: "dot",
						text: "Query not sent"
					});
					// console.log (`Unable to send message : ${err}`);
				} else {
					node.status({
						fill: "green",
						shape: "dot",
						text: "Query Sent"
					});
					msg.graphQLResult = JSON.stringify(body.data);
					msg.graphQLInfo = body;
					node.send(msg);
					// console.log (`Message sent : ${body}`);
				}
			});
		});
	}

	RED.nodes.registerType("wwsGraphQL", wwsGraphQL);

	function sendQuery(query, token, cb) {
		//		setTimeout(function(){
		console.log('[wwsNodes] In sendQuery with BETA option');
		var _headers = {
			//Authorization: `Bearer ${token}`,
			jwt: token,
			'Content-type': 'application/graphql',
			'x-graphql-view': 'PUBLIC, BETA'
		};

		var _request = {
			headers: _headers,
			//				json: true,
			method: "POST",
			//			body: query
		};

		var _url = '';
		if (query.startsWith("mutation")) {
			_url = 'https://workspace.ibm.com/graphql';
			_request.body = query;
		} else {
			_url = 'https://workspace.ibm.com/graphql?query=' + query;
			_request.json = true;
		}

		//var _query = "query getSpaceId{spaces(first:200){items{id title}}}";
		console.log(JSON.stringify(_request, ' ', 2));

		request.post(_url, _request, (err, res) => {
			if (err) {
				console.log("[wwsNodes] graphQL request error : " + JSON.stringify(err, null, 2) + " Query : " + _url);
				cb(err);
				return;
			}
			console.log("[wwsNodes] graphQL query response  : " + JSON.stringify(res.body));
			cb(null, res.body);
		});
	}
};