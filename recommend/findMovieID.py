# -*- coding: utf-8 -*-
import pandas as pd
import sys
from csv import DictWriter

def process(userId, rating, resultEmotionPer, concentration, parammovieTitle):
    print("매개변수 확인 : " + str(userId) + ', '+str(rating)+', '+str(resultEmotionPer)+', '+ str(concentration)+', '+ parammovieTitle)
    df = pd.read_csv('recommend/movie_info.csv', low_memory=False)
    print("----- test1 ------")
    for i in range(len(df)):
        print("----- test2 ------")
        if df['original_title'][i] == "Toy Story":
            print("----- test3 ------")
            movieID = str(df['id'][i])
            print("movieID: "+movieID)
            break

    print("userId: "+userId)
    rating = int(rating) + int(resultEmotionPer) / 200 + int(concentration) / 200
    rating = str(round(rating,2))
    headersCSV = ['userId', 'movieId', 'rating']
    result_row = {'userId': userId, 'movieId': movieID, 'rating': rating}

    with open('recommend/user_info.csv', 'a', newline='') as f_object:
        print("파일에 행 추가 확인")
        writer_object = DictWriter(f_object, fieldnames=headersCSV)
        writer_object.writerow(result_row)
        f_object.close()

process("621",5.0,80,90,"Toy Story")
#process(str(sys.argv[1]), 5.0,sys.argv[3],sys.argv[4],sys.argv[5])