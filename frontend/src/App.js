import React, { useState, useEffect } from 'react';
import './App.css';
import styles from './components/ImageSearch.module.css'; 
import ImageSearch from './components/ImageSearch';
import localImagesMap from './assets/localImagesMap';

function App() {
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState([]);

  // Image slider state
  const images = [
    'https://images.pexels.com/photos/13946222/pexels-photo-13946222.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://static.vecteezy.com/system/resources/previews/035/081/140/large_2x/women-s-jewelry-gold-chain-trendy-jewelry-on-a-silk-background-photo.JPG',
    'https://png.pngtree.com/thumb_back/fh260/back_our/20190621/ourmid/pngtree-taobao-jewelry-fresh-and-simple-gold-jewelry-poster-image_194638.jpg'
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, [images.length]);

  const addFavorite = (item) => {
    const itemWithImage = {
      ...item,
      image: item.image ? item.image : localImagesMap[item.id] || null,
    };
    setFavorites((prev) => (prev.find(fav => fav.id === item.id) ? prev : [...prev, itemWithImage]));
  };

  const removeFavorite = (id) => {
    setFavorites((prev) => prev.filter(fav => fav.id !== id));
  };

  const toggleFavoritesView = () => {
    setShowFavorites((prev) => !prev);
  };

  return (
    <>
      <div
        className="navbar"
        style={{ backgroundImage: `url(${images[currentImageIndex]})` }}
      >
        <div className="navTitleContainer">
          <h1 className="navTitle">~ Velora Jewelry</h1>
          <h2 className="navSubtitle">Discover Timeless Elegance</h2>
        </div>
      </div>
      <div className="App">
        <div className={styles.container}>
          {showFavorites ? (
            <>
              <button className={styles.backButton} onClick={toggleFavoritesView}>Back to Search</button>
              <div className={styles.resultsGrid}>
                {favorites.length === 0 ? (
                  <p>No favorites added yet.</p>
                ) : (
                  favorites.map(item => (
                    <div key={item.id} className={styles.card}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className={styles.cardImage} />
                      ) : (
                        <div className={styles.noImage}>No Image</div>
                      )}
                      <div className={styles.cardContent}>
                        <h3 className={styles.cardTitle}>{item.name}</h3>
                        <p className={styles.cardText}><strong>Category:</strong> {item.category || 'N/A'}</p>
                        <p className={styles.cardText}><strong>Price:</strong> {item.price ? `$${item.price}` : 'N/A'}</p>
                        <p className={styles.cardText}>{item.description || 'No description available.'}</p>
                        <button className={styles.removeFavoriteButton} onClick={() => removeFavorite(item.id)}>Remove from Favorites</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <ImageSearch
              favorites={favorites}
              addFavorite={addFavorite}
              removeFavorite={removeFavorite}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              results={results}
              setResults={setResults}
              showFavorites={showFavorites}
              toggleFavoritesView={toggleFavoritesView}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default App;
