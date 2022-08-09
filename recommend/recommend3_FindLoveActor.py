# recommend3_FindLoveActor -> 선호배우 추출 파일
# (사용자가 시청한 영화 user_info.py에서 가져와 그 영화에 출연한 배우 가져옴)
import pandas as pd
import sys

def process(userId):
    # 1. 사용자 시청 영화 하나만 user_info.py에서 찾아오기
    meta = pd.read_csv('csv/user_info.csv', low_memory=False)
    # 필요한 컬럼만 가져온다. 아이디,제목
    meta = meta[['userId','movieId']]

    for i in range(0, len(meta)):
        if str(meta['userId'][i]) == str(userId):
            movieID = meta['movieId'][i]
            break

    # 2. 시청 영화의 배우 movie_info.py에서 movieid로 찾아오기
    # 3. 배우 출력
    movieData = pd.read_csv('csv/movie_info_2_2.csv', low_memory=False)
    movieData = movieData[['id', 'actor']] # 필요한 컬럼만 가져온다.

    for j in range(0, len(movieData)):
        if str(movieData['id'][j]) == str(movieID):
            actorString = movieData['actor'][j].strip('[').strip(']').split(',')
            print(actorString[0].strip("\"").strip("\'"))
            break

if __name__ == '__main__':
    process(sys.argv[1])
    #process('672')