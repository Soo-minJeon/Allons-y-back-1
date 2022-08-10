# 사용자의 아이디(csv파일 내에 기록되는 유저 아이디) 알아오기
# -*- coding: utf-8 -*-
import pandas as pd
import sys
from csv import DictWriter
from pandas import read_csv

def process(favorite_):
        ratings = pd.read_csv(
                'csv/user_info.csv',
                low_memory=False)
        ratings = ratings.sort_values(['userId']) # 오름차순으로 정렬: 아이디가 겹치지 않게끔
        final_user = ratings.tail(1)['userId'] + 1
        final_user = str(final_user.values)
        final_user = final_user.replace('[', '')
        final_user = final_user.replace(']', '')
        
        favorite = favorite_.split(',')
        movie_id = []
        #print(favorite[0]) # 테스트용
        print(final_user)

        df = read_csv('csv/movie_info.csv')

        for j in range(len(favorite)):
                for i in range(len(df)):
                        if df['original_title'][i] == favorite[j]:
                                movie_id.append(df['id'][i])

                                # 일단 timestamp 넣어놓음. 삭제해야함
                                headersCSV = ['userId','movieId','rating']
                                # result_row = {'userId':final_user,'movieId':movie_id[j],'rating':5.0} // 기존 코(오류발생)
                                result_row = {'userId':final_user,'movieId':df['id'][i],'rating':5.0} # 바꿔서 실행해본 코드

                                with open('csv/user_info.csv', 'a', newline='') as f_object:
                                        writer_object = DictWriter(f_object, fieldnames=headersCSV)
                                        writer_object.writerow(result_row)
                                        f_object.close()


if __name__ == '__main__':
    process(sys.argv[1]) # param있음
#     process('Toy Story,Jumanji,Grumpier Old Men') # param있음