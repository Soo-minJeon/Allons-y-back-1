
var nodemailer = require('nodemailer');
var functionUser = require('../function');

// 회원가입 라우팅 함수
var signup = function(req, res) {
    console.log('/signup 라우팅 함수 호출됨.');
  
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
  
    console.log('[요청 파라미터] ID : ' + paramId + ', PW : ' + paramPassword + ', NAME : ' + paramName);
  
    var database = req.app.get('database');

    // 데이터 베이스 객체가 초기화된 경우, signup 함수 호출하여 사용자 추가
    if(database) {
      signUp(database, paramId, paramPassword, paramName, function(err, result) {
  
        if(err) {
            console.log('***ERROR!! 회원가입 에러 발생... : ', err);
            res.status(400).send();
            console.log('----------------------------------------------------------------------------')
        }
       // 결과 객체 확인하여 추가된 데이터 있으면 성공 응답 전송
        else if(result) {
          console.log('회원가입 성공.');
          console.dir(result);
          res.status(200).send();
          console.log('----------------------------------------------------------------------------')
  
        } else { // 결과 객체가 없으면 실패 응답 전송
          console.log('회원가입 에러 발생...');
          res.status(400).send();
          console.log('----------------------------------------------------------------------------')
        }
      });
    }
    else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
      console.log('회원가입 에러 발생...');
      console.dir(err);
      res.status(400).send();
      console.log('----------------------------------------------------------------------------')
    }
};

// 로그인 라우팅 함수
var login = function(req, res){
  console.log('/login 라우팅 함수 호출됨');

  var paramId = req.body.id || req.query.id;
  var paramPassword = req.body.password || req.query.password;
  console.log('[요청 파라미터] ID :  ' + paramId + ', PW : ' + paramPassword);
  var database = req.app.get('database');

  if(database) {
      authUser(database, paramId, paramPassword, function(err, docs) {

        if (err) {
          console.log('***ERROR!! 로그인 에러 발생 : ', err);
          res.status(404).send();
          console.log('----------------------------------------------------------------------------')
        }

        if (docs) {
          // 감상기록 존재 유무 확인
          checkRecord(database, paramId, function (err, doc) {
            if (doc) {
              // 찾은 결과 전송
              var objToSend = {
                id: docs[0].id,
                name: docs[0].name,
                record: true
              };
              console.log("감상기록 ㅣ 있음");
            }
            else if (err){
              console.log('***ERROR!! 로그인 에러 발생 : ', err);
              res.status(404).send();
              console.log('----------------------------------------------------------------------------')
            }
            else {
              // 찾은 결과 전송
              var objToSend = {
                id: docs[0].id,
                name: docs[0].name,
                record: false
              };
              console.log("감상기록 | 없음");
            }
            // 정상 코드 전송
            res.status(200).send(JSON.stringify(objToSend));
            console.log('----------------------------------------------------------------------------')
          });  
        }

        else {
          console.log('***ERROR!! 로그인 에러 발생...');
          res.status(404).send();
          console.log('----------------------------------------------------------------------------')
        }

      });
  } else {
    console.log('***ERROR!! 데이터베이스가 정의되지 않음...');
    res.status(400).send();
    console.log('----------------------------------------------------------------------------')
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
    var paramMovie = req.body.movieTitle || req.query.movieTitle; // 영화 아이디 받아오기
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

var sceneAnalyze = function(req, res) {
    console.log('/sceneAnalyze 라우팅 함수 호출');
    var database = req.app.get('database');
    var paramGenre = null
    var paramActor = null
    var paramEmotion = null
    var paramCorrect = null
    // 감정맥스 초, 감정 종류 받아오기
    //var maxSecond = req.body.maxSecond || req.query.maxSecond;
    var paramId = 'pbkdpwls';//req.body.id || req.query.id;

    // 파이썬 실행 처리 코드, 장면분석 결과 받아옴
      // 1. child-process모듈의 spawn 취득
      const spawn = require('child_process').spawn;
      // 2. spawn을 통해 "python 파이썬파일.py" 명령어 실행
      const result = spawn('python', ['video_test2.py']);

      // 3. stdout의 'data'이벤트리스너로 실행결과를 받는다.
      result.stdout.on('data', function(data) {
        const stringResult = data.toString();
        // 받아온 파이썬 코드 결과 데이터 형식 여기서 처리
        var array = stringResult.split('\n');
        for(var i=0;i<3;i++) {
           console.log(array[i]);
        }
        paramGenre = (array[0].split(' ')).toString()
        paramActor = (array[1].split(' ')).toString()
        paramEmotion = (array[2].split(' ')).toString()
        paramCorrect = (array[3].split(' ')).toString()

        console.log('요청 파라미터 : ' + paramGenre + ', ' + paramActor + ', ' + paramEmotion+', '+paramCorrect);

        var database = req.app.get('database');

        // 데이터 베이스 객체가 초기화된 경우, signup 함수 호출하여 사용자 추가
        if(database) {
          scene(database, paramId, paramGenre, paramActor, paramEmotion,paramCorrect,function(err, result) {
            if(err) {
                console.log('장면분석 정보 등록 에러 발생...');
                console.dir(err);
                res.status(400).send();
            }
           // 결과 객체 확인하여 추가된 데이터 있으면 성공 응답 전송
            if(result) {
              console.log('장면분석 정보 등록 성공.');
              console.dir(result);
              res.status(200).send();
              console.log('\n\n');

            } else { // 결과 객체가 없으면 실패 응답 전송
              console.log('장면분석 정보 등록 에러 발생...');
              res.status(400).send();
              console.log('\n\n');
            }
          });
        }
        else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
          console.log('장면분석 정보 등록 에러 발생...');
          console.dir(err);
          res.status(400).send();
          console.log('\n\n');
        }
      });

      // 4. 에러 발생 시, stderr의 'data'이벤트리스너로 실행결과를 받는다.
      result.stderr.on('data', function(data) {
        const stringResult = data.toString();
        // 받아온 파이썬 코드 결과 데이터 형식 여기서 처리
        var array = stringResult.split('\n');
        for(var i=0;i<array.length;i++) {
           console.log(array[i]);
        }
        paramGenre = array[0]
        paramActor = array[1]
        paramEmotion = array[2]
      });
}
/*
var saveEmotion = function(req,res) {
    console.log('/saveEmotion 라우팅 함수 호출');
    var database = req.app.get('database');
    var paramGenre = null
    var paramActor = null
    //var paramEmotion = null
    // 감정맥스 초, 감정 종류 받아오기
    //var maxSecond = req.body.maxSecond || req.query.maxSecond;
    var emotionKind = 'Happy';//req.body.emotionKind || req.query.emotionKind;
    var paramId = 'pbkdpwls';//req.body.id || req.query.id;

    // 파이썬 실행 처리 코드, 장면분석 결과 받아옴
      // 1. child-process모듈의 spawn 취득
      //const spawn = require('child_process').spawn;
      // 2. spawn을 통해 "python 파이썬파일.py" 명령어 실행
      //const result = spawn('python', ['video_test2.py']);

      // 3. stdout의 'data'이벤트리스너로 실행결과를 받는다.
      /*result.stdout.on('data', function(data) {
        const stringResult = data.toString();
        // 받아온 파이썬 코드 결과 데이터 형식 여기서 처리
        var array = stringResult.split('\n');
        for(var i=0;i<3;i++) {
           console.log(array[i]);
        }*//*
        var paramEmotion = 'Happy';//array[2] // 영화 장면 감정정보 받아오기

        console.log('요청 파라미터 : ' + paramEmotion);

        var database = req.app.get('database');

        var correct=0
        if (paramEmotion==emotionKind){
            correct=1
        }
        // 데이터 베이스 객체가 초기화된 경우, signup 함수 호출하여 사용자 추가
        if(database) {
          correctEmotion(database, paramId, paramEmotion,correct,function(err, result) {
            if(err) {
               console.log('장면분석 정보 등록 에러 발생...');
               console.dir(err);
               res.status(400).send();
            }
           // 결과 객체 확인하여 추가된 데이터 있으면 성공 응답 전송
            if(result) {
              console.log('감정부합 여부 체크 성공.');
              console.dir(result);
              res.status(200).send();
              console.log('\n\n');

            } else { // 결과 객체가 없으면 실패 응답 전송
              console.log('장면분석 정보 등록 에러 발생...');
              res.status(400).send();
              console.log('\n\n');
            }
          });
        }
        else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
          console.log('장면분석 정보 등록 에러 발생...');
          console.dir(err);
          res.status(400).send();
          console.log('\n\n');
        }
      //});
} */

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
    const spawnSync= require('child_process').spawnSync; // child-process 모듈의 spawn 획득
    var getpython = ''

    //result에는 유저에게 추천할 사용자들 id 가 들어있음.
    const result = spawnSync('python', ['recommend/main.py', paramId]);
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

    getRecommendUserList(getpython, function(err, result){

      console.dir(result);

      if(err){
        console.log('추천 사용자 목록 가져오는 중에 에러 발생 ...');
        console.dir(err);
        res.status(400).send();
      }

      else if(result.length > 0){
        console.log('추천 사용자 목록 가져오기 성공');
        
        res.status(200).send(result);
      }  
      else {
        res.status(400).send()
        console.log('추천 사용자 목록 없음.');
        console.log('\n\n');
      }
    });
    
  } else {
    console.log("데이터베이스가 정의되지 않음...");
    res.status(400).send()
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

// 감상시작 라우팅 함수
var watchAloneStart = function(req, res){ // watch스키마 생성
  console.log('/watchAloneStart 라우팅 함수 호출됨')

  var database = req.app.get('database');

  var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기
  var parammovieTitle = req.body.movieTitle || req.query.movieTitle; // 감상중인 영화 제목 받아오기

  if (database){

    var posterurl
    var genres 
    var newWatch

    async function searchMovieInfo(){
      //파이썬 코드 실행 (영화데이터 존재 유무 확인)
      const spawnSync = require("child_process").spawnSync; // child-process 모듈의 spawn 획득

      const result = spawnSync("python", ["/Users/jeonsumin/node-pycharm/newTest.py", 'Toy Story']);

      if (result.status !== 0) {
        process.stderr.write(result.stderr);
        process.exit(result.status);
      } else {
        process.stdout.write(result.stdout);
        process.stderr.write(result.stderr);
        getpython = result.stdout.toString();

        // csv 파일에서 영화 정보 받아온 후 문자열 처리
        getpython = getpython.split(' | ')
        genres = (getpython[1])
        posterurl = console.log(getpython[2])
    }}

    async function createWatchResult(){
      newWatch = new database.WatchModel({ 
        'userId': paramId, 
        'movieTitle': parammovieTitle,
        'poster': posterurl,
        'genres': genres,
        'concentration': 0,
        'highlight_time': NaN,
        'emotion_array': { "HAPPY" : 0, "SAD" : 0, "ANGRY" : 0, "CONFUSED" : 0, "DISGUSTED": 0, "SURPRISED" : 0, "FEAR" : 0, },
        'highlight_array' : {},
        'rating': 0,
        'comment': NaN,
        'sleepingCount ' : 0
      });
    }

    async function main(){
      await searchMovieInfo()
      await createWatchResult()
      await newWatch.save(function(err) {
        if (err){
          console.log('***ERROR!! 감상결과 스키마 생성 및 저장 오류... : ', err)
          res.status(400).send() // 저장오류
          console.log('----------------------------------------------------------------------------')
        }
        else{
          console.log('감상 결과 데이터 추가됨 => \n', newWatch, '\n');
          res.status(200).send()
          console.log('----------------------------------------------------------------------------')
        }    
      });
    }
    main()
  }
  else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
    console.log('***ERROR!! 데이터 베이스 에러 ... : ', err);
    res.status(400).send();
    console.log('----------------------------------------------------------------------------')
  }
};

var watchImageCaptureEyetrack = async function(req, res){
  console.log('/watchImageCaptureEyetrack 라우팅 함수 호출됨.');

  var database = req.app.get('database');

  // eyetrack용 이미지를 s3버킷에 업로드 했다는 요청을 받으면

  var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기
  var parammovieTitle = req.body.movieTitle || req.query.movieTitle; // 감상중인 영화 아이디 받아오기
  var paramTime = req.body.time || req.query.time;
  var paramImgPath = req.body.imgPath || req.body.imgPath; // 버킷에 올라간 파일 경로

  var sleepCount = 0
  var checkLimit = 0
  var concentration_scene = 0
  var tmp_concentration = 0

  if (database){
  
    //파이썬 코드 실행 
    const spawnSync= require('child_process').spawnSync; // child-process 모듈의 spawn 획득
    var getpython = ''

    //result에는 유저에게 추천할 사용자들 id 가 들어있음.
    const result = spawnSync('python', ['eyetracking/eyetrack.py', paramTime, paramId, parammovieTitle]);

    if(result.status !== 0){
      process.stderr.write(result.stderr)
      process.exit(result.status);
    } else{
      process.stdout.write(result.stdout);
      process.stderr.write(result.stderr);
      getpython = result.stdout.toString();
      // console.log('eyetrack.py 결과 형식 : ', typeof(getpython))
      concentration_scene = Number(getpython)
    }

    // 감상결과에 저장해놓은 (몇번 잤니?) 받아오기 
    // 영화 러닝타임 알아오기 -> (몇번 잤니?) 가 용인되는 횟수보다 적은가 확인해야 하기때문
    /// ==> 기다려줘야함 1. 
    const existing = await database.WatchModel.find(
      {userId : paramId, movieTitle : parammovieTitle}).clone()
    
    async function countlimit() {
      if (existing.length > 0) {
        // console.dir(existing)

        sleepCount = existing[0].sleepingCount 
        tmp_concentration = existing_watch[0].concentration // 현재까지의 집중도 합을 구해옴.

        concentration_scene = tmp_concentration + Number(getpython) // 현재 장면에서의 집중도를 더함.
        
        await db.WatchModel.updateOne({ // 감상목록 concentration 수정 //
          userId: paramId,
          movieTitle: parammovieTitle
        }, {
          $set: { 
            concentration: concentration_scene,
          },
        }).clone()

        await database.MovieModel.findByTitle(parammovieTitle, async function(err, result){
          if (result.length > 0){
            // console.dir(result[0])
            checkLimit = result[0].runningTime / 10 / 2
            console.log('러닝타임 : ', result[0].runningTime)
            console.log('용인 한계 : ', checkLimit)
            console.log('현재 : ', sleepCount, "\n")
          }
        }).clone()
      }
      else{
        console.log('WatchModel에 정보 없음요')
        res.status(400).send()
      }
    }
    await countlimit()

    // 자는 중이니?
    /// 2.
    async function isSleep(){

      if (Number(getpython) == 0){
        console.log('집중도 분석 결과 : 자는 중');
        sleepCount = sleepCount + 1
  
        // 결과 스키마의 (몇번잤니?) 수정
        /// 3.
        await database.WatchModel.updateOne({
          userId: paramId,
          movieTitle: parammovieTitle
        },{
          $set: {
            sleepingCount: sleepCount
          }
        }).clone()
  
        // sleepCount가 용인 횟수를 넘었을 때
        /// 4.
        if ((sleepCount) >= checkLimit) {
          console.log('분석 횟수 중 절반 이상 자는 중.');
          res.status(410).send() // 자는 중이라고 프론트에 알려줌 - 410 // 프론트에 알려줘야 함.
        } else {
          console.log('아직 분석 횟수 중 절반 이하 자는 중.');
        }
  
      }
      else{ // 안 자는 중
        console.log('집중도 분석 결과 : 안 자는 중');
  
        path = '' // path - 수정필요
  
        // 감정분석 시작 - 수정 필요
        watchImageCaptureRekognition(database, paramId, parammovieTitle, paramImgPath, function(err, result){
          if (result){
            console.log('집중도 | 감정데이터 분석 및 정보 추가 완료');
            res.status(200).send()
          }
          else {
            console.log('집중도 성공 | 감정 실패');
            console.dir(err)
            res.status(400).send();
          }
        }); 
      }
    }
    await isSleep()

  } else {
    console.log("데이터베이스가 정의되지 않음...");
    res.status(400).send()
  }
};

var watchAloneEnd = function(req, res){
  var database = req.app.get('database');

  var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기
  var parammovieTitle = req.body.movieTitle || req.query.movieTitle; // 감상중인 영화 제목 받아오기
  var tmp_highlight_array // 정규화 전 배열
  var normalization_array // 정규화 후 배열
  var highlight_time // 감정의 폭이 큰 시간
  var concentration_sum // 평균치를 내기 전 집중도의 합
  var movie_running_time // 영화 러닝타임
  var ConcentrationPreScopeAverage // 범위 변환 전 집중도 평균 (0~100)
  var count_eyetracking // 10초간격으로 집중도 측정한 횟수

  async function getWatchResult(userId, movieTitle){ // 감상결과 기록을 찾는 함수. / 하이라이트 계산 배열 찾아옴.

    var existing_watch = await database.WatchModel.find({
      userId : userId, movieTitle : movieTitle
    }).clone()

    if (existing_watch.length>0){
      console.log('해당 유저의 해당 영화의 감상 기록 찾음.')
      tmp_highlight_array = existing_watch[0].highlight_array
      concentration_sum = existing_watch[0].concentration
    }
    else {
      console.log('해당 유저의 해당 영화의 감상 기록 존재하지 않음.')
      res.status(400).send();
    }
  }

  async function HighlightImageTrans_ToFolder(highlightT, id, title){
    // param으로 계산완료한 하이라이트 시간 전달받고
    // time.jpg 형식으로된 이미지 파일 삭제 ==> 이미지명은 나중에 수정 필요

    ///필요 코드 : param.jpg만 제외하고 삭제, 
    ///로직 : param.jpg를 다른 폴더로 옮기고 나머지 파일들은 삭제
    
    function deleteImg_from_python(time, id, title) {
      //파이썬 코드 실행 (사용자 감정 분석)
      const spawnSync = require("child_process").spawnSync; // child-process 모듈의 spawn 획득
      var getpython = "";
  
      // (param) 이미지 경로 재설정 필요
      const result = spawnSync("python", ["bucket_imgDelete.py", time, id, title]);
  
      if (result.status !== 0) {
        process.stderr.write(result.stderr);
  
        process.exit(result.status);
      } else {
        process.stdout.write(result.stdout);
        process.stderr.write(result.stderr);
        console.log(time, '.jpg 사진 삭제 완료')
      }

    }
    deleteImg_from_python(highlightT, id, title)
  }

  async function getMovieInfo(movieTitle){ // 영화 정보 찾기 -> 집중도 평균치 계산위해
    var existing_movie = await database.MovieModel.find({
      movieTitle : movieTitle
    }).clone()

    if (existing_watch.length>0){
      console.log('해당 영화의 감상 기록 찾음.')
      movie_running_time = existing_movie[0].runningTime
      count_eyetracking = parseInt(movie_running_time / 10)
      ConcentrationPreScopeAverage = concentration_sum / count_eyetracking 
    }
    else {
      console.log('해당 영화의 기록 존재하지 않음.')
      res.status(400).send();
    }

  }

  async function main(){

    ////////////////////////// 하이라이트 정규화 //////////////////////////
    await getWatchResult(paramId, parammovieTitle);
    await normalization(tmp_highlight_array, function(result){
      normalization_array = result
    });
    /////////////////////////////////////////////////////////////////

    ////////////////////////// 집중도 처리 //////////////////////////
    await getMovieInfo(parammovieTitle)

    await database.WatchModel.updateOne({ // 감상목록 highlight_array 수정 // 
      userId: paramId,
      movieTitle: parammovieTitle
    }, {  
      $set: {
        highlight_time : highlight_time,
        highlight_array : normalization_array,   
        concentration : (ConcentrationPreScopeAverage / 10) // 0~10 값으로 변환
      },
    })

    await HighlightImageTrans_ToFolder(highlight_time, paramId, parammovieTitle);
  }
  main()
  
  
  
};

var addReview = function(req, res){
  var database = req.app.get('database');

  var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기
  var parammovieTitle = req.body.movieTitle || req.query.movieTitle; // 감상중인 영화 제목 받아오기
  var paramRating = req.body.rating || req.query.rating // 사용자가 매긴 평점
  var paramComment =req.body.comment || req.query.comment // 사용자가 작성한 한줄 평

  async function addreview(){
    await database.WatchModel.updateOne({ // 감상평,평점 업데이트
      userId: paramId,
      movieTitle: parammovieTitle
    }, {  
      $set: {
        rating: paramRating,   
        comment : paramComment
      }
    });
    await res.status(200).send()
  }
  addreview()
};

var email = function(req, res){
    console.log('/email(이메일 인증) 라우팅 함수 호출');
    var database = req.app.get('database');
    if(database){
  
        var paramEmail = req.body.email;
  
        // 발신자 정의.
        var app_email = '수정';
        var app_pass = '수정';

  
        console.log('수신자 : ', paramEmail);
  
        sendEmail(app_email, app_pass, paramEmail, function(err, results){
  
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
    
    var RoomCode = Math.random().toString(36).substr(2,11); // 랜덤으로 방 초대코드 생성

    if(database) {
      makeroom(database,RoomCode, function(err, result){
        if (err) {
          console.log('회원가입 중 에러 발생');
          console.dir(err);
          return;
        }
  
        if(result.length > 0) {
          console.log('초대 코드 중복, 다시 생성..');
          const Checking2 = Math.random().toString(36).substr(2,11); // 랜덤으로 방 초대코드 생성
  
          // 방을 새로 생성합니다.
          var room = new database.RoomModel({'roomCode': Checking2});
          console.log('RoomCode : ' + RoomCode);
  
          // save()로 저장
          room.save(function(err) {
            if(err) {
              return;
            }
            console.log('새로운 방 등록');
            // 찾은 결과 전송
            var objToSend = {
              roomCode: result[0].roomCode
            };
            res.status(200).send(JSON.stringify(objToSend));
          });
        }
  
        else {
          // 방을 새로 생성합니다.
          var room = new database.RoomModel({'roomCode': RoomCode});
          console.log('RoomCode : ' + RoomCode);
          // save()로 저장
          room.save(function(err) {
            if(err) {
              return;
            }
            console.log('새로운 방 등록');
            // 찾은 결과 전송
            var objToSend = {
              roomCode: RoomCode
            };
            res.status(200).send(JSON.stringify(objToSend));
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
    res.status(200).send();
    console.log('로그아웃합니다..');
};

// 함수 시작

var getWatchResult = functionUser.getWatchResult;

var authUser = functionUser.authUser;

var checkRecord = functionUser.checkRecord;

var signUp = functionUser.signUp;

var enterRoom = functionUser.enterRoom;

var getRecommendUserList = functionUser.getRecommendUserList;

var makeroom = functionUser.makeroom;

var sendEmail = functionUser.sendEmail;

var scene = functionUser.scene;

var watchImageCaptureRekognition = functionUser.watchImageCaptureRekognition;

var normalization = functionUser.normalization;


module.exports.signup = signup;
module.exports.login = login;
module.exports.watchlist = watchlist;
module.exports.watchresult = watchresult;
module.exports.recommend1 = recommend1;
module.exports.recommend2 = recommend2;
module.exports.enterroom = enterroom;
module.exports.email = email;
module.exports.makeRoom = makeRoom;
module.exports.sceneAnalyze = sceneAnalyze;
module.exports.logout = logout;
module.exports.watchAloneStart = watchAloneStart;
module.exports.watchImageCaptureEyetrack = watchImageCaptureEyetrack;
module.exports.watchAloneEnd = watchAloneEnd;
module.exports.addReview = addReview;
