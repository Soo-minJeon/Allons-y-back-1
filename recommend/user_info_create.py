import pandas as pd
import csv
# 활용할 csv 파일 만들기

# 활용할 csv 파일 만들기
f = open("user_info.csv", "w")

meta = pd.read_csv('ratings_small.csv',low_memory=False)
# 필요한 컬럼만 가져온다. 아이디,제목,장르,개봉알,인기도,언어
meta = meta[['userId','movieId','rating']]

theActor = []
headersCSV = ['userId','movieId','rating']

with open('user_info.csv', 'a', newline='') as f_object:
    dictwriter_object = csv.DictWriter(f_object, fieldnames=headersCSV)
    dictwriter_object.writeheader()

    for i in range(0, len(meta)):
        dict = {'userId': str(meta['userId'][i]), 'movieId': str(meta['movieId'][i]), 'rating': str(meta['rating'][i])}
        dictwriter_object.writerow(dict)


f_object.close()
f.close()