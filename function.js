var nodemailer = require('nodemailer');

// 감상결과 가져오기
var getWatchResult = function(db, userid, movieTitle, callback){
  console.log('getWatchResult(감상결과 가져오기) 호출됨. userid : ' + userid + ', movietitle : ' + movieTitle);

  db.WatchModel.findById(userid, function(err, results_id) {

        if (err) {
          callback(err, null);
          return;
        };

        if(results_id.length > 0) {

          console.log(userid + '의 감상결과 발견');
          db.WatchModel.findByMovieTitle(movieTitle, function(err, results_movie) {

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
};

// 사용자 로그인
var authUser = function(db, id, password, callback) {
  console.log('authUser(로그인)함수 호출됨');

  // 아이디를 사용해 검색
  db.UserModel.findById(id, function(err, results_id){

      if (err) {
          callback(err, null);
          return;
      }

      // 해당 id 를 통해 정보가 존재하는지 확인
      if (results_id.length > 0) {
          console.log('아이디와 일치하는 사용자 찾음');

          // 존재하는 데이터의 비밀번호 확인
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

// 사용자 로그인 : 감상기록 유무 확인
var checkRecord = function(db, id, callback){

  console.log('checkRecord(감상기록 존재 유무 확인)함수 호출됨 ');

  // 아이디를 사용해 검색
  db.WatchModel.findById(id, function(err, results){

      if (err) {
          callback(err, null);
          return;
      }

      console.log('아이디 %s로 검색됨',id);

      if (results.length > 0) { // 감상기록 있음
          callback(null, results);
      }
      else { // 감상기록 없음
          callback(null, null);
      }
  });

};

// 사용자 회원가입
var signUp = function(db, id, password, name, callback) { // callback 함수는 함수를 호출하는 쪽에 결과 객체를 보내기 위해 쓰임
  console.log('signUp 함수 호출됨');

  var getpython = "";
  async function get_reco_id(){

    //파이썬 코드 실행 (추천용 아이디 발급)
    const spawnSync = require("child_process").spawnSync; // child-process 모듈의 spawn 획득

    // (param 없음)
    const result = spawnSync("python", ["recommend/getUserId_reco2.py"]);

    if (result.status !== 0) {
      process.stderr.write(result.stderr);
      process.exit(result.status);
    } else {
      process.stdout.write(result.stdout);
      process.stderr.write(result.stderr);
      getpython = result.stdout.toString();
      getpython = Number(getpython)
    }
  }

  async function addUser() {
    // 아이디를 사용해 검색 - 아이디 중복 검사
    db.UserModel.findById(id, function (err, results) {
      if (err) {
        console.log("회원가입 중 에러 발생");
        console.dir(err);
        return;
      }

      if (results.length > 0) {
        console.log('아이디 : [', results[0].id, ']로 가입된 정보가 존재합니다.');
        callback('duplicated ID', null)
      } else {
        var user = new db.UserModel({ 
          id: id, 
          password: password, 
          name: name,
          reco2_id : getpython});

        // save()로 저장
        user.save(function (err) {
          if (err) {
            callback(err, null);
            return;
          }
          console.log("사용자 데이터 추가함");
          callback(null, user);
        });
      }
    });
  }

  async function main(){
    await get_reco_id()
    await addUser()
  }

  main()
};

// 같이보기 방 입장
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
};

// 유사사용자 영화목록 추천
var getRecommendUserList = function(result, callback){

  console.log('getRecommendUserList 호출됨.');

  splitResult = result.split('] [')

  ids = splitResult[0];
  ids = ids.split(", ")

  titles = splitResult[1];
  titles = titles.split("', '")

  posters = splitResult[2];
  posters = posters.split("', '")

  resultArray = []

  for (let i = 0; i<5; i++){
    var s = i*5;
    var e = s+5;
    var c = 0
    var resultTitleArray = []
    var resultPosterArray = []

    for (let j = s; j < e; j++){
      resultTitleArray[c] = titles[j]
      resultPosterArray[c] = posters[j]
      c = c+1
    }
    var obj = {
      userId : ids[i],
      title : resultTitleArray,
      poster : resultPosterArray
    }
    resultArray[i] = obj
  }

  var count = resultArray.length
  console.log('===================\n결과 갯수 : ', count)

  console.log("============================ 처리 결과 ============================\n", resultArray, "\n============================ 처리 결과 ============================\n");


  callback(null, resultArray)
};

// 같이보기 방 생성
var makeroom = function (db, roomcode, callback) {
  db.RoomModel.findByRoomCode(roomcode, function(err, result){
    if(err){
      callback(err, null);
      return;
    }

    else if(result.length > 0){
      console.log('입력된 코드에 해당하는 같이보기 방 찾음.생성불가');

      callback(null, result);
    }

    else{
      callback(null, '');
      return;
    }
  });
};

// 인증 이메일 전송
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

// 장면분석
var scene = function(db, id, gen, actor, emotion,correctModel,callback){
    console.log('sceneAnalyze 호출됨' + id + ', ' + gen + ', ' + actor+' , ' + emotion+', '+correctModel);

  // 아이디를 사용해 검색
  db.likeModel.findById(id, function(err, results){
       if (err) {
          console.log('장면분석 중 에러 발생');
          console.dir(err);
          return;
       }

        if(results.length < 0) {
          console.log('회원정보가 없습니다.');
        }
        else {
           var user = new db.likeModel({'id' : id, 'genres': gen, 'actors' : actor, 'emotions':emotion, 'correctModel':correctModel});

           // save()로 저장
           user.save(function(err) {
           if(err) {
                  callback(err, null);
                  return;
           }
           console.log('사용자 장면분석 데이터 추가함');
           callback(null, user);
           });
        }
  })
};

// 사용자 감정분석
var watchImageCaptureRekognition = function (db, userId, movieTitle, path, callback) {

  console.log('rekognition 함수 호출')

  var result_total // python 감정분석 실행 결과 배열

  //////////////////////////////////////////////////감정분석 파이썬 코드 실행//////////////////////////////////////////////////
  function rekognition_python() {
    //파이썬 코드 실행 (사용자 감정 분석)
    const spawnSync = require("child_process").spawnSync; // child-process 모듈의 spawn 획득
    var getpython = "";

    // (param) 이미지 경로 재설정 필요
    const result = spawnSync("python", ["rekognition/rekognition.py", path]);

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

    result_total = removedResult.split(", ");
  }
  rekognition_python()
  //////////////////////////////////////////////////감정분석 파이썬 코드 완료//////////////////////////////////////////////////

  //////////////////////////////////////////////////감정의 폭 관련 코드 시작//////////////////////////////////////////////////
  var calm_count = 0
  var calm_sum = 0
  var calm_emotion_count = 0
  var calm_emotion_sum = 0
  var calm_emotion_calm_sum = 0

  // rekognition모델 10초전의 기록을 찾아서 변수에 넣어야 함.
  var tmp_calm_count = 0
  var tmp_calm_sum = 0
  var tmp_calm_emotion_count = 0
  var tmp_calm_emotion_sum = 0
  var tmp_calm_emotion_calm_sum = 0

  // 감정의 폭 계산 결과
  var highlight_emotion_diff = 0
  var highlight_emotion_time = 0


  // watch모델에 기록된 감상결과
  var tmp_emotion_array = []

  // 수정된 감상결과
  var edit_emotionArray = []

  async function getPastRekognition(userId, movieTitle, time){ // 10초 전의 rekognition 기록을 찾는 함수.

    var pastTime = time - 10

    var existing_re = await db.RekognitionModel.find({
      userId : userId, movieTitle : movieTitle, time : pastTime
    }).clone()

    if (existing_re.length>0){
      console.log('10초 전의 rekognition 기록 찾음.', existing_re[0])

      tmp_calm_count = existing_re[0].calm_count
      tmp_calm_sum = existing_re[0].calm_sum
      tmp_calm_emotion_count = existing_re[0].calm_emotion_count
      tmp_calm_emotion_sum = existing_re[0].calm_emotion_sum
      tmp_calm_emotion_calm_sum = existing_re[0].calm_emotion_calm_sum
    }
    else {
      console.log('10초 전의 rekognition 기록 존재하지 않음.')
    }
  }


  async function getWatchResult(userId, movieTitle){ // 감상결과 기록을 찾는 함수.

    var existing_watch = await db.WatchModel.find({
      userId : userId, movieTitle : movieTitle
    }).clone()

    if (existing_watch.length>0){
      console.log('해당 유저의 해당 영화의 감상 기록 찾음.')
      tmp_emotion_array = existing_watch[0].emotion_array
      return true;
    }
    else {
      console.log('해당 유저의 해당 영화의 감상 기록 존재하지 않음.')
      callback(null, null); // 감상기록을 찾지 못하면 콜백으로 돌아가버림 - 문제가 있는것.
    }
  }

  async function getCalmConcentration(){ // 감정분석 후 calm 의 confidence를 찾기 위한 함수
    for (var i = 0; i < 15; i += 2){
      if (result_total[i] == "CALM"){
        calm_emotion_calm_sum = Number(tmp_calm_emotion_calm_sum) + Number(result_total[i+1])
        break;
      }
    }
  }
  async function check_highlight(){

      calm_emotion_count = tmp_calm_emotion_count + 1
      calm_emotion_sum = Number(tmp_calm_emotion_sum) + Number(result_total[1])
      console.log('calm_emotion_sum: ', calm_emotion_sum)

      await getCalmConcentration();

      console.log('tmp_calm_count : ', tmp_calm_count)
      console.log('calm_emotion_count : ', calm_emotion_count)

      if (tmp_calm_count == 0){
        calm_count = 0;
        calm_sum = 0;
        calm_emotion_count = 0;
        calm_emotion_sum = 0;
        calm_emotion_calm_sum = 0;
      }

      else if (tmp_calm_count == 1){
        calm_count = 0;
        calm_sum = 0;
        calm_emotion_count = 0;
        calm_emotion_sum = 0;
        calm_emotion_calm_sum = 0;
      }

      else if (tmp_calm_count == 2){
        if (calm_emotion_count == 2){
          // 감정의 폭 계산
          calm_aver = (tmp_calm_sum / 2)
          calm_emotion_calm_aver = (calm_emotion_calm_sum / 2)
          calm_emotion_aver = (calm_emotion_sum / 2)
          highlight_emotion_diff = (((calm_aver - calm_emotion_calm_aver) + calm_emotion_aver)/2)
          highlight_emotion_time = time

          // 초기화
          calm_count = 0;
          calm_sum = 0;
          calm_emotion_count = 0;
          calm_emotion_sum = 0;
          calm_emotion_calm_sum = 0;
        }
      }
  }

  async function edit_emotion_array(first){
    if (first == 'HAPPY') {
      edit_emotionArray[0].HAPPY += 1
      await check_highlight()
    }
    else if (first == 'SAD') {
      edit_emotionArray[0].SAD += 1
      await check_highlight()
    }
    else if (first == 'ANGRY') {
      edit_emotionArray[0].ANGRY += 1
      check_highlight()
    }
    else if (first == 'CONFUSED') {
      edit_emotionArray[0].CONFUSED += 1
      check_highlight()
    }
    else if (first == 'DISGUSTED') {
      edit_emotionArray[0].DISGUSTED += 1
      check_highlight()
    }
    else if (first == 'SURPRISED') {
      edit_emotionArray[0].SURPRISED += 1
      check_highlight()
    }
    else if (first == 'FEAR') {
      edit_emotionArray[0].FEAR += 1
      check_highlight()
    }
    else if (first == 'CALM') {
      calm_count = tmp_calm_count + 1
      calm_sum = tmp_calm_sum + result_total[1]

      if (tmp_calm_emotion_count == 1){
        calm_emotion_count = 0
        calm_emotion_sum = 0
        calm_emotion_calm_sum = 0
      }
    }
  }


  async function main(){

    await getPastRekognition(userId, movieTitle, time)
    console.log('====================첫번째 완료====================')

    await getWatchResult(userId, movieTitle);
    console.log("====================두번째 완료====================");

    // watch model 기록안에 있던 emotion_array를 대입.
    edit_emotionArray = tmp_emotion_array;
    console.log("확인필요 ; ", edit_emotionArray[0]);
    console.log("확인필요 ; ", edit_emotionArray[0].SAD);

    await edit_emotion_array(result_total[0])
    console.log('====================네번째 완료====================')

    if (highlight_emotion_time == 0){
      await db.WatchModel.updateOne({ // 감상목록 emotion_array 수정 //
        userId: userId,
        movieTitle: movieTitle
      }, {
        $set: {
          emotion_array: edit_emotionArray,
        },
      })
    }
    else {
      await db.WatchModel.updateOne({ // 감상목록 emotion_array 수정 //
        userId: userId,
        movieTitle: movieTitle
      }, {
        $set: {
          emotion_array: edit_emotionArray,
        },
        $push : {
          highlight_array: {
            time : highlight_emotion_time,
            emotion_diff : highlight_emotion_diff
          }
        }
      })
    }
    console.log('====================다섯번째 완료====================')

    // 감정분석 기록 추가 //
    var newRekognition = await new db.RekognitionModel({
      'userId': userId, 'movieTitle': movieTitle, 'time': time,
      'firstEmotion': result_total[0],
      'firstConfidence': result_total[1],
      'secondtEmotion': result_total[2],
      'thirdEmotion': result_total[4],
      'fourthEmotion': result_total[6],
      'fifthEmotion': result_total[8],
      'sixthEmotion': result_total[10],
      'seventhEmotion': result_total[12],
      'eighthEmotion': result_total[14],
      'calm_count': calm_count, // calm 횟수
      'calm_sum' : calm_sum, // calm confidence 합
      'calm_emotion_count' : calm_emotion_count, // calm 2번 후에 emotion 횟수
      'calm_emotion_sum' : calm_emotion_sum, // calm 2번 후에 emotion confidence 합
     'calm_emotion_calm_sum' : calm_emotion_calm_sum // calm 2번 후에 emotion 나왔을 때 calm의 합
    });
    await newRekognition.save(function (err) {
      if (err) {
        console.dir(err);
        callback(err, null)
      }
      console.log('감정분석 데이터 추가');
      callback(null, true)
    })
    console.log('====================여섯번째 완료====================')



  }
  main()
};

// 정규화
var normalization = async function (highlight_array, callback) {

  var min = 0;
  var max = 0;
  var normal_array = highlight_array;

  async function getMinMax() {
    var diff_array = [];

    for (var i = 0; i < highlight_array.length; i++) {
      diff_array.push(highlight_array[i].emotion_diff);
    }

    diff_array.sort(function (a, b) {
      if (a > b) return 1;
      if (a < b) return -1;
      if (a == b) return 0;
    });

    min = diff_array[0];
    max = diff_array[diff_array.length - 1];
  }

  async function normalization() {
    for (var i = 0; i < normal_array.length; i++) {
      normal_array[i].emotion_diff =
        (Number(normal_array[i].emotion_diff) - min) / (max - min);
    }
  }

  async function main(){
    await getMinMax();
    await normalization();
    callback(null, normal_array)
  }
  main()
};

// 모듈화 연결
module.exports.getWatchResult = getWatchResult;
module.exports.authUser = authUser;
module.exports.checkRecord = checkRecord;
module.exports.signUp = signUp;
module.exports.enterRoom = enterRoom;
module.exports.getRecommendUserList = getRecommendUserList;
module.exports.makeroom = makeroom;
module.exports.sendEmail = sendEmail;
module.exports.scene = scene;
module.exports.watchImageCaptureRekognition = watchImageCaptureRekognition;
module.exports.normalization = normalization;