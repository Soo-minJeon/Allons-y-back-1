

var Schema = {};

Schema.createSchema = function (mongoose) {

    console.log('createSchema 호출됨.')

    // 스키마 정의 - 몽구스는 각각 다른 스키마를 다루기 가능 (관계db와 차이점)
    // 스키마 정의 (속성: type, required, unique)
    var UserSchema = mongoose.Schema({ // 사용자정보
        id: { type: String, required: true, unique: true, 'default': '' }, // 아이디
        password: { type: String, required: true }, 'default': '', // 비번
        name: { type: String, required: 'hashed', 'default': '' }, // 닉네임
        genres: { type: String, required: false }, // 선호 장르
        result: { type: Boolean, required: false }, // 감상결과 여부
        created_at: { type: Date, index: { unique: false }, 'default': Date.now } // 가입일
    });

    console.log('Schema 정의를 완료하였습니다.');

    // 필수 속성에 대한 유효성 확인 (길이 값 체크)
    UserSchema.path('id').validate(function (id) {
        return id.length;
    }, 'id 칼럼의 값이 없습니다.');

    UserSchema.path('name').validate(function (name) {
        return name.length;
    }, 'name 칼럼의 값이 없습니다.');

    // 스키마에 static 메소드 추가, static 메소드를 사용하여 스키마에 메소드를 추가한다. - 2개의 메소드 이용할 수 있게 됨. findById, findAll
    UserSchema.static('findById', function (id, callback) { // findById 함수 추가해서 모델객체에서 호출할 수 있도록함
        return this.find({ id: id }, callback);
    });

    UserSchema.static('findAll', function (callback) {
        return this.find({}, callback);
    });

    // 비밀번호 비교
    UserSchema.static('authenticate', function (password, callback) {
        return this.find({ password: password }, callback);
    });


    console.log('Schema 설정을 완료하였습니다.');

    return UserSchema;
}

module.exports = Schema