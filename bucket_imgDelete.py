import os
import sys
import boto3
import botocore
import csv
import glob

region = ''
bucket = ''
s3 = ''
testfolder  = ''# local
capture_folder = ''
highlight_folder = '' # s3 bucket highlight image save folder

def preprocess():
    global region
    global bucket
    global s3

    # 버킷 접근 위한 기본 설정
    with open('credentials.csv',
              'r') as input:
        next(input)
        reader = csv.reader(input)
        for line in reader:
            access_key_id = line[0]
            secret_access_key = line[1]

    region = 'ap-northeast-2'
    bucket = "allonsybucket1"

    s3 = boto3.client('s3',
                          aws_access_key_id=access_key_id,
                          aws_secret_access_key=secret_access_key,
                          region_name=region)

def main(id, title, highlight_time):
    global testfolder
    global capture_folder
    global highlight_folder
    global s3

    testfolder = 'eyetracking/testfolder/' # 임시로 사진을 저장하는 폴더, 10초마다 아이트래킹 위해 저장되는 파일 저장하는 폴더, 나중에 삭제해야하는 정보
    capture_folder = "capture/" # 10초마다 3번 저장한 모든 사진, 버킷
    highlight_folder = "highlight/" # 감정맥스 하이라이트 장면 저장 폴더, 버킷

    img = id + '_'+title+'_'+str(highlight_time)+'.jpg'

    # 파일 다운 to local from s3 캡쳐폴더
    try:
        down = s3.download_file(bucket, "capture/" + img,
                            testfolder + img)
        return down
    except : 
        print('bucket_imgDelete: 하이이이트 사진 다운받기 실패')

    # 하이라이트 전용 폴더에 파일 업로드 to s3 하이라이트 전용 폴더 from Local
    try:
        upload = s3.upload_file(testfolder + img, bucket, highlight_folder + img)
        return upload
    except : 
        print('bucket_imgDelete: 하이라이트 전용 폴더에 사진 업로드 실패')
    

    # 로컬 저장소 삭제
    [os.remove(f)
     for f in
     glob.glob('eyetracking/testfolder/*.jpg')]

def get_all_keys(**args):

    # 전체 파일목록(key) 반환용 array
    keys = []

    # 1000 개씩 반환되는 list_objects_v2의 결과 paging 처리를 위한 paginator 선언
    page_iterator = s3.get_paginator("list_objects_v2") # list_objects_v2 : 버킷안에 있는 이미지 모두 삭제하기 위해 사용. 버킷 안에 있는 이름 모두 가져옴.

    for page in page_iterator.paginate(**args):
        try:
            contents = page["Contents"]
        except KeyError:
            break

        for item in contents:
            keys.append(item['Key'])

    return keys

# 버킷 불러와서 필요없는 파일 삭제하는 함수
def makeManifest(mypath, id, title):
    # s3_bucket_name 버켓의 특정 폴더(mypath)하의 파일들만 가져옴
    entries = get_all_keys(Bucket= bucket, Prefix=mypath) # 버킷 가져옴

    for entry in entries:
        #이미지만
        if os.path.splitext(entry)[1].lower() in ('.png','.jpg','.jpeg'):

            s_title = id + '_' + title
            if (s_title in entry):
                delete = s3.delete_object(Bucket=bucket, Key=entry)
                #print(entry)



if __name__ == "__main__":
    preprocess()
    
    param = str(sys.argv[1]).split("/")
    #param = "40/smj8554/toy story".split("/")

    # 매개변수 3가지
    time = param[0] # 하이라이트 초
    id = param[1] # userId
    title = param[2]

    # 하이라이트 장면 시간대(초)를 받아와서, 해당 사진을 다운받고
    main(id, title, time)
    # 다운 받은 사진을 하이라이트 폴더에 업로드하고
    # capture폴더 안의 사진을 모두 삭제한다.
    makeManifest(capture_folder, id, title)
    # main("smj85548554_toystory_10.jpg")