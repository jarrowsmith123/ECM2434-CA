# Security framework

## What is it ?

The main purpose of security framework is to **generate an security middleware function** which can be apply on express and have a way to store user informations on **req.user**

In order to generating the function, security framework (SF later) deals with 2 elements:
  
  - **Method**: an Method is an Promise which will be call and depending result will block express execution or not. When Promise is successful, the result of this promise is merge on **req.user**.
  - **Rule**: the purpose of Rule is to make an collection of method and define how to combine them. Rule are very important because you need to have at least one rule to generate the security middleware function.

For each Rule you can define the execution process of methods:

 - **and** each define method will be fulfilled (successful) to continue express execution. We execute method one after the other, and allow to have method depending off previous method execution.
 - **or** the first successful method will continue express execution and others methods are ignored. We execute method one after the other too. 

Security framework (SF later) expose 3 default methods:
 
  - **oauth** it is an http proxy to reach existing oauth server. 
  - **http basic** configure an user / pass to be verified in http basic authentication.
  - **an passthrougth middleware**

and expose 2 rules

  - **guest** which use an passthrougth Promise
  - **user** which use **oauth** or **http basic** promise with "**or**" process execution
  
  
To be simple, you config


## How to use

    SF have a lot of unit test if you don't find your response here.


### Use default methods

#### oauth

In order to use oauth method, you need to configure it.  

##### minimal use 

You need to configure an endpoint.
Response from endpoint will be store in **req.user** if your endpoint return an 200 OK Http code.

Your endpoint will be hit with the access token found in request. We add the access token in the headers authorization bearer.

Default we search in header authorization bearer or in the *access_token* GET parameters

    var security = SecurityFramework({
        methods: {
        	oauth: {
        		config: {
        			endpoint: "http://localhost:3000/me"        		}        	}        }
        rules: {
            me: {
                methods: ['oauth']
            }
        }
    });
        
    security.validate();
    var middleware = security.getSecurityMiddleware("me");

##### full use 

You can override the way to extract access token.

    var security = SecurityFramework({
        methods: {
        	oauth: {
        		config: {
        			endpoint: "http://localhost:3000/me",
        			accessTokenExtractor: function(config, req, res) {
                                return req.query.at;
                         }        		}        	}        }
        rules: {
            me: {
                methods: ['oauth']
            }
        }
    });
        
    security.validate();
    var middleware = security.getSecurityMiddleware("me");


#### http basic

Will be valid if user and password are provided.

    var security = SecurityFramework({
        methods: {
            http: {
                config: {
                    user: "Aladdin",
                    password: "open sesame"
                }
            }
        },
        rules: {
            me: {
                methods: ['http']
            }
        }
    });
        
    security.validate();
    var middleware = security.getSecurityMiddleware("me"); 


### Add global custom method

The key in methods configuration is used. If you use same name as defaults method an merge will be done.
In case you don't want override but just customize configuration, see **Extends**

    var security = SecurityFramework({
        methods: {
            custom: {
                config: {
                    secretKey: "dontmakeinproduction"                },
                validation: function(config, req, res) {
                    return new Promise(function(resolve, reject) {
                        if(req.query.secret == config.secretKey) {
                            return resolve();
                        }                                
                        return reject();                                
                    });
                }            }
        },
        rules: {
            me: {
                methods: ['custom']
            }
        }
    });
        
    security.validate();
    var middleware = security.getSecurityMiddleware("me"); 


### Add  custom method on Rule

Method can be add in rules too.
Warning: if you specify an method name already used, you will override previous method GLOBALLY and not just for this role.

    var security = SecurityFramework({
        methods: {},
        rules: {
            me: {
                methods: [{
                    custom: {
                        config: {
                            secretKey: "dontmakeinproduction"                        },
                        validation: function(config, req, res) {
                            return new Promise(function(resolve, reject) {
                                if(req.query.secret == config.secretKey) {
                                    return resolve();
                                }                                
                                return reject();                                
                             });
                        }                }]
            }
        }
    });
        
    security.validate();
    var middleware = security.getSecurityMiddleware("me"); 


### Add custom middleware from folders

Or you can load yours custom method by specifying an folder path.

    var security = SecurityFramework({
    	          pathMiddlewares: "/absolute/path/folders",
    	          methods: {},    	          
                rules: {
                    me: {
                        methods: ['guest']
                    }
                }
    });
    
    security.validate();
    var middleware = security.getSecurityMiddleware("me");
    
Each files found in folder will be loaded. File must be like this file

    "use strict";
    var Promise = require('bluebird');

    module.exports = {
        name: 'dummy',   // method name
        config: {               // default config
        },
        middleware: function(config, req, res) {
            return new Promise(function(resolve, reject) {
                resolve({id: "1000"});   // req.user will have an "id" property
            });
        }
    }  


### Extends 

Extends an middleware in when you must have different configuration for same method.  
You can extends in methods or rules.

    var security = SecurityFramework({
                methods: {
                	custom: {
                        extends: 'oauth',
                        config: {
                            accessTokenExtractor: function(config, req, res) {
                                return req.query.at;
                            }
                        }
                    }                },
                rules: {
                    me: {
                        methods: ['custom']
                    }
                }
    });
    
    security.validate();
    var middleware = security.getSecurityMiddleware("me");
    




## Express Samples

### Secure an route


	var express = require('express');
	var Promise = require('bluebird');

	var app = express();
	app.use(express.bodyParser());

	var security = require('security-framework')({
	    methods: {
	        custom: {
	            validation: function(config, req, res) {
	                return new Promise(function(resolve, reject){
	                    if(req.query.admin != undefined) {
	                        return resolve({admin: true})
	                    } else {
	                        reject();
	                    }
	                });
	            }
	        }
	    },
	    rules: {
	        private: {
	            methods: ['custom']
	        }
	    }
	});

	security.validate();
	var middleware = security.getSecurityMiddleware("private");
	app.use(middleware);

	app.get('/', function(req, res) {
	    res.send('Hello World!')
	})

	var server = app.listen(4500, function() {

	    var host = server.address().address
	    var port = server.address().port

	    console.log('Example app listening at http://%s:%s', host, port)

	})


    

    

    

