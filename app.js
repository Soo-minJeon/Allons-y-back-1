// Express 기본 모듈 불러오기
var express = require("express");
var http = require("http");
var path = require("path");

// Express의 미들웨어 불러오기
var bodyParser = require("body-parser");
var static = require("serve-static");
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

// Mail 모듈
var nodemailer = require("nodemailer");

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
var WatchSchema;  // 감상결과/기록 스키마
var RoomSchema;
// 데이터베이스 모델 객체를 위한 변수 선언
var UserModel;
var WatchModel; // 감상결과/기록 모델
var roomModel; // 리액션 공유 방 모델

//데이터베이스에 연결
function connectDB() {
  // 데이터베이스 연결 정보
  var databaseUrl = "mongodb://127.0.0.1:27017/local";

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
    UserSchema = mongoose.Schema({ // 사용자정보
      id: {type:String, required:true, unique:true, 'default':''}, // 아이디
      password: {type:String, required:true}, 'default':'', // 비번
      name:{type:String, required:'hashed','default':''}, // 닉네임
      genres:{type:String, required:false}, // 선호 장르
      result:{type:Boolean, required:false}, // 감상결과 여부
      created_at:{type:Date, index:{unique:false},'default':Date.now} // 가입일
    });

    WatchSchema = mongoose.Schema({ // 감상기록
      userId: {type:String, required:true, 'default':''},// 사용자 아이디
      movieId: {type:String, required:true, unique:true, 'default':''},
      title: {type:String, required:true, 'default':''},
      poster: {type:String, required:true},
      genres: {type:String, required:true},
      emotion: {type:String, required:true},
      highlight: {type:String, required:true}
    });

    RoomSchema = mongoose.Schema({
      roomCode: {type:String, require:true, unique:true,'default':''}
    });

    console.log('Schema 정의를 완료하였습니다.');

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

    // 비밀번호 비교
    UserSchema.static('authenticate', function (password, callback) {
      return this.find({ password: password }, callback);
    });

    // WatchSchema id로 검색
    WatchSchema.static('findById', function(id, callback) { // findById 함수 추가해서 모델객체에서 호출할 수 있도록함
      return this.find({userId:id}, callback);
    });
    // WatchSchema id로 검색
    WatchSchema.static('findByMovieId', function(id, callback) { // findById 함수 추가해서 모델객체에서 호출할 수 있도록함
      return this.find({movieId:id}, callback);
    });

    // roomShema roomcode 로 검색
    RoomSchema.static('findByRoomCode', function(roomcode, callback){ // findByRoomCode 함수 추가
        return this.find({roomCode : roomcode}, callback);
    });

    console.log('Schema 설정을 완료하였습니다.');

     // UserModel 모델 정의
     UserModel = mongoose.model("UserSchema", UserSchema);
     WatchSchema = mongoose.model("WatchSchema", WatchSchema);
     roomModel = mongoose.model("RoomSchema", RoomSchema);
     console.log('Model 정의를 완료하였습니다.');
     console.log('\n\n');

  });

  // 연결 끊어졌을 때 5초 후 재연결
  database.on("disconnected", function () {
    console.log("연결이 끊어졌습니다. 5초 후 재연결합니다.");
    setInterval(connectDB, 5000);
  });
}

var router = express.Router();

// 회원가입, 클라이언트에서 보내온 데이터를 이용해 데이터베이스에 추가
router.route('/signup').post(function(req, res) {
  console.log('/signup 라우팅 함수 호출됨.');

  var paramId = req.body.id || req.query.id;
  var paramPassword = req.body.password || req.query.password;
  var paramName = req.body.name || req.query.name;

  console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword + ', ' + paramName);

  // 데이터 베이스 객체가 초기화된 경우, signup 함수 호출하여 사용자 추가
  if(database) {
    signUp(database, paramId, paramPassword, paramName, function(err, result) {

      if(err) {
          console.log('회원가입 에러 발생...');
          console.dir(err);
          res.status(400).send();
      }
     // 결과 객체 확인하여 추가된 데이터 있으면 성공 응답 전송
      if(result) {
        console.log('회원가입 성공.');
        console.dir(result);
        res.status(200).send();
        console.log('\n\n');

      } else { // 결과 객체가 없으면 실패 응답 전송
        console.log('회원가입 에러 발생...');
        res.status(400).send();
        console.log('\n\n');
      }
    });
  }
  else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
    console.log('회원가입 에러 발생...');
    console.dir(err);
    res.status(400).send();
    console.log('\n\n');
  }
});

// 로그인
router.route('/login').post(function(req, res){
  console.log('/login 라우팅 함수 호출됨');

  var paramId = req.body.id || req.query.id;
  var paramPassword = req.body.password || req.query.password;
  console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword);

  if(database) {
      authUser(database, paramId, paramPassword, function(err, docs) {

        if (err) {
          console.log('로그인 에러 발생');
          console.dir(err);
          res.status(404).send();
        }

        if (docs) {
          console.log('doc확인절차 : ' + docs[0].id + ', ' + docs[0].name);

          // 찾은 결과 전송
          var objToSend = {
            id: docs[0].id,
            name: docs[0].name
          };

          console.log('로그인 : 데이터베이스 존재 : 회원찾기 성공 : 찾은 결과 전송 성공');

          // 정상 코드 전송
          res.status(200).send(JSON.stringify(objToSend));
          console.log('\n\n');

        }

        else {
          console.log('로그인 에러 발생');
          res.status(404).send();
          console.log('\n\n');
        }

      });
  } else {
    console.log('데이터베이스가 정의되지 않음...');
    res.status(400).send();
    console.log("\n\n");
  }
});

// 감상목록
router.route('/watchlist').post(function(req, res) {
  console.log('/watchlist(감상결과 목록 처리) 라우팅 함수 호출');

  var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기

  if(database) {
    WatchModel.findById(paramId, function(err, results) {
        if (err) {
          callback(err, null);
          return;
        }
        console.log(results);
        console.log(paramId + '의 감상결과 리스트 가져오기');

        if(results.length>0) {
          console.log('감상결과 목록 존재');
          var resultArray = new Array(results.length);
          for(var i=0;i<results.length;i++) {
            var objToSend = {
              title: results[i].title,
              poster: results[i].poster
            };
            resultArray[i]=objToSend;
          }
          res.status(200).send(JSON.stringify(resultArray)); // 감상결과 목록 보내기
        } else {
          console.log('감상 기록 없음');
        }
      });
  }
});

// 감상결과
router.route('/watchresult').post(function(req, res) {
  console.log('/watchresult(감상결과) 라우팅 함수 호출');

  var paramId = req.body.id || req.query.userid; // 사용자 아이디 받아오기
  var paramMovie = req.body.movieId || req.query.movieId; // 영화 아이디 받아오기

  if(database) {

    getWatchResult(database, paramId, paramMovie, function(err, results){

      console.dir(results)

      if (err){
        console.log('감상결과 가져오는 중에 에러 발생...');
        console.dir(err)
        res.status(400).send();
      }

      else if (results.length > 0) {

        var objToSend = {
          title: results[0].title,
          poster: results[0].poster,
          genres: results[0].genres,
          emotion: results[0].emotion,
          highlight: results[0].highlight
        };

        res.status(200).send(JSON.stringify(objToSend));
        console.log('감상기록 결과 : 데이터베이스 존재 : 기록 존재 : 찾은 결과 전송 성공');
        console.log('\n\n');

      }

      else {
        res.status(400).send();
        console.log('감상기록 결과 없음.');
        console.log('\n\n');
      };

    });

  }
  else{
    console.log('데이터베이스가 정의되지 않음...');
    res.status(400).send();
    console.log("\n\n");
  }
});

router.route('/recommend1').post(function(req, res){

  // 파이썬 실행 처리 코드, 파이썬에서 처리한 추쳔영화 10개 가져옴
    // 1. child-process모듈의 spawn 취득
    const spawn = require('child_process').spawn;
    // 2. spawn을 통해 "python 파이썬파일.py" 명령어 실행
    const result = spawn('python', ['test3_2.py']);

    // 3. stdout의 'data'이벤트리스너로 실행결과를 받는다.
    result.stdout.on('data', function(data) {
      const stringResult = data.toString();

      var array = stringResult.split('\n');
      for(var i=0;i<array.length-2;i++) {
         array[i]=array[i].replace(/[0-9]/g, '');
         array[i]=array[i].trim();
         console.log(array[i]);
      }
      res.status(200).send(JSON.stringify(array));
    });

    // 4. 에러 발생 시, stderr의 'data'이벤트리스너로 실행결과를 받는다.
    result.stderr.on('data', function(data) {
      const stringResult = data.toString();

      var array = stringResult.split('\n');
      for(var i=0;i<array.length;i++) {
         array[i]=array[i].replace(/[0-9]/g, '');
         array[i]=array[i].trim();
         console.log(array[i]);
      }
    });

});

router.route('/recommend2').post(function(req, res){
  console.log('/recommend2 (사용자 추천) 라우팅 함수 호출');

  var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기

  if (database){

    //파이썬 코드 실행 (유사 사용자 추천)
    const spawnSync = require('child_process').spawnSync; // child-process 모듈의 spawn 획득
    var getpython = ''

    //result에는 유저에게 추천할 사용자들 id 가 들어있음.
    const result = spawnSync('python', ['recommend/main.py'], {input : paramId});
    console.log('중간점검')

    if(result.status !== 0){
      process.stderr.write(result.stderr)

      process.exit(result.status);
    } else{
      process.stdout.write(result.stdout);
      process.stderr.write(result.stderr);
      getpython = result.stdout.toString();
      console.log('python 결과 형식 : ', typeof(getpython))
    }

    getRecommendUserList(database, getpython, function(err, result){

      console.dir(result);

      if(err){
        console.log('추천 사용자 목록 가져오는 중에 에러 발생 ...');
        console.dir(err);
        res.status(400).send();
      }

      else if(result.length > 0){
        console.log('추천 사용자 목록 가져오기 성공');
        console.log(result);

        // 전달 : 추천 사용자들 목록 find id 통해서 포스터, 영화제목
        res.status(200).send(JSON.stringify(result));
        console.log('추천 사용자 목록 전송 성공');
        console.log('\n\n');
      }

      else {
        res.status(400).send()
        console.log('추천 사용자 목록 없음.');
        console.log('\n\n');
      }

    });

  } else {
    console.log("데이터베이스가 정의되지 않음...");
    res.status(400).send
  }
});
// 초대 코드 입장
router.route('/enterRoom').post(function(req, res){

  console.log('/enterRoom ( 방 코드 입력 / 입장 ) 라우팅 함수 호출');

  if(database){

    var paramRoomCode = req.body.roomCode || req.query.roomCode;

    console.log('입력된 룸 코드 : ' + paramRoomCode);

    enterRoom(paramRoomCode, function(err, result){

      if (err) {
        console.log('초대 코드 검색 중 오류');
        console.dir(err);
        res.status(400).send();
      }

      else if (result.length > 0){
        console.log('초대 코드에 해당하는 함께보기 방 검색 성공');


        // 방 생성한 유저 아이디를 스키마에 넣어서 전달해주는 것도 좋을듯
        res.status(200).send();
        console.log('같이 보기 방 : 초대 코드 검색 완료 : 정상코드 발송 완료');
        console.log('\n\n');
      }

      else{
        res.status(400).send();
        console.log('초대 코드에 해당하는 같이 보기 방 없음...');
        console.log('\n\n')
      };

    })
  }
  else{
    console.log('데이터베이스가 정의되지 않음...');
    res.status(400).send();
    console.log('\n\n');
  }

});


router.route('/email').post(function(req, res){
  console.log('/email(이메일 인증) 라우팅 함수 호출');

  if(database){

      var paramId = req.body.id;

      // 발신자 정의.
      var app_email = '***@gmail.com';
      var app_pass = '****';

      console.log('수신자 : ', paramId);

      sendEmail(app_email, app_pass, paramId, function(err, results){

        if(err){
          console.log('이메일 발송 실패')
          res.status(400).send();
          console.log('\n\n');
        }

        if (results){
          console.log('mail 전송을 완료하였습니다.');
          res.status(200).send(JSON.stringify(results));
          console.log('\n\n');
        }
      })
  }
  else{
      console.log('데이터베이스가 정의되지 않음...');
      res.status(400).send();
      console.log("\n\n");
  }
});

// 리액션공유 방 생성
router.route('/makeRoom').post(function(req, res) {
    console.log('/makeRoom 라우팅 함수 호출됨');

    const Checking = Math.random().toString(36).substr(2,11); // 랜덤으로 방 초대코드 생성
    // 아이디를 사용해 검색
    roomModel.findByRoomCode(Checking, function(err, results){
      if (err) {
        console.log('회원가입 중 에러 발생');
        console.dir(err);
        return;
      }

      if(results.length > 0) {
        console.log('초대 코드 중복, 다시 생성..');
        const Checking2 = Math.random().toString(36).substr(2,11); // 랜덤으로 방 초대코드 생성

        // 방을 새로 생성합니다.
        var room = new roomModel({'roomCode': Checking2});

        // save()로 저장
        room.save(function(err) {
          if(err) {
            callback(err, null);
            return;
          }
          console.log('새로운 방 등록');
          callback(null, user);
        });
      }

      else {
        // 방을 새로 생성합니다.
        var room = new roomModel({'roomCode': Checking});

        // save()로 저장
        room.save(function(err) {
          if(err) {
            callback(err, null);
            return;
          }
          console.log('새로운 방 등록');
          callback(null, user);
        });
    }
  });
});

// 로그아웃
router.get('/logout', async function (req, res, next) {
  var session = req.session;
  try {
      if (session.user) { //세션정보가 존재하는 경우
          await req.session.destroy(function (err) {
              if (err)
                  console.log(err)
              else {
                res.redirect('/');
              }
          })
      }
  }
  catch (e) {
    console.log(e)
  }
  res.redirect('/');
});

var getWatchResult = function(db, userid, movieid, callback){
  console.log('getWatchResult(감상결과 가져오기) 호출됨. userid : ' + userid + ', movieid : ' + movieid);

  WatchModel.findById(userid, function(err, results_id) {

        if (err) {
          callback(err, null);
          return;
        };

        if(results_id.length > 0) {

          console.log(userid + '의 감상결과 발견');
          WatchModel.findByMovieId(movieid, function(err, results_movie) {

            if(err){
              callback(err, null);
            }

            if (results_movie.length > 0) {

              console.log(movieid + ' : 감상 기록 존재');
              callback(null, results_movie);
            }

            else {
              callback(null, null);
            };

          });
        }
        else{
          callback(null, null);
        }
      });
}



var authUser = function(db, id, password, callback) {
  console.log('authUser(로그인) 호출됨' + id + ', ' + password);

  // 아이디를 사용해 검색
  UserModel.findById(id, function(err, results_id){

      if (err) {
          callback(err, null);
          return;
      }

      console.log('아이디 %s로 검색됨',id);

      if (results_id.length > 0) {
          console.log('아이디와 일치하는 사용자 찾음');

          UserModel.authenticate(password, function(err, results){

            if(err){
                callback(err, null)
                return;
            }

            if(results.length > 0){
                console.log('비밀번호 일치');

                callback(null, results_id);
            }

            else{
                callback(null, null);
            }

        })
      }
      else {
          console.log('아이디와 일치하는 사용자를 찾지 못함');
          callback(null, null);
      }

  });
};

// 사용자를 추가하는 함수
var signUp = function(db, id, password, name, callback) { // callback 함수는 함수를 호출하는 쪽에 결과 객체를 보내기 위해 쓰임
  console.log('signUp 호출됨' + id + ', ' + password + ', ' + name);

  // 아이디를 사용해 검색
  UserModel.findById(id, function(err, results){

    if (err) {
      console.log('회원가입 중 에러 발생');
      console.dir(err);
      return;
    }

    if(results.length > 0) {

      console.log('이미 가입된 아이디입니다.');
      console.log('username : ', results[0].name);

    }
    else {

      var user = new UserModel({'id' : id, 'password': password, 'name' : name});

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

var enterRoom = function(roomcode, callback){
  console.log('enterRoom (같이보기 방 입장)호출됨. 방 코드 : ' + roomcode);

  roomModel.findByRoomCode(roomcode, function(err, result){

    if(err){
      callback(err, null);
      return;
    }

    else if(result.length > 0){
      console.log('입력된 코드에 해당하는 같이보기 방 찾음.');

      callback(null, result);
    }

    else{
      callback(null, null);
      return;
    }

  })
}

var getRecommendUserList = function(database, result, callback){

  console.log('getRecommendUserList 호출됨.');

  substrResult = result.substring(2)
  splitResult = substrResult.split(' ')
  console.log(splitResult)

  console.log('result 개수 ; ', splitResult.length);

  splitResult2 = [];
  var resultArray = [];

  for (var i = 0; i<splitResult.length; i++){

    if (splitResult[i] == ''){
      // console.log(i+'번째는 continue')
      continue
    }
    else{
      splitResult2.push(parseInt(splitResult[i]))
      // console.log(i + '번째 검사결과 : ' + typeof(splitResult[i]))
      console.log(splitResult2)
    }
  };

  var count = splitResult2.length
  console.log('===================\n결과 갯수 : ', count)
  splitResult2.forEach(element => {
    WatchModel.findByMovieId(element, function(err, result){
      console.log('무비아이디로 찾는 중')

      if(err){
        console.log('추천 사용자 못찾음')
        callback(err, null)
      }

      if(result.length > 0){
        console.log('추천 사용자 찾음')
        resultArray.push({
          id : result[0].userId,
          title : result[0].title,
          poster : result[0].poster
        })
        console.log(resultArray)
      }

      else {
        console.log('추천 사용자 못찾음')
        callback(null, null);
      }

      if(resultArray.length == count){
        console.log('추천 사용자 | 추천 목록 생성 완료')
        callback(null, resultArray);
      }
    })


  })
};

var sendEmail = function (sendemail, sendpass, userid, callback) {

    console.log('sendEmail 호출됨.');
  
    const email = async () => {
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 3000,
        secure: false,
        auth: {
          user: sendemail,
          pass: sendpass,
        },
      });
  
      console.log('transporter 설정 완료');
  
      var code = (Math.floor(Math.random()*9000)+1000).toString()
  
      const objToSend = {
        code: code
      }
  
      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: `"allonsy"`,
        to: userid,
        subject: '[하루뭅] 인증코드를 확인해주세요 ',
        text: code,
        html: '<a>안녕하세요. <b>하루뭅(Harumub)</b>입니다.<br>'
        +'고객님께서 입력하신 이메일의 소유확인을 위해 아래 인증번호를 회원가입 화면에 입력해주세요.</a> <br> <br><b>'
        +code+'</b>'
        
      });
  
      console.log("Messege email address : ", userid)
      console.log('Message sent: %s', info.messageId);
      console.log("Mail Code : ", code)
  
      callback(null, objToSend);
      return;
    };
  
    callback(console.err, null);
    email().catch(console.error);
};

app.use('/', router);

const server = http.createServer(app).listen(app.get("port"), function () {
  console.log("서버 시작됨");
  connectDB();
});