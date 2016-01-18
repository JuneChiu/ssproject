const isPrd = process.env.NODE_ENV === 'production'

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const Firebase = require('firebase');

const app = express();

// 设置数据库连接地址
app.db = new Firebase("https://flickering-torch-8358.firebaseio.com/");

app.set('view engine', 'ejs')
	.use(bodyParser.urlencoded({ extended: false }))
	.use(bodyParser.json())
	.use(express.static('resouce'));


app.get('/', function(req, res) {
	res.render('index');
});

// 读入服务
const serviceFolderPath = __dirname + '/service/';

app.service = {};
fs.readdirSync(serviceFolderPath).forEach(function(serviceName){
	const service = require(serviceFolderPath + serviceName);
	app.service[serviceName.replace(/\.[^/.]+$/, '')] = service(app);
});


// 读入控制器
const controllersFolderPath = __dirname + '/api/';

fs.readdirSync(controllersFolderPath).forEach(function(controllerName){
	const controller = require(controllersFolderPath + controllerName);
	controller(app);
});

// 启动程序
app.listen(isPrd ? 80: 3000, isPrd ? 'ss.junechiu.com' : null, function () {
	console.log('Example app listening on port 3000!');
});
