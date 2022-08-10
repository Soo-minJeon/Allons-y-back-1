# 감정분석(함께보기)
import csv
import boto3
import sys

def process(roomCode, time):

    resultString_arr = []

    # aws 계정 정보 입력
    with open('credential/credentials.csv', 'r') as input:
        next(input)
        reader = csv.reader(input)
        for line in reader:
            access_key_id = line[0]
            secret_access_key = line[1]

    region = 'ap-northeast-2'
    bucket = "allonsybucket1"

    client = boto3.client('rekognition',
                          aws_access_key_id=access_key_id,
                          aws_secret_access_key=secret_access_key,
                          region_name=region)


    # 버킷 안의 사진이 들어있는 테스트 폴더
    folder = "together/"

    # bucket 하위 경로에 있는 object list 가져오기
    s3 = boto3.client('s3', 
                        aws_access_key_id=access_key_id,
                        aws_secret_access_key=secret_access_key,
                        region_name=region)
    obj_list = s3.list_objects(Bucket = bucket, Prefix = folder)
    contents_list = obj_list['Contents']

    # 룸코드, 시간에 맞는 파일명 들어있는 리스트
    file_list = []
    for content in contents_list:
        temp = content['Key'].split('/')
        key = temp[1]

        if roomCode+'_' in key and '_'+time+'.jpg' in key:
            file_list.append(key)
    
    if (len(file_list) <= 0):
        print('None')
    else: 
        for i in range(len(file_list)):

            # 버킷/테스트 폴더/사진이름 (경로명) : capture/+'프론트에서 넘겨받은 파일명'
            photo = folder + str(file_list[i]) 

            response = client.detect_faces(
                Image={
                    'S3Object': {
                        'Bucket': bucket,
                        'Name': photo
                    }},
                Attributes=["ALL"]
            )

            for key, value in response.items():
                if key == "FaceDetails":

                    for people_att in value:
                        
                        # rekognition 결과 중, 감정정보만 찾아서 문자열 처리
                        emotion_index = (str(people_att).find('Emotions'))
                        landmark_index = (str(people_att).find('Landmarks'))
                        emotion_result = str(people_att)[emotion_index + 12: landmark_index]

                        total_result = emotion_result.split("'Type': ")
                        total = total_result[1][0:len(total_result[1]) - 4].split(", 'Confidence': ")
                        emotion = total[0].replace("'", "")

                        resultString_arr.append(emotion)

        print(resultString_arr)


if __name__ == '__main__':
    param = sys.argv[1]
    # param = "aabbcc_0"
    roomCode, time = param.split('_')
    process(roomCode, time)
    # process(sys.argv[1])
    # process('k8elpunvyts_30')