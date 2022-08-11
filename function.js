var nodemailer = require('nodemailer');

// 사용자 로그인
var authUser = function(db, id, password, callback) {
  console.log('authUser(로그인)함수 호출됨');

  // 아이디를 사용해 검색 - userSchema에서
  db.UserModel.findById(id, function(err, results_id){

      if (err) {
          callback(err, null);
          return;
      }

      // 해당 id 를 통해 정보가 존재하는지 확인
      if (results_id.length > 0) {
          console.log('아이디와 일치하는 사용자 찾음, 받아온 id : ', id);

          // 존재하는 데이터의 비밀번호 확인
          db.UserModel.authenticate(id, password, function(err, results){
            if(err){
                callback(err, null) 
                return;
            }
            if(results.length > 0){
                console.log('비밀번호 일치');
                console.log(results)
                // objToSend = {
                //   id : results[0].id,
                //   name : results[0].name,
                //   record : 
                // }
                callback(null, results);
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

// 사용자 회원가입
var signUp = function(db, id, password, name, favorite, genre, callback) { // callback 함수는 함수를 호출하는 쪽에 결과 객체를 보내기 위해 쓰임
  console.log('signUp 함수 호출됨');

  var getpython = "";
  async function get_reco_id(){

    //파이썬 코드 실행 (추천용 아이디 발급)
    const spawnSync = require("child_process").spawnSync; // child-process 모듈의 spawn 획득

    // 매개변수로 선호 영화 전달
    const result = spawnSync("python", ["recommend/createRecommend_ID.py", favorite]);

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
          favorite:favorite,
          genre:genre,
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
  console.log('enterRoom (같이보기 방 입장)호출됨.');

  db.RoomModel.findByRoomCode(roomcode, function(err, result){

    if(err){
      callback(err, null);
      return;
    }

    else if(result.length > 0){
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
  // console.log('ids : ', ids)
  ids = ids.split(", ")
  ids[0] = ids[0].replace("[", '')

  titles = splitResult[1];
  // console.log('titles : ', titles)
  // titles = titles.replace('"', "'").replace('",', "',").split("', '")
  titles = titles.split(",")

  posters = splitResult[2];
  // console.log('posters : ', posters)
  posters = posters.split(',')
  // posters = posters.replace('nan', "'nan'").split("', '")
  // for(let i = 0; i<posters.length; i++){
  //   posters[i].replace("'", "")
  // }

  resultArray = []

  for (let i = 0; i<5; i++){
    var s = i*5;
    var e = s+5;
    var c = 0
    var resultTitleArray = []
    var resultPosterArray = []

    for (let j = s; j < e; j++){
      resultTitleArray[c] = titles[j].replace(/'/g, '').replace(/\s/gi, "");  
      resultPosterArray[c] = posters[j].replace(/'/g, '').replace(/\s/gi, "");  
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
  // console.log('===================\n결과 갯수 : ', count)

  // console.log("============================ 처리 결과 ============================\n", resultArray, "\n============================ 처리 결과 ============================\n");

  callback(null, resultArray)
};

// 같이보기 방 생성
var makeroom = function (db, roomToken, roomCode, callback) {
  db.RoomModel.findByRoomTokenANDCode(roomToken, roomCode, function(err, result){
    if(err){
      callback(err, null);
      return;
    }

    else if(result.length > 0){
      console.log('입력된 코드에 해당하는 같이보기 방 찾음. 중복된 룸코드');
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
        html: 
        '<div style=" width: 540px; height: 600px; border-top: 4px solid {$point_color}; margin: 80px auto; padding: 20px 0; box-sizing: border-box;">'+
        '<div style="border-top: 1px solid #DDD; padding: 5px;"/><br /><br />'+
        '<span style="color: {$point_color};"><b>메일인증</b></span> 안내입니다.'+
        '<p style="font-size: 16px; line-height: 26px; margin-top: 50px; padding: 0 5px;">'+
        '안녕하세요.<br />'+
        '<b>하루뭅(Harumub)</b>에 가입해 주셔서 진심으로 감사드립니다.<br />'+
        '고객님께서 입력하신 이메일의 소유확인을 위해 아래 인증번호를 회원가입 화면에 입력해주세요.'+ '<br> <br><b>'
        +code+'</b>' + 
        '<br /><br /><div style="border-top: 1px solid #DDD; padding: 5px;"/>'
        
        
      });
  
      console.log("Messege email address : ", userid)
      console.log('Message sent: %s', info.messageId)
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
  db.likeModel.findById(id, function(err, results) {
       if (err) {
          console.log('장면분석 중 에러 발생');
          console.dir(err);
          return;
       }

        if(results.length <= 0) {
          console.log('회원정보가 없습니다. 새로 생성합니다..');
          var user = new db.likeModel({'id' : id, 'genres': gen, 'actors' : actor, 'emotions':emotion,'correctModel':correctModel});

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
        else {
          console.log(results.length)
          console.log('회원정보를 찾았습니다. 업데이트합니다..');
          console.log(gen,actor,emotion,correctModel)

          db.likeModel.deleteMany({id: 'pbkdpwls123'});
          var user = new db.likeModel({'id' : id, 'genres': gen, 'actors' : actor, 'emotions':emotion,'correctModel':correctModel});
          // save()로 저장
           user.save(function(err) {
               if(err) {
                   callback(err, null);
                   return;
               }
              console.log('사용자 장면분석 데이터 업데이트함');
              callback(null, user);
           });
//          var user = db.likeModel.updateOne({ // 감상목록 emotion_array 수정 //
//            id: id,
//          }, {
//            $set: {
//               genres: 'love',
//               actors : 'love',
//               emotions: 'love',
//               correctModel: 'love',
//            },}
//          )

          // WatchSchema 업데이트 코드 작성
        }
  })
};

// 사용자 감정분석
var watchImageCaptureRekognition = function (db, userId, movieTitle, path, time, callback) {
  // param : time (감정부합도에서 빈 배열에 대해서 처리)

  console.log('rekognition 함수 호출')

  var result_total // python 감정분석 실행 결과 배열

  //////////////////////////////////////////////////감정분석 파이썬 코드 실행//////////////////////////////////////////////////
  function rekognition_python() {
    //파이썬 코드 실행 (사용자 감정 분석)
    const spawnSync = require("child_process").spawnSync; // child-process 모듈의 spawn 획득
    var getpython = "";

    // (param) 이미지 경로 재설정 필요
    const result = spawnSync("python", ["rekognition/userAnalyze_alone.py", path]);

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
  var tmp_emotion_count_array = []

  // watch모델에 기록된 감정부합도용 배열
  var tmp_every_emotion_array = []

  // 수정된 감상결과
  //var edit_emotionArray = []

  async function getPastRekognition(userId, movieTitle, time){ // 10초 전의 rekognition 기록을 찾는 함수.

    var pastTime = time - 10

    var existing_re = await db.RekognitionModel.find({
      userId : userId, movieTitle : movieTitle, time : pastTime
    }).clone()

    if (existing_re.length>0){
      // console.log('10초 전의 rekognition 기록 찾음.', existing_re[0])

      tmp_calm_count = existing_re[0].calm_count
      tmp_calm_sum = Number(existing_re[0].calm_sum)
      tmp_calm_emotion_count = existing_re[0].calm_emotion_count
      tmp_calm_emotion_sum = Number(existing_re[0].calm_emotion_sum)
      tmp_calm_emotion_calm_sum = Number(existing_re[0].calm_emotion_calm_sum)
    }
    else {
      // console.log(time, " s: ", '10초 전의 rekognition 기록 존재하지 않음.')
    }
  }


  async function getWatchResult(userId, movieTitle){ // 감상결과 기록을 찾는 함수.
    existing_watch = await db.WatchModel.find({
      userId : userId, movieTitle : movieTitle
    }).clone()


    if (existing_watch.length>0){
      // console.log('해당 유저의 해당 영화의 감상 기록 찾음.')
      tmp_emotion_count_array = existing_watch[0].emotion_count_array
      tmp_every_emotion_array = existing_watch[0].every_emotion_array
    }
    else {
      console.log('해당 유저의 해당 영화의 감상 기록 존재하지 않음.', userId, ", ", movieTitle)
      console.dir(existing_watch)
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
      // console.log('calm_emotion_sum: ', calm_emotion_sum)

      await getCalmConcentration();

      // console.log('tmp_calm_count : ', tmp_calm_count)
      // console.log('calm_emotion_count : ', calm_emotion_count)

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
        if (calm_emotion_count == 1){
          calm_count = tmp_calm_count;
          calm_sum = tmp_calm_sum;
          calm_emotion_count = calm_emotion_count;
          calm_emotion_sum = calm_emotion_sum;
          calm_emotion_calm_sum = calm_emotion_calm_sum;
        }
        else if (calm_emotion_count == 2){
          // 감정의 폭 계산
          calm_aver = (tmp_calm_sum / 2)
          calm_emotion_calm_aver = (calm_emotion_calm_sum / 2)
          calm_emotion_aver = (calm_emotion_sum / 2)
          highlight_emotion_diff = (((calm_aver - calm_emotion_calm_aver) + calm_emotion_aver)/2)
          highlight_emotion_time = time-10

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
      tmp_emotion_count_array[0].HAPPY += 1
      tmp_every_emotion_array[time/10] = first // 10초라면 배열의 [1] 값을 현재 가장 크게 느낀 감정으로.
      await check_highlight()
    }
    else if (first == 'SAD') {
      tmp_emotion_count_array[1].SAD += 1
      tmp_every_emotion_array[time/10] = first // 10초라면 배열의 [1] 값을 현재 가장 크게 느낀 감정으로.
      await check_highlight()
    }
    else if (first == 'ANGRY') {
      tmp_emotion_count_array[2].ANGRY += 1
      tmp_every_emotion_array[time/10] = first // 10초라면 배열의 [1] 값을 현재 가장 크게 느낀 감정으로.
      check_highlight()
    }
    else if (first == 'CONFUSED') {
      tmp_emotion_count_array[3].CONFUSED += 1
      tmp_every_emotion_array[time/10] = first // 10초라면 배열의 [1] 값을 현재 가장 크게 느낀 감정으로.
      check_highlight()
    }
    else if (first == 'DISGUSTED') {
      tmp_emotion_count_array[4].DISGUSTED += 1
      tmp_every_emotion_array[time/10] = first // 10초라면 배열의 [1] 값을 현재 가장 크게 느낀 감정으로.
      check_highlight()
    }
    else if (first == 'SURPRISED') {
      tmp_emotion_count_array[5].SURPRISED += 1
      tmp_every_emotion_array[time/10] = first // 10초라면 배열의 [1] 값을 현재 가장 크게 느낀 감정으로.
      check_highlight()
    }
    else if (first == 'FEAR') {
      tmp_emotion_count_array[6].FEAR += 1
      tmp_every_emotion_array[time/10] = first // 10초라면 배열의 [1] 값을 현재 가장 크게 느낀 감정으로.
      check_highlight()
    }
    else if (first == 'CALM') {
      calm_count = tmp_calm_count + 1
      calm_sum = tmp_calm_sum + Number(result_total[1])

      if (tmp_calm_emotion_count == 1){
        calm_emotion_count = 0
        calm_emotion_sum = 0
        calm_emotion_calm_sum = 0
      }
    }
  }

  async function main(){

    await getPastRekognition(userId, movieTitle, time)
    // console.log('====================첫번째 완료====================')

    await getWatchResult(userId, movieTitle);
    // console.log("====================두번째 완료====================");

    // watch model 기록안에 있던 emotion_array를 대입.
    // edit_emotionArray = tmp_emotion_count_array;

    await edit_emotion_array(result_total[0])
    // console.log('====================네번째 완료====================')
    // edit_emotionArray = 
    //   { "HAPPY" : tmp_emotion_count_array[0].HAPPY, 
    //   "SAD" : tmp_emotion_count_array[0].SAD, 
    //   "ANGRY" : tmp_emotion_count_array[0].ANGRY, 
    //   "CONFUSED" : tmp_emotion_count_array[0].CONFUSED, 
    //   "DISGUSTED": tmp_emotion_count_array[0].DISGUSTED, 
    //   "SURPRISED" : tmp_emotion_count_array[0].SURPRISED, 
    //   "FEAR" : tmp_emotion_count_array[0].FEAR, }
    
    // console.log("확인필요 ; ", tmp_emotion_count_array);
    // 테스트
    // console.log("-----------------------테스트-----------------------")
    // console.dir(tmp_every_emotion_array)
    // console.log("---------------------------------------------------")

    if (highlight_emotion_time == 0){
      await db.WatchModel.updateOne({ // 감상목록 emotion_array 수정 //
        userId: userId,
        movieTitle: movieTitle,
        // every_emotion_array : tmp_every_emotion_array
      }, {
        $set: {
          emotion_count_array: tmp_emotion_count_array,
          every_emotion_array : tmp_every_emotion_array
        },
      })
    }
    else {
      await db.WatchModel.updateOne({ // 감상목록 emotion_array 수정 //
        userId: userId,
        movieTitle: movieTitle
      }, {
        $set: {
          emotion_count_array: tmp_emotion_count_array,
          every_emotion_array : tmp_every_emotion_array
        },
        $push : {
          highlight_array: {
            time : highlight_emotion_time,
            emotion_diff : highlight_emotion_diff
          }
        }
      })
    }
    // console.log('====================다섯번째 완료====================')

    // 감정분석 기록 추가
    var newRekognition = await new db.RekognitionModel({
      'userId': userId, 'movieTitle': movieTitle, 'time': time,
      'firstEmotion': result_total[0],
      'firstConfidence': result_total[1],
      'calm_count': calm_count, // calm 횟수
      'calm_sum' : calm_sum, // calm confidence 합
      'calm_emotion_count' : calm_emotion_count, // calm 2번 후에 emotion 횟수
      'calm_emotion_sum' : calm_emotion_sum, // calm 2번 후에 emotion confidence 합
     'calm_emotion_calm_sum' : calm_emotion_calm_sum // calm 2번 후에 emotion 나왔을 때 calm의 합
    });
    await newRekognition.save(function(err) {
      if (err) {
        console.dir(err);
        callback(err, null)
      }
      console.log('감정분석 데이터 추가');
    })
    // console.log('====================여섯번째 완료====================')
    callback(null, 'true')
  }
  main()
};

// 정규화
var normalization = async function (category, highlight_array, callback) {
  console.log('정규화 함수 호출')

  var min = 0;
  var max = 0;
  var temp_array = highlight_array;
  var diff_array = [];
  var normal_array = [];

  async function getMinMax() {

    if (category == "eyetrack"){
      console.log('카테고리: 아이트래킹')
      for (let i = 0; i<highlight_array.length; i++){
        diff_array[i] = Math.round(highlight_array[i])
        console.log(diff_array[i])
      }
      diff_array = [...diff_array].sort(function(a, b){
        return a - b;
      }); 
      console.log('중간 점검1 : (diff_array) : ', diff_array)
    }
    else if (category == "emotion"){
      console.log('카테코리: 감정')
      for (let i = 0; i < highlight_array.length; i++){
        diff_array[i] = highlight_array[i].emotion_diff
        console.log(highlight_array[i].emotion_diff)
      }
      diff_array = [...diff_array].sort(function(a, b){
        return a - b;
      });
      console.log('중간 점검1 : (diff_array) : ', diff_array)
    }
    min = diff_array[0];
    if (highlight_array.length == 1){min = 0}

    max = diff_array[diff_array.length - 1];

    if (min == max) { 
      min = 0
      max = 1
    }

    console.log("중간 점검 2 : min : ", min, "// max : ", max)
  }

  async function normalization() {

    if(category == "eyetrack"){
      for (let i = 0; i<highlight_array.length; i++){
        normal_tmp = (Number(temp_array[i] - min) / (max - min))
        if ( normal_tmp <= 0 ) {normal_tmp = 0 }
        if ( normal_tmp >= 100 ) {normal_tmp = 1 }
        normal_array[i] = {
          "time" : i*10,
          "emotion_diff" : normal_tmp
        }
        // console.log("중간 점검 3 : ", normal_array[i])
      }
    }
    else if (category == "emotion"){
      for (let i = 0; i<highlight_array.length; i++){
        normal_tmp = Number(temp_array[i].emotion_diff - min) / (max - min)
        normal_array[i] = {
          "time" : temp_array[i].time,
          "emotion_diff" : normal_tmp
        }
  
        // console.log("중간 점검 3 : ", normal_array[i])
      }
    }
    console.log("중간 점검 3 : ", normal_array)
    

    // for (var i = 1; i < highlight_array.length; i++) {
    //   temp_array[i].emotion_diff =
    //     (Number(highlight_array[i].emotion_diff) - min) / (max - min);
    //   console.log("중간 점검 3 : ", temp_array[i])
    // }
  }

  async function main(){
    await getMinMax();
    await normalization();
    callback(null, normal_array)
  }
  main()
};

// 모듈화 연결
module.exports.authUser = authUser;
module.exports.signUp = signUp;
module.exports.enterRoom = enterRoom;
module.exports.getRecommendUserList = getRecommendUserList;
module.exports.makeroom = makeroom;
module.exports.sendEmail = sendEmail;
module.exports.scene = scene;
module.exports.watchImageCaptureRekognition = watchImageCaptureRekognition;
module.exports.normalization = normalization;