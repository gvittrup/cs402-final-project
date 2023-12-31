import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Dimensions, ScrollView, TouchableOpacity, Button } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../../styles/MovieStyles';
import { useNavigation } from '@react-navigation/native';
import {saveList} from "../../components/SaveAndLoad";

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const OMDB_API_KEY = '942c9b75';

export function Home( {user} ) {

  console.log("Movies: ", movies);


  const [movies, setMovies] = useState([]);
  const scrollViewRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigation = useNavigation();

  const [likedMovies, setLikedMovies] = useState([]);
  const [dislikedMovies, setDislikedMovies] = useState([]);

  // Function to handle movie selection
  const handleSelectMovie = async (movie) => {
    try {
      const response = await fetch(`http://www.omdbapi.com/?i=${movie.imdbID}&apikey=${OMDB_API_KEY}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const detailedMovie = await response.json();
      navigation.navigate('Reviews', { movie: detailedMovie, user: user });
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  };

  const addMovie = (movie) => {
    setLikedMovies([...likedMovies, {key: movie.Title, poster: movie.Poster, selected: false}]);
    scrollRight();
  };

  useEffect(() => {
    console.log("Length: ", Object.keys(likedMovies).length);
    console.log("Liked Movies", likedMovies);
  }, [likedMovies]);

  const removeMovie = (movie) => {
    scrollRight();
  };


  useEffect(() => {
    const searchMovies = async () => {
      const keywords = ['christmas', 'holiday'];
      try {
        const responses = await Promise.all(
          keywords.map((keyword) =>
            fetch(
              `http://www.omdbapi.com/?s=${encodeURIComponent(
                keyword
              )}&apikey=${OMDB_API_KEY}`
            ).then((response) => response.json())
          )
        );

        const combinedMovies = responses.flatMap((response) => response.Search || []);
        const uniqueMovies = Array.from(new Map(combinedMovies.map((movie) => [movie.imdbID, movie])).values());

        setMovies(uniqueMovies);
      } catch (error) {
        console.error(error);
      }
    };

    searchMovies()

  }, []);
  useEffect(() => {
    if (movies.length > 0) {
      addViewed(movies[0]);

    }
  }, []);
  const scrollLeft = () => {
    const newIndex = Math.max(currentIndex - 1, 0);
    scrollViewRef.current.scrollTo({ x: newIndex * windowWidth, animated: true });
    setCurrentIndex(newIndex);
  };
  async function addViewed(movie) {
    const load = 'https://cs.boisestate.edu/~scutchin/cs402/codesnips/loadjson.php?user={movierater}';
    const save = 'https://cs.boisestate.edu/~scutchin/cs402/codesnips/savejson.php?user={movierater}';

    try {
      const response = await fetch(load);
      const data = await response.json();

      const foundUser = data.find(JSONuser => JSONuser.username === user.username);
      if (foundUser) {
        const movieExists = foundUser.viewed.find(movieJson => movieJson.Title === movie.Title);
        if (!movieExists) {
          foundUser.viewed.push(movie);
        }
      }

      await saveList(save, data);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const scrollRight = () => {

    const newIndex = Math.min(currentIndex + 1, movies.length - 1);
    scrollViewRef.current.scrollTo({ x: newIndex * windowWidth, animated: true });
    setCurrentIndex(newIndex);
    addViewed(movies[currentIndex]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={scrollLeft} style={[styles.arrow, styles.arrowLeft]}>
        <Icon name="chevron-back" size={30} color="black" />
      </TouchableOpacity>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={scrollViewRef}
        style={styles.carousel}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
          setCurrentIndex(index);
        }}
      >
        {movies.map((movie, index) => (
          <View key={index}>
            <View style={{maxHeight: "10%"}}>
              <TouchableOpacity onPress={() => handleSelectMovie(movie)}>
                <View style={styles.item}>
                  <Image source={{ uri: movie.Poster }} style={styles.poster} />
                  <Text style={styles.movieTitle}>{movie.Title}</Text>
                  <View style={{flexDirection: 'row'}}>
                    <TouchableOpacity onPress={() => removeMovie(movie)} style={{marginTop: 25, marginRight: 25}}>
                      <Icon name='thumbs-down-outline' size={45} color="tomato" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => addMovie(movie)} style={{marginTop: 25, marginLeft: 25}}>
                      <Icon name='thumbs-up' size={45} color="lightgreen" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={scrollRight} style={[styles.arrow, styles.arrowRight]}>
        <Icon name="chevron-forward" size={30} color="black" />
      </TouchableOpacity>
      <Button title='View Movie List' onPress={() => navigation.navigate('Liked Movies', likedMovies )} />
    </View>
  );
}

export default Home;