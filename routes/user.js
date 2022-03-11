
var nodemailer = require('nodemailer');

var signup = function(req, res) {
    console.log('/signup 라우팅 함수 호출됨.');
  
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
  
    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword + ', ' + paramName);
  
    var database = req.app.get('database');

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
};


var login = function(req, res){
    console.log('/login 라우팅 함수 호출됨');
  
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword);
    var database = req.app.get('database');
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
  };

var watchlist = function(req, res) {
    console.log('/watchlist(감상결과 목록 처리) 라우팅 함수 호출');
  
    var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기
    var database = req.app.get('database');
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
    else{
        console.log('데이터베이스가 정의되지 않음...');
        res.status(400).send();
        console.log("\n\n");
    }
};
var watchresult = function(req, res) {
    console.log('/watchresult(감상결과) 라우팅 함수 호출');
  
    var paramId = req.body.id || req.query.userid; // 사용자 아이디 받아오기
    var paramMovie = req.body.movieId || req.query.movieId; // 영화 아이디 받아오기
    var database = req.app.get('database');
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
  };

var recommend1 = function(req, res){
    var database = req.app.get('database');
    if(database) {

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
    }
    else{
        console.log('데이터베이스가 정의되지 않음...');
        res.status(400).send();
        console.log("\n\n");
    }
  
  };

var recommend2 = function(req, res){
    console.log('/recommend2 (사용자 추천) 라우팅 함수 호출');
  
    var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기
    var database = req.app.get('database');
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
  };
var enterroom = function(req, res){

    console.log('/enterRoom ( 방 코드 입력 / 입장 ) 라우팅 함수 호출');
    var database = req.app.get('database');
    if(database){
  
      var paramRoomCode = req.body.roomCode || req.query.roomCode;
  
      console.log('입력된 룸 코드 : ' + paramRoomCode);
  
      enterRoom(database, paramRoomCode, function(err, result){
  
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
  
};

var email = function(req, res){
    console.log('/email(이메일 인증) 라우팅 함수 호출');
    var database = req.app.get('database');
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
  };

var makeRoom = function(req, res) {
    console.log('/makeRoom 라우팅 함수 호출됨');
    var database = req.app.get('database');
    
    if(database) {
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
    }
    else{
        console.log('데이터베이스가 정의되지 않음...');
        res.status(400).send();
        console.log("\n\n");
    }
};

var logout = function (req, res) {
    var database = req.app.get('database');
    var session = req.session;
    try {
        if (session.user) { //세션정보가 존재하는 경우
            req.session.destroy(function (err) {
                if (err)
                  console.log(err);
                else {
                  res.status(200).send(); // 로그아웃 성공
                }
            })
        }
    }
    catch (e) {
      console.log(e)
    }
  };

  

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
  db.UserModel.findById(id, function(err, results_id){

      if (err) {
          callback(err, null);
          return;
      }

      console.log('아이디 %s로 검색됨',id);

      if (results_id.length > 0) {
          console.log('아이디와 일치하는 사용자 찾음');
          db.UserModel.authenticate(password, function(err, results){
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
  db.UserModel.findById(id, function(err, results){

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

      var user = new db.UserModel({'id' : id, 'password': password, 'name' : name});

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

var enterRoom = function(db, roomcode, callback){
  console.log('enterRoom (같이보기 방 입장)호출됨. 방 코드 : ' + roomcode);

  db.roomModel.findByRoomCode(roomcode, function(err, result){

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
    database.WatchModel.findByMovieId(element, function(err, result){
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

  
module.exports.signup = signup;
module.exports.login = login;
module.exports.watchlist = watchlist;
module.exports.watchresult = watchresult;
module.exports.recommend1 = recommend1;
module.exports.recommend2 = recommend2;
module.exports.enterroom = enterroom;
module.exports.email = email;
module.exports.makeRoom = makeRoom;
module.exports.logout = logout;