import React from 'react';
import axios from 'axios';
import styles from './ImageSearch.module.css';

import localImagesMap from '../assets/localImagesMap';

const ImageSearch = ({
  favorites,
  addFavorite,
  removeFavorite,
  selectedFile,
  setSelectedFile,
  results,
  setResults,
  showFavorites,
  toggleFavoritesView,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setResults([]);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image file first.');
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      // Updated API URL for your Node.js backend hosted on Render
      const response = await axios.post('https://velora-jewlery.onrender.com/search', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.results.length === 0) {
        setError('Sorry, the product you are searching for is not in our store.');
        setResults([]);
      } else {
        setResults(response.data.results);
      }
    } catch (err) {
      setError('Failed to upload image or get results.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (id) => {
    return favorites.some((fav) => fav.id === id);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.customTitle}>SHOP YOUR FAVORITE JEWLERY</h2>
      <div className={styles.uploadSection}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className={styles.searchButton}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
        <button
          onClick={toggleFavoritesView}
          className={styles.searchButton}
          style={{ marginLeft: '12px' }}
        >
          {showFavorites ? 'Back to Search' : `Favorites (${favorites.length})`}
        </button>
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <div className={styles.resultsGrid}>
        {results.map((item) => (
          <div key={item.id} className={styles.card}>
            {localImagesMap[item.id] ? (
              <img src={localImagesMap[item.id]} alt={item.name} className={styles.cardImage} />
            ) : item.image ? (
              <img src={item.image} alt={item.name} className={styles.cardImage} />
            ) : (
              <div className={styles.noImage}>No Image</div>
            )}
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{item.name}</h3>
              <p className={styles.cardText}>
                <strong>Category:</strong> {item.category || 'N/A'}
              </p>
              <p className={styles.cardText}>
                <strong>Price:</strong> {item.price ? `$${item.price}` : 'N/A'}
              </p>
              <p className={styles.cardText}>{item.description || 'No description available.'}</p>
              <p className={styles.similarity}>
                <strong>Similarity:</strong>{' '}
                {item.similarity !== undefined ? item.similarity.toFixed(2) + '%' : 'N/A'}
              </p>
              {isFavorite(item.id) ? (
                <button className={styles.favoriteButton} onClick={() => removeFavorite(item.id)}>
                  Remove from Favorites
                </button>
              ) : (
                <button className={styles.favoriteButton} onClick={() => addFavorite(item)}>
                  Add to Favorites
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageSearch;
