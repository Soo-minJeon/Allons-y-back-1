# 영화감상 후 리메이크작이 있으면 추천

import csv
import random
import pandas as pd # pandas
import sys

def process(param_origintitle):
    # row, col 생략 없이 출력
    pd.set_option('display.max_rows', None)
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 300)

    ###############################################
    recommend_count = 5 # 추천할 영화 개수
    original_title = []
    remake_title = []
    remake_poster = []
    random_list = [] # 랜덤 인덱스
    movieTitle = 'none'
    moviePoster = 'none'

    f = open('csv/movie_info.csv', 'r')
    fs = csv.reader(f)

    for line in fs: # 리메이크 데이터(제목, 포스터)가 들어있는 영화의 movie_id 가져오기
        if(line[8] != '0' and line[8] != 'remakePoster'):
            original_title.append(line[1])
            remake_title.append(line[7])
            remake_poster.append(line[8])

    for i in range(len(original_title)):
        if (original_title[i] == param_origintitle):
            movieTitle = remake_title[i]
            moviePoster = remake_poster[i]
    if (movieTitle == 'none' and moviePoster == 'none'):
        print('false')
    else:
        print(movieTitle,',', moviePoster)


if __name__ == '__main__':
    process(sys.argv[1])
    # process("Top Gun")

