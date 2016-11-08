/**
 * Created by franck on 08/11/2016.
 */
"use strict";
var request = require('request');
var url = require('url');
var jsonwebtoken = require('jsonwebtoken');
var jwtToken;
var errors = 0;

module.exports = function(RED) {
	function wwsApplications(n) {
		RED.nodes.createNode(this,n);
		var node=this;
		node.appId = n.appId;
		node.appSecret = n.appSecret;
		node.initialize(
					   (err, token) => {
						if (err) {
							console.error('Initialize : Failed');
						}			
		console.log('Got new token : '+token);
		this.accessToken=token;
		});
	}
	RED.nodes.registerType("wwsApplications",wwsApplications);

	wwsApplications.prototype.initialize = function(cb) {
		this.run(
				(err, token) => {
					if(err) {
						console.error(`Failed to get JWT token - attempt ${errors}`);
						errors++;
						if(errors > 10) {
							console.error(`Too many JWT token attempts; giving up`);
							cb("Initialize : Too many JWT token attempts; giving up");
						}
						setTimeout(initialize(), 10000);
						return;
					}

					console.log("Initialized JWT token");
					this.accessToken = token();
					cb(undefined, this.accessToken);
					//console.log("AccessToken : "+this.accessToken);
				});
	}



	wwsApplications.prototype.run = function(cb) {
		let tok;

		// Return the current token
		const current = () => tok;

		// Return the time to live of a token
		const ttl = (tok) => Math.max(0, jsonwebtoken.decode(tok).exp * 1000 - Date.now());

		// Refresh the token
		const refresh = (cb) => {
			var string = this.appId + ":" + this.appSecret;
			var buffer = new Buffer(string);
			var toBase64 = buffer.toString('base64');
			var authorization = "Basic "+toBase64;
			console.log('Getting token : ' +authorization);
			request.post('https://api.watsonwork.ibm.com/oauth/token', {
				headers : {
					"Content-Type": "application/x-www-form-urlencoded",
					"Accepts": "application/json",
					"Authorization" : authorization
				},
				json: true,
				form: {
					grant_type: 'client_credentials'
				}
			}, (err, res) => {
				if(err || res.statusCode !== 200) {
					console.log('Error getting token %o', err || res.statusCode);
					cb(err || new Error(res.statusCode), current);
					return;
				}

				// Save the fresh token
				console.log('Got new token');
				tok = res.body.access_token;
				//this.accessToken = tok;

				// Schedule next refresh a bit before the token expires
				const t = ttl(tok);
				console.log('Token ttl', t);
				setTimeout(refresh, Math.max(0, t - 60000)).unref();

				// Return a function that'll return the current token
				cb(undefined, current);
			});
		};

		// Obtain initial token
		setImmediate(() => refresh(cb));
	};
};