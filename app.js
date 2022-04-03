// Express 기본 모듈 불러오기
var express = require("express");
var http = require("http");
var path = require("path");

// Express의 미들웨어 불러오기
var bodyParser = require("body-parser");
var static = require("serve-static");
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

// 설정정보 모듈
var config = require('./config');
// 데이터베이스 로딩
var database_loader = require('./database/database_loader');

var user = require('./routes/user');

// Mail 모듈
var nodemailer = require("nodemailer");

//===== mongoose 모듈 사용 =====//
var mongoose = require("mongoose");

var app = express();

app.set('port', config.server_port || 3000);

app.use('/public', static(path.join(__dirname,'public')));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressSession({
   secret:'my key',
   resave:true,
   saveUninitialized:true
}));

// body-parser 설정
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 스키마 생성
function createUserSchema(database){
  database.UserSchema = require('./database/UserSchema').createSchema(mongoose);

  // UserModel 모델 정의
  database.UserModel = mongoose.model("UserSchema", UserSchema);
  console.log('user Model 정의를 완료하였습니다.\n');
};
function createWatchSchema(database){
  database.WatchSchema = require('./database/WatchSchema').createSchema(mongoose);

  // WatchModel 모델 정의
  database.WatchModel = mongoose.model("WatchSchema", WatchSchema);
  console.log('watch Model 정의를 완료하였습니다.\n');
}
function createRoomSchema(database){
  database.RoomSchema = require('./database/RoomSchema').createSchema(mongoose);

  // RoomModel 모델 정의
  database.roomModel = mongoose.model("RoomSchema", RoomSchema);
  console.log('room Model 정의를 완료하였습니다.\n');
}
function createLikeSchema(database){
  database.likeSchema = require('./database/likeSchema').createSchema(mongoose);

  // likeModel 모델 정의
  database.likeModel = mongoose.model("likeSchema", likeSchema);
  console.log('like Model 정의를 완료하였습니다.\n');
}

var router = express.Router();

// 회원가입, 클라이언트에서 보내온 데이터를 이용해 데이터베이스에 추가
router.route('/signup').post(user.signup);

// 로그인
router.route('/login').post(user.login);

// 감상목록
router.route('/watchlist').post(user.watchlist);

// 감상결과
router.route('/watchresult').post(user.watchresult);

router.route('/recommend1').post(user.recommend1);

router.route('/recommend2').post(user.recommend2);

// 초대 코드 입장
router.route('/enterRoom').post(user.enterroom);

router.route('/email').post(user.email);

// 리액션공유 방 생성
router.route('/makeRoom').post(user.makeRoom);

// 장면분석
router.route('/sceneAnalyze').post(user.sceneAnalyze);

// 로그아웃
router.route('/logout').post(user.logout);

app.use('/', router);

const server = http.createServer(app).listen(app.get("port"), function () {
  console.log("서버 시작됨");

  database_loader.init(app, config);
});