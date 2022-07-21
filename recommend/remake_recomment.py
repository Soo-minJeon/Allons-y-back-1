import csv
import random
import pandas as pd # pandas

def process():
    # row, col 생략 없이 출력
    pd.set_option('display.max_rows', None)
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 300)

    ###############################################
    recommend_count = 5 # 추천할 영화 개수
    remake_title = []
    remake_poster = []
    random_list = [] # 랜덤 인덱스
    movieTitle = []
    moviePoster = []

    f = open('recommend/movie_info.csv', 'r')
    fs = csv.reader(f)

    for line in fs: # 리메이크 데이터(제목, 포스터)가 들어있는 영화의 movie_id 가져오기
        if(line[8] != '0' and line[8] != 'remakePoster'):
            remake_title.append(line[7])
            remake_poster.append(line[8])

    while(len(random_list)<5): # 랜덤으로 영화 선택(중복 시 재선택)
        x = random.randint(0, len(remake_title) - 1)
        if x not in random_list:
            random_list.append(x)
        # else:
            # print('겹침!')

    for i in range(recommend_count):
        movieTitle.append(remake_title[random_list[i]])
        moviePoster.append(remake_poster[random_list[i]])
        # print(remake_title[random_list[i]])
        # print(remake_poster[random_list[i]])

    print( movieTitle, moviePoster)

if __name__ == '__main__':
    process()

