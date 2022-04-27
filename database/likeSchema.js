
var Schema = {};

Schema.createSchema = function (mongoose) {

    console.log('createSchema 호출됨.')

    // 스키마 정의 - 몽구스는 각각 다른 스키마를 다루기 가능 (관계db와 차이점)
    // 스키마 정의 (속성: type, required, unique)
    var likeSchema = mongoose.Schema({ // 사용자정보
        id: { type: String, required: true, unique: true, 'default': '' }, // 사용자 아이디
        genres: { type: String, required: false }, // 선호 장르
        actors: { type: String, required: false }, // 선호 배우
        emotions: { type: String, required: false }, // 선호 감정
        correctModel: {type: String, required: true, 'default':''}
    });

    console.log('Schema 정의를 완료하였습니다.');

    // 필수 속성에 대한 유효성 확인 (길이 값 체크)
    likeSchema.path('id').validate(function (id) {
        return id.length;
    }, 'id 칼럼의 값이 없습니다.');

    // 스키마에 static 메소드 추가, static 메소드를 사용하여 스키마에 메소드를 추가한다. - 2개의 메소드 이용할 수 있게 됨. findById, findAll
    likeSchema.static('findById', function (id, callback) { // findById 함수 추가해서 모델객체에서 호출할 수 있도록함
        return this.find({ id: id }, callback);
    });

    likeSchema.static('findAll', function (callback) {
        return this.find({}, callback);
    });

    console.log('Schema 설정을 완료하였습니다.');

    return likeSchema;
}

module.exports = Schema