var functionUser = require('../function');
var request = require("request");
var personal_info = require("../personal_info");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token"); // 아고라 토큰 발급 위해 필요
const { time } = require('console');

// 회원가입 라우팅 함수
var signup = function(req, res) {
    console.log('/signup 라우팅 함수 호출됨.');
  
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
    var likeMovie = req.body.favorite || req.query.favorite; // 선호 영화 3가지
    var genre = req.body.genre || req.query.genre; // 선호 장르
  
    console.log('[요청 파라미터] ID : ' + paramId + ', PW : ' + paramPassword + ', NAME : ' + paramName);
  
    var database = req.app.get('database');

    // 데이터 베이스 객체가 초기화된 경우, signup 함수 호출하여 사용자 추가
    if(database) {
      signUp(database, paramId, paramPassword, paramName,likeMovie, genre, function(err, result) {
        // 회원가입, 추천용아이디 발급, 선호 정보 추가
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

// 로그인 라우팅 함수 // reco1 도 추가해서 프론트로 넘겨줘야 함.
var login = function(req, res){
  console.log('/login 라우팅 함수 호출됨');

  var paramId = req.body.id || req.query.id;
  var paramPassword = req.body.password || req.query.password;
  console.log('[요청 파라미터] ID :  ' + paramId + ', PW : ' + paramPassword);
  var database = req.app.get('database');

  if(database) {
    var recoID 
    var objToSend
    var final_objToSend

    // 로그인 - 사용자 정보 찾기
    async function auth() {
      authUser(database, paramId, paramPassword, function (err, docs) {
        if (err) {
          console.log("***ERROR!! 로그인 에러 발생 : ", err);
          res.status(404).send();
          console.log("----------------------------------------------------------------------------");
        }
        if (docs) {
          // recoID = docs[0].reco2_id
          objToSend = {
            id: docs[0].id,
            name: docs[0].name,
          };
          reco2(recoID = docs[0].reco2_id)
        } 
        else {
          console.log("***ERROR!! 로그인 에러 발생...");
          res.status(404).send();
          console.log("----------------------------------------------------------------------------");
        }
      })
    }

    async function reco2(reco_id){
      console.log('추천 함수 호출')
        recommend1(database, reco_id, function(err, result1){
        if (result1){
        console.log(result1)
          recommend2(reco_id, function(err, result2) {
            if (result2){
                recommend3(database,paramId, function(err, result3) {
                    if(result3) {
                      recommend4(database, reco_id, function(err, result4){
                        if(result4){
                          recommend5(function(err, result5){
                            if (result5){
                              res.status(200).send(JSON.stringify(final_objToSend = {
                                id: objToSend.id,
                                name: objToSend.name,
                                reco1: result1,
                                reco2_1: result2[0],
                                reco2_2 : result2[1],
                                reco2_3 : result2[2],
                                reco2_4 : result2[3],
                                reco2_5 : result2[4],
                                reco3 : result3,
                                reco4 : result4,
                                reco5 : result5
                              }));
                              console.log('final = ')
                              console.log(final_objToSend)
                              console.log("----------------------------------------------------------------------------");
                            }
                            else{
                              console.dir(err)
                              res.status(404).send();
                              console.log("----------------------------------------------------------------------------");
                            }
                          })
                        }
                        else{
                          console.log('추천4 오류 발생 : ', err)
                        }
                      })
                    }
                })
                }
          })
        }
        else {
          res.status(404).send();
          console.log("----------------------------------------------------------------------------");
        }
      })
    }

    async function main(){
        await auth()
    }
    main()

  } else {
    console.log('***ERROR!! 데이터베이스가 정의되지 않음...');
    res.status(400).send();
    console.log('----------------------------------------------------------------------------')
  }
};

// 감상결과
var watchlist = function(req, res) {
    console.log('/watchlist(감상결과 목록 처리) 라우팅 함수 호출');
  
    var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기
    var database = req.app.get('database');

    var resultTitleArray = []
    var resultPosterArray = []

    if(database) {
      database.WatchModel.findById(paramId, function(err, results) {
          if (err) {
            callback(err, null);
            return;
          }
          // console.log(results);
          // console.log(paramId + '의 감상결과 리스트 가져오기');
  
          if(results.length>0) {

            for (let i = 0; i<results.length; i++){
              resultTitleArray[i] = results[i].movieTitle;
              resultPosterArray[i] = results[i].poster;
            }

            var objToSend = {
              title : resultTitleArray,
              poster : resultPosterArray
            }

            console.log('감상결과 목록 존재', objToSend);

            res.status(200).send(JSON.stringify(objToSend)); // 감상결과 목록 보내기
            console.log('----------------------------------------------------------------------------')
          } else {
            console.log('감상 기록 없음');
            var objToSend = {title : [], poster : []}
            res.status(200).send(JSON.stringify(objToSend)); // 빈  감상결과 목록 보내기
            console.log('----------------------------------------------------------------------------')
          }
        });
    }
    else{
        console.log('데이터베이스가 정의되지 않음...');
        res.status(400).send();
        console.log('----------------------------------------------------------------------------')
    }
};

// 감상결과
var watchresult = function(req, res) {
    console.log('/watchresult(감상결과) 라우팅 함수 호출');
  
    var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기
    var parammovieTitle = req.body.movieTitle || req.query.movieTitle; // 영화 아이디 받아오기

    var database = req.app.get('database');

    if(database) {

      async function main() {
        const results = await database.WatchModel.find({
          userId: paramId,
          movieTitle: parammovieTitle,
        });

        if (results.length > 0) {
          // console.log(results);

          var objToSend = {
            title: results[0].movieTitle,
            poster: results[0].poster,
            genres: results[0].genres,
            concentration: (results[0].concentration*10),
            highlight_time: results[0].highlight_time, // 감정폭 가장 큰 시간
            emotion_count_array: results[0].emotion_count_array, // 감정들 count
            highlight_array: results[0].highlight_array, // 감정폭 체크한 모든 기록 -- 그래프 제작에 이용
            rating: results[0].rating, // 평점
            comment: results[0].comment, // 감상평
          };

          res.status(200).send(JSON.stringify(objToSend));
          console.log(
            "감상기록 결과 : 데이터베이스 존재 : 기록 존재 : 찾은 결과 전송 성공", objToSend
          );
          console.log('----------------------------------------------------------------------------')
        }
        else {
          res.status(400).send()
          console.log("유저의 해당 영화 감상기록이 존재하지 않음.")
          console.log('----------------------------------------------------------------------------')
        }
      }
      main() 
    }
    else{
      console.log('데이터베이스가 정의되지 않음...');
      res.status(400).send();
      console.log('----------------------------------------------------------------------------')
    }
};

var labelDetection = function(second, callback){
    const spawn = require('child_process').spawn;
    // 2. spawn을 통해 "python 파이썬파일.py" 명령어 실행
    const result = spawn('python', ['video_test2.py']);
    console.log("1. 장르 분석 실행 시작 ")
      result.stdout.on('data', function(data) {
      console.log("1. 장르 분석 실행끝! ")
      const stringResult = data.toString();
      console.log(stringResult)

      callback(null,stringResult);
    });
};
var celebrityDetection = function(second, callback){
      const spawn = require('child_process').spawn;
      const result2 = spawn('python', ['celebrityAnalyze.py']);

      console.log("2. 배우 분석 실행 시작 ")
      result2.stdout.on('data', function(data) {
          console.log("2. 배우 분석 실행 끝! ")
          const stringResult = data.toString();
          console.log(stringResult)

          callback(null,stringResult);
      });
};
var emotionDetection = function(second, callback){
    const spawn = require('child_process').spawn;
    const result3 = spawn('python', ['emotionAnalyze.py']);

    console.log("3. 감정 분석 실행 시작 ")
    result3.stdout.on('data', function(data) {
      console.log("3. 감정 분석 실행 끝! ")
      const stringResult = data.toString();
      console.log(stringResult)

      callback(null,stringResult);
    });
};

// 장면분석
var sceneAnalyze = function(req, res) {
    console.log('/sceneAnalyze 라우팅 함수 호출');
    var database = req.app.get('database');
    var paramGenre = null
    var paramActor = null
    var paramEmotion = null
    var paramCorrect = null
    // 감정맥스 초, 감정 종류 받아오기
    //var maxSecond = req.body.maxSecond || req.query.maxSecond;
    var paramId = 'pbkdpwls1';//req.body.id || req.query.id;

      function dbSet(paramGenre, paramActor, paramEmotion,paramCorrect) {
            var database = req.app.get('database');
            // 데이터 베이스 객체가 초기화된 경우, signup 함수 호출하여 사용자 추가
            if(database) {
               scene(database, paramId, paramGenre, paramActor, paramEmotion,paramCorrect,function(err, result) {
                if(err) {
                    console.log('장면분석 정보 등록 에러 발생...');
                    console.dir(err);
                    res.status(400).send();
                    console.log('----------------------------------------------------------------------------')
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
                  console.log('----------------------------------------------------------------------------')
                }
              });
            }
            else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
              console.log('장면분석 정보 등록 에러 발생...');
              console.dir(err);
              res.status(400).send();
              console.log('----------------------------------------------------------------------------')
            }
      }

      labelDetection(database, 'second', function(err, result1) {
           paramGenre = result1
      });
      celebrityDetection(database, 'second', function(err, result2) {
           paramActor = result2
      });
      emotionDetection(database, 'second', function(err, result3) {
            a = result3.split('\n')
            paramEmotion = a[0]
            paramCorrect = a[1]
      });

      while (true) {
          if (paramGenre && paramActor && paramEmotion && paramCorrect){
              dbSet(paramGenre, paramActor, paramEmotion, paramCorrect)
              break
          }
      }
}

// 추천1 - 컨텐츠 기반(함수) - 테스트데이터 - 실행시수정
var recommend1 = function(db, id, callback){
  console.log('/recommend1 라우팅 함수 호출');
  var database = db
  var paramId = id
  // var paramId = 665; // 사용자 아이디 임의로 설정해놓음
  var titleArray = []
  var posterArray = []

  if(database) {
    // 파이썬 실행 처리 코드, 파이썬에서 처리한 추쳔영화 10개 가져옴
    // 1. child-process모듈의 spawn 취득
    const spawn = require('child_process').spawn;

    // 2. spawn을 통해 "python 파이썬파일.py" 명령어 실행
    const result = spawn('python', ['test3_2.py', paramId]);

    // 3. stdout의 'data'이벤트리스너로 실행결과를 받는다.
    result.stdout.on('data', function(data) {
      const stringResult = data.toString();
      console.log(stringResult)
      var array = stringResult.split('],[');

      titleArray = []
      titleArray = array[0].replace('[',"").split(',');
      console.log("titleArray:")
      console.log(titleArray)

      posterArray = []
      posterArray = array[1].replace(']',"").split(',');
      console.log("posterArray:")
      console.log(posterArray)

      var objToSend = {
        titleArray : titleArray,
        posterArray : posterArray
      }
      callback(null, objToSend)
    });
  }
  else{
      console.log('데이터베이스가 정의되지 않음...');
      callback(null, null)
      console.log("\n\n");
  }
};

// 추천2 - 유사 사용자(함수) - 테스트데이터 - 실행시수정
var recommend2 = function (id, callback) {
  console.log("/recommend2 (사용자 추천) 함수 호출");

  var paramId = id; // 사용자 아이디 받아오기
  // var paramId = 671; // 사용자 아이디 받아오기

  //파이썬 코드 실행 (유사 사용자 추천)
  const spawnSync = require("child_process").spawnSync; // child-process 모듈의 spawn 획득
  var getpython = "";

  //result에는 유저에게 추천할 사용자들 id 가 들어있음.
  const result = spawnSync("python", ["recommend/main.py", paramId]);

  if (result.status !== 0) {
    process.stderr.write(result.stderr);

    process.exit(result.status);
  } else {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    getpython = result.stdout.toString();
  }

  getRecommendUserList(getpython, function (err, result) {
    // console.dir(result);

    if (err) {
      console.log("추천 사용자 목록 가져오는 중에 에러 발생 ...");
      console.dir(err);
      callback(err, null)
    } else if (result.length > 0) {
      console.log("추천 사용자 목록 가져오기 성공");
      callback(null, result)
    }
    else {
      console.log("추천 사용자 목록 없음.");
      console.log("\n\n");
      callback(null, null)
    }
  });

  // async function searchMovieInfo(){ - movie_info.csv 에서 정보 찾는 코드 (후에 필요할까봐 주석처리해서 남겨둠)
  //   //파이썬 코드 실행 (영화데이터 존재 유무 확인)
  //   const spawnSync = require("child_process").spawnSync; // child-process 모듈의 spawn 획득

  //   const result = spawnSync("python", ["/Users/jeonsumin/node-pycharm/newTest.py", 'Toy Story']);

  //   if (result.status !== 0) {
  //     process.stderr.write(result.stderr);
  //     process.exit(result.status);
  //   } else {
  //     process.stdout.write(result.stdout);
  //     process.stderr.write(result.stderr);
  //     getpython = result.stdout.toString();

  //     // csv 파일에서 영화 정보 받아온 후 문자열 처리
  //     getpython = getpython.split(' | ')
  //     genres = (getpython[1])
  //     posterurl = console.log(getpython[2])
  // }}
};

// 추천3 - 선호 영화(함수)
var recommend3 = function(db, id, callback) { // 수정중
    console.log("/recommend3 (선호배우 영화 추천) 함수 호출");
    if(db){
        // 1.DB에서 선호 배우 가져오기
        db.likeModel.findById(id, function(err, result) {
            if(result.length>0){
                fActor = result[0].actors.toString()
                console.log('선호배우 : ' + fActor)
                const spawn = require('child_process').spawn;
                // 2. spawn을 통해 "python 파이썬파일.py" 명령어 실행
                const results1 = spawn('python', ['recommend3.py',fActor]);

                // 3. stdout의 'data'이벤트리스너로 실행결과를 받는다.
                results1.stdout.on('data', (data) => {
                    const stringResult = data.toString()

                    const array = stringResult.split('],[')

                    titleArray = []
                    titleArray = array[0].replace('[',"").split(',');
                    console.log("titleArray:")
                    console.log(titleArray)

                    posterArray = []
                    posterArray = array[1].replace(']',"").split(',');
                    console.log("posterArray:")
                    console.log(posterArray)

                    var objToSend = {
                      titleArray : titleArray,
                      posterArray : posterArray
                    }
                    callback(null, objToSend)
                });
            }
            else {
                db.UserModel.findById(id, function(err, result) {
                    if(result.length>0) {
                        console.log("likeModel 첫 생성")
                        const spawn = require('child_process').spawn;
                        const results2 = spawn('python', ["find_loveActor.py", result[0].reco2_id]); // 추천용 아이디 넣기

                        results2.stdout.on('data', (data) => {
                            const stringRe = data.toString().replace(/\r/g, "");
                            console.log('선호배우 추출 결과 : ' + stringRe);

                            var likeUser = new db.likeModel({
                              id: id,
                              actors: stringRe, // 받아온 영화의 배우 넣기
                            });

                            // save()로 저장
                            likeUser.save(function (err) {
                                if (err) {
                                  callback(err, null);
                                  return;
                                }
                                console.log("사용자 데이터 추가함");
                            });

                            fActor = stringRe
                            console.log("fActor : "+ fActor);
                            // 2. spawn을 통해 "python 파이썬파일.py" 명령어 실행
                            console.log("선호배우 영화 추천 목록 가져오기 실행***")
                            const results1 = spawn('python', ['recommend3.py',fActor]);

                            // 3. stdout의 'data'이벤트리스너로 실행결과를 받는다.
                            results1.stdout.on('data', (data) => {
                                const stringResult2 = data.toString()
                                console.log("선호배우 영화 목록 : "+stringResult2)
                                callback(null, stringResult2)
                            });
                        });
                    }
                });
            }
        });
    } else {
      console.log('데이터베이스가 정의되지 않음...');
      callback(null, null)
      console.log("\n\n");
    }
}

// 추천4 - 연도별 추천
var recommend4 = function(db, id, callback){
  console.log('/recommend4 라우팅 함수 호출');
  var database = db
  //var paramId = id
  var paramId = 1; // 사용자 아이디 임의로 설정해놓음
  var titleArray = []
  var posterArray = []

  if(database) {
    // 파이썬 실행 처리 코드, 파이썬에서 처리한 추쳔영화 10개 가져옴
    // 1. child-process모듈의 spawn 취득
    const spawn = require('child_process').spawn;

    // 2. spawn을 통해 "python 파이썬파일.py" 명령어 실행
    const result = spawn('python', ['yearly_recommend.py',paramId]);

    result.stdout.on('data', (data) => {
      console.log("------check!--------")
      const stringResult = data.toString()
      console.log(stringResult)
      var year = stringResult.slice(0,4)
      //console.log("year check : " + year)
      var array = stringResult.slice(5,).split('],[')
      //console.log("array check : " + array)

      titleArray = []
      titleArray = array[0].replace('[',"").split(',');
      console.log("titleArray:")
      console.log(titleArray)

      posterArray = []
      posterArray = array[1].replace(']',"").split(',');
      console.log("posterArray:")
      console.log(posterArray)

      var objToSend = {
        year : year,
        titleArray : titleArray,
        posterArray : posterArray
      }
      callback(null, objToSend)
    });
  }
  else{
      console.log('데이터베이스가 정의되지 않음...');
      callback(null, null)
      console.log("\n\n");
  }
};

// 추천 5- 리메이크영화 추천(함수)
var recommend5 = function (callback) {
  console.log("/recommend5 (리메이크영화 추천) 함수 호출");

  //파이썬 코드 실행 (유사 사용자 추천)
  const spawnSync = require("child_process").spawnSync; // child-process 모듈의 spawn 획득
  var getpython = "";

  //result에는 유저에게 추천할 사용자들 id 가 들어있음.
  const result = spawnSync("python", ["recommend/remake_recomment.py"]);

  if (result.status !== 0) {
    process.stderr.write(result.stderr);

    process.exit(result.status);
  } else {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    getpython = result.stdout.toString();
  }

  getRemakeList(getpython, function (err, result) {
    // console.dir(result);

    if (err) {
      console.log("리메이작 목록 가져오는 중에 에러 발생 ...");
      console.dir(err);
      callback(err, null)
    } else if (result) {
      console.log("리메이작 가져오기 성공");
      callback(null, result)
    }
    else {
      console.log("리메이크작 목록 없음.");
      console.log("\n\n");
      callback(null, null)
    }
  });
};

// 영화검색 페이지에 영화 정보 전달하기
var getAllMovieList = function(req, res){
  console.log('/getAllMovieList ( 영화 검색 화면을 위한 영화정보 전달 ) 라우팅 함수 호출');

  var database = req.app.get('database');

  if (database){
    var resultTitleArray = []
    var resultPosterArray = []
    var resultRunningTimeArray = []

    async function searchMovieInfo(){
      const existing = await database.MovieModel.find({}).clone() // 영화 스키마의 모든 정보를 찾고
      
      async function getInfo() {
        if (existing.length > 0) {
          // 형식 알려주면 형식에 맞춰서 구성 json구성 후
          // 프론트로 전달

          for (let i = 0; i<existing.length; i++){
            resultTitleArray[i] = existing[i].title;
            resultPosterArray[i] = existing[i].poster;
            resultRunningTimeArray[i] = existing[i].runningTime;
          }
        }
      }
      await getInfo()
    }
    async function main() {
      await searchMovieInfo()
      var objToSend = {
        title : resultTitleArray,
        poster : resultPosterArray,
        runningTime : resultRunningTimeArray
      }
      console.log('test\n', objToSend)
      res.status(200).send(JSON.stringify(objToSend))
      console.log('----------------------------------------------------------------------------')
    }
    main()
  }
  else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
    console.log('***ERROR!! 데이터 베이스 에러 ... : ', err);
    res.status(400).send();
    console.log('----------------------------------------------------------------------------')
  }
}

// 감상 시작 - 혼자보기 - 테스트데이터 - 실행시수정
var watchAloneStart = function(req, res){ // watch스키마 생성
  console.log('/watchAloneStart 라우팅 함수 호출됨')

  var database = req.app.get('database');

  var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기
  var parammovieTitle = req.body.movieTitle || req.query.movieTitle; // 감상중인 영화 제목 받아오기
  // -테스트데이터
  // var paramId = "smj8554"
  // var parammovieTitle = "toy story"

  if (database){

    var posterurl
    var genres 
    var runningTime
    var newWatch
    var every_emotion_array
    var every_eyetrack_array

    async function searchMovieInfo(){
      // console.log('req.body 정보 : {Id : ', paramId, " / movieTitle : ", parammovieTitle, " }")
      const existing = await database.MovieModel.find(
        { title : parammovieTitle }).clone()
      
      async function getInfo() {
        if (existing.length > 0) {
  
          posterurl = existing[0].poster
          genres = existing[0].genres
          runningTime = existing[0].runningTime
          emotion_check_count = Math.floor(runningTime / 10) + 1
          every_emotion_array = new Array(emotion_check_count)
          every_eyetrack_array = new Array(emotion_check_count)
          
          for (let i = 0; i<emotion_check_count; i++){
            every_emotion_array[i] = '-'
            every_eyetrack_array[i] = -1
          } 
        }
      }
      await getInfo()
    }
    async function createWatchResult(){
      newWatch = new database.WatchModel({ 
        'userId': paramId, 
        'movieTitle': parammovieTitle,
        'poster': posterurl,
        'genres': genres,
        'concentration': 0,
        'highlight_time': NaN,
        'emotion_count_array': [{ "HAPPY" : 0}, {"SAD" : 0}, {"ANGRY" : 0}, {"CONFUSED" : 0}, {"DISGUSTED": 0}, {"SURPRISED" : 0}, {"FEAR" : 0, }],
        'every_emotion_array' : every_emotion_array,
        'rating': 0,
        'comment': NaN,
        'sleepingCount ' : 0
      });

      newEyeTrack = new database.EyetrackModel({
        'userId': paramId, 
        'movieTitle': parammovieTitle,
        'every_concentration_array' : every_eyetrack_array
      })
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
          console.log('감상 결과 데이터 추가됨')
          // console.log('=> \n', newWatch, '\n');
          // res.status(200).send()
          // console.log('----------------------------------------------------------------------------')

          newEyeTrack.save(function(err) {
            if (err){
              console.log('***ERROR!! 집중도 기록 스키마 생성 및 저장 오류... : ', err)
              res.status(400).send() // 저장오류
              console.log('----------------------------------------------------------------------------')
            }
            else{
              console.log('집중도 기록 추가됨');
              // console.log('=> \n', newEyeTrack, '\n');
              res.status(200).send()
              console.log('----------------------------------------------------------------------------')
            }    
          });
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

// 사용자 집중도/감정 분석 - 테스트데이터 - 실행시수정
var watchImageCaptureEyetrack = async function(req, res){

  async function start() {
    var database = req.app.get("database");

    // eyetrack용 이미지를 s3버킷에 업로드 했다는 요청을 받으면

    var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기
    var parammovieTitle = req.body.movieTitle || req.query.movieTitle; // 감상중인 영화 아이디 받아오기
    var paramTime = req.body.time || req.query.time;
    var currentTime = paramTime / 10;
    var paramImgPath = req.body.imgPath || req.body.imgPath; // 버킷에 올라간 파일 경로

    var time = new Date();
    console.log("/watchImageCaptureEyetrack 라우팅 함수 호출됨. // ", paramTime, "초 // ", time.getMinutes(), "분", time.getSeconds(), "초");

    var count = 0; // 러닝타임 나누기 10 + 1 (러닝타임이 30초라면, 0초 10초 20초 30초 측정)
    var sleepCount = 0;
    var checkLimit = 0;
    var concentration_scene = 0;
    var tmp_concentration = 0;
    var getpython = "";

    if (database) {

      async function startEyetrack() {
        //파이썬 코드 실행
        const spawnSync = require("child_process").spawnSync; // child-process 모듈의 spawn 획득

        param = paramTime + "/" + paramId + "/" + parammovieTitle;
        //result에는 유저에게 추천할 사용자들 id 가 들어있음.
        const result = spawnSync("python", ["eyetracking/eyetrack.py", param]);

        if (result.status !== 0) {
          process.stderr.write(result.stderr);
          process.exit(result.status);
        } else {
          process.stdout.write(result.stdout);
          process.stderr.write(result.stderr);
          getpython = result.stdout.toString();
          // console.log('eyetrack.py 결과 형식 : ', typeof(getpython))
          concentration_scene = Number(getpython);
          addEyetrack_record(concentration_scene);
        }
      }

      async function addEyetrack_record(concentration_scene) {
      //   // 집중도 스키마에 집중도 기록을 배열로 저장

      //   const existing = await database.EyetrackModel.find({
      //     userId: paramId,
      //     movieTitle: parammovieTitle,
      //   });

      //   if (existing.length > 0) {
      //     // console.dir(existing)
      //     tmp_every_concentration_array = existing[0].every_concentration_array;
      //     if (paramTime == 0 || paramTime == "0") {
      //       tmp_every_concentration_array[0] = concentration_scene;
      //     } else {
      //       tmp_every_concentration_array[currentTime] = concentration_scene;
      //     }
      //     // tmp_every_concentration_array[paramTime/10] =  concentration_scene
      //   }
        // await database.EyetrackModel.updateOne(
        //   {
        //     // 장면별 집중도 배열 수정 //
        //     userId: paramId,
        //     movieTitle: parammovieTitle,
        //   },
        //   {
        //     $set: {
        //       every_concentration_array: tmp_every_concentration_array,
        //     },
        //   }
        // ).clone();

        try{
          await database.EyetrackModel.updateOne(
            {
              // 장면별 집중도 배열 수정 //
              userId: paramId,
              movieTitle: parammovieTitle,
              every_concentration_array : -1,
            },
            {
              $set: {
                'every_concentration_array.$' : concentration_scene
              },
            }
          ).clone();

        }catch(err){
          console.log("아이트래킹 정보 저장 중 오류 발생함. > \n", err);
        }
      
      }

      async function countlimit() {
      // 감상결과에 저장해놓은 (몇번 잤니?) 받아오기
      // 영화 러닝타임 알아오기 -> (몇번 잤니?) 가 용인되는 횟수보다 적은가 확인해야 하기때문
      /// ==> 기다려줘야함 1.
      // const existing = await database.WatchModel.find(
      //   {userId : paramId, movieTitle : parammovieTitle}).clone()

        const existing = await database.WatchModel.find({
          userId: paramId,
          movieTitle: parammovieTitle,
        });

        if (existing.length > 0) {
          // console.dir(existing);

          sleepCount = existing[0].sleepingCount;
          tmp_concentration = existing[0].concentration; // 현재까지의 집중도 합을 구해옴.

          concentration_scene = tmp_concentration + Number(getpython); // 현재 장면에서의 집중도를 더함.

          await database.WatchModel.updateOne(
            {
              // 감상목록 concentration 수정 //
              userId: paramId,
              movieTitle: parammovieTitle,
            },
            {
              $set: {
                concentration: concentration_scene,
              },
            }
          ).clone();

          await database.MovieModel.findByTitle(
            parammovieTitle,
            async function (err, result) {
              if (result.length > 0) {
                // console.dir(result[0])
                count = Math.floor(result[0].runningTime / 10) + 1;
                checkLimit = count / 2;
                // console.log(paramTime, " s: ", "러닝타임 : ", result[0].runningTime);
                // console.log(paramTime, " s/ ","용인 한계 : ", checkLimit, "현재 : ", sleepCount);
              }
            }
          ).clone();
        } else {
          console.log("WatchModel에 정보 없음");
          console.dir(
            await database.WatchModel.find({
              userId: paramId,
              movieTitle: parammovieTitle,
            })
          );
          res.status(400).send();
          console.log(
            "----------------------------------------------------------------------------"
          );
        }
      }
      // 자는 중이니?
      /// 2.
      async function isSleep() {
        if (Number(getpython) == 0) {
          console.log(paramTime, " 초: ", "집중도 분석 결과 : 자는 중");

          const existing = await database.WatchModel.find({
            userId: paramId,
            movieTitle: parammovieTitle,
          });
  
          sleepCount = existing[0].sleepingCount+1;
          
          // 결과 스키마의 (몇번잤니?) 수정
          /// 3.
          await database.WatchModel.updateOne(
            {
              userId: paramId,
              movieTitle: parammovieTitle,
            },
            {
              $set: {
                sleepingCount: sleepCount,
              },
            }
          ).clone();

          // sleepCount가 용인 횟수를 넘었을 때
          /// 4.
          if (sleepCount >= checkLimit) {
            console.log(paramTime, " 초: ", "분석 횟수 중 절반 이상 자는 중.");
            res.status(410).send(); // 자는 중이라고 프론트에 알려줌 - 410 // 프론트에 알려줘야 함.
            console.log(
              "----------------------------------------------------------------------------"
            );
          } else {
            console.log(paramTime, " 초: ", "아직 분석 횟수 중 절반 이하("+sleepCount+") 자는 중.");
            res.status(200).send();
            console.log(
              "----------------------------------------------------------------------------"
            );
          }
        } else {
          // 안 자는 중
          console.log(paramTime, " 초: ", "집중도 분석 결과 : 안 자는 중");

          path = ""; // path - 수정필요

          // 감정분석 시작 - 수정 필요
          // watchImageCaptureRekognition(database, paramId, parammovieTitle, paramImgPath, count, paramTime, function(err, result){
          watchImageCaptureRekognition(
            database,
            paramId,
            parammovieTitle,
            paramImgPath,
            paramTime,
            function (err, result) {
              if (result) {
                // console.log(paramTime, " s: ", "집중도 | 감정데이터 분석 및 정보 추가 완료");
                res.status(200).send();
                console.log(
                  "----------------------------------------------------------------------------"
                );
              } else {
                console.log(paramTime, " s: ", "집중도 성공 | 감정 실패");
                console.dir(err);
                res.status(400).send();
                console.log(
                  "----------------------------------------------------------------------------"
                );
              }
            }
          );
        }
      }

      async function main() {
        await startEyetrack();
        // await addEyetrack_record(concentration_scene)
        await countlimit();
        await isSleep();
        function delay(){
          return new Promise(function(resolve){
            setTimeout(resolve, 10000);
          });
        }
        await delay();
      }
      await main();
    } else {
      console.log("데이터베이스가 정의되지 않음...");
      res.status(400).send();
    }
  }
  await start()
};

// 같이보기 시 감정 분석
var watchTogetherImageCapture = async function(req, res){

  var database = req.app.get('database');

  // 같이보기 시 사진 캡쳐해서 올렸다고 하면

  var paramRoomCode = req.body.roomCode || req.query.roomCode; // roomCode알아오기
  var paramTime = req.body.time || req.query.time;

  console.log('/watchTogetherImageCapture 라우팅 함수 호출됨. // ', paramTime, "초");

  if (database){
    function rekognition_python() {
      //파이썬 코드 실행 (사용자 감정 분석)
      const spawnSync = require("child_process").spawnSync; // child-process 모듈의 spawn 획득
      var getpython = "";
      var path = paramRoomCode + '_' + paramTime + '.jpg'
  
      // (param) 이미지 경로 재설정 필요
      const result = spawnSync("python", ["rekognition/rekognition_together.py", path]);
  
      if (result.status !== 0) {
        process.stderr.write(result.stderr);
  
        process.exit(result.status);
      } else {
        process.stdout.write(result.stdout);
        process.stderr.write(result.stderr);
        getpython = result.stdout.toString();
        // console.log('rekognition.py 결과 형식 : ', typeof (getpython))
        //console.log(getpython)
      }
  
      // 문자 예쁘게 정리
      removedResult = getpython.replace(/\'/g, "");
      removedResult = removedResult.replace(/\[/g, "");
      removedResult = removedResult.replace(/\]/g, "");
      removedResult = removedResult.replace(/\\n/g, "");
  
      result_total = removedResult.split(", ");
      console.log('(같이보기)감정분석 결과 : ', result_total)
    }
    rekognition_python()

    res.status(200).send(JSON.stringify(result_total))
    console.log('----------------------------------------------------------------------------')
  } else {
    console.log("데이터베이스가 정의되지 않음...");
    res.status(400).send()
    console.log('----------------------------------------------------------------------------')
  }
};

// 감상 끝 - 혼자보기 - 테스트 데이터
// 맥스 감정 추출, 하이라이트 장면 처리(보안 위한 사진 삭제), 집중도, 정규화, 
var watchAloneEnd = async function(req, res){
  console.log('/watchAlonEnd 라우팅 함수 호출');

  // function delay(){
  //   return new Promise(function(resolve){
  //     setTimeout(resolve, 60000);
  //   });
  // }
  // await delay();

  async function main() {
    var database = req.app.get('database');

    var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기
    var parammovieTitle = req.body.movieTitle || req.query.movieTitle; // 감상중인 영화 제목 받아오기
    // var paramId = "smj8554"; // 사용자 아이디 받아오기
    // var parammovieTitle = 'toy story'; // 감상중인 영화 제목 받아오기
    var tmp_highlight_array // 정규화 전 배열
    var normalization_array // 정규화 후 배열
    var highlight_time // 감정의 폭이 큰 시간
    var concentration_sum // 평균치를 내기 전 집중도의 합
    var movie_running_time // 영화 러닝타임
    var ConcentrationPreScopeAverage // 범위 변환 전 집중도 평균 (0~100)
    var count_eyetracking // 10초간격으로 집중도 측정한 횟수

    var movie_genre // 영화 장르
    var movie_poster // 영화 포스터

    var category=''

    if (database) {
      // 감상결과 기록을 찾는 함수. 하이라이트 계산 배열 찾아옴.
      async function getWatchResult(userId, movieTitle) {
        var existing_watch = await database.WatchModel.find({
          userId: userId,
          movieTitle: movieTitle,
        }).clone();

        if (existing_watch) {
          console.log("해당 유저의 해당 영화의 감상 기록 찾음.");
          // console.log(existing_watch[0]);
          tmp_highlight_array = existing_watch[0].highlight_array;
          // console.log("테스트 tmp_highlight_array");
          // console.dir(tmp_highlight_array);
          concentration_sum = existing_watch[0].concentration;

          // 하이라이트 장면 찾기
          highlight_time = 0;
          highlight_diff = 0;
          if (tmp_highlight_array.length < 1) {
            category = "eyetrack"
            // 감정폭 측정한 기록이 없으면 집중도 측정 기록을 하이라이트~ 활용.
            const existing = await database.EyetrackModel.find({
              userId: paramId,
              movieTitle: parammovieTitle,
            });
            if (existing.length > 0) {
              await getEyetrackRecord(paramId, parammovieTitle);
            }

          } 
          else {
            // 감정폭 측정한 기록이 있으면 감정폭 최대치를 하이라이트 장면으로 선정
            category = "emotion"

            for (let i = 0; i < tmp_highlight_array.length; i++) {
              if (tmp_highlight_array[i].emotion_diff > highlight_time) {
                highlight_time = tmp_highlight_array[i].time;
                highlight_diff = tmp_highlight_array[i].emotion_diff;
              }
            }
          }

          console.log('하이라이트 시간 : ', highlight_time, " / 하이라이트 값 : ", highlight_diff);
        

          await normalization(category, tmp_highlight_array, function (error, result) {
              if (error){
                console.log("정규화 실패 : ", error)
                res.status(400).send();
              }
              normalization_array = result;
          });
          

        } else {
          console.log("해당 유저의 해당 영화의 감상 기록 존재하지 않음.");
          res.status(400).send();
        }
      }
      // 감정폭 측정기록 없을 때, 집중도 기록 가져오는 함수
      async function getEyetrackRecord(paramId, parammovieTitle){
        const existing = await database.EyetrackModel.find({userId : paramId, movieTitle : parammovieTitle})

        if (existing.length > 0) {
          tmp_highlight_array = existing[0].every_concentration_array;

          // 감정폭 측정한 기록이 있으면 감정폭 최대치를 하이라이트 장면으로 선정
          for (let i = 0; i < tmp_highlight_array.length; i++) {
            if (tmp_highlight_array[i] > highlight_diff) {
              highlight_time = i*10;
              highlight_diff = tmp_highlight_array[i];
            }
          }
        }
      }

      // 하이라이트 이미지를 버킷에 넣고 나머지 사진 삭제하는 함수
      async function HighlightImageTrans_ToFolder(highlightT, id, title) {
        // param으로 계산완료한 하이라이트 시간 전달받고
        // time.jpg 형식으로된 이미지 파일 삭제 ==> 이미지명은 나중에 수정 필요

        ///필요 코드 : param.jpg만 제외하고 삭제,
        ///로직 : param.jpg를 다른 폴더로 옮기고 나머지 파일들은 삭제

        function deleteImg_from_python(time, id, title) {
          //파이썬 코드 실행 (사용자 감정 분석)
          const spawnSync = require("child_process").spawnSync; // child-process 모듈의 spawn 획득
          var getpython = "";

          param = time + "/" + id + "/" + title;

          const result = spawnSync("python", ["bucket_imgDelete.py", param]);

          if (result.status !== 0) {
            process.stderr.write(result.stderr);

            process.exit(result.status);
          } else {
            process.stdout.write(result.stdout);
            process.stderr.write(result.stderr);
            console.log(time, ".jpg 사진 삭제 완료");
          }
        }
        deleteImg_from_python(highlightT, id, title);
      }
      // 영화 정보 찾기 -> 집중도 평균치 계산위해
      async function getMovieInfo(movieTitle) {
        var existing_movie = await database.MovieModel.find({
          // 영화 정보 데베에서 추출
          title: movieTitle,
        }).clone();

        if (existing_movie.length > 0) {
          console.log("해당 영화의 감상 기록 찾음.");

          movie_genre = existing_movie[0].genres;
          movie_poster = existing_movie[0].poster;
          movie_running_time = existing_movie[0].runningTime;
          count_eyetracking = Math.floor(movie_running_time / 10) + 1; // 집중도 계산할 횟수 구함 (러닝타임 나누기 10(10초간격으로 측정하기 때문))
          ConcentrationPreScopeAverage = Math.floor(concentration_sum / count_eyetracking); // 집중도 평균 계산

          console.log('집중도평균 계산 count = ', count_eyetracking)
          console.log('집중도평균 계산 합 : ', concentration_sum)
          console.log('집중도평균 계산 결과 : ', ConcentrationPreScopeAverage)
        } else {
          console.log("해당 영화의 기록 존재하지 않음.");
          res.status(400).send();
          console.log('----------------------------------------------------------------------------')
        }
      }
      // 감정 부합 확인
      async function emotionCorrectTest() {
        var resultSend=0;
        await database.likeModel.findById(paramId, function (err, result1) {
            if (err) {
              callback(err, null);
              return;
            }

            if (result1.length > 0) {
              console.log(result1[0].correctModel);
              array_test = result1[0].correctModel.split(",");
              array_test.pop();
              console.log(array_test.length);
            }
          })
          .clone();

        async function updateResultPer(resultSend) {
            await console.log("결과값 확인(0~100) : "+resultSend);
            await database.likeModel.updateOne(
                { id: paramId },
                { $set: { resultEmotionPer : resultSend },}
            );
        }

        await database.WatchModel.findById(paramId, function (err, result2) {
            if (err) {
              callback(err, null);
              return;
            }

            if (result2.length > 0) {
              var emotionArray = result2[0].every_emotion_array;
              // console.log(emotionArray)
              var len_test = result2[0].every_emotion_array.length;
              var count_test = 0;
              var allCount = 0;
              for (i = 0; i < len_test; i++) {
                if (array_test[i] == emotionArray[i]) {
                  count_test += 1;
                }
                allCount+=1;
              }
              console.log("횟수 : " + count_test + " 전체 횟수 : "+allCount);
              resultSend = ((count_test/allCount)*100).toFixed(3)

              console.log("결과값 확인(0~100) : "+resultSend);
              updateResultPer(resultSend);
            }
          }
        ).clone();

      }

  // user_info.csv 업데이트 - 평점 가공 (감정부합도+집중도+평점)
      async function ratingUpdate(){
          database.WatchModel.find({ userId : paramId, title : parammovieTitle }, function(err, results) {
            if (err) {
              callback(err, null);
              return;
            }

            if(results.length>0) {
              const existing = results[0]
              //console.log(results[0]);
              //console.log(results[0].rating);
              const spawn = require('child_process').spawn;

              database.UserModel.findById(paramId, function (err, result2) {
                    if (err) {
                      return;
                    }

                    if (result2.length > 0) {
                      var recoID = result2[0].reco2_id
                      console.log("recoID: "+recoID)
                      // 2. spawn을 통해 "python 파이썬파일.py" 명령어 실행
                      const result = spawn('python', ['recommend/findMovieID.py', recoID, results[0].rating, results[0].resultEmotionPer, results[0].concentration, parammovieTitle]);
                      result.stdout.on('data', function(ls_result){
                          console.log(ls_result.toString());
                      })
                      return;
                    }
                }
              )

            }
            else {
              console.log("DB에서 해당 영화를 찾지 못했습니다.");
              return;
            }
          });

      }
      async function main() {
        await emotionCorrectTest()

        ////////////////////////// 하이라이트 정규화 //////////////////////////
        await getWatchResult(paramId, parammovieTitle);
        /////////////////////////////////////////////////////////////////

        ////////////////////////// 집중도 처리 //////////////////////////
        await getMovieInfo(parammovieTitle);

        await database.WatchModel.updateOne(
          {
            // 감상목록 highlight_array 수정 //
            userId: paramId,
            movieTitle: parammovieTitle,
          },
          {
            $set: {
              highlight_time: highlight_time,
              highlight_array: normalization_array,
              concentration: ConcentrationPreScopeAverage / 10, // 0~10 값으로 변환
            },
          }
        );

        await HighlightImageTrans_ToFolder(
          highlight_time,
          paramId,
          parammovieTitle
        );

        // rekognition안의 시간대별 감정 측정 결과를 기록해놓은 데이터 삭제
        await database.RekognitionModel.deleteMany({
          userId : paramId,
          movieTitle : parammovieTitle
        });

        // eyetracking안의 시간대별 감정 측정 결과를 기록해놓은 데이터 삭제
        await database.EyetrackModel.deleteMany({
          userId : paramId,
          movieTitle : parammovieTitle
        });

        await ratingUpdate();
        var objToSend = {
          genres : movie_genre,
          poster : movie_poster
        }
        res.status(200).send(JSON.stringify(objToSend));
        console.log('----------------------------------------------------------------------------')
      }
      main();
      return;

    }
    else { // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
      console.log('***ERROR!! 데이터 베이스 에러 ... : ', err);
      res.status(400).send();
      console.log('----------------------------------------------------------------------------')
    }
  }
  main();

};

var watchTogetherEnd = function(req, res){

  console.log('/watchTogetherEnd 라우팅 함수 호출');
  var database = req.app.get('database');

  if (database){

    var paramRoomCode = req.body.roomCode || req.query.roomCode; // 룸코드 받아오기

    async function find_room(){

      var existing_room = await database.RoomModel.find({
        roomCode : paramRoomCode
      }).clone();

      if (existing_room) {
        console.log('존재하는 룸 확인됨.')
        var a = await database.RoomModel.deleteOne({
          roomCode : paramRoomCode.toString()
        });
        console.log('룸코드 [' + paramRoomCode + '] 삭제 완료')
        res.status(200).send()
        console.log('----------------------------------------------------------------------------')
      }else {
        console.log("해당하는 방 정보를 찾을 수 없음.")
        res.status(400).send()
        console.log('----------------------------------------------------------------------------')
      }
    }

    find_room()
  }else {
    console.log("데이터베이스가 정의되지 않음...");
    res.status(400).send()
    console.log('----------------------------------------------------------------------------')
  }

}

// 감상정보 업데이트 : 감상 후 작성되는 감상평,평점 콜렉션에 반영 
var addReview = function(req, res){
  console.log('/addReview 라우팅 함수 호출');
  console.log(req.body)

  var database = req.app.get('database');
  var paramId = req.body.id || req.query.id; // 사용자 아이디 받아오기
  var parammovieTitle = req.body.movieTitle || req.query.movieTitle; // 감상중인 영화 제목 받아오기
  var paramRating = req.body.rating || req.query.rating // 사용자가 매긴 평점
  var paramComment =req.body.comment || req.query.comment // 사용자가 작성한 한줄 평
  
  async function getInfo() {

    const existing = await database.WatchModel.find(
      { userId : paramId, title : parammovieTitle }).clone() 

    if (existing.length <= 0) {
      res.status(400).send();
    }
  }
  async function addreview(){
    await database.WatchModel.updateOne({ // 감상평,평점 업데이트
      userId: paramId,
      movieTitle: parammovieTitle
    }, {  
      $set: {
        rating: parseInt(paramRating),   
        comment : paramComment
      }
    });
    await res.status(200).send()
  }
  async function main(){
    getInfo()
    addreview()
  }
  main()
};

// 회원가입 인증메일 - 발신자정의 필요 - 실행시수정
var email = function(req, res){
    console.log('/email(이메일 인증) 라우팅 함수 호출');
    var database = req.app.get('database');
    if(database){
  
        var paramEmail = req.body.email;
  
        // 발신자 정의.
        var app_email = personal_info.app_email;
        var app_pass = personal_info.app_pass;

        console.log('수신자 : ', paramEmail);
  
        sendEmail(app_email, app_pass, paramEmail, function(err, results){
  
          if(err){
            console.log('이메일 발송 실패')
            res.status(400).send();
            console.log('----------------------------------------------------------------------------')
          }
  
          if (results){
            console.log('mail 전송을 완료하였습니다.');
            res.status(200).send(JSON.stringify(results));
            console.log('----------------------------------------------------------------------------')
          }
        })
    }
    else{
        console.log('데이터베이스가 정의되지 않음...');
        res.status(400).send();
        console.log('----------------------------------------------------------------------------')
    }
};

var makeRoom = async function (req, res) {
  console.log("/makeRoom 라우팅 함수 호출됨");
  var database = req.app.get("database");
  var paramId = req.body.id || req.query.id;
  var paramRole = req.body.role || req.query.role;

  var RoomToken;
  var RoomCode;

  async function getToken() {
    RoomCode = Math.random().toString(36).substr(2,11); // 랜덤으로 방 초대코드 생성
    // const: 상수 선언 => 선언과 동시에 리터럴값 할당 및 이후 재할당 불가

    // express 및 agora-access-token 에 대한 참조 추출
    // const express = require("express");
    const app = req.app;

    // 자격 증명과 요청 수신하는 데 사용할 포트 추가
    const PORT = 3001;
    const APP_ID = personal_info.APP_ID;
    const APP_CERTIFICATE = personal_info.APP_CERTIFICATE;

    // 첫번째 함수: 브라우저가 응답을 캐시하지 않게 => 항상 새로운 토큰을 얻음
    const nocache = (req, res, next) => {
      res.header("Cache-Control", "private, no-store", "must-revalidate");
      res.header("Expires", "-1");
      res.header("Pragma", "no-cache");
      next(); // 첫번째 미들웨어 함수 > 다음 함수 계속
    };

    // 두 번째 함수: 요청 처리 및 JSON 응답 반환
    // Agora RTC Token 생성
    const generateRTCToken = (req, res) => {
      // 응답 헤더 설정 - set response header
      res.header("Access-Control-Allow-Origin", "*");

      // 요청 매개변수 가져오기 - get channel name
      const channelName = req.params.channel; //req.query.channelName;
      if (!channelName) {
        return res.status(500).json({ error: "channel is required" });
      }

      // get uid
      let uid = req.params.uid; // req.query.uid;
      if (!uid || uid === "") {
        uid = 0;
        return res.status(500).json({ error: "uid is required" });
      }

      // get role
      let role = RtcRole.SUBSCRIBER;
      //if (req.query.role == 'publisher') {
      if (req.params.role === "publisher") {
        role = RtcRole.PUBLISHER;
      }

      // 토큰 만료 시간 설정 (선택적으로 전달) - get the expire time
      // let expireTime = req.query.expireTime;
      let expireTime = req.query.expiry;
      if (!expireTime || expireTime == "") {
        expireTime = 300; // 5분 - 확실하진 않음
      } else {
        expireTime = parseInt(expireTime, 10);
      }

      // 만료 시간 계산 - calculate privilege expire time
      const currentTime = Math.floor(Date.now() / 1000);
      const privilegeExpireTime = currentTime + expireTime;

      // 토큰 구축 - build the token
      // const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
      let token;
      if (req.params.tokentype === "userAccount") {
        token = RtcTokenBuilder.buildTokenWithAccount(
          APP_ID,
          APP_CERTIFICATE,
          channelName,
          uid,
          role,
          privilegeExpireTime
        );
      } else if (req.params.tokentype === "uid") {
        token = RtcTokenBuilder.buildTokenWithUid(
          APP_ID,
          APP_CERTIFICATE,
          channelName,
          uid,
          role,
          privilegeExpireTime
        );
      } else {
        return res.status(500).json({ error: "token type is invalid" });
      }

      // 응답 반환 - return the token
      return res.json({ token: token });
    };

    // GET 방식 - 경로
    // app.get('/access_token', nocache, generateAccessToken);
    app.get("/rtc/:channel/:role/:tokentype/:uid", nocache, generateRTCToken);

    // 서버가 준비되고 지정된 포트에서 수신 대기하면 메소드 구현하고 포트와 콜백 전달
    var server = app.listen(PORT, () => {
      console.log(`Listening on port: ${PORT}`);
    });

    var url = "http://127.0.0.1:3001/rtc/"+RoomCode+"/"+paramRole+"/userAccount/"+paramId;
    request(url, function (error, response, html) {
      if (error) {
        throw error;
      }

      html = html.toString().split('":"')
      result = html[1].replace('"}','')
      RoomToken = result
      
      
      // port 종료
      server.close(function() {
        console.log('토큰 발급서버 종료')
      })

      vaildToken(RoomToken, RoomCode)
    });

  }

  async function vaildToken(RoomToken, RoomCode) {
    makeroom(database, RoomToken, RoomCode, function (err, result) {
      if (err) {
        console.log("방 생성 중 에러 발생");
        console.dir(err);
        return;
      }

      if (result.length > 0) {
        console.log("초대 코드 중복, 다시 생성..");

        getToken();
      } else {
        var room = new database.RoomModel({ roomToken : RoomToken, roomCode: RoomCode });
        console.log("RoomCode : " + RoomCode);
        console.log("RoomToken : " + RoomToken);

        // save()로 저장
        room.save(function (err) {
          if (err) {
            return;
          }
          console.log("새로운 방 등록");
          // 찾은 결과 전송
          var objToSend = {
            roomCode: RoomCode,
            roomToken : RoomToken
          };
          res.status(200).send(JSON.stringify(objToSend));
          console.log('----------------------------------------------------------------------------')
        });
      }
    });
  }

  if (database) {
    async function main() {
      await getToken()
    }
    main();
  } else {
    console.log("데이터베이스가 정의되지 않음...");
    res.status(400).send();
    console.log('----------------------------------------------------------------------------')
  }
};

// 같이보기 방 입장
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

      else if (result){
        console.log('초대 코드에 해당하는 함께보기 방 검색 성공');

        var objToSend = {
          roomToken : result[0].roomToken
        };
        res.status(200).send(JSON.stringify(objToSend));
        console.log('----------------------------------------------------------------------------')
      }

      else{
        res.status(400).send();
        console.log('초대 코드에 해당하는 같이 보기 방 없음...');
        console.log('----------------------------------------------------------------------------')
      };

    })
  }
  else{
    console.log('데이터베이스가 정의되지 않음...');
    res.status(400).send();
    console.log('----------------------------------------------------------------------------')
  }

};

// 로그아웃
var logout = function (req, res) {
    res.status(200).send();
    console.log('로그아웃합니다..');
    console.log('----------------------------------------------------------------------------')
};

// 함수 시작

var authUser = functionUser.authUser;

var signUp = functionUser.signUp;

var enterRoom = functionUser.enterRoom;

var getRecommendUserList = functionUser.getRecommendUserList;

var getRemakeList = functionUser.getRemakeList;

var makeroom = functionUser.makeroom;

var sendEmail = functionUser.sendEmail;

var scene = functionUser.scene;

var watchImageCaptureRekognition = functionUser.watchImageCaptureRekognition;

var normalization = functionUser.normalization;


module.exports.signup = signup;
module.exports.login = login;
module.exports.watchlist = watchlist;
module.exports.watchresult = watchresult;
module.exports.enterroom = enterroom;
module.exports.email = email;
module.exports.makeRoom = makeRoom;
module.exports.sceneAnalyze = sceneAnalyze;
module.exports.logout = logout;
module.exports.getAllMovieList = getAllMovieList;
module.exports.watchAloneStart = watchAloneStart;
module.exports.watchTogetherEnd = watchTogetherEnd;
module.exports.watchImageCaptureEyetrack = watchImageCaptureEyetrack;
module.exports.watchTogetherImageCapture = watchTogetherImageCapture;
module.exports.watchAloneEnd = watchAloneEnd;
module.exports.addReview = addReview;