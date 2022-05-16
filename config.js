// 설정 정보

module.exports = {
    server_port : 3000, // 접속 포트 번호
    db_url : "mongodb://127.0.0.1:27017/local", // ip 주소 상시 변경 사항
    db_schemas : [ // 스키마-콜렉션 정보
        {file : './UserSchema', 
        collection : 'UserCollection', 
        schemaName : "UserSchema", 
        modelName : "UserModel"},

        {file : './WatchSchema', 
        collection : 'WatchCollection', 
        schemaName : "WatchSchema", 
        modelName : "WatchModel"},

        {file : './RoomSchema', 
        collection : 'RoomCollection', 
        schemaName : "RoomSchema", 
        modelName : "RoomModel"},

        {file : './likeSchema',
        collection : 'likeCollection',
        schemaName : "likeSchema",
        modelName : "likeModel"},

        {file : './EyetrackSchema', 
        collection : 'EyetrackCollection', 
        schemaName : "EyetrackSchema", 
        modelName : "EyetrackModel"},

        { file : './RekognitionSchema', 
        collection : 'RekognitionCollection', 
        schemaName : "RekognitionSchemㅁa", 
        modelName : "RekognitionModel"},

        { file : './MovieSchema', 
        collection : 'MovieCollection', 
        schemaName : "MovieSchema", 
        modelName : "MovieModel"}
    ],
    // 라우터 함수 정보
    route_info: [
        {file:'./routes/user', path:'/login', method:'login', type:'post'},
        {file:'./routes/user', path:'/signup', method:'signUp', type:'post'},
        {file:'./routes/user', path:'/watchlist', method:'watchlist', type:'post'},
        {file:'./routes/user', path:'/watchresult', method:'watchresult', type:'post'},
        {file:'./routes/user', path:'/enterroom', method:'enterRoom', type:'post'},
        {file:'./routes/user', path:'/email', method:'email', type:'post'},
        {file:'./routes/user', path:'/makeRoom', method:'makeRoom', type:'post'},
        {file:'./routes/user', path:'/logout', method:'logout', type:'post'},
        {file:'./routes/user', path:'/getAllMovieList', method:'getAllMovieList', type:'post'},
        {file:'./routes/user', path:'/watchAloneStart', method:'watchAloneStart', type:'post'},
        {file:'./routes/user', path:'/watchImageCaptureEyetrack', method:'watchImageCaptureEyetrack', type:'post'},
        {file:'./routes/user', path:'/watchAloneEnd', method:'watchAloneEnd', type:'post'},
        {file:'./routes/user', path:'/addReview', method:'addReview', type:'post'},
    ]
}
