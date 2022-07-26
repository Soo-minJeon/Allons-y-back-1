# 감정분석(함께보기)
import csv
import boto3
import sys

def process(path):

    # aws 계정 정보 입력
    with open('credentials.csv', 'r') as input:
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

    # 버킷/테스트 폴더/사진이름 (경로명) : capture/+'프론트에서 넘겨받은 파일명'
    photo = folder + str(path) 
    
    response = client.detect_faces(
        Image={
            'S3Object': {
                'Bucket': bucket,
                'Name': photo
            }},
        Attributes=["ALL"]
    )

    resultString_arr = []
    resultString = []

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
    # process(sys.argv[1])
    process('k8elpunvyts_30.jpg')