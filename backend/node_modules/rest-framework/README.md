# Rest-framework

## What is it ?

**Base components to build REST API**

Rest-Framework (RT later) is a toolbox to make an robust REST API faster.  

At origin, we have a lots of node server which expose REST API and we will share some code / reflex between each projects.

Each components in toolbox can be used one at time.
When one component is too complex, we split in another node module. It's important to keep in mind this sentence. That why rest-framework has dependency to other components like security-framework, validation-framework.

> We use bluebird as Promise engine but it's work with all Promise engine.

## How to use ?



### Collection

Collection is an component to format collection of item.  
It's designed to have an data source and will handle pagination according to user request.


#### Pagination common

Pagination work with 2 query parameters:
  
  - page
  - limit  : default is 10 when parameters is missing.
 
#### Pagination timestamble

Pagination work with 3 extra query parameters

  - since
  - before
  - until 

#### Return 

Route

    var RF = require('rest-framework');
    
    function(req, res, next) {
	    var collection = RF.Collection();

	    var dataFunction = function(pagination) {
	        return new Promise(function(resolve, reject) {
	            var items = [];
	            for (var i = 1; i < 50; i++) {
	                items.push({
	                    id: i,
	                    name: "item " + i
	                })
	            }
	        	
	             return resolve(items);	        })
	    };
	    var countFunction = function() {
	        return 30;
	    }

	    return returnCollection(req, res, dataFunction, countFunction);
    }
    
If user request this route with limit query parameter at 2, collection will return to client an json like

    {
    	count: 30,
    	items: [{
        		id: 1,
        		name: "item 1"        	}, {
        		id: 2,
        		name: "item 2"
        	},
        	…
        	],
       links: {
           current: "http://localhost/?page=1&limit=2",
           first: "http://localhost/?page=1&limit=2",
           last: "http://localhost/?page=15&limit=2",
           next: "http://localhost/?page=2&limit=2"
       }    }

Links are generated according to req. Don't worry.


Others methods:

   - returnCollectionTimestamp
   - returnCollectionFirebase

   This 2 methods are very similar because the only difference is in the links generation. 
   Each method need a last parameters to indicate the name of item property which used for generated links. 


### Cors

Cors is an component to expose useful middlewares.

### Error

Error is an important component to create and handle error on application.  

     var RF = require('rest-framework');
     var errorComponent = RF.Error({ debug: false });
	    
#### base errors
	
Error component expose some custom javascript Error like

  - NotFoundError
  - AccessDeniedError
  - ValidationParametersError

If you use this error then the handling error function will create appropriate status code on response.

    // Create default AccessDeniedError
    var error = new errorComponent.AccessDeniedError("", "it's bad no ?")
    // will produce an error.message = "NOT_ALLOWED" and error.details = "its bad no ?"
        
    // Create custom AccessDeniedError
    var error = new errorComponent.AccessDeniedError("HEY_DUDE", "it's bad no ?")
    // will produce an error.message = "HEY_DUDE" and error.details = "its bad no ?"
    

#### handleError(error, req, res, next)

This function will return to client an formatted error message according to type of error.

    {
        statusCode: 403,  // error.statusCode || predefined statusCode if you use core error || 500
        error: 'NOT_ALLOWED', // error.message
        details: "its bad no ?",  // error.details
        date: "Fri Oct 24 2014 15:22:43 GMT+0200 (CEST)"
    }

### Routing

The main module is **Routing**. Designed for handling error, validation and security.

When you use Routing, you need to follow few rules.

   - You must declare Controller before loading route
   - Controller must expose function which follow name convention for handling request.
     - **get**Name**Action**  
   - If you want use validation-framework for an action, you must named your method
     - **get**Name**Validation**

#### Full configuration

App.js

    // load security config (see security-framework for detail)
    var securityConfig = {
        methods: {}
        rules: {
            me: {
                methods: ['oauth']
            }
        }
    };
    
    // load error handler
    var RF = require('rest-framework');
    var errorComponent = RF.Error({ debug: false });
    
    // Create Routing
    var Routing = RF.Routing(app, securityConfig, {
        debug: false,
        pathControllers: '/absolute/path/to/controller'	}, errorComponent);
	
    // Find the file in  /absolute/path/to/controller/user.js
    var UserController = Routing.loadController('user', {});
    
    // create an GET route on "localhost/users" which is behind an security rule named "me" and the name of action are  users" located in user.js file
    Routing.loadRoute('GET', '/users', 'me', 'user/users');
    
> Notice that you don't need to create an security-framework object but only the configuration for it.
> 
> Notice that errorComponent parameter is optional, if you don't want use ours you juste have to put an object which can response to handleError(error, req, res, next)

UserController must be a file like
	
	var RF = require('rest-framework');
	
	module.exports = function(app, config) {
	    return new Controller(app, config);
	}
	
	Controller = function(app, config) {
	    this.config = config;
	    this.app = app;

	    return this;
	}
	
	Controller.prototype.getUsersAction = function(req, res) {
	    var self = this;

	    var collection = RF.Collection();

	    var dataFunction = function(pagination) {
	        return self.app.db.getUsers(pagination);
	    };
	    var countFunction = function() {
	        return self.app.db.getUsersCount();
	    }

	    return collection.returnCollectionFirebase(req, res, dataFunction, countFunction, "id");
	}
	
Action method can return many thing like

  - Promise: 
    - if your promise return an object or string, your data are display with req.json(data)
    - if your promise return an function(req, res) then your function will be call and it's your responsibility to display anything.
    - if your promise return an empty result, then RF will trigger an INTERNAL_ERROR.
  - plain object: direct to req.json
  - function(req, res): it's your responsibility to display anything
  - string: direct to req.json

Anything else will throw an 500 error INTERNAL_ERROR

#### Minimal configuration

You can use routing with only app parameters, but you will use default rest-framework parameters. By default, parameters are writing for ours stack.
	
    var Routing = RF.Routing(app);
	
    // Find the file in  ./controllers/user.js
    var UserController = Routing.loadController('user', {});
    
    // create an GET route on "localhost/users" which is behind an security rule named "user" and the name of action are  users" located in user.js file
    Routing.loadRoute('GET', '/users', 'user', 'user/users');  // security rules 'user' are http basic and oauth

#### Validation

If you want use validation-framework for an action, you must named your method

   - **get**Name**Validation**

Rest-framework will use his dependency to validator-framework and validate each domains on **req** like 

- query
- params 
- body

When validation rules are successfull, RF provide a simple way to get trust parameters.

	Controller.prototype.getUpdateValidation = function(req, res) {
	    return [{
	        rules: {
		      username: {
		          required: { value: true, groups: ["create", "update"] }
		      }
		  },
	        on:    'body',
	        groups: 'update'
	    },{
	        rules: {
	        	id: {
	        		required: true	        	}	        },
	        on:    'params'
	    },{
	        rules: {
	        	gender: {
	        		required: true	        	}	        },
	        on:    'query'
	    }];
	}

    Controller.prototype.getUpdateAction = function(req, res) {
        var self = this;
	    
        var userId = req.validatedValues.params("user_id");
        var username = req.validatedValues.body("username");
        var gender = req.validatedValues.query("gender");
	    
        return {
            username: username,
            id: userId,
            gender: gender        }   
    })

> To know how configure Rule, see validator-framework doc

### Utils

Utils provide some usefull function like

- isPromise
- errorsToString
- generator: ??


