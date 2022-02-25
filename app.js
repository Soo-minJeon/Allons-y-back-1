// Express 기본 모듈 불러오기
var express = require("express");
var http = require("http");
var path = require("path");

// Express의 미들웨어 불러오기
var bodyParser = require("body-parser");
var static = require("serve-static");
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

//===== mongoose 모듈 사용 =====//
var mongoose = require("mongoose");

var app = express();

app.set('port', process.env.PORT || 3000);
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

//===== 데이터베이스 연결 =====//
// 데이터베이스 객체를 위한 변수 선언
var database;
// 데이터베이스 스키마 객체를 위한 변수 선언
var UserSchema;
// 데이터베이스 모델 객체를 위한 변수 선언
var UserModel;

//데이터베이스에 연결
function connectDB() {
  // 데이터베이스 연결 정보
  var databaseUrl = "mongodb://localhost:27017/local";

  // 데이터베이스 연결
  console.log("데이터베이스 연결을 시도합니다.");
  // 몽구스 초기 설정
  mongoose.Promise = global.Promise; // mongoose의 Promise 객체는 global의 Promise 객체 사용하도록 함
  mongoose.connect(databaseUrl); // db연결 시 connect 호출, 동시에 db 연결 정보를 파라미터로 넘김
  database = mongoose.connection; // db 연결 여부를 mongoose 객체에 들어있는 connection 객체로 확인

  database.on("error", console.error.bind(console, "mongoose connection error."));

  database.on("open", () => {
    console.log("데이터베이스에 연결되었습니다. : " + databaseUrl);

    // 스키마 정의 - 몽구스는 각각 다른 스키마를 다루기 가능 (관계db와 차이점)
    // 스키마 정의 (속성: type, required, unique)
    UserSchema = mongoose.Schema({
      id: {type:String, required:true, unique:true, 'default':''}, // 아이디
      password: {type:String,required:true}, 'default':'', // 비번
      salt:{type:String,required:true},
      name:{type:String, required:'hashed','default':''}, // 닉네임
      genres:{type:String, required:true}, // 선호 장르
      result:{type:Boolean, required:true}, // 감상결과 여부
      created_at:{type:Date, index:{unique:false},'default':Date.now} // 가입일
    });
    console.log('UserSchema 정의함');

    UserSchema
      .virtual('password')
      .set(function(password){
          this.salt = makeSalt();
          this.hashed_password = this.encryptPassword(password);
          console.log('virtual password 저장됨 : ' + this.hashed_password);
    });

    // 필수 속성에 대한 유효성 확인 (길이 값 체크)
    UserSchema.path('id').validate(function(id) {
      return id.length;
    },'id 칼럼의 값이 없습니다.');

    UserSchema.path('name').validate(function(name) {
      return name.length;
    }, 'name 칼럼의 값이 없습니다.');

    // 스키마에 static 메소드 추가, static 메소드를 사용하여 스키마에 메소드를 추가한다. - 2개의 메소드 이용할 수 있게 됨. findById, findAll
    UserSchema.static('findById', function(id, callback) { // findById 함수 추가해서 모델객체에서 호출할 수 있도록함
      return this.find({id:id}, callback);
    }); 

    UserSchema.static('findAll', function(callback) {
      return this.find({}, callback);
    });

    UserSchema.method('encryptPassword', function(plainText, inSalt) {
      if(inSalt) {
          return crypto.createHmac('sha1', inSalt).update(plainText).digest('hex');
      }  else {
          return crypto.createHmac('sha1', this.salt).update(plainText).digest('hex');
      }
    });

    // 비밀번호 비교
    UserSchema.method('authenticate', function(plainText, inSalt, hashed_password) {
      if (inSalt) {
          console.log('authenticate 호출됨');
          return this.encryptPassword(plainText, inSalt) === hashed_password;
      } else {
          console.log('authenticate 호출됨');
          return this.encryptPassword(plainText) === this.hashed_password;
      }
    }); 

    console.log('UserSchema 정의함');

     // UserModel 모델 정의
     UserModel = mongoose.model("users", UserSchema); // users2 콜렉션
     console.log('UserModel 정의함');
  });

  // 연결 끊어졌을 때 5초 후 재연결
  database.on("disconnected", function () {
    console.log("연결이 끊어졌습니다. 5초 후 재연결합니다.");
    setInterval(connectDB, 5000);
  });
}

var router = express.Router();

// 회원가입, 클라이언트에서 보내온 데이터를 이용해 데이터베이스에 추가
router.route('/process/signup').post(function(req, res) {
  console.log('/process/signup 라우팅 함수 호출됨.');

  var paramId = req.body.id || req.query.id;
  var paramPassword = req.body.password || req.query.password;
  var paramName = req.body.name || req.query.name;

  console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword + ', ' + paramName);

  // 데이터 베이스 객체가 초기화된 경우, signup 함수 호출하여 사용자 추가
  if(database) {
    signUp(database, paramId, paramPassword, paramName, function(err, result) {
      if(err) {
          console.log('에러 발생.');
          res.status(400).send();
      }
     // 결과 객체 확인하여 추가된 데이터 있으면 성공 응답 전송
      if(result) {
        console.dir(result);
        res.status(200).send();

      } else { // 결과 객체가 없으면 실패 응답 전송
        console.log('에러 발생');
        res.status(400).send();
      }
    });
  } 
  else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
    console.log('에러 발생');
    res.status(400).send();
  }
});

// 로그인
router.route('/process/login').post(function(req, res){
  console.log('/process/login 라우팅 함수 호출됨'); 

  var paramId = req.body.id || req.query.id;
  var paramPassword = req.body.password || req.query.password;
  console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword);
  
  if(database) {
      authUser(database, paramId, paramPassword, function(err, docs) {
          if(err) {
              console.log('에러 발생');
              res.status(404).send();
          }

          if (docs) {
              console.dir(docs);

              var username = docs[0].name;
              res.status(200).send(username);

          } else {
              console.log('에러 발생');
              res.status(400).send();
          }
          
      });
  } else {
      res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
      res.write('<h1>데이터 베이스 연결 실패</h1>');
      res.end();
  }
});

var authUser = function(db, id, password, callback) {
  console.log('authUser 호출됨' + id + ', ' + password);

  // 아이디를 사용해 검색
  UserModel.findById(id, function(err, results){
      if (err) {
          callback(err, null);
          return;
      }

      console.log('아이디 %s로 검색됨',id);
      console.dir(results);

      if (results.length > 0) {
          console.log('아이디와 일치하는 사용자 찾음');

          var user = new UserModel({id:id});
          var authenticated = user.authenticate(password, results[0]._doc.salt, results[0]._doc.password);

          // 비밀번호 확인
          if(authenticated) {
              console.log('비밀번호 일치');
              callback(null, results);
          } else {
              console.log('비밀번호 일치하지 않음');
              callback(null, null);
          }
      } else {
          console.log('아이디와 일치하는 사용자를 찾지 못함');
          callback(null, null);
      }

  });

  // 아이디와 비밀번호를 사용해 검색, UserModel의 find() 사용
  UserModel.find({"id" : id, "password" : password}, function(err, results) {
    if(err) {
      callback(err, null);
      return;
    }

    console.log('아이디[%s], 비밀번호[%s]로 사용자 검색 결과', id, password);
    console.dir(results);

    if(results.length > 0) {
      console.log('일치하는 사용자 찾음',id,password);
      callback(null, results); // callback 함수를 사용해 docs 객체 전달
    }
    else {
      console.log('일치하는 사용자를 찾지 못함');
      callback(null,null);
    }    
  });
};

// 사용자를 추가하는 함수
var signUp = function(db, id, password, name, callback) { // callback 함수는 함수를 호출하는 쪽에 결과 객체를 보내기 위해 쓰임
  console.log('signUp 호출됨' + id + ', ' + password + ', ' + name);
  
  var user = new UserModel({'id':id, 'password':password,'name':name});

  // 아이디를 사용해 검색
  UserModel.findById(id, function(err, results){
    if (err) {
      console.log('회원가입 중 에러 발생');
      return;
    }

    if(results.length > 0) {
      console.log('이미 가입된 아이디입니다.');   
    } else {
      // save()로 저장
      user.save(function(err) {
        if(err) {
          callback(err, null);
          return;
        }
        console.log('사용자 데이터 추가함');
        callback(null, user);
      });
    }
  }
)};

const server = http.createServer(app).listen(app.get("port"), function () {
  console.log("서버 시작됨");
  connectDB();
});