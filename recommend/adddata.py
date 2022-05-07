from csv import writer
import pandas as pd

def process(id, title, rating):
        movies = pd.read_csv(
                'recommend/movies_metadata.csv',
                low_memory=False)
        movies.columns = ['adult', 'belongs_to_collection', 'budget', 'genres', 'homepage', 'movieId', 'imdb_id',
                          'original_language', 'original_title', 'overview', 'popularity', 'poster_path',
                          'production_companies', 'production_countries', 'release_date', 'revenue', 'runtime',
                          'spoken_languages', 'status', 'tagline',
                          'title', 'video', 'vote_average', 'vote_count']
        print(movies)

        movies.movieId = pd.to_numeric(movies.movieId, errors='coerce')
        indexs = movies.index[movies['original_title'] == title]
        movieId = movies.loc[indexs[0]]['movieId']

        add_data = [id, movieId, rating, 0]
        print('add_data : ', add_data)

        with open('recommend/ratings_small.csv','a', newline='') as ratingg:
                writer_object = writer(ratingg)
                writer_object.writerow(add_data)
                ratingg.close()

if __name__ == '__main__':
    process(2000, "Toy Story", 5)