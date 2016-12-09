/**
 * Created by franck on 09/11/2016.
 */

"use strict";
const request = require('request');
const url = require('url');
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const bparser = require('body-parser');
const crypto = require('crypto');


module.exports = function(RED) {
	function wwsReceive(config) {
		RED.nodes.createNode(this, config);
		this.wwsApplications = RED.nodes.getNode(config.wwsApplications);
		console.log("In wwsReceive");
		this.appId = this.wwsApplications.appId;
		this.appSecret = this.wwsApplications.appSecret;
		this.jwtToken = this.wwsApplications.accessToken;
		this.callbackUrl = config.callbackUrl;
		this.callbackPort = config.callbackPort;
		this.requireHttps = config.requireHttps;
		this.whId = config.whId;
		this.whSecret = config.whSecret;
		var node = this;
		console.log("config.whSecret:"+node.whSecret);

		node.app = express();
		node.app.use(rawBody);

		// GET Method for testing purpose
		node.app.get(node.callbackUrl, function handleGet(req, res){
		    console.log('GET /')
		    //var html = '<html><body><form method="post" action="https://vfea.i234.me:8443/wws/wh/callback">Name: <input type="text" name="name" /><input type="submit" value="Submit" /></form></body>';
		    //var html = fs.readFileSync('index.html');
		    var html;
		    if (node.requireHttps) {
		    	html = '<html><body>Server running on : https://'+req.headers.host+node.callbackUrl+':'+node.callbackPort+'</form></body>';
		    } else {
		    	html = '<html><body>Server running on : http://'+req.headers.host+node.callbackUrl+':'+node.callbackPort+'</form></body>';		    	
		    }
		    res.writeHead(200, {'Content-Type': 'text/html'});
		    res.end(html);
		});

		// POST Method to handle authorization and callback from Watson Work Services
		node.app.post(node.callbackUrl, function handlePost(req, res){
			console.log("In Callback");
			console.log("Req.header:"+req.headers);
			console.log("Req.rawBody:"+req.rawBody);
			console.log("whSecret:"+node.whSecret);
			console.log("req.get('X-OUTBOUND-TOKEN'):"+req.get('X-OUTBOUND-TOKEN'));
			
			if (!verifySender(req.headers, req.rawBody, node.whSecret, req.get('X-OUTBOUND-TOKEN'))) {
				console.log("ERROR: Cannot verify caller! -------------");
			    console.log(req.rawBody.toString());
			    res.status(200).end();
			    return;
			}
			var body = JSON.parse(req.rawBody.toString());
			var eventType = body.type;
			if (eventType === "verification") {
			    handleVerificationRequest(res, body.challenge, node.whSecret);
			    console.log("INFO: Verification request processed");
			    return;
			}
            
			// Acknowledge we received and processed notification to avoid getting sent the same event again
			res.status(200).end();
			if (body.userId === node.appId) {
				console.log("INFO: Skipping our own message Body: " + JSON.stringify(body));
			    return;
			}
			// passing the message to next Node
			var msg = { payload:body };
			node.send(msg);  
		});
		
		startServer(node, function (err, server){
			if (err) {
				console.log("Unable to start the server on : "+node.urlCallback);
			} else {
				console.log("Server is listening : "+server);
				node.server = server;
			}
		});
		  
	    this.on("close",function() {
	    	console.log("On Close : Stopping the server");
	        var node = this;
	        console.log("RequireHttps:"+node.requireHttps);
	        var routes = node.app._router.stack;
	        routes.forEach(removeMiddlewares);
	        function removeMiddlewares(route, i, routes) {
	            switch (route.handle.name) {
	                case 'handlePost':
	                    routes.splice(i, 1);
	                case 'handleGet':
	                    routes.splice(i, 1);
	            }
	            if (route.route)
	                route.route.stack.forEach(removeMiddlewares);
	        }
	    	if (node.requireHttps) {
	    		node.server.close();
	    	} else {
	    		node.server.close();
	    	}
	     });
	}
	
	RED.nodes.registerType("wwsReceive", wwsReceive);
	
	
	function startServer(node, callback) {	
		var server;
		if (node.requireHttps) {
			try {
			console.log("Starting callback (https) : "+ node.callbackUrl+':'+node.callbackPort);
			const privateKey  = fs.readFileSync('node_modules/node-red-contrib-wwsNodes/ssl/privkey.pem', 'utf8');
			const certificate = fs.readFileSync('node_modules/node-red-contrib-wwsNodes/ssl/cert.pem', 'utf8');
			const credentials = {key: privateKey, cert: certificate, rejectUnauthorized: false };
			node.httpsServer = https.createServer(credentials, node.app);
	    	server = node.httpsServer.listen(node.callbackPort);
			callback(null, server);

			} catch (e) {
				console.log("Unable to start HTTPS server : "+ e);
				callback(e);
			}
		} else {
			console.log("Starting callback (http) : "+ node.callbackUrl+':'+node.callbackPort);
			node.httpServer = http.createServer(node.app);
	    	server = node.httpServer.listen(node.callbackPort);
			callback(null, server);
		}
	}
	
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
	
	function verifySender(headers, rawbody, whSecret, headerToken) {
	    var expectedToken = crypto
	        .createHmac("sha256", whSecret)
	        .update(rawbody)
	        .digest("hex");

	    if (expectedToken === headerToken) {
	        return Boolean(true);
	    } else {
	        return Boolean(false);
	    }
	}

	function handleVerificationRequest(response, challenge, whSecret) {
	    var responseBodyObject = {
	        "response": challenge
	    };
	    var responseBodyString = JSON.stringify(responseBodyObject);

	    var responseToken = crypto
	        .createHmac("sha256", whSecret)
	        .update(responseBodyString)
	        .digest("hex");

	    response.writeHead(200, {
	        "Content-Type": "application/json; charset=utf-8",
	        "X-OUTBOUND-TOKEN": responseToken
	    });

	    response.end(responseBodyString);
	}
	
	function rawBody(req, res, next) {
	    var buffers = [];
	    req.on("data", function(chunk) {
	        buffers.push(chunk);
	    });
	    req.on("end", function() {
	        req.rawBody = Buffer.concat(buffers);
	        next();
	    });
	}
};
 /*   
 // Verify Watson Work request signature
    export const verify = (wsecret) => (req, res, buf, encoding) => {
      if(req.get('X-OUTBOUND-TOKEN') !==
        crypto.createHmac('sha256', wsecret).update(buf).digest('hex')) {
        log('Invalid request signature');
        const err = new Error('Invalid request signature');
        err.status = 401;
        throw err;
      }
    };

    // Handle Watson Work Webhook challenge requests
    export const challenge = (wsecret) => (req, res, next) => {
      if(req.body.type === 'verification') {
        log('Got Webhook verification challenge %o', req.body);
        const body = JSON.stringify({
          response: req.body.challenge
        });
        res.set('X-OUTBOUND-TOKEN',
          createHmac('sha256', wsecret).update(body).digest('hex'));
        res.type('json').send(body);
        return;
      }
      next();
    };

    // Create Express Web app
    export const webapp = (appId, secret, wsecret, cb) => {
      // Authenticate the app and get an OAuth token
      oauth.run(appId, secret, (err, token) => {
        if(err) {
          cb(err);
          return;
        }

        // Return the Express Web app
        cb(null, express()

          // Configure Express route for the app Webhook
          .post('/echo',

            // Verify Watson Work request signature and parse request body
            bparser.json({
            
            */
 //             type: '*/*',
/*              verify: verify(wsecret)
            }),

            // Handle Watson Work Webhook challenge requests
            challenge(wsecret),

            // Handle Watson Work messages
            echo(appId, token)));
      });
    };
    */