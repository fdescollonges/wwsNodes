/**
 * Copyright 2013, 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var bodyParser = require("body-parser");
    var cookieParser = require("cookie-parser");
    var getBody = require('raw-body');
    var cors = require('cors');
    var jsonParser = bodyParser.json();
    var urlencParser = bodyParser.urlencoded({extended:true});
    var onHeaders = require('on-headers');
    var typer = require('media-typer');
    var isUtf8 = require('is-utf8');
    var crypto = require('crypto');


    function wwsIn(n) {
        RED.nodes.createNode(this,n);
        if (RED.settings.httpNodeRoot !== false) {

            if (!n.callbackUrl) {
                this.warn(RED._("wwwIn.errors.missing-path"));
                return;
            }
            
    		this.wwsApplications = RED.nodes.getNode(n.wwsApplications);
            this.url = n.callbackUrl;
            this.whSecret = n.whSecret;
            this.appId = this.wwsApplications.appId;
            
            //this.method = n.method;
            //this.swaggerDoc = n.swaggerDoc;

            var node = this;
            //		console.log("[wwsNodes] node.appId : "+node.appId);
            var rawBodyParser = function(req, res, next) {
        		console.log("[wwsNodes] In rawBodyParser - Content-type : "+req.headers['content-type']);
        if (req.skipRawBodyParser) { next(); } // don't parse this if told to skip
        if (req._body) { return next(); }
        req.body = "";
        req._body = true;

        var isText = true;
        var checkUTF = false;
        if (req.headers['content-type']) {
            var parsedType = typer.parse(req.headers['content-type'])
            if (parsedType.type === "text") {
                isText = true;
            } else if (parsedType.subtype === "xml" || parsedType.suffix === "xml") {
                isText = true;
            } else if (parsedType.type !== "application") {
                isText = false;
            } else if (parsedType.subtype !== "octet-stream") {
                checkUTF = true;
            } else {
                // applicatino/octet-stream
                isText = false;
            }
        }

        getBody(req, {
            length: req.headers['content-length'],
            encoding: isText ? "utf8" : null
        }, function (err, buf) {
            if (err) { return next(err); }
            if (!isText && checkUTF && isUtf8(buf)) {
                buf = buf.toString()
            }
            req.body = buf;
            req.rawBody = buf;
            		console.log("[wwsNodes] In RawBodyParser - req.body :"+req.body);
            next();
        });
    }

    var corsSetup = false;
    var corsHandler = function(req,res,next) { next(); }
    /*
 	if (RED.settings.httpNodeCors) {
        corsHandler = cors(RED.settings.httpNodeCors);
        RED.httpNode.options("*",corsHandler);
    }
    */
    
    var verifySender = function (headers, rawbody, whSecret, headerToken) {
		console.log("[wwsNodes] Verify Sender")
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

	var handleVerificationRequest = function(response, challenge, whSecret) {
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
	
	var rawBody = function(req, res, next) {
		//		console.log("[wwsNodes] rawBody");
	    var buffers = [];
	    req.on("data", function(chunk) {
	        buffers.push(chunk);
	    });
	    req.on("end", function() {
	        req.rawBody = Buffer.concat(buffers);
	        next();
	    });
	}

            
            this.errorHandler = function(err,req,res,next) {
                node.warn(err);
                res.sendStatus(500);
            };

            this.callback = function(req,res) {
                var msgid = RED.util.generateId();
                res._msgid = msgid;
    		    console.log('[wwsNodes] Message received : '+JSON.stringify(req.body));
                if (req.method=="GET") {
        		    console.log('[wwsNodes] GET /');
        		    //var html = '<html><body><form method="post" action="https://vfea.i234.me:8443/wws/wh/callback">Name: <input type="text" name="name" /><input type="submit" value="Submit" /></form></body>';
        		    //var html = fs.readFileSync('index.html');
        		    var html;
        		    if (req.secure) {
        		    	html = '<html><body>Server running on : https://'+req.headers.host+req.url+'</form></body>';
        		    } else {
        		    	html = '<html><body>Server running on : http://'+req.headers.host+req.url+'</form></body>';		    	
        		    }
        		    res.writeHead(200, {'Content-Type': 'text/html'});
        		    res.end(html);
                    //node.send({_msgid:msgid,req:req,res:createResponseWrapper(node,res),payload:req.query});
                };
                if (req.method=="POST") {
        		    //console.log('[wwsNodes] POST /');
        			//		console.log("[wwsNodes] In Callback");
        			if (!req.rawBody) { 
        						console.log("[wwsNodes] req.rawBody is null - setting it to JSON.stringify(req.body)");
        				req.rawBody = JSON.stringify(req.body); 
        			}
        					console.log("[wwsNodes] req.body : "+ req.body);
        					console.log("[wwsNodes] req.rawBody : " + req.rawBody);
        			//		console.log("[wwsNodes] Req.header:"+JSON.stringify(req.headers));
        			//		console.log("[wwsNodes] Req.rawBody:"+req.rawBody);
        			//		console.log("[wwsNodes] whSecret:"+node.whSecret);
        					console.log("[wwsNodes] req.get('X-OUTBOUND-TOKEN'):"+req.get('X-OUTBOUND-TOKEN'));
        			
        			if (!verifySender(req.headers, req.rawBody, node.whSecret, req.get('X-OUTBOUND-TOKEN'))) {
        						console.log("[wwsNodes] ERROR: Cannot verify caller! -------------");
        			    console.log("[wwsNodes] "+req.body.toString());
        			    res.status(200).end();
        			    return;
        			} else {
        			    		console.log("[wwsNodes] INFO: verifySender processed");
        			}
        			
        			

        			var body = JSON.parse(req.rawBody.toString());
        			var eventType = body.type;
        			if (eventType === "verification") {
        			    handleVerificationRequest(res, body.challenge, node.whSecret);
        			    		console.log("[wwsNodes] INFO: Verification request processed");
        			    return;
        			}
                    
        			// Acknowledge we received and processed notification to avoid getting sent the same event again
        			res.status(200).end();
        			//		console.log("[wwsNodes] body : " + body);
        					console.log("[wwsNodes] body.userId : " + body.userId);
        					console.log("[wwsNodes] node.appId : " + node.appId);
        			//		console.log("[wwsNodes] this.appId : "+ this.appId);
        			
        			if (body.userId === node.appId) {
        						console.log("[wwsNodes] INFO: Skipping our own message Body: " + JSON.stringify(body));
        			    return;
        			}
        			// passing the message to next Node
        			var msg = { payload:body };
        			node.send(msg);  
                    //node.send({_msgid:msgid,req:req,res:createResponseWrapper(node,res),payload:req.query});
                }
            };

            var httpMiddleware = function(req,res,next) { 		console.log("[wwsNodes] middleware"); next(); }


            var metricsHandler = function(req,res,next) { 		console.log("[wwsNodes] metrics");next(); }
            
            if (this.metric()) {
                metricsHandler = function(req, res, next) {
                    var startAt = process.hrtime();
                    onHeaders(res, function() {
                        if (res._msgid) {
                            var diff = process.hrtime(startAt);
                            var ms = diff[0] * 1e3 + diff[1] * 1e-6;
                            var metricResponseTime = ms.toFixed(3);
                            var metricContentLength = res._headers["content-length"];
                            //assuming that _id has been set for res._metrics in HttpOut node!
                            node.metric("response.time.millis", {_msgid:res._msgid} , metricResponseTime);
                            node.metric("response.content-length.bytes", {_msgid:res._msgid} , metricContentLength);
                        }
                    });
                    next();
                };
            }

            //RED.httpNode.all(this.url,cookieParser(),httpMiddleware,corsHandler,metricsHandler,this.callback,this.errorHandler);
            //RED.httpNode.all(this.url,cookieParser(),httpMiddleware,corsHandler,metricsHandler,jsonParser,urlencParser,rawBody,this.callback,this.errorHandler);
            
            //RED.httpNode.use(rawBody);
    		RED.httpNode.all(this.url, rawBodyParser, this.callback, this.errorHandler);

            this.on("close",function() {
                var node = this;
                RED.httpNode._router.stack.forEach(function(route,i,routes) {
                    if (route.route && route.route.path === node.url) {
                        routes.splice(i,1);
                    }
                    //if (route.route && route.route.path === node.url && route.route.methods["post"]) {
                    //    routes.splice(i,1);
                    //}
                });
            });
        } else {
            this.warn(RED._("httpin.errors.not-created"));
        }
    }
    RED.nodes.registerType("wwsIn",wwsIn);
}
