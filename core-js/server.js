"use strict";
const express = require('express');
const passport = require('passport');
const xsenv = require('@sap/xsenv');
const hdbext = require("@sap/hdbext");

const JWTStrategy = require('@sap/xssec').JWTStrategy;

const app = express();

const services = xsenv.getServices({
	uaa: 'SampleUAA'
});

var hanaOptions = xsenv.getServices({
	hana: {
		tag: "hana"
	}
});

passport.use(new JWTStrategy(services.uaa));

app.use(passport.initialize());

app.use(
	passport.authenticate("JWT", {
		session: false
	}),
	hdbext.middleware(hanaOptions.hana)
);


app.get('/showJWTToken', function(req, res, next) {

	var isAuthorized = req.authInfo.checkScope("$XSAPPNAME.JWTViewer");

	if (isAuthorized) {

		var UserContext = req.authInfo;
		var result = JSON.stringify({
			UserContext: UserContext
		})
		res.type("application/json").status(200).send(result)

	} else {
		res.status(403).send('You do not have rights to view the JWT Token');
	}

});

app.get('/showUserInfo', function(req, res, next) {
	var UserInfo = req.user;
	var result = JSON.stringify({
		UserInfo: UserInfo
	})
	res.type("application/json").status(200).send(result)
});

app.get('/displayOrders', function(req, res, next) {

	req.db.exec('select * from "orders.Sales"', function(err, results) {
		if (err) {
			res.type("text/plain").status(500).send("ERROR: " + err.toString());
			return;
		}
		res.status(200).json(results);
	});

});

app.get('/showSessionContextFromDB', function(req, res, next) {
	var sql = 'select * from M_SESSION_CONTEXT';
	req.db.exec(sql, function(err, results) {
		if (err) {
			res.type("text/plain").status(500).send("ERROR: " + err.toString());
			return;
		}
		res.status(200).json(results);
	});

});

app.get('/showUserAttributesFromDB', function(req, res, next) {
	var sql = 'select SESSION_CONTEXT(' +
		"'XS_COUNTRY'" + ')' +
		' from "DUMMY"';

	req.db.exec(sql, function(err, results) {
		if (err) {
			res.type("text/plain").status(500).send("ERROR: " + err.toString());
			return;
		}
		res.status(200).json(results);
	});

});

app.get('/showUserAppUserFromDB', function(req, res, next) {
	var sql = 'select SESSION_CONTEXT(' +
		"'APPLICATIONUSER'" + ')' +
		' from "DUMMY"';

	req.db.exec(sql, function(err, results) {
		if (err) {
			res.type("text/plain").status(500).send("ERROR: " + err.toString());
			return;
		}
		res.status(200).json(results);
	});

});

app.get('/checkAuth', function(req, res, next) {
	var isAuthorized = req.authInfo.checkScope("$XSAPPNAME.Edit");

	if (isAuthorized) {
		res.status(200).json('Okay');
	} else {
		res.status(403).send('You do not have rights to create an Order');
	}
});

app.get('/showUserattribute', function(req, res, next) {
	res.status(200).json(req.authInfo.userAttributes.Country[0]);

});

app.post('/createOrder', function(req, res, next) {

	var isAuthorized = req.authInfo.checkScope("$XSAPPNAME.Edit");

	if (isAuthorized) {

		var country = req.authInfo.userAttributes.Country[0];
		var amount = Math.floor((Math.random() * 100) + 1);
		var UserInfo = req.user;
		var sql = 'INSERT INTO "orders.Sales" VALUES( ' +
			amount + ',' +
			"'" + country + "' ," +
			"'" + UserInfo.id + "'" + ")";

		req.db.prepare(sql, function(err, statement) {
			if (err) {
				res.type("text/plain").status(500).send("ERROR: " + err.toString());
				return;
			}
			statement.exec(function(err, results) {
				if (err) {
					res.type("text/plain").status(500).send("ERROR: " + err.toString());
				} else {
					res.status(200).json("SUCCESS");
				}
			});
		});
	} else {
		res.status(403).send('You do not have rights to create an Order');
	}
});

const port = process.env.PORT || 3000;
app.listen(port, function() {
	console.log('myapp listening on port ' + port);
});