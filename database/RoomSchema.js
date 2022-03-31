var Schema = {};

Schema.createSchema = function (mongoose) {

    console.log('createSchema 호출됨.')

    // 스키마 정의 - 몽구스는 각각 다른 스키마를 다루기 가능 (관계db와 차이점)
    // 스키마 정의 (속성: type, required, unique)
   var RoomSchema = mongoose.Schema({
        roomCode: { type: String, require: true, unique: true, 'default': '' }
    });

    console.log('Schema 정의를 완료하였습니다.');

    RoomSchema.path('roomCode').validate(function (roomCode) {
        return roomCode.length;
    }, 'roomCode 칼럼의 값이 없습니다.');
    // roomShema roomcode 로 검색
    RoomSchema.static('findByRoomCode', function (roomcode, callback) { // findByRoomCode 함수 추가
        return this.find({ roomCode: roomcode }, callback);
    });

    console.log('Schema 설정을 완료하였습니다.');

    return RoomSchema;
}

module.exports = Schema