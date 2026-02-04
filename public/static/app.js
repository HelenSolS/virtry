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
      // Extract user-friendly error message
      const errorMsg = data.message || data.error || 'Ошибка при обработке изображений';
      const supportMsg = data.support ? '\n' + data.support : '';
      throw new Error(errorMsg + supportMsg);
    }

    if (data.success && data.image) {
      // Check if image is valid
      if (!data.image.startsWith('data:image/')) {
        throw new Error('Получен некорректный формат изображения. Попробуйте ещё раз.');
      }
      
      // Show result
      resultPreview.src = data.image;
      resultPreview.style.display = 'block';
      loadingSpinner.style.display = 'none';
      
      // Scroll to result
      resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (data.warning === 'same_as_input') {
      // Special handling for identical images
      throw new Error(data.message || 'AI вернул то же изображение. Попробуйте другие фото.');
    } else {
      throw new Error(data.message || 'Не удалось сгенерировать изображение. Попробуйте позже.');
    }

  } catch (error) {
    console.error('Generation error:', error);
    
    // Show user-friendly error
    let errorMsg = error.message || 'Произошла ошибка при обработке изображений';
    
    // Add helpful suggestions
    if (errorMsg.includes('одинаковые') || errorMsg.includes('идентичен')) {
      errorMsg += '\n\nСоветы:\n• Попробуйте другие фотографии\n• Убедитесь, что одежда хорошо видна\n• Используйте фото с хорошим освещением';
    } else if (errorMsg.includes('большие')) {
      errorMsg += '\n\nСоветы:\n• Сожмите изображения перед загрузкой\n• Рекомендуемый размер: до 2MB\n• Используйте онлайн-компрессоры';
    } else if (errorMsg.includes('безопасности')) {
      errorMsg += '\n\nСоветы:\n• Используйте качественные фотографии\n• Избегайте неподходящего контента\n• Попробуйте другие изображения';
    }
    
    showError(errorMsg);
    loadingSpinner.style.display = 'none';
    resultArea.querySelector('.result-placeholder').style.display = 'flex';
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Создать образ';
  }
}

function showError(message) {
  // Convert line breaks to HTML breaks
  errorMessage.innerHTML = message.replace(/\n/g, '<br>');
  errorMessage.style.display = 'block';
  
  // Scroll to error message
  errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Auto-hide after 10 seconds (increased for longer messages)
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 10000);
}
