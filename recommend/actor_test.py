# -*- coding: utf-8 -*-
import pandas as pd
from csv import DictWriter

# 영화 등장인물 가져오기
actor = pd.read_csv('credits.csv', low_memory=False)
actor = actor['cast']

actor[0] = actor[0].strip('[{')
actor[0] = actor[0].strip('}]')
list1 = actor[0].split('}, {')

for i in range(len(list1)):
    dic = list1[i].split(',')
    print(dic[5].split(':')[1])

'''
ratings = pd.read_csv('ratings_small.csv', low_memory=False) # 원본은 데이터가 많아서 small 데이터 사용
ratings = ratings[['userId', 'movieId', 'rating']]
print(ratings.head(10))

headersCSV = ['userId','movieId','rating','timestamp']
dict = {'userId':'1','movieId':'6','rating':'3.5','timestamp':'1074784724'}
with open('ratings_small.csv', 'a', newline='') as f_object:
    dictwriter_object = DictWriter(f_object, fieldnames=headersCSV)
    dictwriter_object.writerow(dict)

    f_object.close()
'''
# 이런식으로 사용자 정보를 직접 csv 파일에 축적하여 추천에 활용한다. timestamp는 필요 X