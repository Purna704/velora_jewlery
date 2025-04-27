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

  // Handle the file input change (when the user selects an image)
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setResults([]); // Clear previous results
    setError(null); // Clear any previous errors
  };

  // Handle image upload and search
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image file first.'); // Error if no file is selected
      return;
    }
    setLoading(true); // Start loading
    setError(null); // Clear any previous errors

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      // Send the POST request to the backend with the image file
      const response = await axios.post('https://velora-jewlery.onrender.com', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Check if no results are found
      if (response.data.results.length === 0) {
        setError('Sorry, the product you are searching for is not in our store.');
        setResults([]); // Clear results
      } else {
        setResults(response.data.results); // Set the received results
      }
    } catch (err) {
      // Handle errors during the request
      setError('Failed to upload image or get results.');
      setResults([]); // Clear results on error
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Check if the item is already a favorite
  const isFavorite = (id) => {
    return favorites.some((fav) => fav.id === id);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.customTitle}>SHOP YOUR FAVORITE JEWELRY</h2>
      <div className={styles.uploadSection}>
        {/* File input for image selection */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        {/* Button to trigger the upload and search */}
        <button
          onClick={handleUpload}
          disabled={loading} // Disable when loading
          className={styles.searchButton}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
        {/* Button to toggle favorites view */}
        <button
          onClick={toggleFavoritesView}
          className={styles.searchButton}
          style={{ marginLeft: '12px' }}
        >
          {showFavorites ? 'Back to Search' : `Favorites (${favorites.length})`}
        </button>
      </div>

      {/* Show error message if any */}
      {error && <p className={styles.errorMessage}>{error}</p>}

      <div className={styles.resultsGrid}>
        {/* Display results if there are any */}
        {results.map((item) => (
          <div key={item.id} className={styles.card}>
            {/* Check if a local image exists for the item, otherwise use the image from the API */}
            {localImagesMap[item.id] ? (
              <img src={localImagesMap[item.id]} alt={item.name} className={styles.cardImage} />
            ) : item.image ? (
              <img src={item.image} alt={item.name} className={styles.cardImage} />
            ) : (
              <div className={styles.noImage}>No Image</div> // Fallback if no image
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

              {/* Add/remove from favorites */}
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
