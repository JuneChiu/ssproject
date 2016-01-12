const fs = require('fs');
const md5 = require('md5');
const shadowsocksSetting = require('./shadowsocks-setting.json');

const Firebase = require("firebase");

const account = {"8389" : md5('june01.qiu@corp.vipshop.com')};

shadowsocksSetting.port_password = Object.assign({}, shadowsocksSetting.port_password, account);

//console.log(shadowsocksSetting);

fs.writeFile('message.txt', JSON.stringify(shadowsocksSetting), function (err) {
	if (err) throw err;
//	console.log('It\'s saved!');
});


// Get a database reference to our posts
var ref = new Firebase("https://flickering-torch-8358.firebaseio.com/");

//ref.set({
//	userList: [{
//		account: 'june.chiu.s@gmail.com',
//		password: md5('june.chiu.s@gmail.com'),
//	}]
//});
var userList = ref.child('userList');
//userList.push({
//	account: 'june.chiu@foxmail.com',
//	password: md5('june.chiu@foxmail.com'),
//})

// Attach an asynchronous callback to read the data at our posts reference
//userList.on("value", function(snapshot) {
//	console.log(snapshot.val());
//}, function (errorObject) {
//	console.log("The read failed: " + errorObject.code);
//});


var express = require('express');

;

var app = express();

app.use(express.static('.'));

app.get('/api/get/user', function (req, res) {
	userList.once("value", function(snapshot) {
		res.send(snapshot.val());
	});
});

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
})

//
//var koa = require('koa');
//var app = koa();
//var serve = require('koa-static');
//var json = require('koa-json');
//
//var router = require('koa-router')();
//app.use(serve('.'));
//
//
//router
//	.get('/api', function *(next) {
//		var that = this
//});
//
//app
//	.use(router.routes())
//	.use(router.allowedMethods());
//
//app.listen(3000);