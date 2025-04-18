// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAJ-PIDUWyOCtHkDRyfo98-Vho1nCMKxIw",
    authDomain: "restaurant-dashboard-b88c0.firebaseapp.com",
    projectId: "restaurant-dashboard-b88c0",
    storageBucket: "restaurant-dashboard-b88c0.appspot.com",
    messagingSenderId: "193783060494",
    appId: "1:193783060494:web:44d7e82826c959119d445f"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  // حالة التطبيق
  let currentCategory = null;
  let categoriesList = [];
  
  // عناصر DOM
  const menuContainer = document.getElementById('menu-container');
  const categoriesContainer = document.getElementById('categories-container');
  const reviewsContainer = document.getElementById('reviews-container');
  const offerTitle = document.getElementById('offer-title');
  const offerPrice = document.getElementById('offer-price');
  
  // تحميل البيانات عند بدء التشغيل
  document.addEventListener('DOMContentLoaded', () => {
    initSwipers();
    loadCategories().then(() => {
      // تعيين القسم الأول كافتراضي إذا لم يكن هناك قسم محدد
      if (!currentCategory && categoriesList.length > 0) {
        currentCategory = categoriesList[0].id;
        document.querySelector('.category-btn').classList.add('active');
      }
      loadMenuItems();
    });
    loadTodayOffer();
    loadReviews();
    
    setTimeout(() => {
      document.body.classList.add('loaded');
    }, 2000);
  });
  
  // تهيئة Swipers
  function initSwipers() {
    new Swiper('.categories-slider', {
      slidesPerView: 'auto',
      spaceBetween: 10,
      freeMode: true,
    });
  
    new Swiper('.reviews-slider', {
      slidesPerView: 1,
      spaceBetween: 20,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      breakpoints: {
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      }
    });
  }
  
  // تحميل الأقسام من Firebase
  async function loadCategories() {
    try {
      const snapshot = await db.collection('categories').orderBy('order').get();
      categoriesContainer.innerHTML = '';
      categoriesList = [];
      
      if (snapshot.empty) {
        console.error('No categories found');
        return;
      }
  
      snapshot.forEach(doc => {
        const category = { id: doc.id, ...doc.data() };
        categoriesList.push(category);
        
        const button = document.createElement('button');
        button.className = 'swiper-slide category-btn';
        button.innerHTML = `<i class="${category.icon}"></i> ${category.name}`;
        button.setAttribute('data-category', category.id);
        
        button.addEventListener('click', () => {
          currentCategory = category.id;
          localStorage.setItem('lastCategory', currentCategory);
          
          document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
          });
          button.classList.add('active');
          
          loadMenuItems();
        });
        
        categoriesContainer.appendChild(button);
      });
  
      // تعيين القسم الأول كنشط إذا لم يكن هناك قسم محدد
      if (!currentCategory && categoriesList.length > 0) {
        currentCategory = categoriesList[0].id;
        document.querySelector('.category-btn').classList.add('active');
      }
  
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }
  
  // تحميل عناصر القائمة
  async function loadMenuItems() {
    try {
      if (!currentCategory) {
        console.error('Current category is not defined');
        return;
      }
  
      menuContainer.innerHTML = '<div class="loading-text"><i class="fas fa-spinner fa-spin"></i> جاري تحميل القائمة...</div>';
      
      const query = db.collection('menu')
        .where('category', '==', currentCategory)
        .where('isActive', '==', true)
        .orderBy('order');
  
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        const categoryName = getCategoryName(currentCategory);
        menuContainer.innerHTML = `<div class="empty-menu">لا توجد عناصر متاحة في قسم ${categoryName} حالياً</div>`;
        return;
      }
      
      menuContainer.innerHTML = '';
      snapshot.forEach(doc => {
        const item = doc.data();
        if (item.name && item.price && item.category === currentCategory) {
          renderMenuItem(item);
        }
      });
    } catch (error) {
      console.error('Error loading menu items:', error);
      menuContainer.innerHTML = '<div class="error-message">حدث خطأ أثناء تحميل القائمة. يرجى المحاولة لاحقاً</div>';
    }
  }
  
  // عرض عنصر القائمة
  function renderMenuItem(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'menu-item';
    itemElement.innerHTML = `
      <div class="item-header">
        <h3 class="item-name">${item.name}</h3>
        <span class="item-price">${item.price} جنيه</span>
      </div>
      ${item.description ? `<p class="item-description"><i class="fas fa-info-circle"></i> ${item.description}</p>` : ''}
      ${item.imageUrl ? `<div class="item-image"><img src="${item.imageUrl}" alt="${item.name}" loading="lazy"></div>` : ''}
    `;
    menuContainer.appendChild(itemElement);
  }
  
  // دالة مساعدة للحصول على اسم التصنيف
  function getCategoryName(categoryId) {
    const category = categoriesList.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  }
  
  // تحميل عرض اليوم
  async function loadTodayOffer() {
    try {
      const todayOfferSection = document.getElementById('today-offer');
      todayOfferSection.innerHTML = '<div class="loading-offer"><i class="fas fa-spinner fa-spin"></i> جاري تحميل عرض اليوم...</div>';
      
      const snapshot = await db.collection('offers')
        .where('isTodayOffer', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
  
      if (!snapshot.empty) {
        const offer = snapshot.docs[0].data();
        offerTitle.textContent = offer.title;
        
        if (offer.originalPrice) {
          offerPrice.innerHTML = `${offer.price} جنيه بدلًا من <span>${offer.originalPrice} جنيه</span>`;
        } else {
          offerPrice.textContent = `${offer.price} جنيه`;
        }
        
        todayOfferSection.style.display = 'block';
        todayOfferSection.innerHTML = `
          <div class="offer-content">
            <span class="offer-tag">عرض اليوم</span>
            <h2>${offer.title}</h2>
            <p class="offer-price">${offerPrice.innerHTML}</p>
            ${offer.description ? `<p class="offer-desc">${offer.description}</p>` : ''}
          </div>
        `;
      } else {
        todayOfferSection.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading today offer:', error);
      document.getElementById('today-offer').innerHTML = 
        '<div class="error-message">عرض اليوم غير متاح حالياً</div>';
    }
  }
  
  // تحميل التقييمات (معدل)
  async function loadReviews() {
    try {
      reviewsContainer.innerHTML = '<div class="loading-reviews"><i class="fas fa-spinner fa-spin"></i> جاري تحميل آراء العملاء...</div>';
      
      const snapshot = await db.collection('reviews')
        .where('isApproved', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
  
      if (snapshot.empty) {
        reviewsContainer.innerHTML = `
          <div class="empty-reviews">
            <i class="fas fa-comment-slash"></i>
            <p>لا توجد تقييمات معتمدة حالياً</p>
          </div>
        `;
        return;
      }
  
      reviewsContainer.innerHTML = '';
      snapshot.forEach(doc => {
        const review = doc.data();
        const reviewElement = document.createElement('div');
        reviewElement.className = 'swiper-slide review-card';
        
        // إنشاء نجوم التقييم
        let stars = '';
        for (let i = 1; i <= 5; i++) {
          stars += `<i class="fas fa-star ${i <= review.rating ? 'active' : ''}"></i>`;
        }
        
        reviewElement.innerHTML = `
          <div class="review-header">
            <div class="user-info">
              <i class="fas fa-user-circle"></i>
              <span>${review.userName || "عميل"}</span>
            </div>
            <div class="review-rating">${stars}</div>
          </div>
          <div class="review-content">
            <p>${review.comment || "لا يوجد تعليق"}</p>
            <div class="review-date">${formatDate(review.createdAt)}</div>
          </div>
        `;
        
        reviewsContainer.appendChild(reviewElement);
      });
  
      // إعادة تهيئة السلايدر بعد تحميل التقييمات
      if (window.reviewSwiper) {
        window.reviewSwiper.update();
      } else {
        window.reviewSwiper = new Swiper('.reviews-slider', {
          slidesPerView: 1,
          spaceBetween: 20,
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
          breakpoints: {
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 }
          }
        });
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      reviewsContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>حدث خطأ في تحميل التقييمات</p>
        </div>
      `;
    }
  }
  function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // عرض التقييم
  function renderReview(review) {
    const reviewElement = document.createElement('div');
    reviewElement.className = 'swiper-slide review-card';
    
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<i class="fas fa-star ${i <= review.rating ? 'active' : ''}"></i>`;
    }
    
    reviewElement.innerHTML = `
      <div class="review-content">
        <p>${review.comment || "لا يوجد تعليق"}</p>
        <div class="review-author">
          <span class="author-name">${review.userName || "مستخدم مجهول"}</span>
          <div class="rating">${stars}</div>
        </div>
      </div>
    `;
    
    reviewsContainer.appendChild(reviewElement);
  }