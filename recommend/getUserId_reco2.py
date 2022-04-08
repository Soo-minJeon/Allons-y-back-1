import pandas as pd

def process():
        ratings = pd.read_csv(
                'recommend/ratings_small.csv',
                low_memory=False)
        ratings = ratings.sort_values(['userId']) # 오름차순으로 정렬: 아이디가 겹치지 않게끔
        final_user = ratings.tail(1)['userId'] + 1
        final_user = str(final_user.values)
        final_user = final_user.replace('[', '')
        final_user = final_user.replace(']', '')

        print(final_user)

if __name__ == '__main__':
    process() # param없음