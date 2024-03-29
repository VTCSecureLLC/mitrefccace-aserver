/**
* Define the different REST service routes in this file.
*
* @param (type) app Instance of express
* @param (type) connection Retrieves DB from the MySQL server
* @returns (undefined) Not used
*/

var appRouter = function(app,connection) {

  /**
* @api {get} /AgentVerify Verify an agent by username and password.
* @apiName AgentVerify
* @apiGroup AgentVerify
* @apiVersion 1.0.0
*
* @apiParam {String} username   username for the agent.
* @apiParam {String} password   password for the agent.
*
* @apiSuccessExample Success-Response
*     HTTP/1.1 200 OK
*    {
*      "message":"success",
*      "data":[{
*             agent_id: 0,
*             username: "CSRAgent0",
*             first_name: "John",
*             last_name: "Smith",
*             phone: "1112223333",
*             role:"Agent",
*             email:"jsmith@email.xyz",
*             organization:"call center xyz",
*             is_approved: 1,
*             is_active: 1,
*             extension: 1234,
*             extension_secret: "ABC123",
*             queue_name: "Queue1234",
*             queue_name: null
*            }]
*    }
* @apiErrorExample 400 Error-Response
*     HTTP/1.1 400 BadRequest Bad Request Error
*     {
*        'message': 'missing username'
*     }
* @apiErrorExample 400 Error-Response
*     HTTP/1.1 400 BadRequest Bad Request Error
*     {
*        'message': 'missing password'
*     }
* @apiErrorExample 404 Error-Response
*     HTTP/1.1 404 Not Found
*     {
*        'message': 'Login failed'
*     }
* @apiErrorExample 500 Error-Response
*     HTTP/1.1 500 Internal Server Error
*     {
*        'message': 'mysql error'
*     }
* @apiErrorExample 501 Error-Response
*     HTTP/1.1 501 Not implemented
*     {
*        'message': 'records returned is not 1'
*     }
*/

    app.get('/agentverify', function(req, res) {
        if (!req.query.username) {
			return res.status(400).send({'message': 'missing username'});
        }
        else if (!req.query.password) {
			return res.status(400).send({'message': 'missing password'});
        }
        else {
            //Query DB for agent info
            connection.query('SELECT ad.agent_id, ad.username, ad.first_name, ad.last_name, ad.role, ad.phone, ad.email, ad.organization, ad.is_approved, ad.is_active, ae.extension, ae.extension_secret, aq.queue_name, aq2.queue_name AS queue2_name, oc.channel FROM agent_data AS ad LEFT JOIN asterisk_extensions AS ae ON ad.agent_id = ae.id LEFT JOIN asterisk_queues AS aq ON aq.id = ad.queue_id LEFT JOIN asterisk_queues AS aq2 ON aq2.id = ad.queue2_id LEFT JOIN outgoing_channels AS oc ON oc.id = ae.id WHERE ad.username = ? AND BINARY ad.password = ?',[req.query.username , req.query.password], function(err, rows, fields) {
                if (err) {
                    console.log(err);
                    return res.status(500).send({'message': 'mysql error'});
                }
                else if (rows.length === 1) {
                    //success
                    json = JSON.stringify(rows);
                    res.status(200).send({'message': 'success', 'data':rows});
                }
                else if (rows.length === 0) {
                    return res.status(404).send({'message': 'Login failed'});
                } else {
                    console.log('error - records returned is ' + rows.length);
                    return res.status(501).send({'message': 'records returned is not 1'});
                }
            });
        }
  });

  /**
* @api {get} /GetAllAgentRecs Gets a dump of all Agent Records in the database.
* @apiName Get All Agent Recs
* @apiGroup GetAllAgentRecs
* @apiVersion 1.0.0
*
* @apiSuccessExample 200 Success-Response
*     HTTP/1.1 200 OK
*    {
*      "message":"success",
*      "data":[{
*             agent_id: 0,
*             username: "CSRAgent0",
*             first_name: "John",
*             last_name: "Smith",
*             phone: "1112223333",
*             role:"Agent",
*             email:"jsmith@email.xyz",
*             organization:"call center xyz",
*             is_approved: 1,
*             is_active: 1,
*             extension: 1234,
*             extension_secret: "ABC123",
*             queue_name: "Queue1234",
*             queue_name: null
*            },{
*             ...
*            }]
*    }
*
* @apiSuccessExample 204 Success-Response
*     HTTP/1.1 204 No Content
*    {
*      "message":"no agent records"
*    }
* @apiErrorExample 500 Error-Response
*     HTTP/1.1 500 Internal Server Error
*     {
*        'message': 'mysql error'
*     }
*/


	app.get('/getallagentrecs', function(req, res) {
        //Query DB for all agent records
        connection.query('SELECT ad.agent_id, ad.username, ad.first_name, ad.last_name, ad.role, ad.phone, ad.email, ad.organization, ad.is_approved, ad.is_active, ae.extension, ae.extension_secret, aq.queue_name, aq2.queue_name AS queue2_name, oc.channel FROM agent_data AS ad LEFT JOIN asterisk_extensions AS ae ON ad.agent_id = ae.id LEFT JOIN asterisk_queues AS aq ON aq.id = ad.queue_id LEFT JOIN asterisk_queues AS aq2 ON aq2.id = ad.queue2_id LEFT JOIN outgoing_channels AS oc ON oc.id = ae.id ORDER BY agent_id', function(err, rows, fields) {
            if (err) {
                console.log(err);
            return res.status(500).send({'message': 'mysql error'});
            }
            else if (rows.length > 0) {
                //success
                json = JSON.stringify(rows);
                res.status(200).send({'message': 'success', 'data':rows});
            }
            else if (rows.length === 0) {
                return res.status(204).send({'message': 'no agent records'});
            }
        });
    });

    /**
    * @api {get} /GetScript Gets a specify CSR Agent Script by queue name from the database.
    * @apiName GetScript
    * @apiGroup GetScript
    * @apiVersion 1.0.0
    *
    * @apiParam {String} queue_name   Queue name for associated with a script.
    *
    * @apiSuccessExample 200 Success-Response
    *     HTTP/1.1 200 OK
    *    {
    *      "message":"success",
    *      "data":[{
    *               "id": 0,
    *               "queue_name": "Complaints",
    *               "text": "The script text the agent will say to the caller.....",
    *               "date": '2016-04-01'
    *            }]
    *    }
    *
    * @apiErrorExample 400 Error-Response
    *     HTTP/1.1 400 BadRequest Bad Request Error
    *     {
    *        'message': 'missing queue_name field'
    *     }
    * @apiErrorExample 404 Not-Found-Response
    *     HTTP/1.1 404 Not Found
    *    {
    *      "message":"script not found"
    *    }
    * @apiErrorExample 500 Error-Response
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *        'message': 'mysql error'
    *     }
    * @apiErrorExample 501 Error-Response
    *     HTTP/1.1 501 Not implemented
    *     {
    *        'message': 'records returned is not 1'
    *     }
    */

	app.get('/getscript', function(req, res) {
        if (!req.query.queue_name) {
            return res.status(400).send({'message': 'missing queue_name field'});
        }
        else {
            //Query DB for script info
            connection.query('SELECT s.id, aq.queue_name, s.text, s.date FROM scripts AS s, asterisk_queues AS aq WHERE s.queue_id = aq.id AND aq.queue_name = ?',[req.query.queue_name], function(err, rows, fields) {
                if (err) {
                    console.log(err);
                    return res.status(500).send({'message': 'mysql error'});
                }
                else if (rows.length === 1) {
                    //success
                    json = JSON.stringify(rows);
                    res.status(200).send({'message': 'success', 'data':rows});
                }
                else if (rows.length === 0) {
                    return res.status(404).send({'message': 'script not found'});
                }
                else {
                    console.log('error - records returned is ' + rows.length);
                    return res.status(501).send({'message': 'records returned is not 1'});
                }
            });
        }
    });

  /**
  * @api {get} /GetAllScripts Gets a dump of all CSR Agent Scripts from the database.
  * @apiName GetAllScripts
  * @apiGroup GetAllScripts
  * @apiVersion 1.0.0
  *
  * @apiSuccessExample 200 Success-Response
  *     HTTP/1.1 200 OK
  *    {
  *      "message":"success",
  *      "data":[{
  *               "id": 0,
  *               "queue_name": "Complaints",
  *               "text": "The script text the agent will say to the caller.....",
  *               "date": '2016-04-01'
  *            },{
  *               "id": 1,
  *               "queue_name": "Other",
  *               "text": "The script text the agent will say to the caller.....",
  *               "date": '2016-04-15'
  *           }]
  *    }
  *
  * @apiErrorExample 404 Not-Found-Response
  *     HTTP/1.1 404 Not Found
  *    {
  *      "message":"script not found"
  *    }
  * @apiErrorExample 500 Error-Response
  *     HTTP/1.1 500 Internal Server Error
  *     {
  *        'message': 'mysql error'
  *     }
  */

	app.get('/getallscripts', function(req, res) {

        //Query DB for script info
        connection.query('SELECT s.id, aq.queue_name, s.text, s.date FROM scripts AS s, asterisk_queues AS aq WHERE s.queue_id = aq.id', function(err, rows, fields) {
            if (err) {
                console.log(err);
                return res.status(500).send({'message': 'mysql error'});
            }
            else if (rows.length >= 1) {
                //success
                json = JSON.stringify(rows);
                res.status(200).send({'message': 'success', 'data':rows});
            }
            else if (rows.length === 0) {
                return res.status(404).send({'message': 'script not found'});
            }
		});
	});

	/*
	* This is just for testing the connection, no APIdoc info required.
	* GET request; e.g. http://localhost:8085/
	*/

	app.get('/', function(req, res) {
		return res.status(200).send({'message': 'Welcome to the agent portal.'});
	});

	/**
  * @api {post} /UpdateProfile Updates an Agent's information in the database.
  * @apiName Updates an Agent Record
  * @apiGroup UpdateProfile
  * @apiVersion 1.0.0
  *
  * @apiParam {String} agent_id CSR Agent ID Number from the Database
  *	@apiParam {String} first_name First name of the CSR Agent user
  *	@apiParam {String} last_name Last name of the CSR Agent user
  *	@apiParam {String} role Role of the CSR Agent user
  *	@apiParam {String} phone Phone number for the CSR Agent user
  *	@apiParam {String} email Email address for the CSR Agent user
  *	@apiParam {String} orgainization ORganization for the CSR Agent user
  *	@apiParam {Boolean} is_approved A boolean value.
  *	@apiParam {Boolean} is_active A boolean value.
  *
  * @apiSuccessExample Success-Response
  *     HTTP/1.1 200 OK
  *    {
  *      "message":"Success!"
  *    }
  * @apiErrorExample 400 Error-Response
  *     HTTP/1.1 400 BAD Request
  *     {
  *        'message': 'Missing required field(s)'
  *     }
  *
  * @apiErrorExample 500 Error-Response
  *     HTTP/1.1 500 Internal Server Error
  *     {
  *        'message': 'MySQL error'
  *     }
  */


	app.post('/updateProfile',function(req, res) {
		console.log('Got a POST request at /updateProfile');
		var agent_id = req.body.agent_id;
		var first_name = req.body.first_name;
		var last_name = req.body.last_name;
		var role = req.body.role;
		var phone = req.body.phone;
		var email = req.body.email;
		var organization = req.body.organization;
		var is_approved = Boolean(req.body.is_approved);
		var is_active = Boolean(req.body.is_active);
		if (!agent_id || !first_name || !last_name || !role || !phone || !email || !organization || isNaN(is_approved) || isNaN(is_active)){
			return res.status(400).send({'message': 'Missing required field(s)'});
		}
		else {
			var query = 'UPDATE agent_data SET first_name = ?'
			+ ', last_name = ?'
			+ ', role = ?'
			+ ', phone = ?'
			+ ', email = ?'
			+ ', organization = ?'
			+ ', is_approved = ?'
			+  ', is_active = ?'
			+ ' WHERE agent_id = ?';
			// Query for all records sorted by the id
			connection.query(query, [first_name, last_name, role, phone, email, organization, is_approved, is_active, agent_id], function(err, results) {
			if (err) {
				console.log(err);
				return res.status(500).send({'message': 'MySQL error'});
			}
			else if (results.affectedRows > 0){
				return res.status(200).send({'message': 'Success!'});
			} else {
				return res.status(200).send({'message': 'Failed!'});
			}
			});
		}

	});

};

module.exports = appRouter;
