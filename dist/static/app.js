// State management
let photoFile = null;
let outfitFile = null;

// DOM Elements
const photoUpload = document.getElementById('photo-upload');
const outfitUpload = document.getElementById('outfit-upload');
const photoInput = document.getElementById('photo-input');
const outfitInput = document.getElementById('outfit-input');
const photoPreview = document.getElementById('photo-preview');
const outfitPreview = document.getElementById('outfit-preview');
const resultPreview = document.getElementById('result-preview');
const resultArea = document.getElementById('result-area');
const generateBtn = document.getElementById('generate-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');

// Smooth scroll for hero section
document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll on arrow click
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      document.getElementById('tryon').scrollIntoView({ 
        behavior: 'smooth' 
      });
    });
  }

  // Initialize upload handlers
  setupUploadHandlers();
});

function setupUploadHandlers() {
  // Photo upload
  photoUpload.addEventListener('click', () => {
    photoInput.click();
  });

  photoInput.addEventListener('change', (e) => {
    handleImageUpload(e.target.files[0], 'photo');
  });

  // Outfit upload
  outfitUpload.addEventListener('click', () => {
    outfitInput.click();
  });

  outfitInput.addEventListener('change', (e) => {
    handleImageUpload(e.target.files[0], 'outfit');
  });

  // Drag and drop for photo
  photoUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    photoUpload.style.borderColor = '#667eea';
  });

  photoUpload.addEventListener('dragleave', (e) => {
    e.preventDefault();
    photoUpload.style.borderColor = '#cbd5e0';
  });

  photoUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    photoUpload.style.borderColor = '#cbd5e0';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file, 'photo');
    }
  });

  // Drag and drop for outfit
  outfitUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    outfitUpload.style.borderColor = '#667eea';
  });

  outfitUpload.addEventListener('dragleave', (e) => {
    e.preventDefault();
    outfitUpload.style.borderColor = '#cbd5e0';
  });

  outfitUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    outfitUpload.style.borderColor = '#cbd5e0';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file, 'outfit');
    }
  });

  // Generate button
  generateBtn.addEventListener('click', handleGenerate);
}

function handleImageUpload(file, type) {
  if (!file || !file.type.startsWith('image/')) {
    showError('Пожалуйста, загрузите изображение');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    if (type === 'photo') {
      photoFile = file;
      photoPreview.src = e.target.result;
      photoPreview.style.display = 'block';
      photoUpload.querySelector('.upload-placeholder').style.display = 'none';
    } else {
      outfitFile = file;
      outfitPreview.src = e.target.result;
      outfitPreview.style.display = 'block';
      outfitUpload.querySelector('.upload-placeholder').style.display = 'none';
    }

    // Enable generate button if both images are uploaded
    if (photoFile && outfitFile) {
      generateBtn.disabled = false;
    }

    // Hide error message
    errorMessage.style.display = 'none';
  };

  reader.readAsDataURL(file);
}

async function handleGenerate() {
  if (!photoFile || !outfitFile) {
    showError('Пожалуйста, загрузите оба изображения');
    return;
  }

  // Show loading state
  generateBtn.disabled = true;
  generateBtn.textContent = 'Обработка...';
  resultArea.querySelector('.result-placeholder').style.display = 'none';
  resultPreview.style.display = 'none';
  loadingSpinner.style.display = 'flex';
  errorMessage.style.display = 'none';

  try {
    // Prepare form data
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('outfit', outfitFile);

    // Send request
    const response = await fetch('/api/tryon', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка при обработке изображений');
    }

    if (data.success && data.image) {
      // Show result
      resultPreview.src = data.image;
      resultPreview.style.display = 'block';
      loadingSpinner.style.display = 'none';
      
      // Scroll to result
      resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      throw new Error('Не удалось сгенерировать изображение');
    }

  } catch (error) {
    console.error('Generation error:', error);
    showError(error.message || 'Произошла ошибка при обработке изображений');
    loadingSpinner.style.display = 'none';
    resultArea.querySelector('.result-placeholder').style.display = 'flex';
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Создать образ';
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}
