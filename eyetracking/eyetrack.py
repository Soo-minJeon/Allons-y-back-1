import io
import os
import time

import boto3
import botocore
import csv

# s3 bucket
import cv2
# 얼굴 인식은 opencv로
# 눈을 감고있지 않은 이미지에만 MediaPipe적용
# blink 결과 -> mediapipe 만 적용
# 눈 초점 벗어남 차등 기준 적용
# s3 bucket 에서 사진 가져오기
import glob
import os
import time
import sys
import cv2
import dlib
import numpy as np
import math
import mediapipe as mp
import boto3
import csv

mp_face_mesh = 0
LEFT_EYE = 0
RIGHT_EYE = 0
LEFT_EYEBROW = 0
RIGHT_EYEBROW = 0
FACE_OVAL = 0
vertical = 0
LEFT_IRIS = 0
RIGHT_IRIS = 0
ImgArray = 0
Img1 = 0
canvas = 0
radious = 0
standard_center_l = 0
standard_center_r = 0
blink_mp = 0
blink_cv = 0
blinkStandard_cv = 0
blinkStandard_mp = 0
warning = 0
s3 = 0
bucket = 0
photo_list = []
directory_name = []
testfolder = ''


def preprocessing(id, title, path):
    global mp_face_mesh
    global LEFT_EYE
    global RIGHT_EYE
    global LEFT_EYEBROW
    global RIGHT_EYEBROW
    global FACE_OVAL
    global vertical
    global LEFT_IRIS
    global RIGHT_IRIS
    global ImgArray
    global Img1
    global canvas
    global radious
    global standard_center_l
    global standard_center_r
    global s3
    global bucket
    global photo_list
    global directory_name
    global testfolder

    # 눈 영역 지정
    LEFT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
    RIGHT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]

    # 눈썹 영역 지정
    LEFT_EYEBROW = [336, 296, 334, 293, 300, 276, 283, 282, 295, 285]
    RIGHT_EYEBROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46]

    # 얼굴 영역 지정
    FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176,
                 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]

    # 얼굴 제일 윗부분 & 제일 아랫부분 연결
    vertical = [10, 152]

    # 눈 검은자
    LEFT_IRIS = [474, 475, 476, 477]
    RIGHT_IRIS = [469, 470, 471, 472]

    # s3 bucket

    if((path == '0') or (path == 0)):
        photo_list = [
            id + '_' + title + '_' + str(0) + '.jpg',
            id + '_' + title + '_' + str(1) + '.jpg',
            id + '_' + title + '_' + str(2) + '.jpg'
        ]
    else :
        photo_list = [
            id + '_' + title + '_' + str(int(path) - 1) + '.jpg',
            id + '_' + title + '_' + str(int(path)) + '.jpg',
            id + '_' + title + '_' + str(int(path) + 1) + '.jpg'
        ]

    directory_name = [
        "blinking1", "lookother1", "lookother2", "shaking1", "asiangirl1", "sleeping1", "shaking2"
        , "shaking3", "", "man1", "asiangirl2", "test"
    ]

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
                      region_name=region
                      )

    mp_face_mesh = mp.solutions.face_mesh

    # get image file
    # 이미지 셋 선택
    testfolder = 'eyetracking/testfolder/'

    try:
        for i in range(3):
            down = s3.download_file(bucket, "capture/" + photo_list[i],
                                testfolder + photo_list[i])
    except : 
        #  에러 처리(버킷) - 발생시 집중도 0으로 리턴
            return False

    

    ImgArray = [testfolder + photo_list[0],
             testfolder + photo_list[1],
             testfolder + photo_list[2]]

    # 첫번재 이미지로 프레임 크기를 지정함.
    Img1 = cv2.imread(ImgArray[0])
    canvas = np.full(Img1.shape, 255, np.uint8)

    # 눈을 감고 있지 않은 첫 이미지에서 지정할 눈초점 움직임 용인 영역
    radious = 0
    standard_center_l = 0
    standard_center_r = 0
    return True


def settingStandard(eyeRatio_cv, eyeRatio_mp):  # 집중도 기준 설정

    global blink_mp
    global blink_cv
    global blinkStandard_cv
    global blinkStandard_mp
    global warning
    global none
    global flag
    global concentration

    # 깜빡임
    blinkStandard_cv = eyeRatio_cv  # 얼굴에서 눈 높이의 비율
    blinkStandard_mp = eyeRatio_mp  # 얼굴에서 눈 높이의 비율

    # 눈 초점 범위 벗어남
    warning = 0

    # 얼굴 인식 안됨
    none = 0

    # 눈을감지않은 첫 이미지인지
    flag = 0

    # 집중도 분석 결과 ( 범위 : 0~100 )
    concentration = 100


def process(eye_points_L, eye_points_R, facial_landmarks, _gray, frame, i):
    global warning
    global blink_mp
    global blink_cv
    global none
    global flag
    global standard_center_l
    global standard_center_r
    global radious
    global canvas
    global concentration

    # 왼쪽 눈 영역 지정
    eye_region_L = np.array([(facial_landmarks.part(eye_points_L[0]).x, facial_landmarks.part(eye_points_L[0]).y),
                             (facial_landmarks.part(eye_points_L[1]).x, facial_landmarks.part(eye_points_L[1]).y),
                             (facial_landmarks.part(eye_points_L[2]).x, facial_landmarks.part(eye_points_L[2]).y),
                             (facial_landmarks.part(eye_points_L[3]).x, facial_landmarks.part(eye_points_L[3]).y),
                             (facial_landmarks.part(eye_points_L[4]).x, facial_landmarks.part(eye_points_L[4]).y),
                             (facial_landmarks.part(eye_points_L[5]).x, facial_landmarks.part(eye_points_L[5]).y)],
                            np.int32)

    # 오른쪽 눈 영역 지정
    eye_region_R = np.array([(facial_landmarks.part(eye_points_R[0]).x, facial_landmarks.part(eye_points_R[0]).y),
                             (facial_landmarks.part(eye_points_R[1]).x, facial_landmarks.part(eye_points_R[1]).y),
                             (facial_landmarks.part(eye_points_R[2]).x, facial_landmarks.part(eye_points_R[2]).y),
                             (facial_landmarks.part(eye_points_R[3]).x, facial_landmarks.part(eye_points_R[3]).y),
                             (facial_landmarks.part(eye_points_R[4]).x, facial_landmarks.part(eye_points_R[4]).y),
                             (facial_landmarks.part(eye_points_R[5]).x, facial_landmarks.part(eye_points_R[5]).y)],
                            np.int32)

    # 눈 영역 그림 그리기
    cv2.polylines(frame, [eye_region_L], True, (0, 255, 0), 1)
    cv2.polylines(frame, [eye_region_R], True, (0, 255, 0), 1)

    # 눈 roi 지정

    # 왼쪽눈이 위에 ? 오른쪽눈이 위에 ? - 눈 움직임 허용 범위를 지정하기 위한 작업
    l_top = facial_landmarks.part(eye_points_L[1]).y
    r_top = facial_landmarks.part(eye_points_R[1]).y
    if (l_top <= r_top):  # 왼쪽이 위쪽에 위치함.

        eye_rec_start_y = min([facial_landmarks.part(eye_points_L[0]).y,
                               facial_landmarks.part(eye_points_L[1]).y,
                               facial_landmarks.part(eye_points_L[2]).y,
                               facial_landmarks.part(eye_points_L[3]).y,
                               facial_landmarks.part(eye_points_L[4]).y,
                               facial_landmarks.part(eye_points_L[5]).y])
        eye_rec_start_y -= 5
        eye_l_max = max([facial_landmarks.part(eye_points_L[0]).y,
                         facial_landmarks.part(eye_points_L[1]).y,
                         facial_landmarks.part(eye_points_L[2]).y,
                         facial_landmarks.part(eye_points_L[3]).y,
                         facial_landmarks.part(eye_points_L[4]).y,
                         facial_landmarks.part(eye_points_L[5]).y])
        eye_l_sub = eye_l_max - eye_rec_start_y

        eye_rec_end_y = max([facial_landmarks.part(eye_points_R[0]).y,
                             facial_landmarks.part(eye_points_R[1]).y,
                             facial_landmarks.part(eye_points_R[2]).y,
                             facial_landmarks.part(eye_points_R[3]).y,
                             facial_landmarks.part(eye_points_R[4]).y,
                             facial_landmarks.part(eye_points_R[5]).y])
        eye_rec_end_y += 5
        eye_r_min = min([facial_landmarks.part(eye_points_R[0]).y,
                         facial_landmarks.part(eye_points_R[1]).y,
                         facial_landmarks.part(eye_points_R[2]).y,
                         facial_landmarks.part(eye_points_R[3]).y,
                         facial_landmarks.part(eye_points_R[4]).y,
                         facial_landmarks.part(eye_points_R[5]).y])
        eye_r_sub = eye_rec_end_y - eye_r_min

    else:

        eye_rec_start_x = facial_landmarks.part(eye_points_R[3]).x + 5
        eye_rec_start_y = min([facial_landmarks.part(eye_points_R[0]).y,
                               facial_landmarks.part(eye_points_R[1]).y,
                               facial_landmarks.part(eye_points_R[2]).y,
                               facial_landmarks.part(eye_points_R[3]).y,
                               facial_landmarks.part(eye_points_R[4]).y,
                               facial_landmarks.part(eye_points_R[5]).y])
        eye_rec_start_y -= 5

        eye_r_max = max([facial_landmarks.part(eye_points_R[0]).y,
                         facial_landmarks.part(eye_points_R[1]).y,
                         facial_landmarks.part(eye_points_R[2]).y,
                         facial_landmarks.part(eye_points_R[3]).y,
                         facial_landmarks.part(eye_points_R[4]).y,
                         facial_landmarks.part(eye_points_R[5]).y])
        eye_r_sub = eye_r_max - eye_rec_start_y

        eye_rec_end_y = max([facial_landmarks.part(eye_points_L[0]).y,
                             facial_landmarks.part(eye_points_L[1]).y,
                             facial_landmarks.part(eye_points_L[2]).y,
                             facial_landmarks.part(eye_points_L[3]).y,
                             facial_landmarks.part(eye_points_L[4]).y,
                             facial_landmarks.part(eye_points_L[5]).y])
        eye_rec_end_y += 5

        eye_l_min = min([facial_landmarks.part(eye_points_L[0]).y,
                         facial_landmarks.part(eye_points_L[1]).y,
                         facial_landmarks.part(eye_points_L[2]).y,
                         facial_landmarks.part(eye_points_L[3]).y,
                         facial_landmarks.part(eye_points_L[4]).y,
                         facial_landmarks.part(eye_points_L[5]).y])
        eye_l_sub = eye_rec_end_y - eye_l_min

    # 얼굴의 범위를 구하기 (턱 y좌표 - 눈썹 제일 윗부분 y좌표)
    face_sub_min = min([facial_landmarks.part(17).y,
                        facial_landmarks.part(18).y,
                        facial_landmarks.part(19).y,
                        facial_landmarks.part(20).y,
                        facial_landmarks.part(21).y,
                        facial_landmarks.part(22).y,
                        facial_landmarks.part(23).y,
                        facial_landmarks.part(24).y,
                        facial_landmarks.part(25).y,
                        facial_landmarks.part(26).y])
    face_sub_max = max([facial_landmarks.part(5).y,
                        facial_landmarks.part(6).y,
                        facial_landmarks.part(7).y,
                        facial_landmarks.part(8).y,
                        facial_landmarks.part(9).y,
                        facial_landmarks.part(10).y,
                        facial_landmarks.part(11).y,
                        facial_landmarks.part(12).y])
    face_sub = face_sub_max - face_sub_min

    # 얼굴대비 눈 높이 비율 구하기
    sum = eye_l_sub + eye_r_sub
    if (sum <= 0):
        ratio = 0
    else:
        ratio = (sum / 2) * 100 / face_sub

    # 얼굴대비 눈 비율이 blinkStandard 보다 작으면 감은 것으로 판별
    if ratio < blinkStandard_cv:
        blink_cv += 15

    elif ratio >= blinkStandard_cv:  # open cv로 한번 걸러주고
        # 눈을 감고 있지 않으면 mediaPipe 적용해서 눈 초점 위치 파악
        with mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.2,
                min_tracking_confidence=0.2
        ) as face_mesh:
            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img_h, img_w = frame.shape[:2]
            results = face_mesh.process(rgb_frame)

            if results.multi_face_landmarks:
                mesh_points = np.array([np.multiply([p.x, p.y], [img_w, img_h]).astype(int) for p in
                                        results.multi_face_landmarks[0].landmark])

                (l_cx, l_cy), l_radious = cv2.minEnclosingCircle(mesh_points[LEFT_IRIS])
                (r_cx, r_cy), r_radious = cv2.minEnclosingCircle(mesh_points[RIGHT_IRIS])
                center_left = np.array([l_cx, l_cy], dtype=np.int32)
                center_right = np.array([r_cx, r_cy], dtype=np.int32)

                if (flag == 0):
                    flag = flag + 1

                    color = (255, 0, 0)
                    a = abs(center_left[0] - mesh_points[LEFT_EYEBROW[4]][0])  # 선 a의 길이
                    b = abs(center_left[1] - mesh_points[LEFT_EYEBROW[4]][1])  # 선 b의 길이
                    radious = math.sqrt((a * a) + (b * b))

                    standard_center_l = center_left
                    standard_center_r = center_right

                    cv2.circle(canvas, standard_center_l, int(radious), (255, 0, 0), 1, cv2.LINE_AA)
                    cv2.circle(canvas, standard_center_r, int(radious), (255, 0, 0), 1, cv2.LINE_AA)

                else:
                    if (flag == 1): color = (0, 255, 0)
                    if (flag == 2): color = (0, 0, 255)
                    flag = flag + 1

                    a = abs(center_left[0] - standard_center_l[0])  # 선 a의 길이
                    b = abs(center_left[1] - standard_center_l[1])  # 선 b의 길이
                    l_distance = math.sqrt((a * a) + (b * b))

                    a = abs(center_right[0] - standard_center_r[0])  # 선 a의 길이
                    b = abs(center_right[1] - standard_center_r[1])  # 선 b의 길이
                    r_distance = math.sqrt((a * a) + (b * b))

                    # 왼|오 둘 중 하나라도
                    # 첫 프레임에서 눈의 위치와 현재 프레임에서 눈 위치의 거리가 용인 영역(반지름)의 길이를 넘어가면
                    if l_distance >= radious or r_distance >= radious:

                        # 평균
                        distance_sum = (l_distance + r_distance) // 2
                        warning = (distance_sum / (radious * 2)) * 50

                cv2.circle(frame, center_left, int(l_radious), color, 1, cv2.LINE_AA)
                cv2.circle(frame, center_right, int(r_radious), color, 1, cv2.LINE_AA)

                cv2.circle(canvas, center_left, int(l_radious), color, -1, cv2.LINE_AA)
                cv2.circle(canvas, center_right, int(r_radious), color, -1, cv2.LINE_AA)

                cv2.polylines(frame, [mesh_points[LEFT_EYE]], True, color, 1, cv2.LINE_AA)
                cv2.polylines(frame, [mesh_points[RIGHT_EYE]], True, color, 1, cv2.LINE_AA)

                cv2.circle(frame, standard_center_l, int(radious), (255, 0, 0), 5, cv2.LINE_AA)
                cv2.circle(frame, standard_center_r, int(radious), (255, 0, 0), 5, cv2.LINE_AA)

                LEFT_SUB = mesh_points[LEFT_EYE[4]][1] - mesh_points[LEFT_EYE[12]][1]
                RIGHT_SUB = mesh_points[RIGHT_EYE[4]][1] - mesh_points[RIGHT_EYE[12]][1]
                FACE_SUB = mesh_points[FACE_OVAL[18]][1] - mesh_points[FACE_OVAL[0]][1]

                sum = LEFT_SUB + RIGHT_SUB

                if (sum <= 0):
                    ratio = 0
                else:
                    ratio = (sum / 2) * 100 / FACE_SUB

                if ratio < blinkStandard_mp:
                    blink_mp += 1

                # 얼굴 범위 확인
                cv2.polylines(frame, [mesh_points[FACE_OVAL]], True, color, 1, cv2.LINE_AA)
                cv2.polylines(frame, [mesh_points[vertical]], True, color, 1, cv2.LINE_AA)

            else:
                none += 1

def main():
    global blink_mp
    global blink_cv
    global concentration
    global warning

    detector = dlib.get_frontal_face_detector()
    predictor = dlib.shape_predictor(
        "eyetracking/shape_predictor_68_face_landmarks.dat")

    for i in range(0, len(ImgArray)):

        frame = cv2.imread(ImgArray[i])
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = detector(gray)

        # 얼굴 인식 부분
        for face in faces:
            landmarks = predictor(gray, face)

            # 눈 그리기
            process([36, 37, 38, 39, 40, 41], [42, 43, 44, 45, 46, 47], landmarks, gray, frame, i)

    if (blink_mp == len(ImgArray)):
        concentration = 0  # 조는 중이면 집중도 0

    concentration = concentration - warning
    concentration = concentration - blink_cv
    concentration = concentration - (blink_mp*15)
    if (concentration < 0):
        concentration = 0

# 후처리 - 로컬 저장소 - 테스트 폴더 안에 있는 사진들 모두 삭제
def afterprocessing():

    # 로컬 저장소 삭제
    [os.remove(f)
     for f in
     glob.glob('eyetracking/testfolder/*.jpg')]


if __name__ == "__main__":

    time.sleep(2) # 버킷에 올라가는 시간이 필요함.

    param = str(sys.argv[1]).split("/")
    # param = "10/smj8554/toy story".split("/")

    times = param[0]
    id = param[1]
    title = param[2]

    # 테스트할 사진들 지정
    pre = preprocessing(id, title, times)
    if (pre):
        settingStandard(5, 3)  # 일단 기준은 cv = 7 / mp = 3
        main()
        afterprocessing()
    else:
        concentration = 0

    # 집중도 출력
    print(concentration)
    # time.sleep(3)