var mongoose = require('mongoose');

var database = {};

database.init = function(app, config) {
    console.log('init 호출됨.');

    connect(app, config);
};

var options = {
    serverSelectionTimeoutMS : 30000, // default : 30000 // 30 초
    socketTimeoutMS : 360000, // default : 360000 // 360000ms로 설정하면 30 초 동안 아무런 활동이 없을 경우 소켓이 닫힌다.
    connectTimeoutMS : 30000 // default : 30000 // 30 초
};

function connect(app, config) {
    console.log('connect 호출됨.');

    // 데이터베이스 연결
    console.log("데이터베이스 연결을 시도합니다.");
    // 몽구스 초기 설정
    mongoose.Promise = global.Promise; // mongoose의 Promise 객체는 global의 Promise 객체 사용하도록 함
//    mongoose.connect(config.db_url); // db연결 시 connect 호출, 동시에 db 연결 정보를 파라미터로 넘김
    mongoose.connect(config.db_url, options); // db연결 시 connect 호출, 동시에 db 연결 정보를 파라미터로 넘김
    database.db = mongoose.connection; // db 연결 여부를 mongoose 객체에 들어있는 connection 객체로 확인

    database.db.on("error", console.error.bind(console, "mongoose connection error."));

    database.db.on("open", () => {
        console.log("데이터베이스에 연결되었습니다. : " + config.db_url);

        createSchema(app, config);
    });

    // 연결 끊어졌을 때 5초 후 재연결
    database.db.on("disconnected", function () {
        console.log("연결이 끊어졌습니다. 5초 후 재연결합니다.");
        setInterval(connect, 5000);
    });
};

function createSchema(app, config){
    console.log("설정의 DB 스키마 수 : " + config.db_schemas.length);

    for(var i= 0; i<config.db_schemas.length; i++){
        var curItem = config.db_schemas[i];

        var curSchema = require(curItem.file).createSchema(mongoose);
        console.log('%s 모듈을 이용해 스키마 생성함.', curItem.file);

        var curModel = mongoose.model(curItem.collection, curSchema);
        console.log('%s 컬렉션을 위해 모델 정의함', curItem.collection);

        database[curItem.schemaName] = curSchema;
        database[curItem.modelName] = curModel;

        console.log('스키마 [%s], [%s] 생성됨. ', curItem.schemaName, curItem.modelName);
    }

    console.log('----------------------------------------------------------------------------')
    app.set('database', database);
};

module.exports = database;